# Герой домашки — Техническая спецификация

Версия документа: 1.0 · Платформа: iOS + Android (Expo SDK 54)

---

## 1. Общее описание

**Герой домашки** — кроссплатформенное мобильное приложение, геймифицированный
трекер домашних заданий для детей начальной и средней школы.

Идея: превратить выполнение домашки в игру. Родитель ставит задания-«квесты»,
ребёнок выполняет их под таймером фокуса и сдаёт на проверку, получает за это
опыт (XP), монеты, повышает уровень героя и держит «стрик» (серию активных дней).

### 1.1. Два пользователя — одно приложение

| Роль | Что делает | Что НЕ может |
|------|-----------|--------------|
| **Родитель** | Создаёт семью, приглашает детей, ставит задания, проверяет (одобряет/возвращает), начисляет бонусные монеты, смотрит прогресс | Заходить в режим ребёнка без выхода и повторного входа |
| **Ребёнок** | Видит назначенные ему квесты, запускает таймер фокуса, сдаёт на проверку, прокачивает героя | Создавать, редактировать или удалять задания; видеть форму добавления |

Каждый пользователь входит через **свой Google-аккаунт**. Роль выбирается один
раз при первом входе (онбординг) и сохраняется в профиле.

### 1.2. Ключевые сценарии

1. **Родитель регистрируется первым** → создаётся «семья» с уникальным
   6-значным инвайт-кодом.
2. **Родитель передаёт код ребёнку** (показать / скопировать / поделиться).
3. **Ребёнок входит через Google**, выбирает роль «Ребёнок», вводит код →
   присоединяется к семье.
4. **Родитель ставит задание** конкретному ребёнку (предмет, описание, XP,
   дедлайн).
5. **Ребёнок видит квест**, жмёт «Начать квест» → запускается Pomodoro-таймер
   25 минут, по «Готово» задание уходит на проверку.
6. **Родитель проверяет**: одобряет (начисляются XP + монеты, опц. бонус) или
   возвращает с комментарием.
7. Прогресс и состояние **синхронизируются между устройствами** в реальном
   времени через Supabase Realtime.

---

## 2. Технологический стек

| Слой | Технология | Версия |
|------|-----------|--------|
| Рантайм | React Native | 0.81.5 |
| Фреймворк | Expo SDK | 54 |
| Язык | TypeScript (strict) | 5.9 |
| UI-библиотека | React | 19.1 |
| Навигация | expo-router (file-based) | v6 |
| Состояние | Zustand + middleware/persist | 4.5 |
| Локальное хранилище | @react-native-async-storage/async-storage | 2.2 |
| Бэкенд / БД / Auth | Supabase (PostgreSQL + GoTrue + Realtime) | js-sdk 2.45 |
| Анимации | react-native-reanimated + react-native-worklets | 4.1 / 0.5 |
| Графика | react-native-svg (круговой таймер) | 15.12 |
| Иконки | @expo/vector-icons (Ionicons) | 15 |
| OAuth-флоу | expo-web-browser + expo-linking + expo-auth-session | — |
| Прочее | expo-clipboard, expo-notifications | — |

Бэкенда как отдельного сервиса нет — вся серверная часть это **Supabase**
(управляемый Postgres + Auth + Realtime + Row Level Security).

---

## 3. Архитектура проекта

### 3.1. Файловая структура

```
HWHero/
├── app/                        # Экраны (expo-router, file-based routing)
│   ├── _layout.tsx             # Корневой Stack, рендерит только навигатор
│   ├── index.tsx               # Routing-trampoline (<Redirect> по auth-состоянию)
│   ├── auth.tsx                # Экран «Войти через Google»
│   ├── auth-callback.tsx       # Приём OAuth deep link, установка сессии
│   ├── onboarding.tsx          # Выбор роли + ввод инвайт-кода
│   ├── parent/
│   │   ├── _layout.tsx         # PIN-gate + Tabs (Задания/Добавить/Прогресс/Семья)
│   │   ├── index.tsx           # Список заданий + проверка
│   │   ├── add.tsx             # Форма создания задания
│   │   ├── stats.tsx           # Дашборд прогресса детей
│   │   └── family.tsx          # Инвайт-код + список детей
│   └── child/
│       ├── _layout.tsx         # Tabs (Квесты / Герой)
│       ├── index.tsx           # Список квестов + запуск таймера
│       └── hero.tsx            # XP, уровень, монеты, стрик, победы
├── components/
│   ├── AuthBoot.tsx            # Подписка на supabase.auth onAuthStateChange
│   ├── FocusTimer.tsx          # Полноэкранный Pomodoro-таймер (SVG-кольцо)
│   ├── PinModal.tsx            # Модалка ввода PIN для родителя
│   ├── ReviewSheet.tsx         # Bottom sheet проверки задания
│   ├── TaskCard.tsx            # Карточка задания (parent/child варианты)
│   ├── XPBar.tsx               # Анимированная XP-полоса (reanimated)
│   └── useTheme.ts             # Хук light/dark темы (useColorScheme)
├── constants/theme.ts          # Палитра, Radius, Spacing
├── lib/
│   ├── supabase.ts             # Supabase-клиент + типы строк БД
│   └── auth.ts                 # Google OAuth, deep link, setSessionFromUrl
├── store/index.ts              # Zustand store — единый источник состояния
├── types/index.ts              # TypeScript-типы домена + константы
├── supabase/schema.sql         # DDL: таблицы, RPC-функции, RLS, Realtime
├── app.json                    # Конфиг Expo (scheme: homeworkhero)
├── babel.config.js             # Пресет expo + плагин worklets
└── package.json
```

### 3.2. Навигация (expo-router v6)

Маршрутизация — файловая. Корневой `app/_layout.tsx` рендерит **только**
`<Stack>` (без императивных переходов — это требование expo-router v6).

Логика «куда направить пользователя» сосредоточена в `app/index.tsx`,
который возвращает декларативный `<Redirect>`:

```
              session?
            /         \
          нет          да
           |            |
        /auth      profile.familyId?
                    /            \
                  нет             да
                   |               |
             /onboarding     role == 'parent'?
                              /            \
                            да              нет
                             |               |
                         /parent          /child
```

Граф маршрутов:

| Маршрут | Назначение |
|---------|-----------|
| `/` | Trampoline — мгновенный редирект |
| `/auth` | Вход через Google |
| `/auth-callback` | Приём OAuth-редиректа (deep link), установка сессии |
| `/onboarding` | Выбор роли «Родитель / Ребёнок» |
| `/parent` (tabs) | `index` · `add` · `stats` · `family` |
| `/child` (tabs) | `index` (квесты) · `hero` |

---

## 4. Модель данных

### 4.1. Доменные типы (`types/index.ts`)

```typescript
type TaskStatus = 'active' | 'submitted' | 'approved' | 'rejected'
type Role       = 'parent' | 'child'
type AppMode    = 'select' | 'parent' | 'child'

interface Profile {
  id: string                 // = auth.users.id
  email: string | null
  displayName: string
  avatarUrl: string | null
  role: Role
  familyId: string | null    // null до прохождения онбординга
}

interface Family {
  id: string
  ownerId: string            // создатель-родитель
  name: string
  inviteCode: string         // 6 символов A-Z2-9 без неоднозначных
}

interface Task {
  id: string
  familyId: string
  childId: string            // кому назначено
  parentId: string           // кто создал
  subject: string
  description: string
  deadline: string           // ISO date
  xpReward: number
  status: TaskStatus
  timeSpentSec: number       // накопленное время таймера фокуса
  submittedAt?: string
  approvedAt?: string
  parentComment?: string     // комментарий при возврате
  bonusCoins?: number        // бонус от родителя при одобрении
  createdAt: string
}

interface HeroStats {        // прогресс ОДНОГО ребёнка
  name: string
  level: number
  xp: number
  xpToNext: number           // XP_PER_LEVEL = 1000
  coins: number
  streakDays: number
  lastActiveDate?: string    // YYYY-MM-DD, для расчёта стрика
}
```

### 4.2. Схема БД (Supabase / PostgreSQL)

Четыре таблицы. Полный DDL — в `supabase/schema.sql`.

**`families`** — семья (одна на родителя-владельца)
| Колонка | Тип | Описание |
|---------|-----|----------|
| id | uuid PK | |
| owner_id | uuid → auth.users | владелец |
| name | text | название семьи |
| invite_code | text UNIQUE | 6-значный код приглашения |
| created_at | timestamptz | |

**`profiles`** — профиль пользователя (1:1 с auth.users)
| Колонка | Тип | Описание |
|---------|-----|----------|
| id | uuid PK → auth.users | |
| email | text | |
| display_name | text | |
| avatar_url | text | из Google-метаданных |
| role | text CHECK(parent/child) | |
| family_id | uuid → families | NULL до онбординга |
| created_at | timestamptz | |

**`tasks`** — задания-квесты
| Колонка | Тип | Описание |
|---------|-----|----------|
| id | uuid PK | |
| family_id | uuid → families | |
| child_id | uuid → profiles | кому назначено |
| parent_id | uuid → profiles | кто создал |
| subject, description | text | |
| deadline | timestamptz | |
| xp_reward | int | |
| status | text CHECK(active/submitted/approved/rejected) | |
| time_spent_sec | int | |
| submitted_at, approved_at | timestamptz | |
| parent_comment | text | |
| bonus_coins | int | |
| created_at | timestamptz | |

**`heroes`** — игровой прогресс (одна строка на ребёнка, PK = child_id)
| Колонка | Тип | Описание |
|---------|-----|----------|
| child_id | uuid PK → profiles | |
| family_id | uuid → families | |
| name | text | имя героя |
| level, xp, coins, streak_days | int | |
| last_active_date | date | |
| updated_at | timestamptz | |

### 4.3. RPC-функции (PostgreSQL, SECURITY DEFINER)

| Функция | Назначение |
|---------|-----------|
| `gen_invite_code()` | Генерирует случайный 6-символьный код |
| `bootstrap_parent(display_name)` | Создаёт семью + профиль родителя при первом входе. Возвращает `(r_profile_id, r_family_id, r_invite_code)` |
| `join_family_as_child(invite_code, display_name)` | Привязывает ребёнка к семье по коду, создаёт профиль + строку heroes |
| `regenerate_invite_code(family_id)` | Меняет код семьи (только владелец) |
| `is_parent_of(family_id)` | RLS-хелпер: «текущий юзер — родитель в семье F» |
| `is_member_of(family_id)` | RLS-хелпер: «текущий юзер — член семьи F» |

> Выходные колонки RPC-функций с `RETURNS TABLE` намеренно префиксованы `r_`,
> чтобы не конфликтовать с именами колонок таблиц (ошибка Postgres 42702
> «column reference is ambiguous»).

---

## 5. Аутентификация

### 5.1. Google OAuth через Supabase Auth

Полноценная авторизация — не анонимный доступ. Каждый пользователь входит
своим Google-аккаунтом.

**Флоу входа (`lib/auth.ts` → `signInWithGoogle`):**

1. `getRedirectUrl()` = `Linking.createURL('auth-callback')`
   → в Expo Go: `exp://192.168.x.y:8081/--/auth-callback`
   → в standalone-сборке: `homeworkhero://auth-callback`
2. `supabase.auth.signInWithOAuth({ provider: 'google', redirectTo })` —
   возвращает URL вида `https://<project>.supabase.co/auth/v1/authorize?...`
3. `WebBrowser.openAuthSessionAsync(url, redirectTo)` открывает браузерную
   сессию.
4. Supabase 302 → Google → пользователь выбирает аккаунт.
5. Google 302 → Supabase callback → Supabase 302 → `redirectTo`
   (с `#access_token=...` во фрагменте).
6. Установка сессии:
   - **iOS**: браузерная сессия перехватывает редирект, токены парсятся в
     `signInWithGoogle` через `setSessionFromUrl`.
   - **Android**: редирект deep-link'ом попадает в приложение на маршрут
     `/auth-callback`, экран `auth-callback.tsx` парсит токены и ставит сессию.
7. `setSessionFromUrl()` извлекает `access_token` / `refresh_token` и вызывает
   `supabase.auth.setSession()`.

**Слежение за сессией:** компонент `AuthBoot` подписан на
`supabase.auth.onAuthStateChange` и при любом изменении вызывает
`store.setSession()`.

### 5.2. PIN-код родителя

Дополнительная защита режима родителя на устройстве (чтобы ребёнок случайно не
зашёл). PIN по умолчанию `1234`, хранится **только локально** (AsyncStorage),
**не синхронизируется** через Supabase. `PinGate` в `parent/_layout.tsx`
требует PIN при каждом входе в родительский раздел.

### 5.3. Настройка на стороне Supabase (обязательна)

- **Authentication → Providers → Google**: включён, прописаны Client ID и
  Secret из Google Cloud Console.
- **Authentication → URL Configuration → Redirect URLs**:
  `exp://**`, `homeworkhero://**`, точный dev-URL.
- **Site URL**: в dev указывает на `exp://<ip>:8081/--/auth-callback`
  (так как GoTrue в implicit-флоу не восстанавливает `redirect_to` из state
  через Google и фоллбэчит на Site URL). Для продакшена → `homeworkhero://auth-callback`.

---

## 6. Семьи и инвайт-коды

- Каждый родитель при первом входе автоматически создаёт **одну семью**
  (`bootstrap_parent`).
- Семья получает уникальный **6-значный код** (алфавит `A-Z2-9` без
  неоднозначных символов `0/O/1/I`).
- Ребёнок присоединяется, введя код (`join_family_as_child`).
- Одна семья — **один родитель + N детей** (модель поддерживает несколько
  детей; форма создания задания показывает выбор ребёнка, если их больше одного).
- Родитель-владелец может **сменить код** (`regenerate_invite_code`) — старый
  перестаёт работать, уже привязанные дети остаются.
- Экран «Семья» (`parent/family.tsx`): показ кода, копирование, шеринг,
  смена кода, список детей с их уровнем/XP/монетами.

---

## 7. Геймификация

### 7.1. Опыт и уровни

- `XP_PER_LEVEL = 1000`.
- `level = floor(xp / 1000) + 1`.
- `xpToNext = 1000 − (xp mod 1000)`.
- Эмодзи героя по уровню (1→10):
  🥚 🐣 🧙 ⚔️ 🏆 👑 🌟 🔥 💫 🌌.

### 7.2. Начисления при одобрении задания

```
xpGain   = task.xpReward
coinGain = floor(task.xpReward / 10) + bonusCoins
newXp    = hero.xp + xpGain
newCoins = hero.coins + coinGain
level, xpToNext = computeLevel(newXp)
```

### 7.3. Стрик (серия активных дней)

При одобрении задания:
- если `lastActiveDate == сегодня` — стрик не меняется;
- если `lastActiveDate == вчера` — `streakDays += 1`;
- иначе — `streakDays = 1`.

### 7.4. Таймер фокуса (Pomodoro)

- Полноэкранная модалка, 25 минут, круговой SVG-прогресс.
- Зелёный баннер «🛡️ Щит концентрации активен» пока таймер идёт.
- Кнопки «Пауза/Старт» и «Готово!».
- По «Готово» → подтверждение → `submitTask(id, elapsedSec)`; накопленное
  время прибавляется к `task.timeSpentSec`.

---

## 8. Состояние и синхронизация

### 8.1. Zustand store (`store/index.ts`)

Единый источник истины. Срез состояния:

| Поле | Описание |
|------|----------|
| `session` | Supabase-сессия |
| `profile` | профиль текущего пользователя |
| `family` | семья текущего пользователя |
| `children` | профили детей семьи (для UI родителя) |
| `heroByChildId` | прогресс героев по child_id |
| `tasks` | задания семьи |
| `mode`, `parentPin` | локальные UI-настройки |
| `hydrated`, `realtimeSubscribed` | служебные флаги |

**Основные actions:**
`setSession` · `refreshFromRemote` · `bootstrapAsParent` · `joinAsChild` ·
`regenerateInviteCode` · `addTask` · `submitTask` · `approveTask` ·
`rejectTask` · `deleteTask` · `setHeroName` · `initRealtime`.

**Персистентность:** через `zustand/middleware/persist` + AsyncStorage
сохраняются только локальные настройки (`parentPin`, `mode`). Доменные данные
(`tasks`, `profiles`, `heroes`) всегда тянутся из Supabase — он источник истины.

### 8.2. Realtime-синхронизация

После загрузки `family` вызывается `initRealtime()` (идемпотентно), который
подписывается на три канала Postgres Changes, отфильтрованных по `family_id`:

| Канал | Реакция |
|-------|---------|
| `tasks` | вставка/обновление/удаление задания → обновление `tasks` |
| `heroes` | изменение прогресса → обновление `heroByChildId` |
| `profiles` | присоединение/изменение участника → полный `refreshFromRemote()` |

> Важно: `initRealtime()` вызывается в конце `refreshFromRemote()`, когда
> `family` уже загружен. Вызов до загрузки `family` — no-op (известный баг,
> исправлен).

**Подстраховка:** экран «Семья» обновляет данные при получении фокуса
(`useFocusEffect`) и поддерживает pull-to-refresh — на случай пропущенного
realtime-события.

---

## 9. Описание экранов

### 9.1. Режим родителя

**Задания (`parent/index.tsx`)**
- Секция «На проверке» (статус `submitted`) с янтарной обводкой; тап по
  карточке открывает `ReviewSheet`.
- Ниже — все остальные задания, цвет статуса: серый/зелёный/красный.
- При нескольких детях на карточке показывается имя ребёнка.

**Проверка (`ReviewSheet.tsx`)** — bottom sheet:
- Описание задания и потраченное время.
- Поле комментария, поле бонусных монет.
- Кнопки «Вернуть» (красная обводка) и «Одобрить ✓» (зелёная).

**Добавить (`parent/add.tsx`)**
- Выбор ребёнка (если их >1).
- Горизонтальные чипы предметов (9 предметов).
- Multiline-описание.
- XP: чипы 50/100/150/200 + ручной ввод.
- Дедлайн: дата-пикер (по умолчанию завтра).

**Прогресс (`parent/stats.tsx`)**
- Карточка по каждому ребёнку (уровень, XP, монеты, стрик).
- Красный баннер при просроченных заданиях.
- Сетка 2×2: выполнено / на проверке / активных / минут учёбы.
- Гистограмма активности за 7 дней.
- Разбивка по предметам.

**Семья (`parent/family.tsx`)**
- Крупный инвайт-код, копирование/шеринг/смена.
- Список детей с прогрессом.

### 9.2. Режим ребёнка

**Квесты (`child/index.tsx`)**
- Карточки заданий: предмет, описание, дедлайн, XP-бейдж.
- Возвращённое задание (`rejected`) — красный баннер с комментарием родителя.
- Кнопка «Начать квест ▶» → полноэкранный `FocusTimer`.
- Сданные (`submitted`) — серый баннер «Ожидает проверки».

**Герой (`child/hero.tsx`)**
- Эмодзи персонажа по уровню.
- Редактируемое имя героя.
- Анимированная XP-полоса.
- Сетка: монеты / дней подряд / квестов / минут учёбы.
- Последние 5 одобренных квестов.

---

## 10. Безопасность (Row Level Security)

RLS включён на всех четырёх таблицах. Принцип: пользователь видит и меняет
только данные своей семьи.

| Таблица | Политика |
|---------|----------|
| `families` | читать — члены семьи; менять — только владелец |
| `profiles` | читать — свой профиль + члены своей семьи; менять — только свой |
| `tasks` | читать — члены семьи; писать всё — родитель семьи; обновлять своё — ребёнок (сдача задания) |
| `heroes` | читать — члены семьи; обновлять своего героя — ребёнок; обновлять героев детей — родитель (награды) |

RLS-хелперы `is_parent_of()` / `is_member_of()` — `SECURITY DEFINER`, что
исключает рекурсию политик. RPC-функции (`bootstrap_parent` и т.д.) тоже
`SECURITY DEFINER` — выполняются с повышенными правами, но внутри проверяют
`auth.uid()`.

---

## 11. Дизайн

- **Цветовые схемы:** зелёный (`#639922` / `#EAF3DE`) — детский режим;
  синий (`#378ADD` / `#E6F1FB`) — родительский.
- **Скругления:** 14–20 px карточки, 12 px кнопки.
- **Стиль:** минималистичный flat, без теней (кроме функциональных focus-ring).
- **Тёмная/светлая тема:** автоматически через `useColorScheme`.
- **Шрифты:** системные (San Francisco / Roboto).

---

## 12. Известные ограничения и dev-заметки

| # | Ограничение / нюанс |
|---|---------------------|
| 1 | **Site URL привязан к dev-IP.** В dev Supabase Site URL = `exp://<ip>:8081/--/auth-callback`. При смене IP ноутбука нужно обновлять Site URL. Для продакшена → `homeworkhero://auth-callback` (standalone-сборка). |
| 2 | **PIN не синхронизируется** — только локальный AsyncStorage. |
| 3 | **Один родитель на семью.** Со-родители не поддерживаются (модель расширяема). |
| 4 | **react-native-worklets** зафиксирован на `0.5.1` (совместимость с reanimated 4 в SDK 54). |
| 5 | **Туннель ngrok** на dev-машине не подключался (файрвол/корп-сеть) — разработка ведётся в LAN-режиме (`expo start --lan`), порт 8081 открыт правилом Windows Firewall. |
| 6 | **Expo Go SDK 54** — оба устройства должны иметь свежий Expo Go; проект апнут с SDK 51 до 54. |
| 7 | **Push-уведомления** (`expo-notifications`) подключены как зависимость, но логика уведомлений ещё не реализована. |
| 8 | **RLS для Realtime**: postgres_changes доставляются с учётом RLS — клиент получает событие только если может прочитать строку. |

---

## 13. Установка и запуск (dev)

```bash
# 1. Зависимости
npm install --legacy-peer-deps

# 2. .env — ключи Supabase
#    EXPO_PUBLIC_SUPABASE_URL=...
#    EXPO_PUBLIC_SUPABASE_ANON_KEY=...

# 3. Схема БД — выполнить supabase/schema.sql в SQL-редакторе Supabase

# 4. Supabase Auth — включить Google-провайдер, прописать Redirect URLs

# 5. Запуск Metro (watch-режим, следит за файлами)
npx expo start --lan

# 6. Подключение устройства
#    iOS:     Камера → QR  (или Safari: exp://<ip>:8081)
#    Android: Камера → QR
```

**Сборка standalone (когда понадобится):**
```bash
npx expo install eas-cli
eas build --platform android --profile preview
eas build --platform ios --profile preview
```

---

## 14. Дальнейшее развитие (бэклог)

- Push-уведомления: «новое задание», «задание проверено», напоминание о
  дедлайне.
- Магазин наград за монеты (родитель задаёт призы).
- Несколько со-родителей в семье.
- Достижения / бейджи.
- Перевод Site URL на постоянную схему через standalone-сборку (убрать
  привязку к dev-IP).
- История заданий и аналитика за длительный период.
