# Project: paynote

<!-- 작성 규칙은 ../README.md 참고. 이 파일은 60줄 이하로 유지하세요. -->

## What — 스택과 구조

- **Stack**: Next.js 15 (App Router) + TypeScript strict + SQLite (Drizzle ORM) + Tailwind + shadcn/ui
- **Runtime**: Node 22 (로컬 전용, 단일 사용자)
- **Package manager**: pnpm

### 코드 지도 (파일 인덱스)

- `src/app/` — 페이지·Server Action (`*/actions.ts`, 첫 줄 zod 검증)
- `src/db/schema.ts` — Drizzle 스키마; `src/db/queries/` — DB 접근 함수 (유일한 진입점)
- `src/domain/` — 순수 함수 계산 (파생값·TransferPlan·복제) · DB·React 의존 없음
- `src/lib/validators/` zod 스키마; `src/lib/currency.ts` 금액; `src/lib/month-key.ts` 월 키
- `src/components/` — 입력 폼·표·차트
- `drizzle/` 마이그레이션; `tests/domain/` 계산 단위 테스트

## Why — 이 프로젝트의 목적

사용자 본인이 매달 월급 받을 때 메모장으로 하던 가계 기록(수입/지출/통장 배분/이체)을 자동화한다. 기존 메모 방식의 합계 오차를 제거하고, 월별 추이를 본다.

## How — 명령어

- Dev: `pnpm dev`
- Build: `pnpm build`
- Test: `pnpm test` ← **커밋 전 반드시 실행**
- Lint/format: `pnpm lint && pnpm format`
- DB 마이그레이션 생성/적용: `pnpm db:generate` / `pnpm db:migrate`

## Never — 금지사항

- **파생값을 컬럼으로 저장하지 않는다** (총수입/총지출/잔액/통장 순변동/TransferPlan) — ADR-0002.
- **마이그레이션 파일(`drizzle/`)을 직접 수정·삭제하지 않는다** — 새 마이그레이션 추가로.
- **금액은 float 금지** — 원 단위 정수 `z.number().int().positive()` — ADR-0003.
- **월 단위 비교에 `Date` 금지** — `YYYY-MM` 문자열 키 — ADR-0004.
- **Server Action은 첫 줄에서 zod 검증** — `schema.safeParse` 없이 DB 터치 금지 — ADR-0005.
- **hard delete 금지** — `archivedAt` soft delete. 과거 FK 참조 보호.
- **재확인 다이얼로그 금지** — 파괴적 동작은 토스트 undo 5초 — ADR-0007.
- **카테고리 비교는 정규화 후** — `src/lib/normalize.ts` 경유.

## 패턴 참조 (핵심만)

- 도메인 계산은 `src/domain/` 순수 함수만 — 컴포넌트에서 합산·이체계획 생성 금지
- DB는 `src/db/queries/` 경유 + Server Action 첫 줄에서 `src/lib/validators/` zod로 검증
- 금액·월 키는 헬퍼 경유: `currency.ts`(`formatKRW`/`parseKRW`), `month-key.ts`(`prevMonth`, `MONTH_KEY_REGEX`)
- 모든 엔티티 audit: Drizzle `$onUpdate(() => new Date())`

## 더 깊은 맥락 (필요 시 Read)

- 아키텍처·도메인·성능·보안: `docs/architecture.md`
- UX·인터랙션 패턴: `docs/ux.md`
- 테스트 전략: `docs/testing.md`
- Phase 2+ 로드맵: `docs/roadmap.md`
- ADR: `docs/decisions/` · 용어: `docs/glossary.md`
