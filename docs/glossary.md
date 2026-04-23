# Glossary

paynote 고유 용어집. **코드만 봐서는 알 수 없는** 개념을 여기에.

## 도메인 용어 (저장되는 것)

- **Month**: 가계 기록의 최상위 집계 단위. `YYYY-MM` 문자열로 식별 (예: `2025-09`). 하나의 Month 안에 여러 IncomeItem과 ExpenseItem이 속한다. 필드:
  - `note` (nullable): 자유 메모.
  - `closedAt` (nullable timestamp): 사용자의 "이번 달 확인 완료" 체크 기록. **편집을 막지 않는 소프트 플래그** — 통계·월 목록에서 ✓ 뱃지 표시, "확정된 달만" 필터에 활용.
  - 코드: `src/db/schema.ts` (Months 테이블).

- **IncomeItem**: 특정 월의 개별 수입 내역. `amount`(원 단위 정수 양수), `label`, `destinationAccountId`(입금 통장), audit 필드(`createdAt`, `updatedAt`). 예: "월급 5,346,000원 → 우리은행".

- **ExpenseItem**: 특정 월의 개별 지출 내역. `amount`, `label`, `category`(선택, 자유 문자열), `sourceAccountId`(출금 통장), audit 필드. 예: "월세 800,000원 ← 우리은행 (category: 주거)".

- **Account**: 사용자의 통장(은행 계좌). 필드:
  - `name`: 사용자가 보는 이름 (예: "우리은행"). 자유롭게 변경 가능.
  - `role`: `spending` | `savings`. **savings는 어느 시점이든 정확히 하나만 존재** (DB 부분 유니크 인덱스로 강제). 기본 savings는 카카오뱅크이나 UI에서 변경 가능.
  - `openingBalance`: 기록 개시 시점의 잔액 (정수 원).
  - `openingBalanceAsOfMonth`: openingBalance가 적용되는 시점 — 해당 달의 1일 00시 기준. 이후 Month의 accountDelta가 누적되어 잔액을 추정.
  - `archivedAt`: soft delete 타임스탬프. 설정되면 **신규 참조 금지**, 과거 참조는 유지.

- **Category** (ExpenseItem.category): 지출 분류 자유 문자열 (예: "주거", "통신", "저축"). MVP는 문자열 필드 + 과거 값 자동완성. 정규화 테이블 승격은 Phase 2 검토.

- **FixedTemplate**: 매달 거의 동일한 지출·수입의 명시적 프리셋. 금액·라벨·통장·카테고리까지 포함. "이 템플릿 적용" 버튼으로 Month에 복사.

- **FixedTemplateItem**: FixedTemplate 하위의 개별 행. `kind: 'income'|'expense'`으로 둘 다 표현.

- **Clone Previous Month**: 명시적 템플릿 없이 직전 달의 수입·지출을 전체 복제하는 단축 동작. FixedTemplate과 병행 제공, 내부 구현은 동일 함수(`src/domain/clone-items.ts`) 재사용.

## 파생값 (저장 금지, 계산만 — ADR-0002)

- **totalIncome**: 한 월의 모든 IncomeItem 합.
- **totalExpense**: 한 월의 모든 ExpenseItem 합.
- **netBalance**: `totalIncome − totalExpense`. 그 달의 순잔액.
- **accountDelta(account, month)**: `sum(incomes to account in month) − sum(expenses from account in month)`. 해당 통장의 월간 순변동.
- **projectedAccountBalance(account, month)**: `openingBalance + Σ accountDelta for all months in [openingBalanceAsOfMonth .. month]`. **근사값**임을 유의 (InternalTransfer 미모델링으로 월말 이체가 계산에 안 들어감 — ADR-0006).
- **TransferPlan(month)**: 그 달의 권장 이체 목록. 각 spending 통장 netFlow가 양수면 savings로 sweep, 음수면 savings에서 cover. `src/domain/transfer-plan.ts`.

## 개념 용어 (도메인에는 있지만 MVP에 저장 안 함)

- **InternalTransfer** ⚠️ MVP 미구현: 사용자가 본인 통장 간에 실제로 이체한 기록. Phase 2에서 도입. MVP에서는 TransferPlan이 순수 "표시용 권장안"이며, 실행 기록은 저장되지 않음. 결과적으로 통장별 누적 잔액은 근사값. 근거: ADR-0006.

- **MonthEndActualBalance** ⚠️ MVP 미구현: 사용자가 은행 앱에서 확인한 월말 실잔액을 기록해 시스템 계산과 대조하는 기능. 사용자 결정으로 MVP에서는 제외. 현재는 사용자가 수동으로 은행 앱에서 확인.

- **TargetBalance** ⚠️ MVP 미구현: 통장별 "월말 목표 잔액" (버퍼). 설정하면 TransferPlan이 이 값을 기준으로 sweep. MVP는 "0으로 sweep" 단순 규칙만. Phase 2에서 도입 검토.

## 코드 규약 용어

- **domain function**: `src/domain/` 안의 순수 함수. DB·React·환경 의존 없음. 단위 테스트 대상.
- **query function**: `src/db/queries/` 안의 DB 접근 함수. 컴포넌트/라우트는 이것만 호출.
- **Server Action**: `"use server"` 지시를 가진 함수. 폼 제출의 진입점. 첫 줄에서 zod 검증.
- **validator schema**: `src/lib/validators/` 안의 zod 스키마. Server Action·테스트에서 공유.
- **audit fields**: 모든 저장 엔티티가 가지는 `createdAt`, `updatedAt`. 감사·디버깅용.

## UX 용어

- **Home route behavior**: `/` 접속 시 상태 기반 리다이렉트. 통장 없음 → `/onboarding`, 있음 → 오늘 기준 월로. 규칙: `src/app/page.tsx`.
- **Toast undo**: 파괴적 동작 후 5초간 "되돌리기" 링크를 포함한 토스트. 재확인 다이얼로그 대체 (ADR-0007).
- **Savings rate (저축률)**: `netBalance / totalIncome × 100` (%). 통계 대시보드의 핵심 지표.
- **Annual rollup (올해 누적 저축)**: 해당 연도의 월별 TransferPlan sweep 금액 합. 현재 savings 통장 기준.
- **Year summary (연도별 합계)**: 통계 범위 내 연도별 수입·지출·순잔액·저축률·기록 개월 수 표. 여러 해 비교·연말정산 용도.
- **Custom range**: 통계 "직접 지정" 모드. 두 개의 `<input type="month">`로 from·to를 선택. from > to면 자동 swap.
- **Rebase (opening balance)**: 드리프트 해소를 위해 `openingBalance`/`openingBalanceAsOfMonth`를 현재 실잔액으로 재설정하는 사용자 동작. 설정 > 통장 관리에서 제공.
- **Inline edit**: 테이블 행을 클릭해 그 자리에서 편집. 별도 모달 없음.
- **Live summary**: 입력 폼 옆 요약 패널. 타이핑과 동시에 합계·TransferPlan 갱신. 낙관적 업데이트.

## 혼동하기 쉬운 용어

- **Savings account vs Spending account**: Account.role로 구분. savings는 TransferPlan의 목적지(잉여 수신·부족 커버), spending은 일상 지출 통장. savings 역할의 통장은 어느 시점이든 1개만 존재.

- **FixedTemplate vs Clone Previous Month**: 둘 다 "새 달을 빈 상태가 아닌 어딘가에서 출발"시키는 기능. 전자는 **명시적**(사용자가 관리하는 프리셋), 후자는 **암묵적**(지난 달 그대로). 고정지출이 자주 바뀌면 후자만 쓰는 것도 유효.

- **accountDelta vs projectedAccountBalance**: delta는 **그 달의 순변동**(±), projectedBalance는 **누적 추정 잔액**. 전자는 정확, 후자는 근사.

- **archived vs deleted**: paynote는 hard delete 없음. `archivedAt` 설정만. 과거 데이터의 FK 참조가 끊어지는 것을 방지.

- **label vs category**: label은 **식별용 자유 텍스트**(예: "9월 월세"), category는 **분류 태그**(예: "주거"). 통계 파이에서 category로 집계.

- **sweep vs cover** (TransferPlan의 direction): sweep = 잉여를 savings로 밀어넣음, cover = 부족분을 savings에서 끌어옴.

## 약어·시간 표기

- **YYYY-MM**: 월 키. 정규식 `^\d{4}-(0[1-9]|1[0-2])$`. ADR-0004 참고.
- **KRW**: 한국 원. 정수로만 다룸 (ADR-0003). 포맷팅 시 `formatKRW()` 사용.
