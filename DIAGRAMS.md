# Герой домашки — Диаграммы

Все диаграммы в формате [Mermaid](https://mermaid.js.org/) — рендерятся на
GitHub, в VS Code (с расширением) и на mermaid.live.

---

## 1. Навигация и роутинг (expo-router)

Как пользователь попадает на нужный экран в зависимости от auth-состояния.

```mermaid
flowchart TD
    Start([Запуск приложения]) --> Hydrate[Гидратация store]
    Hydrate --> Index{"/" — index.tsx}
    Index -->|нет session| Auth["/auth<br/>Войти через Google"]
    Auth -->|OAuth| Callback["/auth-callback<br/>приём токенов"]
    Callback --> Index
    Index -->|session, нет familyId| Onboarding["/onboarding<br/>Кто ты?"]
    Onboarding -->|Родитель| Parent
    Onboarding -->|Ребёнок + код| Child
    Index -->|session + role=parent| Parent
    Index -->|session + role=child| Child

    subgraph Parent["/parent (Tabs)"]
        P1[Задания]
        P2[Добавить]
        P3[Прогресс]
        P4[Семья]
    end

    subgraph Child["/child (Tabs)"]
        C1[Квесты]
        C2[Герой]
    end

    Parent -.PIN-gate.-> PinCheck{PIN верный?}
    PinCheck -->|нет| Index
```

---

## 2. Схема базы данных (ER)

```mermaid
erDiagram
    AUTH_USERS ||--|| PROFILES : "1:1"
    FAMILIES ||--o{ PROFILES : "содержит"
    FAMILIES ||--o{ TASKS : "содержит"
    FAMILIES ||--o{ HEROES : "содержит"
    PROFILES ||--o{ TASKS : "child_id / parent_id"
    PROFILES ||--|| HEROES : "ребёнок:герой"

    FAMILIES {
        uuid id PK
        uuid owner_id FK
        text name
        text invite_code UK
        timestamptz created_at
    }
    PROFILES {
        uuid id PK
        text email
        text display_name
        text avatar_url
        text role "parent|child"
        uuid family_id FK
        timestamptz created_at
    }
    TASKS {
        uuid id PK
        uuid family_id FK
        uuid child_id FK
        uuid parent_id FK
        text subject
        text description
        timestamptz deadline
        int xp_reward
        text status "active|submitted|approved|rejected"
        int time_spent_sec
        timestamptz submitted_at
        timestamptz approved_at
        text parent_comment
        int bonus_coins
        timestamptz created_at
    }
    HEROES {
        uuid child_id PK
        uuid family_id FK
        text name
        int level
        int xp
        int coins
        int streak_days
        date last_active_date
        timestamptz updated_at
    }
```

---

## 3. Поток авторизации Google OAuth

```mermaid
sequenceDiagram
    actor U as Пользователь
    participant App as Приложение
    participant WB as WebBrowser
    participant SB as Supabase Auth
    participant G as Google

    U->>App: Тап «Войти через Google»
    App->>SB: signInWithOAuth(provider=google, redirectTo)
    SB-->>App: authorize URL
    App->>WB: openAuthSessionAsync(url, redirectTo)
    WB->>SB: GET /authorize?provider=google
    SB-->>WB: 302 → accounts.google.com
    WB->>G: страница выбора аккаунта
    U->>G: Выбирает аккаунт
    G-->>SB: 302 → /auth/v1/callback?code
    SB-->>WB: 302 → redirectTo#access_token

    alt iOS
        WB-->>App: result.url (перехват в браузере)
        App->>App: setSessionFromUrl()
    else Android
        WB-->>App: deep link → /auth-callback
        App->>App: auth-callback.tsx → setSessionFromUrl()
    end

    App->>SB: setSession(access, refresh)
    SB-->>App: Сессия установлена
    App->>U: Редирект на /onboarding или /parent//child
```

---

## 4. Жизненный цикл задания

```mermaid
stateDiagram-v2
    [*] --> active : Родитель создал (addTask)
    active --> submitted : Ребёнок сдал (submitTask)
    submitted --> approved : Родитель одобрил (approveTask)
    submitted --> rejected : Родитель вернул (rejectTask)
    rejected --> submitted : Ребёнок переделал и сдал
    approved --> [*]

    note right of active
        Виден ребёнку как квест.
        Можно запускать таймер.
    end note
    note right of submitted
        У родителя — секция «На проверке».
        У ребёнка — «Ожидает проверки».
    end note
    note right of approved
        +XP, +монеты, обновление стрика.
        Уходит из списка квестов.
    end note
    note right of rejected
        Красный баннер с комментарием
        родителя у ребёнка.
    end note
```

---

## 5. Архитектура и синхронизация

```mermaid
flowchart LR
    subgraph DeviceP["📱 Устройство родителя"]
        UIp[Экраны parent/]
        StoreP[Zustand store]
        UIp <--> StoreP
    end

    subgraph DeviceC["📱 Устройство ребёнка"]
        UIc[Экраны child/]
        StoreC[Zustand store]
        UIc <--> StoreC
    end

    subgraph Supabase["☁️ Supabase"]
        Auth[GoTrue Auth]
        DB[(PostgreSQL + RLS)]
        RT[Realtime]
    end

    StoreP -->|RPC, CRUD| DB
    StoreC -->|RPC, CRUD| DB
    DB --> RT
    RT -->|postgres_changes| StoreP
    RT -->|postgres_changes| StoreC
    StoreP -.OAuth.-> Auth
    StoreC -.OAuth.-> Auth

    AS[(AsyncStorage<br/>PIN, mode)] <--> StoreP
    AS2[(AsyncStorage<br/>PIN, mode)] <--> StoreC
```

---

## 6. Геймификация — расчёт наград

```mermaid
flowchart TD
    Approve[approveTask id, bonusCoins] --> XP["xpGain = task.xpReward"]
    Approve --> Coins["coinGain = floor xpReward/10 + bonusCoins"]
    XP --> NewXP["newXp = hero.xp + xpGain"]
    NewXP --> Level["level = floor newXp/1000 + 1"]
    NewXP --> ToNext["xpToNext = 1000 − newXp mod 1000"]
    Coins --> NewCoins["newCoins = hero.coins + coinGain"]
    Approve --> Streak{lastActiveDate?}
    Streak -->|сегодня| S0[стрик без изменений]
    Streak -->|вчера| S1[streakDays + 1]
    Streak -->|раньше| S2[streakDays = 1]
    Level --> Save[(UPDATE heroes)]
    ToNext --> Save
    NewCoins --> Save
    S0 --> Save
    S1 --> Save
    S2 --> Save
```
