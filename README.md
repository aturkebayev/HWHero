# 🧙 Герой домашки

Геймифицированный трекер домашних заданий для детей начальной и средней школы.
Родитель ставит задания-квесты, ребёнок выполняет их под таймером фокуса и
сдаёт на проверку, прокачивая героя — XP, уровни, монеты, стрик.

> Кроссплатформенно: iOS + Android. Один родитель и ребёнок могут быть на
> разных платформах — состояние синхронизируется в реальном времени.

| | |
|---|---|
| **Стек** | React Native 0.81 · Expo SDK 54 · TypeScript · expo-router v6 |
| **Состояние** | Zustand + AsyncStorage |
| **Бэкенд** | Supabase (Postgres + Auth + Realtime + RLS) |
| **Авторизация** | Google OAuth |

📄 Подробности — в [`SPEC.md`](./SPEC.md) · 📊 Диаграммы — в [`DIAGRAMS.md`](./DIAGRAMS.md)

---

## Быстрый старт

### 1. Зависимости
```bash
npm install --legacy-peer-deps
```

### 2. Переменные окружения
Создай `.env` в корне (шаблон — `.env.example`):
```
EXPO_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

### 3. База данных
Открой SQL-редактор Supabase → выполни весь `supabase/schema.sql`.
Создаст таблицы, RPC-функции, RLS-политики, включит Realtime.

### 4. Авторизация Supabase
- **Authentication → Providers → Google** — включить, прописать Client ID/Secret
  из Google Cloud Console.
- **Authentication → URL Configuration → Redirect URLs** — добавить
  `exp://**` и `homeworkhero://**`.
- **Site URL** (dev) — `exp://<ip>:8081/--/auth-callback`.

### 5. Запуск
```bash
npx expo start --lan
```
Подключение устройства: камера iPhone/Android → QR-код. Оба устройства должны
быть в одной Wi-Fi и иметь свежий Expo Go (SDK 54).

---

## Роли

| Родитель | Ребёнок |
|----------|---------|
| Создаёт семью, приглашает детей кодом | Входит по коду от родителя |
| Ставит задания, проверяет, начисляет бонусы | Выполняет квесты под таймером, сдаёт |
| Вкладки: Задания · Добавить · Прогресс · Семья | Вкладки: Квесты · Герой |
| Защита PIN-кодом (по умолчанию `1234`) | Вход без PIN |

---

## Структура проекта

```
app/            Экраны (expo-router, file-based)
  ├ _layout     Корневой Stack
  ├ index       Routing-trampoline
  ├ auth*       Вход + OAuth-callback
  ├ onboarding  Выбор роли
  ├ parent/     4 вкладки родителя
  └ child/      2 вкладки ребёнка
components/     Переиспользуемые компоненты (TaskCard, FocusTimer, XPBar…)
constants/      Тема (цвета, отступы)
lib/            supabase-клиент, auth-хелперы
store/          Zustand store — единый источник состояния
types/          TypeScript-типы домена
supabase/       schema.sql (DDL + RPC + RLS)
```

---

## Геймификация

- `level = floor(xp / 1000) + 1`
- При одобрении: `+xpReward` XP, `+floor(xpReward/10) + bonus` монет
- Стрик растёт, если задания одобряются в последовательные дни
- Таймер фокуса — Pomodoro 25 минут

---

## Полезные команды

```bash
npx tsc --noEmit          # проверка типов
npx expo start --lan      # dev-сервер (watch-режим)
npx expo start --clear    # с очисткой кэша Metro
```

## Известные нюансы

- Site URL в Supabase привязан к dev-IP — при смене сети обновить.
- `react-native-worklets` зафиксирован на `0.5.1` (совместимость с reanimated 4).
- Туннель ngrok может блокироваться файрволом — используется LAN-режим.

Полный список — раздел 12 в [`SPEC.md`](./SPEC.md).
