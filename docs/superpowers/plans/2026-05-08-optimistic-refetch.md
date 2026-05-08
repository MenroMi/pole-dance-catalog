# Optimistic Re-fetch для admin-таблиц — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Таблицы AdminUsers, AdminMoves, AdminTags остаются видимыми (с opacity 0.5) во время любого re-fetch; полный спиннер показывается только при первой загрузке.

**Architecture:** Добавить `isFetching` bool рядом с `loading`. `loading=true` только когда данных ещё нет. При re-fetch — `isFetching=true`, данные остаются в DOM с `opacity: 0.5`. В AdminUsers попутно убираем `t` из deps эффекта (баг: смена локали → re-fetch).

**Tech Stack:** React `useState`, `useRef`, `useEffect`; next-intl `useTranslations`.

---

### Task 1: AdminUsers — isFetching + locale bug fix

**Files:**

- Modify: `src/features/admin/components/AdminUsers.tsx`

- [ ] **Step 1: Добавить `isFetching` state и `tRef`**

Найти блок state (строки 346–360) и добавить после строки 348:

```tsx
const tRef = useRef(t);
tRef.current = t;
const [isFetching, setIsFetching] = useState(false);
```

Импорт `useRef` добавить в строку 5: `import { useEffect, useRef, useState } from 'react';`

- [ ] **Step 2: Обновить `useEffect`**

Заменить весь `useEffect` (строки 362–391):

```tsx
useEffect(() => {
  let cancelled = false;
  const timeout = setTimeout(
    () => {
      if (users.length === 0) setLoading(true);
      else setIsFetching(true);
      getUsersForAdminAction({ page, pageSize: PAGE_SIZE, query, roleFilter })
        .then((data) => {
          if (!cancelled) {
            setUsers(data.users);
            setTotal(data.total);
            setTotalAll(data.totalAll);
            setTotalAdmins(data.totalAdmins);
            setTotalBlocked(data.totalBlocked);
            setError(null);
          }
        })
        .catch((e) => {
          if (!cancelled)
            setError(e instanceof Error ? e.message : tRef.current('users.loadError'));
        })
        .finally(() => {
          if (!cancelled) {
            setLoading(false);
            setIsFetching(false);
          }
        });
    },
    query ? 300 : 0,
  );
  return () => {
    cancelled = true;
    clearTimeout(timeout);
  };
}, [page, query, roleFilter]);
```

Обратить внимание: `t` убрана из deps, используется `tRef.current` для сообщения об ошибке.

- [ ] **Step 3: Обновить render — scrollable body (строки 715–745)**

Заменить блок scrollable body:

```tsx
{
  /* Scrollable body */
}
<div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
  {loading && <div style={{ padding: 40, textAlign: 'center', color: '#555' }}>{t('loading')}</div>}

  {!loading && users.length === 0 && (
    <div
      style={{
        padding: 60,
        textAlign: 'center',
        color: '#6b6270',
        fontFamily: 'var(--font-manrope)',
        fontSize: 14,
      }}
    >
      {t('users.noUsers')}
    </div>
  )}

  {!loading && users.length > 0 && (
    <div style={{ opacity: isFetching ? 0.5 : 1, transition: 'opacity 0.15s' }}>
      {users.map((user, i) => (
        <UserRow
          key={user.id}
          user={user}
          isLast={i === users.length - 1}
          isSelf={user.id === currentUserId}
          isPending={user.id === actingUserId}
          onAction={handleAction}
        />
      ))}
    </div>
  )}
</div>;
```

- [ ] **Step 4: Обновить пагинацию — добавить `isFetching` в `disabled`**

Строка 762: `disabled={page <= 1 || loading}` → `disabled={page <= 1 || loading || isFetching}`

Строка 774: `cursor: page <= 1 || loading ? 'not-allowed' : 'pointer'` → `cursor: page <= 1 || loading || isFetching ? 'not-allowed' : 'pointer'`

Строка 792: `disabled={page >= totalPages || loading}` → `disabled={page >= totalPages || loading || isFetching}`

Строка 804: `cursor: page >= totalPages || loading ? 'not-allowed' : 'pointer'` → `cursor: page >= totalPages || loading || isFetching ? 'not-allowed' : 'pointer'`

- [ ] **Step 5: Проверить TypeScript**

```bash
cd .worktrees/feat+admin-ui && npx tsc --noEmit 2>&1 | head -30
```

Ожидается: нет ошибок.

- [ ] **Step 6: Commit**

```bash
cd .worktrees/feat+admin-ui && git add src/features/admin/components/AdminUsers.tsx && git commit -m "fix(admin): optimistic re-fetch + remove t from useEffect deps in AdminUsers"
```

---

### Task 2: AdminMoves — isFetching

**Files:**

- Modify: `src/features/admin/components/AdminMoves.tsx`

- [ ] **Step 1: Добавить `isFetching` state**

Найти строку `const [loading, setLoading] = useState(true);` (≈410) и добавить после:

```tsx
const [isFetching, setIsFetching] = useState(false);
```

- [ ] **Step 2: Обновить `useEffect`**

Заменить весь `useEffect` (строки 421–434):

```tsx
useEffect(() => {
  let cancelled = false;
  if (moves.length === 0) setLoading(true);
  else setIsFetching(true);
  getMovesForAdminAction()
    .then((data) => {
      if (!cancelled) setMoves(data);
    })
    .catch(console.error)
    .finally(() => {
      if (!cancelled) {
        setLoading(false);
        setIsFetching(false);
      }
    });
  return () => {
    cancelled = true;
  };
}, [refreshKey]);
```

- [ ] **Step 3: Обновить функцию `refresh`**

Заменить (строки 436–439):

```tsx
function refresh() {
  setRefreshKey((k) => k + 1);
}
```

`setLoading(true)` убирается — useEffect теперь сам решает: loading или isFetching.

- [ ] **Step 4: Обновить render — тело таблицы**

Найти блок (≈663–700):

```tsx
{loading && (
  <div style={{ padding: '60px 0', textAlign: 'center', ... }}>
    {t('loading')}
  </div>
)}

{!loading && filtered.length === 0 && (
  <div style={{ padding: '60px 0', textAlign: 'center', ... }}>
    ...
  </div>
)}

{!loading &&
  filtered.map((move, i) => (
    <MoveRow ... />
  ))}
```

Заменить на:

```tsx
{
  loading && (
    <div
      style={{
        padding: '60px 0',
        textAlign: 'center',
        color: '#6b6270',
        fontFamily: 'var(--font-manrope)',
        fontSize: 14,
      }}
    >
      {t('loading')}
    </div>
  );
}

{
  !loading && filtered.length === 0 && (
    <div
      style={{
        padding: '60px 0',
        textAlign: 'center',
        color: '#6b6270',
        fontFamily: 'var(--font-manrope)',
        fontSize: 14,
      }}
    >
      {t('moves.noResults')}
    </div>
  );
}

{
  !loading && filtered.length > 0 && (
    <div style={{ opacity: isFetching ? 0.5 : 1, transition: 'opacity 0.15s' }}>
      {filtered.map((move, i) => (
        <MoveRow
          key={move.id}
          move={move}
          isLast={i === filtered.length - 1}
          onEdit={() => handleEditMove(move.id)}
          onDelete={() => {
            setDeleteTarget(move);
            setDeleteError(null);
          }}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Проверить TypeScript**

```bash
cd .worktrees/feat+admin-ui && npx tsc --noEmit 2>&1 | head -30
```

Ожидается: нет ошибок.

- [ ] **Step 6: Commit**

```bash
cd .worktrees/feat+admin-ui && git add src/features/admin/components/AdminMoves.tsx && git commit -m "fix(admin): optimistic re-fetch in AdminMoves"
```

---

### Task 3: AdminTags — isFetching

**Files:**

- Modify: `src/features/admin/components/AdminTags.tsx`

- [ ] **Step 1: Добавить `isFetching` state**

Найти строку `const [loading, setLoading] = useState(true);` (≈600) и добавить после:

```tsx
const [isFetching, setIsFetching] = useState(false);
```

- [ ] **Step 2: Обновить `useEffect`**

Заменить весь `useEffect` (строки 609–622):

```tsx
useEffect(() => {
  let cancelled = false;
  if (tags.length === 0) setLoading(true);
  else setIsFetching(true);
  getTagsForAdminAction()
    .then((data) => {
      if (!cancelled) setTags(data);
    })
    .catch(console.error)
    .finally(() => {
      if (!cancelled) {
        setLoading(false);
        setIsFetching(false);
      }
    });
  return () => {
    cancelled = true;
  };
}, [refreshKey]);
```

- [ ] **Step 3: Обновить render — loading и grid**

Найти блок (≈783–795):

```tsx
{loading && (
  <div style={{ padding: 40, textAlign: 'center', color: '#555' }}>{t('loading')}</div>
)}

{/* Grid */}
{!loading && (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
      gap: 14,
    }}
  >
```

Заменить на:

```tsx
{loading && (
  <div style={{ padding: 40, textAlign: 'center', color: '#555' }}>{t('loading')}</div>
)}

{/* Grid */}
{!loading && (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
      gap: 14,
      opacity: isFetching ? 0.5 : 1,
      transition: 'opacity 0.15s',
    }}
  >
```

- [ ] **Step 4: Проверить TypeScript**

```bash
cd .worktrees/feat+admin-ui && npx tsc --noEmit 2>&1 | head -30
```

Ожидается: нет ошибок.

- [ ] **Step 5: Запустить тесты**

```bash
cd .worktrees/feat+admin-ui && npx vitest run --reporter=verbose 2>&1 | tail -20
```

Ожидается: 39 тестов passing.

- [ ] **Step 6: Commit**

```bash
cd .worktrees/feat+admin-ui && git add src/features/admin/components/AdminTags.tsx && git commit -m "fix(admin): optimistic re-fetch in AdminTags"
```
