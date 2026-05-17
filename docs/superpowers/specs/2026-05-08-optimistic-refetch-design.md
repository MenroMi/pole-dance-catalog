# Optimistic Re-fetch для admin-таблиц

**Дата:** 2026-05-08  
**Ветка:** feat/admin-ui  
**Компоненты:** AdminUsers, AdminMoves, AdminTags

## Проблема

При любом re-fetch (смена страницы, фильтра, поиска, локали) таблица уходит в loading-состояние — данные скрываются, показывается спиннер. Это грубо и ненужно: данные на экране уже есть, новые — почти те же самые.

Дополнительный баг в AdminUsers: `t` (функция из `useTranslations`) стоит в deps `useEffect`. При смене локали `next-intl` возвращает новую ссылку на `t` → эффект запускается → `setLoading(true)`.

## Решение

Разделить «есть данные или нет» и «данные сейчас обновляются»:

| Флаг         | Начальное значение | Смысл                                     |
| ------------ | ------------------ | ----------------------------------------- |
| `loading`    | `true`             | Нет данных ещё, показываем полный спиннер |
| `isFetching` | `false`            | Данные есть, идёт тихое обновление        |

### Логика эффекта

```ts
// Если данных нет — полный спиннер. Если есть — тихий isFetching.
if (data.length === 0) setLoading(true);
else setIsFetching(true);

fetch(...)
  .then(newData => setData(newData))
  .finally(() => { setLoading(false); setIsFetching(false); });
```

`t` убирается из deps `useEffect` в AdminUsers. Вместо этого используется `useRef` для доступа к актуальной `t` внутри эффекта.

### Render

```tsx
{loading && <LoadingPlaceholder />}

{!loading && (
  <div style={{ opacity: isFetching ? 0.5 : 1, transition: 'opacity 0.15s' }}>
    {rows}
  </div>
)}

// Пагинация, кнопки обновления
disabled={loading || isFetching}
```

## Затронутые файлы

- `src/features/admin/components/AdminUsers.tsx`
- `src/features/admin/components/AdminMoves.tsx`
- `src/features/admin/components/AdminTags.tsx`

## Out of scope

- Rollback при ошибке re-fetch (оставляем старые данные, показываем error)
- Skeleton overlay (вариант 3 — отклонён)
