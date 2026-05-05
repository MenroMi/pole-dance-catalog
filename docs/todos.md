# Project TODOs

## Error Boundaries (feat/error-boundaries — в работе)

Worktree: `.worktrees/error-boundaries`

- [x] `src/app/global-error.tsx` — root error boundary (`'use client'`, включает `<html><body>`, заменяет root layout при краше; импортирует globals.css для CSS vars)
- [x] `src/app/(main)/error.tsx` — error boundary для main route group (каталог, профиль и т.д.); пропы: `error`, `unstable_retry` (Next.js 16 API)
- [x] `src/app/(auth)/error.tsx` — error boundary для auth route group; минималистичная карточка внутри split-panel layout
- [x] **Email в URL** (`route.ts` + `verify-email/page.tsx` + `ExpiredEmailForm.tsx`) — убрать email из `?error=expired&email=...`, добавить email input на expired-экране

## Security

### ~~Auth guards in Server Actions~~ ✅ Resolved (2026-04-19)

~~**`src/features/admin/actions.ts`**~~

- ~~`createMoveAction` and `deleteMoveAction` have no role check~~
- `requireAdmin()` guard added — throws `Unauthorized` if session is null or role ≠ ADMIN; 6 unit tests

~~**`src/features/profile/actions.ts`**~~

- ~~`updateProgressAction` takes `userId` as a parameter — caller could pass any userId~~
- `userId` removed from `getUserProgressAction` and `updateProgressAction`; derived from `auth()` session via `requireAuth()` helper; 4 unit tests

## Post-Features Security Hardening

> Implement after core feature set is complete, before public launch.

### ~~`/api/geocode` unauthenticated~~ ✅ Resolved (PR #29)

- `geocodeRatelimit`: 20 req/1min per IP via Upstash. Graceful degradation when env vars absent.

### ~~Rate limiting on auth endpoints~~ ✅ Resolved (PR #29)

- `signinRatelimit` (10/15m), `signupRatelimit` (5/1h), `resendRatelimit` (5/1h), `forgotPasswordRatelimit` (5/1h), `verifyRatelimit` (10/15m) — all in `src/shared/lib/ratelimit.ts`

### CAA DNS records (suggestion, low priority)

- No CAA records on the domain — any Certificate Authority can issue a certificate for it
- Fix: add via Vercel Domains → DNS Records:
  - `CAA @ 0 issue "letsencrypt.org"` — only Let's Encrypt can issue certs (Vercel uses it)
  - `CAA @ 0 issuewild ";"` — block wildcard certs from any CA
  - `CAA @ 0 iodef "mailto:owner@email.com"` — notify on unauthorized issuance attempts

### SSL Labs validation (suggestion, low priority)

- One-time check: run `ssllabs.com/ssltest/` on the production domain after first deploy
- Expected result: A+ (Vercel handles TLS config automatically)
- Confirms: TLS 1.2/1.3 only, correct cipher suites, HSTS, no known vulnerabilities

### Auth edge cases

- OAuth user tries to login via credentials (no password set) — returns generic error, no helpful message
- Expired session doesn't preserve `callbackUrl` on redirect to login
- No account lockout after N failed login attempts

### session.user.id type mismatch (minor)

- `src/shared/types/next-auth.d.ts` augments `Session.user.id` as `string` (inherited from `DefaultSession`)
- `src/shared/lib/auth.config.ts` only sets `session.user.id = token.sub` when `token.sub` is truthy — so technically it could remain `undefined` at runtime even though the type says `string`
- Root cause: TypeScript intersection types cannot override a required field with optional; full module augmentation would require redeclaring the entire `User` interface
- Risk: very low — `token.sub` is always set by NextAuth JWT strategy. But the type lies slightly.
- Fix (post-MVP): augment `id` as `string | undefined` in a full `User` interface redeclaration and update all call sites to handle undefined

### Timing oracle in email verification (suggestion, low priority)

- `src/app/api/auth/verify/route.ts` — expired token branch does an extra DB delete before redirecting; missing token returns immediately
- An attacker can theoretically distinguish "token never existed" from "token existed but expired" by response time
- In practice: network jitter (50–200ms) dwarfs the single DB delete latency; information gained is low-value
- Fix (if desired): fire-and-forget the delete (`void deleteVerificationToken(token)`) — note that in serverless the operation may not complete before the runtime terminates

### ~~Email in verification URL~~ ✅ Resolved (2026-05-02) — `feat/error-boundaries`

- `route.ts` no longer includes email in `?error=expired` redirect
- `ExpiredEmailForm` prompts user to re-enter email on the expired page

### E2e / browser tests (Playwright)

- No browser-level coverage for login/signup flows
- Fix: set up Playwright, add e2e tests for: signup → verify email → login → access protected route

### ~~Proxy matcher scope (minor)~~ ✅ Resolved (2026-04-19)

- ~~`src/proxy.ts` matcher runs on every route; only `/profile` and `/admin` are actually protected~~
- ~~Fix: narrow matcher to `['/profile/:path*', '/admin/:path*']` for explicitness, or keep broad if adding more protected routes soon~~
- Narrowed to `['/profile/:path*', '/admin/:path*']`; `getProtectedRedirect` extracted for testability; 5 unit tests added

### ~~Email sender domain~~ ✅ Partially resolved (2026-04-19)

- ~~`src/features/auth/lib/email.ts` uses `onboarding@resend.dev` (Resend shared test domain)~~
- Code: `FROM` now reads from `RESEND_FROM` env var (fallback: `onboarding@resend.dev`)
- **Action required:** configure a verified sender domain in Resend dashboard, then set `RESEND_FROM=noreply@yourdomain.com` in `.env.local` and Vercel env vars

## Auth Sync

~~**Cross-tab auth sync**~~ ✅ Resolved (2026-04-23) — `feature/cross-tab-auth-sync`

- ~~resendVerificationAction redirected already-verified users to `?error=invalid`~~ → now redirects to `/login`
- `SessionProvider refetchOnWindowFocus` in root layout (`src/shared/components/Providers.tsx`)
- `ResendForm`: 5s polling + `visibilitychange` → `checkEmailVerifiedAction` → auto-redirect to `/catalog`; `redirectingRef` prevents double-redirect
- `ResendForm` `handleAction`: pre-check before `startCountdown` — fixes React 19 hydration error when resending after email already verified in another tab
- `SessionGuard` in `/profile` layout for cross-tab logout sync (`src/shared/components/SessionGuard.tsx`)
- Note: add `SessionGuard` to `/admin` layout when admin feature is built

## UX / Validation

**`src/features/profile/components/SettingsForm.tsx` — PasswordField unit tests missing** (2026-04-23)

- `PasswordField` (private component in SettingsForm) duplicates the logic of `PasswordInput` but has no dedicated unit tests
- Logic is covered indirectly by `PasswordInput.test.tsx`, but any drift between the two won't be caught automatically
- Fix: extract `PasswordField` tests (toggle show/hide, caps lock, error display, `onKeyDown`/`onKeyUp`/`onBlur` forwarding) or extract `PasswordField` to a shared file and reuse `PasswordInput.test.tsx`

**`src/features/profile/components/SettingsForm.tsx` — duplicate SVG icons** (2026-04-23)

- `EyeIcon` and `EyeOffIcon` are defined both in `SettingsForm.tsx` and `PasswordInput.tsx`
- Fix: re-export from `PasswordInput.tsx` or move to a shared `icons.tsx`; low priority until a third usage site appears

~~**`src/features/auth/components/SignupForm.tsx` — geolocation timing**~~ ✅ Resolved (2026-05-04)

- `getCurrentPosition` had no options and no error callback — on desktop without GPS it could block for 30+ seconds or never resolve, causing a race condition where the user submits the form before `detectedLocation` is set
- Fix: added `{ enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }` options (uses fast IP/Wi-Fi positioning, enforces 5s deadline, accepts cached position) and a silent error callback

~~**`src/features/auth/components/SignupForm.tsx`**~~ ✅ Resolved (2026-04-22)

- ~~`name` field uses Zod defaults (`"String must contain at least 2 character(s)"`) — inconsistent with password field which has a custom message~~
- ~~`name` minimum was 2 chars — too low for real names~~
- ~~Password had no complexity requirements — `qwerty123` was accepted~~
- `signupSchema.name`: min 5 chars, custom messages; consistent with `password` field
- `signupSchema.password`: `.superRefine()` enforces uppercase + lowercase + digit + special char, reports all failures simultaneously

~~**`src/features/auth/components/SignupForm.test.tsx`**~~ ✅ Resolved (2026-04-19)

- ~~`name` field validation is not tested (empty name, name < 2 chars)~~
- ~~Fix: add a test case for short/empty name before shipping to production~~
- 3 tests added: 2 in `validation.test.ts` (min/max message strings), 1 in `SignupForm.test.tsx` (UI render)

~~**Move Detail Redesign**~~ ✅ Done (2026-04-28)

**Spec:** `docs/superpowers/specs/2026-04-28-move-detail-redesign.md`
**Plan:** `docs/superpowers/plans/2026-04-28-move-detail-redesign.md`

- [x] Task 1: Data layer — `currentProgress: LearnStatus | null` в `MoveDetail` + `getMoveByIdAction`
- [x] Task 2: `MoveProgressPicker` — client wrapper над `ProgressStatusPicker`; toggle-to-null (повторный клик снимает статус); pill fade-in-place анимация
- [x] Task 3: `MoveHero` — `h-[65vh]` → `aspect-[16/9]`
- [x] Task 4: `MovePlayer` — 2-col hero grid + info panel (title, difficulty chip, desc, tags, actions)
- [x] Task 5: `MoveSpecs` — добавить "SPECS" section label
- [x] Task 6: `MoveTabs` — gradient underline `from-primary to-[#8458b3]`
- [x] Task 7: `RelatedMoves` — горизонтальные карточки (letter icon + title + difficulty)
- [x] Task 8: `page.tsx` — подключить `currentProgress`, `MoveProgressPicker`; SEO `generateMetadata`; `generateStaticParams` (take: 1000); `React.cache()` для дедупликации DB-запроса

**Дополнительно (в рамках той же серии):**

- Related moves теперь подбираются по тегам (не по категории); `revalidatePath('/profile')` после обновления прогресса
- `removeProgressAction` — удаление прогресса + revalidate
- `ProgressCard`: optimistic update + rollback при ошибке
- `extractVideoId` вынесен в `src/features/moves/lib/youtube.ts`

## Design System (feat/design-system — ready to merge, 2026-04-27)

~~**Design system integration**~~ ✅ Done

- CSS tokens, `.glass`, `.kinetic-gradient` fixes in `globals.css`
- Header: 3-col grid, `FavouritesButton`, pill nav, search removed
- MoveCard: hairline border, violet hover, Ken Burns image zoom
- MoveGrid: editorial header + `minmax(240px, 1fr)` auto-fill grid
- MoveBreadcrumb + RelatedMoves + Coach's Note in Move Detail
- Auth layout: editorial left panel with animated blobs and pole silhouette
- ProfileHero: dark gradient card with violet radial glow
- Names: `capitalize` (was `lowercase`)
- Layout: `max-w-[2560px]` on header/footer/main content
- FavouriteMovesGallery: fixed invalid token (`bg-surface-container-low` → `bg-surface-low`), auto-fill grid
- Fixed invalid tokens in MoveBreakdown: `surface-container-low` → `surface-low`, `surface-container-highest` → `surface-highest`

~~**Coach's Note — hardcoded placeholder**~~ ✅ Resolved (2026-04-28)

- `coachNote: String?` и `coachNoteAuthor: String?` добавлены в Prisma `Move` (migration `20260428203347_add_coach_note`)
- `MoveBreakdown` рендерит aside условно; `MoveTabs` принимает `breakdown: ReactNode` вместо пробрасывания 4 пропсов
- `prisma/seed-coach-notes.ts` — 6 движений засеяны с реальными нотами тренеров

**`getRelatedMovesAction` — non-deterministic order** (2026-04-27)

- `src/features/moves/actions.ts` — `prisma.move.findMany` has no `orderBy`
- Fix: add `orderBy: { title: 'asc' }` for stable, predictable results

## Feature Gaps

**Profile Settings — Preferences section not implemented** (2026-04-24)

- Секция Preferences (тема, язык, уведомления и пр.) пропущена при Settings redesign — в дизайне Stitch присутствует, но требования не определены
- Fix: добавить секцию после финализации требований: какие настройки нужны, где хранятся (поля User или отдельная таблица UserPreferences), UX (toggles, select-ы)

**Profile — полная мобильная версия** (2026-04-24)

- Профиль не адаптирован для мобильных устройств: aside скрыт, Hero и Stats карточки не оптимизированы под маленькие экраны
- Нужно: мобильная навигация (bottom bar или drawer), адаптация ProfileHero (вертикальная компоновка, меньший шрифт), адаптация кнопок Share/Edit Profile
- Бенто карточки: ниже 1280px идут в одну колонку — приемлемо, но стоит рассмотреть 2-колоночный лейаут для планшетов (768–1279px)

**Profile — Current Streak stub** (2026-04-24)

- `ProfileStats` renders `"—"` for Current Streak — no streak tracking logic exists
- Needs: `UserStreak` model (or derived from `UserProgress` timestamps), server action, cron/trigger to reset on missed day
- Design: show consecutive days with at least one progress update; reset to 0 if a day is skipped

**Profile — Skill Tier stub** (2026-04-24)

- `ProfileStats` renders `"—"` for Skill Tier — no tier classification logic exists
- Needs: tier thresholds based on mastered moves count and/or difficulty spread (e.g. Beginner → Intermediate → Advanced → Elite)
- Design decision pending: formula, display name, icon per tier

~~**Favourite Moves gallery**~~ ✅ Resolved (2026-04-25)

- Full redesign: responsive 4-col gallery, client-side search, `useOptimistic` removal
- AlertDialog confirmation (same pattern as logout), `onCloseAutoFocus` prevents jump
- `revalidatePath` on add/remove for both `/profile/favourite-moves` and `/profile`
- Catalog sort fixed: `orderBy: { title: 'asc' }` (was `createdAt: desc`)
- ProfileAside: Favourite Moves icon changed Star → Heart
- e2e test cases written (Playwright not installed yet)

**Profile — Elite Member badge stub** (2026-04-24)

- `ProfileHero` always renders the "Elite Member" badge — no membership or achievement check
- Needs: criteria definition (e.g. moves mastered ≥ N, account age, admin-granted flag), conditional rendering
- Until criteria are defined, badge is hardcoded and misleading for new users

~~**Password reset (`/forgot-password`)**~~ ✅ Resolved (PR #29)

- `PasswordResetToken` Prisma model, `forgotPasswordAction`, `resetPasswordAction`, `/forgot-password` + `/reset-password` pages — смёржено в pre-launch blockers

**OAuth login buttons (Google / Facebook)** (2026-04-22)

- `LoginForm` and `SignupForm` render Google/Facebook buttons but they have no `onClick` handler — clicking does nothing
- Providers are already configured in `auth.ts` (`GOOGLE_CLIENT_ID` etc.)
- Fix: wire up `signIn('google')` / `signIn('facebook')` calls, or hide buttons until credentials are set in env

~~**`src/features/catalog/actions.ts`**~~ ✅ Resolved (2026-04-24)

- ~~`getMovesAction` ignores `filters.tags` — tag-based filtering not implemented~~
- ~~`MoveFilters.tags` field in `src/shared/types/index.ts` is misleadingly present~~
- Implemented: `tags: { some: { name: { in: [...] } } }` Prisma WHERE clause; `getTagsAction` added; URL uses tag names (`?tags=aerial,flexibility`)

**`src/features/auth/actions.ts`**

- `signupAction` doesn't return the created user
- Fix: return `prisma.user.create(...)` result if callers need the user ID

~~**Multi-select filters in catalog**~~ ✅ Resolved (2026-04-24)

- Implemented variant A: `poleType: PoleType[]`, `difficulty: Difficulty[]`, `tags: string[]`
- URL format: `?poleType=STATIC,SPIN&difficulty=BEGINNER&tags=id1,id2` (commas unencoded, human-readable)
- Accordion `type="multiple"` with all sections open by default; OR within group, AND between groups
- Category filter removed; replaced by Pole state (STATIC/SPIN) from new nullable `PoleType?` schema field
- `getTagsAction` fetches all tags ordered by name for the Tags accordion
- Tag `color` field admin-settable; chips use `${color}28` tinted bg + colored text
- `buildQuery()` centralises URL construction; tag names URL-encoded per token
- 236 unit tests passing

## Architecture Notes

**`src/app/(main)/catalog/page.tsx`**

- When filling in UI, call `getMovesAction` directly in the Server Component — do NOT fetch via `/api/moves`
- Fetching your own API route from a Server Component is an RSC anti-pattern (unnecessary network hop)

**PageShell usage pattern**

- Pages that need an aside (filters, related content, etc.) wrap their content in `<PageShell aside={...}>`
- Pages without an aside render `{children}` directly — no PageShell needed
- The aside content is page-specific: e.g. CatalogFilters on /catalog, related moves on /moves/[id]
- `(main)/layout.tsx` provides only Header + Footer — PageShell lives at the page level, not the layout level

**Font utilities**

- `font-display` → Space Grotesk (headings, wordmark, move titles)
- `font-sans` → Manrope (body text, labels, form fields)
- Both defined as `@utility` in `globals.css` (Tailwind v4 does not auto-generate font utilities beyond sans/serif/mono)

## Infrastructure

~~**Neon DB not connected**~~ ✅ Resolved — DB connected, schema pushed (2026-04-19)

~~**Vitest picks up .worktrees/ test files**~~ ✅ Resolved (2026-04-20) — added `'.worktrees/**'` to `exclude` in `vitest.config.ts`

~~**Prettier + ESLint not configured**~~ ✅ Resolved (2026-04-21)

- Prettier 3 + `prettier-plugin-tailwindcss`, ESLint 9 flat config with `eslint-config-next/core-web-vitals` + TypeScript + import/unused-imports plugins, Husky 9 + lint-staged. Pre-commit auto-formats staged files and blocks on errors. `.git-blame-ignore-revs` masks the formatting baseline commit.

## UX

~~**Catalog filters UX — требует ресёрча и возможного редизайна**~~ ✅ Resolved (2026-04-24)

- Redesigned: 3-accordion multi-select sidebar (Pole state, Difficulty, Tags)
- Old single-select category accordion removed; replaced with Pole state + Tags
- Remaining open question: mobile UX (bottom-sheet vs sidebar collapse) — deferred until mobile layout pass

~~**i18n (feat/i18n)**~~ ✅ Done (2026-05-04) — все 12 задач + post-launch fixes завершены

- next-intl 4.11.0, routing config (`pl` default, `en` second), ~150 ключей в en.json/pl.json
- Middleware `proxy.ts` → `src/middleware.ts` (createMiddleware + createNavigation)
- Prisma schema: `_pl`/`_en` columns на Move и Tag, `locale` field на токенах
- `localizeMove`/`localizeTag` helpers (TDD, 8 тестов)
- App directory под `src/app/[locale]/`, navigation imports → `@/i18n/navigation`
- Catalog + moves actions принимают `locale` param
- Email localization: locale-aware subjects, токены хранят locale, `verify/route.ts` редиректит по `token.locale`
- Task 9: `LocaleSwitcher` — Globe dropdown, `router.replace(pathname, { locale })`, мок Radix для тестов
- Task 10: Auth UI strings — LoginForm, SignupForm, verifyEmail, forgotPassword, resetPassword через `useTranslations`
- Task 11: Nav + filters + errors — HeaderNav, UserMenu, CatalogFilters, not-found, error boundaries, admin через `useTranslations`/`getTranslations`
- Task 12: Валидация структуры en/pl; e2e кейсы ниже
- Post-launch: SettingsForm, AvatarUpload, MoveCard difficulty badges, FavouriteMovesGallery дата, auth layout, SignupForm placeholders полностью переведены
- Post-launch: `PasswordInput`, `FavouritesButton`, `MoveHero`, `ProfileAside`, `ProfileHero` — aria-labels и fallback-строки переведены
- Post-launch: `ResetPasswordForm` — Zod-сообщения через `t()`, схема внутри компонента
- Post-launch: `SignupForm` геолокация — `timeout: 5000`, `enableHighAccuracy: false` (фикс гонки submit vs detectedLocation)
- Финальный аудит: структура en/pl синхронизирована, битых ключей нет, 469/469 тестов
- `global-error.tsx` — намеренно оставлен на английском (вне `[locale]` роутинга)
- `LocaleSwitcher`: `useSearchParams` → query params сохраняются при смене locale; unit-тест добавлен (`LocaleSwitcher.test.tsx`)
- `checkedLocale(raw): Locale` в `src/i18n/routing.ts` — дупликация из 5 мест убрана
- `RATELIMIT_FALLBACK_IP=127.0.0.1` в `.env.example`; IP-фоллбэк через env var во всех трёх route handlers
- CI фиксы: `admin/actions.ts` + `types.ts` обновлены под bilingual schema (`title_pl/en`, `name_pl/en`); `IntlMessages` augmentation с `eslint-disable-next-line`
- Переводы: capitalize `auth.resetPassword.*`, `catalog.empty`; опечатка `profile.emptyFavourites` (pl) исправлена
- Шрифты: CSS vars перенесены на `<html>` в root layout — font mismatch на 404 исправлен
- 470 тестов, TypeScript чистый (2 pre-existing ошибки в LoginForm/SignupForm)

**Manual e2e — i18n (feat/i18n)**

_Positive:_

- [ ] Открыть `/` — редирект на `/pl/catalog`, весь UI на польском (заголовки фильтров, кнопки навигации)
- [ ] Открыть `/en/catalog` напрямую — UI на английском без переключателя
- [ ] В LocaleSwitcher нажать «English» — URL меняется на `/en/catalog`, UI переключается на английский; «English» отмечен галочкой (aria-checked=true)
- [ ] Переключиться обратно на «Polski» — URL `/pl/catalog`, UI на польском; «Polski» отмечен
- [ ] На `/pl/moves/[slug]` переключить locale — переход на `/en/moves/[slug]`, тот же элемент, язык изменён
- [ ] Фильтры каталога (Pole state / Difficulty / Tags) отображают переводы: pl=«Stan słupa / Poziom trudności / Tagi», en=«Pole state / Difficulty / Tags»
- [ ] Enum-значения в фильтрах: pl=«Statyczny / Wirujący», en=«Static / Spin»; аналогично Difficulty
- [ ] Auth: страница `/pl/login` — все лейблы на польском; `/en/login` — на английском
- [ ] Forgot password / reset password — форма отображает переводы под текущей локалью
- [ ] Ошибка верификации email — страница `/pl/verify-email?error=expired` показывает польский текст
- [ ] 404 страница (`/pl/unknown-path`) — «straciłeś momentum?» на польском
- [ ] Admin: `/pl/admin` при ADMIN-роли показывает польский заголовок дашборда

_Negative:_

- [ ] Переключение locale сохраняет путь: `/pl/catalog?poleType=STATIC` → `/en/catalog?poleType=STATIC` (query не теряется) _(фикс реализован + unit-тест; ждёт browser-верификации)_
- [ ] `/invalid-locale/catalog` — должен вернуть 404 или редирект на `/pl/catalog`
- [ ] Переключение locale на залогиненном пользователе не разлогинивает (сессия сохраняется)

**`Move.title_en` — отсутствует `@unique` constraint** (2026-05-03)

- `seed-move-detail.ts`, `seed-coach-notes.ts`, `seed-tags.ts` ищут moves через `findFirst({ where: { title_en } })` — без уникального индекса это ненадёжно при дублях
- Fix: добавить `@unique` к `title_en` в `schema.prisma` + новая миграция
- Приоритет: низкий — в dev-базе дублей не будет, но стоит закрыть до merge

**`poleTypes` — нет DB-дефолта несмотря на миграцию** (2026-05-03)

- Миграция добавляла `NOT NULL DEFAULT '{}'`, но Neon/PostgreSQL не сохраняет default для enum-массивов в `information_schema.columns`
- Workaround в `seed.ts`: явный `poleTypes: []` в create-цикле
- Если кто-то напишет новый seed без этого — получит тихий P2011
- Fix: создать дополнительную миграцию с `ALTER TABLE "Move" ALTER COLUMN "poleTypes" SET DEFAULT '{}'`; после проверки — убрать workaround

~~**i18n — orphan-ключи в messages**~~ ✅ Resolved (2026-05-05)

Все 5 orphan-ключей удалены из `en.json` и `pl.json`:

- `nav.admin`, `profile.noProgress`, `profile.noFavourites`, `profile.editAvatar`, `profile.inProgress`

**Контентные вопросы — подтвердить** (2026-05-03)

- `gripType_pl: 'Split grip'` у Chair Spin и Carousel Spin — оставлен на английском (все остальные переведены). Уточнить: это принятый польский термин или пропуск?
- `title_pl: 'Wejście na Słup'` для Basic Climb — в плане было `'Podstawowe Wspinanie'`. Другая семантика ("Getting on the Pole" vs "Basic Climb"). Подтвердить итоговый вариант.

**`next.config.ts` — паттерн `/settings(.*)` удалён как мёртвый** (2026-05-03)

- Оригинальный `Cache-Control: no-store` паттерн `/settings(.*)` не совпадал ни с одним реальным роутом (settings живёт на `/profile/settings`, покрыт правилом `/profile/(.*)`)
- Удалён при исправлении паттернов для i18n. Если появится отдельный роут `/settings`, добавить `/:locale([a-z]{2})/settings(.*)` обратно

~~**`getRelatedMovesAction` — `orderBy: { title: 'asc' }` сломан**~~ ✅ Resolved (Task 7, 2026-05-03)

- Реализация заменена на `select`-проекцию только нужных полей + ручная локализация; `orderBy` убран (related moves — небольшой лимит 4 элемента, порядок несущественен)

**`localizeMove`/`localizeTag` — хрупкие `as Parameters<typeof ...>[0]` касты** (2026-05-03)

- 7 мест в `catalog/actions.ts` и `moves/actions.ts` используют `move as Parameters<typeof localizeMove>[0]`
- Причина: Prisma генерирует enum-типы (`Difficulty`, `PoleType`), а `RawMove` изначально имел `string`/`string[]`; после Fix 1 Task 7 типы выровнены, но `stepsData: JsonValue` vs `unknown` всё ещё требует каста
- Fix: типизировать `RawMove.stepsData` как `Prisma.JsonValue` вместо `unknown`, тогда Prisma-объект структурно совместим и каст исчезнет

## Database

~~**`PoleType` on existing moves**~~ ✅ Resolved (2026-04-25) — `prisma/seed-progress.ts`

- Seeded via `seed-progress.ts`: SPIN for all spin-category moves, STATIC for climbs/holds/combos/floorwork
- Run: `SEED_USER_EMAIL=<email> npx tsx prisma/seed-progress.ts`
- Script also seeds `UserProgress` (18 records) and `UserFavourite` (5 records) for the given user

~~**`prisma/schema.prisma` — `UserProgress` relations missing `onDelete: Cascade`**~~ ✅ Resolved

- Both `UserProgress.user` and `UserProgress.move` have `onDelete: Cascade` in schema.prisma

**`prisma/migrations/` — baseline uses `"public".` schema qualifier, subsequent migrations do not**

- Baseline migration (20240101000000) uses explicit `"public".` schema qualifier on all table/type names (Prisma introspection output)
- New migrations (e.g. add_user_favourite) omit the qualifier — they rely on PostgreSQL's default `search_path = public`
- Safe on Neon and standard PostgreSQL setups; could break if `search_path` is non-default
- No action needed unless the project moves to a non-default schema

## CI/CD

**Dependabot `open-pull-requests-limit` не задан** (2026-04-22)

- Дефолт GitHub: 5 открытых PR на ecosystem. Если накопится больше 5 ожидающих обновлений npm — Dependabot молча перестанет открывать новые PR без каких-либо уведомлений.
- Fix: добавить `open-pull-requests-limit: 10` в каждый ecosystem-блок `.github/dependabot.yml`.
- Приоритет: низкий — актуально только при большом количестве одновременных обновлений зависимостей.

## Profile

**`username` column — deferred feature** (2026-04-24)

- `prisma/schema.prisma` has `username String? @unique` and it is selected in `getProfileUserAction`
- No UI exists to set it; no signup/settings path writes it — every row has `username = NULL`
- Fix: build a username settings field or remove the column entirely before public launch
- Priority: low — harmless while all values are NULL, but confusing for future contributors

**`"Elite Member"` badge — hardcoded stub** (2026-04-24)

- `ProfileHero.tsx` and `SettingsForm.tsx` render "Elite Member" unconditionally for every user
- Should be derived from `user.role` or a separate membership tier field
- Fix: conditionalise on role/tier, or remove until the feature is properly designed
- Priority: low — cosmetic stub, no functional impact

~~**App Redesign — Progress page + animations + layout**~~ ✅ Done (2026-04-30)

**Spec/Plan:** `docs/superpowers/plans/2026-04-30-progress-page.md`

**Progress page (Tasks 1–6):**

- `revalidatePath('/profile/progress')` added to `updateProgressAction` + `removeProgressAction`
- `ProgressCard` refactored to accept `onStatusChange` + `isPending` callbacks (no internal server calls)
- `WantToLearnRow` — compact horizontal row with status picker for Want to Learn tab
- `LearnedCard` — portrait achievement card (4:5 ratio, YouTube thumb fallback, naturalWidth guard)
- `ProgressTracker` — client component with 3-tab layout, `useOptimistic`, search, empty states, 7 unit tests
- Progress page RSC wired up; ProfileAside nav link unlocked

**framer-motion animations (post-plan):**

- `src/shared/lib/motion.ts` — shared `cardVariants` + `tabContentVariants` extracted (DRY)
- `ProgressTracker`: `AnimatePresence` + `motion.div layout="position"` on cards; `tabContentVariants` on tab panels; `pointerEvents: 'none'` on exit to prevent click-blocking; instant exit guard for last card
- `FavouriteMovesGallery`: same `AnimatePresence initial={false}` pattern; `useCallback` on `handleOpenRemoveDialog` to prevent new function per render during FLIP
- `MoveGrid`: `motion.div` entrance animation on each card
- `src/test-setup.ts`: framer-motion mock extended to strip `variants`, `layout`, `whileHover`, `whileTap`, `onAnimationStart`, `onAnimationComplete`
- `ProgressStatusPicker`: null-status pill comment restored

**Profile overview layout fixes (post-plan):**

- `getProfileOverviewAction`: removed `take` limit on `currentlyLearning` (was truncating list silently)
- `ProfileCurrentlyLearning`: `min-h-0 flex-col overflow-hidden` on root + `shrink-0` on header + `flex min-h-0 flex-1 overflow-y-auto` on list — scrollable within card without inflating grid row height
- `ProfileFavouritesPreview`: `flex-1` on root — fills right column height when grid row is stretched

**Sticky sidebar:**

- `PageShell`: `aside` gets `self-start sticky top-[60px] h-[calc(100vh-120px)] overflow-y-auto` — `self-start` prevents CSS grid stretch so sticky has room to scroll
