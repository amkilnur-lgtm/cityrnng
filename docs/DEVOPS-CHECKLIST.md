# GitHub + Claude + Deploy Checklist

> **Полный пошаговый гайд по подъёму VM, env, миграциям и reverse-proxy:**
> [`docs/DEPLOY-RUNBOOK.md`](./DEPLOY-RUNBOOK.md)
>
> Этот документ — высокоуровневые правила и git/процесс. Конкретика деплоя — в runbook.


## 1. Репозиторий

1. Создать GitHub repository `cityrnng`.
2. Включить branch protection для `main`.
3. Запретить прямой push в `main`.
4. Разрешить merge только через PR.
5. Включить required status checks для CI.

## 2. Локальная среда

1. Работать в `WSL2 Ubuntu`.
2. Клонировать репозиторий в папку вроде `~/work/cityrnng`.
3. Установить `git`, `docker`, `node`, `pnpm`.
4. Установить Claude Code.
5. Проверить `claude --version`.
6. Запустить `claude doctor`.

## 3. Подключение Claude

1. Открыть репозиторий из корня.
2. Убедиться, что в корне есть `CLAUDE.md`.
3. При желании выполнить `/init`, но не перезаписывать зафиксированные правила.
4. Использовать Claude локально для больших задач.

## 4. GitHub integration для Claude

1. Установить Claude GitHub App или настроить workflow integration.
2. Добавить `ANTHROPIC_API_KEY` в GitHub secrets.
3. Ограничить права integration только на нужный репозиторий.
4. Использовать GitHub-режим для PR review и follow-up задач.

## 5. Git workflow

1. На каждую задачу создавать отдельную ветку.
2. Имена веток:
   - `feat/...`
   - `fix/...`
   - `chore/...`
3. После работы пушить ветку в origin.
4. Открывать Pull Request в `main`.
5. Дожидаться зеленого CI.
6. Merge делать через `Squash and merge`.

## 6. Staging

1. Создать отдельный staging VM или container host.
2. Подготовить `docker compose` или systemd + docker setup.
3. Создать отдельную staging БД.
4. Создать отдельный staging Redis.
5. Настроить staging secrets в GitHub Environment `staging`.
6. Включить auto-deploy на merge в `main`.

## 7. Production

1. Создать production VM.
2. Настроить домен и HTTPS.
3. Использовать отдельные production secrets.
4. Использовать отдельную production БД и Redis.
5. Оставить deploy только ручным через `workflow_dispatch`.
6. После deploy запускать health check.

## 8. База данных и миграции

1. Prisma migrations коммитятся в репозиторий.
2. На staging миграции запускаются автоматически в deploy pipeline.
3. На production миграции запускаются в рамках ручного deploy.
4. Перед production deploy должен существовать backup policy.

## 9. Что нельзя делать

- не редактировать код на staging/prod вручную;
- не выполнять `git pull` на production как основной способ релиза;
- не хранить секреты в репозитории;
- не выкатывать production из локального ноутбука вручную;
- не давать Claude прямой доступ к production deploy без вашего участия.

## 10. Рекомендуемый ежедневный цикл

1. Создать feature branch.
2. Дать Claude задачу на один эпик или срез.
3. Проверить diff.
4. Сделать commit.
5. Push в GitHub.
6. Открыть PR.
7. Дождаться CI.
8. Merge в `main`.
9. Проверить staging.
10. Когда всё стабильно, вручную запустить production deploy.
