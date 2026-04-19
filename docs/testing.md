# Testing Strategy

<!--
개인 도구라고 테스트를 안 써도 되진 않지만, 쓸데없는 테스트는 오히려 마찰.
"계산의 정확성"이 이 프로젝트의 존재 이유(메모 합계 오차 제거)이므로
도메인 함수 테스트가 최우선.
-->

## 프레임워크

- **Vitest** — `pnpm add -D vitest`
  - Next.js·Drizzle·zod 모두 Vitest 친화 (vite 기반).
  - `pnpm test` = 워치 모드, `pnpm test:ci` = 1회 실행.
- **@testing-library/react** — UI 스모크 테스트가 필요해질 때만. MVP는 수동 브라우저 확인으로 충분.

## 계층별 원칙

| 계층 | 테스트 방식 | 목표 커버리지 |
|---|---|---|
| `src/domain/` | 순수 함수 단위 테스트 | **100%** (branch 포함) |
| `src/lib/validators/` | zod 스키마 edge case 테스트 | ~90% |
| `src/lib/` (currency, month-key, normalize) | 단위 테스트 | ~90% |
| `src/db/queries/` | in-memory SQLite 통합 테스트 (핵심 경로만) | ~60% |
| `src/app/**/actions.ts` (Server Action) | 스모크: 검증 실패가 적절히 에러 반환하는지 | 핵심 경로 |
| `src/components/` | 원칙적 X. 필요 시 스냅샷만 | — |
| `src/app/**/page.tsx` | X. Next.js 프레임워크 몫 | — |

## 도메인 테스트가 가장 중요한 이유

paynote의 존재 이유는 **수기 합계 오차 제거**다. 사용자 실측 2025-09 메모의 337,000원 오차가 바로 그 증거. 만약 `calculateMonthTotals`에 버그가 들어가면 프로젝트가 정확히 해결하려던 문제로 되돌아간다. **도메인 함수에는 정성을 쏟을 가치가 있다.**

### 필수 커버해야 할 케이스

- `calculateMonthTotals`
  - 수입 0건 / 지출 0건 / 둘 다 0건
  - 단일 항목, 다수 항목
  - 극단 금액 (1원, 100억)
- `calculateAccountDelta`
  - 한 통장에 수입·지출 혼재
  - 해당 통장 활동 없음
  - archived 통장 (신규 참조 금지지만 과거 델타 계산은 정상)
- `generateTransferPlan`
  - savings 통장 지정됨 / 미지정 (에러 객체 반환)
  - 모든 spending 통장 +netFlow (전부 sweep)
  - 일부 -netFlow (cover 방향 생성)
  - netFlow = 0 (항목 생략)
  - 통장 1개(savings만) 상태
- `cloneItems`
  - 빈 입력
  - archived 통장 참조 있는 항목 스킵 + 경고 배열
  - 라벨·금액·카테고리·통장 보존 검증
- `aggregateTrend`
  - 연속 월 / 데이터 없는 달 (갭)
  - 범위 밖 월 제외
- `calculateSavingsRate`
  - totalIncome = 0 시 0 반환 (division by zero 방지)

## Validator 테스트

각 zod 스키마에 대해:

- 정상 입력 통과
- 필수 필드 누락 → 에러
- 타입 틀림 (숫자 자리에 문자) → 에러
- 경계값 (0, -1, 너무 긴 문자열) → 에러
- 금액 float (ADR-0003 위반) → 에러
- 월 키 형식 틀림 (`2026-13`, `2026-00`, `202604`) → 에러
- 에러 메시지가 한국어인지 확인

## Query 테스트 (통합)

- SQLite in-memory (`:memory:`) 데이터베이스로 setup/teardown
- Drizzle 마이그레이션을 테스트 DB에 적용하는 헬퍼
- 테스트 케이스는 "핵심 경로"만:
  - 항목 삽입 → 조회
  - soft delete 후 active 쿼리가 제외하는지
  - savings 부분 유니크 인덱스가 중복 role 거절하는지
  - cascade·FK 동작

## Server Action 테스트 (스모크)

- FormData 입력 받아 zod 파싱 → 에러면 `{ error }` 형태 반환
- 정상 입력 → DB 반영 + `revalidatePath` 호출
- 도메인 함수의 깊은 검증은 domain 테스트에 위임

## 테스트 데이터 규약

- **금액**: 정수 원 단위. `1_000_000` 같이 언더스코어 세퍼레이터 권장 (가독성).
- **Factory 함수**: `tests/fixtures/factory.ts`에서 `makeExpense({...overrides})` 식으로. 고정 픽스처 대신.
- **금지**: `new Date()` 직접 — 테스트 결정론 위해 고정 Date 주입.
- **금지**: 프로덕션 `paynote.db` 사용. 항상 in-memory 또는 `tests/tmp/*.db`.

## 무엇을 **안** 테스트하나

- Next.js 라우팅·렌더링 — 프레임워크 몫.
- Drizzle ORM 내부 동작.
- 단순 formatter (길이 0, 음수 등 edge만 1회).
- 스타일·애니메이션.
- 브라우저 호환성 — 개인 도구, 현재 크롬/사파리 최신 전제.

## CI 없이 돌리기

- GitHub Actions·Cloud CI는 **없음** (로컬 전용·단일 사용자).
- 대체: `pre-commit` 훅이 `pnpm test:ci`를 돌리고 실패 시 커밋 막기. `.husky/pre-commit`에 배치.
- 설정은 `package.json`의 `prepare`에서 husky 설치.

## 실패했을 때

- Vitest가 실패하면 **커밋 금지**. `pnpm test:ci` 통과 후 커밋.
- 도메인 테스트 실패 = 계산 정확성 문제 → 가장 높은 우선순위로 수정.
- Validator 테스트 실패 = 입력 경계 문제 → 스키마 강화 또는 메시지 개선.

## 커버리지 측정

- `pnpm test:coverage` — Vitest `c8` 리포터.
- 도메인 100% 미만이면 배포 금지.
- 리포트는 `coverage/` (gitignore).
