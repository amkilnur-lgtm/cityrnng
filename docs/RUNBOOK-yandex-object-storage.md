# Runbook: Яндекс Object Storage для аватаров

Пошаговая настройка S3-совместимого хранилища в Яндекс Облаке. Нужно один раз перед мерджем PR с аватарами. Время: ~10-15 минут.

## Зачем

Хранить пользовательские аватары (загружаемые через `/app/profile` → форма обрезки) вне БД и вне диска VPS — чтобы переживали пересоздание контейнеров и были доступны напрямую браузеру по публичному URL.

## Что получим в итоге

5 значений для `.env` на staging и проде:

```
YC_STORAGE_BUCKET=cityrnng-avatars-staging
YC_STORAGE_ENDPOINT=https://storage.yandexcloud.net
YC_STORAGE_KEY_ID=YCAJExxxxxxxxxxxxxxxx
YC_STORAGE_SECRET_KEY=YCxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
YC_STORAGE_PUBLIC_URL_BASE=https://cityrnng-avatars-staging.storage.yandexcloud.net
```

---

## Шаг 1. Создать облако и каталог (если нет)

1. Открой https://console.yandex.cloud/
2. Войди (или зарегистрируйся — получишь 4000 ₽ грантов на 60 дней).
3. Если облака ещё нет — создай: имя «cityrnng».
4. В нём создай каталог (folder) «cityrnng-staging».
5. (Опционально) такой же каталог «cityrnng-prod» — пригодится позже.

---

## Шаг 2. Создать сервисный аккаунт

1. В каталоге `cityrnng-staging` → меню слева «Сервисные аккаунты» → «Создать».
2. Имя: `cityrnng-storage`
3. Роли в каталоге: **`storage.editor`** (полные права на бакеты и объекты этого каталога).
4. Жми «Создать».

---

## Шаг 3. Сгенерить статический ключ доступа

1. Открой созданный сервисный аккаунт `cityrnng-storage`.
2. Вкладка «Ключи доступа» → «Создать новый ключ» → **«Статический ключ доступа»**.
3. Описание: `cityrnng-avatars-staging` (или любое).
4. Жми «Создать».
5. **СКОПИРУЙ ОБА ЗНАЧЕНИЯ** — они показываются один раз:
   - `Идентификатор ключа` (~25 символов) → это **`YC_STORAGE_KEY_ID`**
   - `Секретный ключ` (~40+ символов) → это **`YC_STORAGE_SECRET_KEY`**
6. Сохрани в надёжное место (1Password / Bitwarden / Vaultwarden).

> **Если потерял** — удали ключ и создай новый. Восстановить нельзя.

---

## Шаг 4. Создать bucket

1. В каталоге → меню слева **Object Storage** → «Создать бакет».
2. Имя: `cityrnng-avatars-staging` (для staging) или `cityrnng-avatars` (для прода).
   - Имя должно быть **глобально уникальным** во всём YC.
   - Только латиница, цифры, точки, дефисы.
3. **Доступ на чтение объектов** — **«Публичный»**.
   - Это значит, что URL аватара (`https://cityrnng-avatars-staging.storage.yandexcloud.net/avatars/abc123.webp`) можно открыть в браузере без аутентификации.
   - На запись — приватно, только наш сервисный аккаунт может загружать.
4. **Доступ к списку объектов** — **«Ограниченный»** (не light up «public list», иначе любой увидит весь список аватаров).
5. **Класс хранилища**: «Стандартное».
6. **Максимальный размер**: можно оставить пустым (без квоты) или поставить `1 GB` для подстраховки.
7. Жми «Создать бакет».

---

## Шаг 5. Записать значения в `.env`

На staging VPS:

```bash
ssh root@staging.cityrunning.online
cd /opt/cityrnng/
nano .env
```

Добавь в конец (или замени если уже есть):

```
YC_STORAGE_BUCKET=cityrnng-avatars-staging
YC_STORAGE_ENDPOINT=https://storage.yandexcloud.net
YC_STORAGE_KEY_ID=<твой_key_id>
YC_STORAGE_SECRET_KEY=<твой_secret>
YC_STORAGE_PUBLIC_URL_BASE=https://cityrnng-avatars-staging.storage.yandexcloud.net
```

Сохрани (`Ctrl+O`, `Enter`, `Ctrl+X`).

> ⚠️ См. [[reference_staging_env_quirks]] из памяти: после изменения `.env` на staging нужно `APP_ENV_FILE` export + force-recreate, а не просто restart.

Команда:

```bash
export APP_ENV_FILE=.env
docker compose up -d --force-recreate api web
```

Проверь, что API поднялся:

```bash
docker compose logs --tail 30 api | grep -i "storage\|error"
```

Если видишь `ObjectStorageService initialized` или нет ошибок про YC — всё ок.

---

## Шаг 6. (Опционально) Настроить CORS на bucket'е

Если фронт будет загружать **напрямую** в bucket по pre-signed URL (быстрее, без транзита через наш сервер) — нужно прописать CORS. Сейчас мы загружаем **через API** (multipart на `/me/avatar`), CORS не нужен.

Если в будущем перейдём на pre-signed direct upload — добавим CORS правило:

```json
[
  {
    "AllowedOrigins": ["https://staging.cityrunning.online", "https://cityrunning.online"],
    "AllowedMethods": ["PUT", "POST"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

Применяется через YC консоль → bucket → «CORS-настройки».

---

## Шаг 7. Прод (когда дойдём до релиза)

Повторяешь шаги 4-5 для бакета `cityrnng-avatars` и аналогичных env-переменных в `.env` на прод-VPS. Сервисный аккаунт можно использовать тот же или сделать отдельный (рекомендую отдельный, чтобы можно было отозвать staging ключ не сломав прод).

---

## Что делать если что-то пошло не так

| Симптом | Причина | Фикс |
|---|---|---|
| 403 при загрузке аватара | Сервисный аккаунт не имеет `storage.editor` на каталоге | Добавь роль в IAM каталога |
| Картинка не открывается по public URL | Bucket не публичный на чтение | Открой bucket → настройки → «Доступ на чтение» → Публичный |
| `Access Denied: signature mismatch` | `YC_STORAGE_SECRET_KEY` в `.env` обрезан | Перепиши .env, проверь что секрет полностью скопирован |
| `No such bucket` | Имя bucket не совпадает с `YC_STORAGE_BUCKET` или его удалили | Проверь имя в консоли |
| API не стартует, `Cannot find module '@aws-sdk/client-s3'` | После `pnpm install` нужен `docker compose build api` | Пересобери image |

---

## Стоимость на наших объёмах

При ~100 юзеров с аватарами и активной аудитории:
- Хранение: 5 MB × 1.7 ₽/GB/мес ≈ **0.01 ₽/мес**
- Исходящий трафик аватаров: ~50 MB/день = 1.5 GB/мес → влезает в **бесплатные 10 GB/мес**
- Операции (PUT при загрузке, GET при просмотре): копейки

Итого: **~10 копеек в месяц** до уровня 1000 юзеров.
