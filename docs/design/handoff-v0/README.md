# Handoff: Ситираннинг · Сайт v0 (C3 «Светлый»)

## Overview
«Ситираннинг» — беговой клуб для жителей московских районов. Раз в неделю (по средам в 7:30) соседи выбегают на 3 км по своему району, потом идут пить кофе в локальные кофейни-партнёры. За участие начисляются баллы, которые тратятся у тех же партнёров.

Этот пакет описывает **первый MVP-срез сайта** в дизайн-направлении **C3 «Светлый»**:

- **Главная страница** (guest + authed state в одном файле, переключение через toggle).
- **Авторизация** — отдельный экран (desktop и mobile версии).

Остальные экраны (календарь событий, карточка события, трекер, магазин баллов, комьюнити, профиль, онбординг) — в роадмапе, пока не реализованы.

## About the Design Files
Файлы в этой папке — это **дизайн-референсы, собранные в HTML/CSS/vanilla-JS**. Это не продакшн-код для копирования «как есть». Задача разработчика — **воспроизвести эти экраны в целевой кодовой базе** (React, Next.js, Vue — что уже используется в проекте), подхватив принятые в ней паттерны, роутинг, state management и библиотеки. Если кодовой базы ещё нет, выбирайте фреймворк под задачу (рекомендуемо — **Next.js + React** с server components для SEO-ориентированного лендинга).

Иллюстрации (бегуны, цветок) лежат в `assets/` и могут быть перенесены напрямую.

## Fidelity
**High-fidelity.** Все цвета, типографика, отступы, состояния — финальные. Воспроизводить пиксель-в-пиксель, но в компонентах существующего стека. Все размеры заданы в пикселях (можно транслировать в `rem` при необходимости, базовый размер 16px).

---

## Design Language · C3 «Светлый»

- **Настроение:** бумажный, строгий, немного 90-е независимое издание. Редакторский, не «спортивный IT-стартап».
- **Формы:** только **прямые углы** (radius = 0 везде). 1px чёрные бордеры. **Без теней, без градиентов, без блюров.**
- **Цвет-акцент:** один — брендовый красный `#E63025`. Используется точечно: CTA, подчёркивания, активные состояния, цифры-акценты в данных.
- **Типографика:**
  - `Space Grotesk` 700 — заголовки, цифры в KPI.
  - `Manrope` 400/500/600 — body, кнопки, UI.
  - `JetBrains Mono` 500 — «моно-капсы» (рубрикаторы, метаданные, цифры координат).
- **Язык:** русский, «ты», тёплый, без скобок-смайлов. «Соседи», «среды», «добежать», «кофе после».
- **Сетка:** макс. ширина контейнера — **1280px**, боковые паддинги 48px (24px на мобилке). Секции разделены горизонтальной 1px-линией чёрного цвета.

См. `design-tokens.json` для машиночитаемой выгрузки токенов.

---

## Screens / Views

### 1. Home (`home.html`)

Главная. Содержит 9 секций и два состояния (guest / authed). Переключение на живой странице — **кнопка справа внизу** (`#stateToggle`) — это **dev-only**, в продакшене состояние определяется наличием сессии.

**Состояние определяется** классом на `<body>`: `s-guest` или `s-authed`. Элементы с классом `.guest-only` / `.authed-only` показываются/прячутся через CSS (`body.s-guest .authed-only{display:none}` и наоборот). Это простое и декларативное решение — воспроизведите через conditional rendering в React.

#### Navigation (sticky top)
- Слева: wordmark (`assets/wordmark-hand.png`), высота 30px.
- Центр: 5 ссылок — Главная · События · Магазин · Журнал · Партнёрам. Активная — красная (`color: var(--red)`), остальные чёрные. Hover → красный.
- Справа:
  - **guest:** кнопка «Войти» (`.btn-sm`, outline).
  - **authed:** pill-avatar с аватаркой-инициалом, именем, и баллами в красной части справа. Вся структура — 44px высота, 1px бордер, без радиуса. Кликом ведёт на профиль.
- На mobile (<800px) nav-links скрывается, появляется burger.

#### 1.1 Hero (guest state)
**Layout:** 2 колонки, 1.1fr / 1fr. Слева — текст и форма. Справа — иллюстрация + карточка «ближайшая среда».

- **Eyebrow:** красная моно-капс строка `Беговой клуб · Москва · с 2024` с 36px чёрной чертой слева.
- **H1:** `Три километра. Среда. 7:30. Кофе после.` — 88px (44px на mobile), Space Grotesk 700, leading 0.9, letter-spacing -0.035em. Слово «Кофе» выделено красным (`<em>`).
- **Lede:** 18px, тёплый серый (`var(--graphite)`), max-width 520px. В тексте inline-highlight `.bx` — красная плашка на розовой подложке (`--tint`).
- **Форма:** одна строка из двух полей в горизонтальном ряду (email + имя) с 1px разделителем между ними, плюс красная CTA-кнопка «Записаться» справа. Высота — 56px. Focus state: красная рамка + 3px розовое свечение (`--tint`).
- **OAuth row** под формой: моно-капс «или» + 3 кнопки провайдеров (VK, Yandex, Google).
- **Лёгкий disclaimer** внизу формы: «Первая среда — пробная, без баллов. Отписаться — одной кнопкой.»

#### 1.2 Hero side (sticky, shares with authed)
Прямоугольная «колонка-открытка»:
1. Иллюстрация (`runner-red.png`) на светло-сером `--paper-2` фоне, aspect-ratio 5/4, с mono-caps лейблом в левом верхнем углу.
2. Карточка «Ближайшая среда»: день недели крупно, дата, район, количество мест (`12/20`), кнопка «Детали →».

На authed state карточка заменяется на «ТВОЙ СЛЕДУЮЩИЙ ЗАБЕГ» с теми же данными + «Посмотреть маршрут» (primary, красная) и «Отменить» (ghost).

#### 1.3 How it works (3 steps)
Для guest. Секция `Три шага между кроссовками и капучино.`
3 колонки-карточки, 1px бордер между ними, внутри — большая цифра (01/02/03) Space Grotesk 700 120px, заголовок H3, короткий пояснительный текст. Правее H2 — CTA «FAQ →».

#### 1.4 Personal dashboard (authed-only)
**Важный блок.** Показывает статистику бегуна.
- **Header-row:** одна строка с 3 мини-статами и CTA «Записаться на 22 апреля →»:
  - `Ближайший забег · Среда 22 апр, 7:30 · Хамовники`
  - `Сред в этом месяце · 3 · из 4 · 9 км за месяц`
  - `Баллы · 350 · можно потратить сейчас`
- **Chart:** 5 столбиков по неделям апреля (даты сред — 1, 8, 15, 22, 29 апр). Три «состоявшиеся» среды одинаковой высоты = 3 км каждая, одна пропущенная (8 апр) = 0, одна будущая (22 апр, «завтра») = 3 км с красной рамкой-акцентом. Подпись под графиком: «Пропустила 1 среду из 4. До цели на апрель — 3 км (завтра).»
- **KPI row справа:** 4 мини-блока — `3 среды`, `9 километров`, `1:02 часа в пути`, `6:38 ср. темп`.

Логика: 3 км × 4 среды = 12 км/месяц цель, из которых 9 уже позади.

#### 1.5 Upcoming events (guest) / Next Wednesdays (authed)
3 карточки событий в ряд. На authed первая — «для тебя» (в твоём районе, красный badge «рекомендуем»). На guest показываются с лейблом района.

Карточка события:
- Дата крупно (Space Grotesk 700, 32px), день недели моно-капсом.
- Название события (H3).
- Район + метро.
- Footer: `12/20 соседей записались` · ссылка «Записаться →».

#### 1.6 Shop preview (authed-only)
`350 баллов — хватит на вот это.` Слева — крупная цифра баллов в красном круге-штампе (но без radius — прямоугольник!). Справа — 3 товара из магазина с ценами в баллах.

#### 1.7 Activity / Districts / Partners / Journal
Секции в текстовом стиле: H2 + короткий lede + список/сетка. На guest показывается статистика проекта («7 районов», «37 партнёров»), на authed — персональная активность.

#### 1.8 Journal (news)
3 карточки. Каждая: eyebrow (`Анонс` / `История` / `Партнёр`) + дата, H3-заголовок, ссылка «Читать →».

#### 1.9 Final CTA band
`Следующая среда через 6 дней. Добежим?`
Две кнопки: primary «Записаться →» (56px высота) и ghost «О проекте».

#### 1.10 Footer
4 колонки: `Ситираннинг · о клубе` / `Продукт` / `Клуб` / `Связь`. Email `hello@cityrnng.ru`. Моно-шрифт. 1px top-border.

---

### 2. Auth — Desktop (`auth-desktop.html`)

Split 50/50:
- **Левая колонка (paper-2 фон):** вертикальный список «что ты получишь» + иллюстрация цветка (`flower-red.png`) в правом нижнем углу, прижатая.
- **Правая колонка:** форма — табы `Войти` / `Создать` сверху, поля (email + пароль), primary CTA «Войти», OAuth row снизу.

Полная спецификация — см. **`handoff/auth-desktop/README.md`** в корне проекта (этот package ссылается на существующий detailed handoff).

### 3. Auth — Mobile (`auth-mobile.html`)
Одна колонка, та же форма + свёрнутый список преимуществ в аккордеон сверху. См. `handoff/auth-mobile/README.md`.

---

## Interactions & Behavior

### State toggle (dev only)
В правом нижнем углу — floating toggle `GUEST / AUTHED`. Переключает класс на `<body>`. В проде — убрать, состояние определяется из сессии.

### Form validation (hero signup)
- Email — базовый regex `/^.+@.+\..+$/`.
- Имя — не пустое.
- При submit: если оба ок → redirect на `/auth` (в прототипе — `auth-desktop.html`). Если нет — inline error под формой (красный текст, 13px).

### Hover states
- Ссылки: color → red, без underline.
- Кнопки primary: `--red` → `--red-ink` (#B8251C).
- Кнопки outline: фон → `--ink` (чёрный), текст → белый.

### Focus states
Везде одинаковый: `border-color: var(--red)` + `box-shadow: 0 0 0 3px var(--tint)`.

### Sticky elements
- `<nav>` — sticky top, z-index 10.
- `.hero-side` — sticky top: 88px (на desktop).

### Responsive breakpoints
- `>= 1100px` — full desktop.
- `800px – 1099px` — 1 колонка в hero, карточки 2 в ряд.
- `< 800px` — mobile: burger, все сетки в 1 колонку, hero title уменьшается до 44px.

### Animations
Почти нет. Единственное — `.burger` и `.state-toggle` имеют `transition: 0.12s` на background. Никаких сложных анимаций входа — в C3 это намеренно.

---

## State Management

Минимально необходимое:

```ts
type UserState =
  | { kind: 'guest' }
  | { kind: 'authed'; name: string; initial: string; points: number; nextEvent: Event };

type Event = {
  id: string;
  date: string;       // ISO
  district: string;   // 'Хамовники'
  metro: string;      // 'Парк культуры'
  distance_km: number;
  pace?: string;
  seats_taken: number;
  seats_total: number;
};

type DashboardStats = {
  wednesdays_this_month: { done: number; total: number };
  km_this_month: number;
  hours_this_month: string;
  avg_pace: string;
  weekly_bars: { week_label: string; km: number; is_future?: boolean; is_skipped?: boolean }[];
  points: number;
};
```

Data fetching: для MVP — static JSON endpoints `/api/events/upcoming`, `/api/me`, `/api/me/stats`. SSR на Next.js предпочтительнее для SEO главной страницы.

---

## Design Tokens

См. `design-tokens.json`.

```
/* Colors */
--paper      #FFFFFF   основной фон
--paper-2    #F4F4F2   secondary фон (иллюстрации, неактивные)
--paper-3    #E9E9E6   tertiary, разделители
--ink        #0F0E0C   основной текст и все бордеры
--graphite   #3A3833   secondary текст
--muted      #6B6862   placeholder, mono-caps, captions
--muted-2    #B4B0A8   disabled
--red        #E63025   brand accent — CTA, подчёркивания
--red-ink    #B8251C   hover state для red
--tint       #FFE2DF   розовая подложка для inline-highlight и focus glow

/* Type scale (desktop) */
hero-title   88px / Space Grotesk 700 / lh 0.9 / ls -0.035em
h2           48px / Space Grotesk 700 / lh 0.95 / ls -0.03em
h3           20px / Manrope 600 / lh 1.3
body         15px / Manrope 400 / lh 1.55
lede         18px / Manrope 400 / lh 1.55 / color graphite
label        13px / Manrope 500
mono-caps    11px / JetBrains Mono 500 / ls 0.14em / uppercase / color muted

/* Type scale (mobile <800px) */
hero-title уменьшается до 44px
h2 → 32px

/* Controls */
button-height   sm 32 · md 44 · lg 56 px
input-height    56px
border-radius   0 (всегда)
border          1px solid var(--ink)

/* Spacing scale (px) */
4, 8, 10, 14, 16, 20, 24, 32, 40, 48, 56, 64, 96

/* Container */
max-width       1280px
padding-x       48px desktop · 24px mobile
section padding-y  64px top / 96px bottom
```

---

## Assets

В `assets/`:

| Файл | Где используется | Заменить на |
|---|---|---|
| `wordmark-hand.png` | Navbar, footer | Настоящий wordmark бренда (SVG желательно) |
| `runner-red.png` | Hero-side иллюстрация | Финальная иллюстрация бегуна |
| `runner-yellow.png` | Декоративно в отдельных секциях | — |
| `flower-red.png` | Auth desktop, декор | — |
| `doodle-collage.png` | Community / About | — |

Все иллюстрации — временные placeholder'ы. В продакшене заменить на SVG от иллюстратора бренда. Стиль — наивный рисунок тушью/карандашом, тёплые красные/жёлтые, без полутонов.

---

## Files in this bundle

```
design_handoff_sityranning/
├── README.md                ← this file
├── design-tokens.json       ← machine-readable tokens
├── home.html                ← главная, responsive (guest + authed, dev-toggle справа внизу)
├── home-desktop.html        ← главная, desktop-only (1280px фиксированная сетка) для скриншот-референса
├── home-mobile.html         ← главная, mobile-only (375px) для скриншот-референса
├── auth-desktop.html        ← авторизация desktop
├── auth-mobile.html         ← авторизация mobile
├── screenshots/             ← рендеры всех состояний для дизайн-ревью
│   ├── 01-home-desktop-guest.png      (1280×6571)
│   ├── 02-home-desktop-authed.png     (1280×3904)
│   ├── 03-home-mobile-guest.png       (375×~)
│   ├── 04-home-mobile-authed.png      (375×6142)
│   ├── 05-auth-desktop.png
│   └── 06-auth-mobile.png             (375×2531)
└── assets/
    ├── wordmark-hand.png
    ├── runner-red.png
    ├── runner-yellow.png
    ├── flower-red.png
    └── doodle-collage.png
```

Смежные handoff-пакеты в основном проекте:
- `handoff/auth-desktop/` — подробная спецификация auth-экрана (components.md, copy.md, tokens).
- `handoff/auth-mobile/` — то же для мобилки.

---

## Open questions for product / design

1. **Icon set.** В дизайне сейчас нет иконок (за редким исключением OAuth-логотипов). Если нужны — выбрать библиотеку (предложение: Lucide stroke 1.5px — совпадает с 1px-эстетикой).
2. **Иллюстрации.** Текущие — placeholder. Нужен финальный стиль от иллюстратора.
3. **Онбординг.** После submit hero-формы — какой флоу? Пока заложен redirect на `/auth`, но возможно нужен отдельный wizard с выбором района.
4. **Карта маршрутов.** В карточке события есть CTA «Посмотреть маршрут» — нужна mapbox/yandex-maps интеграция, формат GPX/GeoJSON для маршрутов.
5. **Система баллов.** Правила начисления/списания — в отдельном документе от продукта.
