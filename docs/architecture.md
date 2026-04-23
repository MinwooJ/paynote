# Architecture

<!--
이 파일과 docs/decisions/(ADR)의 차이:
- architecture.md = "현재 시스템의 모양" (지금 어떻게 생겼나)
- docs/decisions/  = "개별 결정의 이력" (왜 그렇게 됐나)
업데이트 주기: 주요 구조 변경 시.
-->

## 큰 그림

paynote은 **로컬에서 실행되는 단일 사용자 웹앱**이다. 브라우저로 `localhost`에 접속해 매달 가계 정보를 입력하면, Next.js 서버가 SQLite 파일(`paynote.db`)에 기록한다. 집계·통계·이체 계획 같은 **파생값은 저장하지 않고 요청 시점에 계산**한다 (ADR-0002).

도메인의 최상위 단위는 **Month** (`YYYY-MM`)다. 한 Month 안에 여러 IncomeItem·ExpenseItem이 있고, 각 항목은 반드시 특정 **Account**(통장)와 연결된다. 월말에 시스템은 각 통장의 순변동을 계산해 "남은 돈을 저축 통장으로 이체"하는 권장안(**TransferPlan**)을 보여준다.

## MVP 범위

### 포함 (In scope)

- 통장 관리: 등록·이름 변경·아카이브(soft delete). 3개 이상 가능.
- 월별 수입·지출 입력: 라벨, 금액, 출/입금 통장. 지출은 선택적 카테고리 태그.
- 월 단위 파생값 표시: 총수입·총지출·순잔액·통장별 순변동.
- TransferPlan 자동 산출 (저장하지 않고 매번 계산).
- 새 달 시작 보조: ①FixedTemplate 적용 ②지난 달 복제.
- 통계 뷰: 월별 수입/지출/순잔액 시계열, 지출 카테고리 비중 파이.
- 데이터 내보내기(JSON 전체 덤프), 로컬 백업 명령.

### 제외 (Out of scope — Phase 2 이후)

- **InternalTransfer 명시적 모델링** — 월말 이체 실행 기록을 저장하지 않음 (ADR-0006). 결과적으로 **통장별 "누적 실잔액"은 근사값**이며 정확한 현재 잔액은 은행 앱에서 직접 확인해야 함.
- 월말 실측 잔액 스냅샷 입력 기능.
- 통장별 월말 목표 잔액(`targetBalance`). MVP는 "남은 금액 전부 savings로 이체" 단순 규칙.
- 인증·권한, 다기기 동기화, 모바일 앱.
- 은행 API 연동.
- 예산/목표 설정, 예측, 알림.

## 주요 컴포넌트

- **UI 레이어** (`src/app/`, `src/components/`): Next.js App Router 페이지·Server Component. 월별 뷰(입력·편집), 통계 뷰, 통장 관리 뷰, 템플릿 관리 뷰, 온보딩 뷰, 설정 뷰.
- **Server Actions** (`src/app/.../actions.ts`): 폼 제출의 진입점. zod로 입력 검증 후 쿼리 레이어 호출 (ADR-0005).
- **도메인 레이어** (`src/domain/`): 순수 함수. `calculateMonthTotals`, `calculateAccountDelta`, `generateTransferPlan`, `cloneItems`, `aggregateTrend`, `calculateSavingsRate` 등. **DB·React 의존 없음** → 단위 테스트 대상.
- **쿼리 레이어** (`src/db/queries/`): Drizzle을 사용한 DB 접근 함수. UI와 도메인 사이의 유일한 DB 접점.
- **검증 레이어** (`src/lib/validators/`): zod 스키마 모음. Server Action 입력·FixedTemplate 구조 등.
- **DB 레이어** (`src/db/schema.ts`, `drizzle/`): Drizzle 스키마와 마이그레이션. SQLite·Postgres 호환 타입만 (ADR-0001).

### UI 프레임워크 선택

- **Tailwind CSS** — 스타일 유틸리티.
- **shadcn/ui** — 접근성 있는 headless 컴포넌트 (Radix UI 기반). `Button`, `Dialog`, `Form`, `Input`, `Table`, `Tabs`, `Tooltip`, `Toast(sonner)` 등을 필요할 때 복사해 쓴다 (npm 의존성 아님).
- **lucide-react** — 아이콘.
- **Recharts** — 통계 차트.
- 상태 관리: Server Component + `useFormState`. 전역 스토어(Zustand, Redux 등) 불채용 — 단일 사용자·단일 도메인이라 과함.

## 라우트 맵

| 경로 | 역할 | 빈 상태 처리 |
|---|---|---|
| `/` | 홈 | 통장 없으면 `/onboarding`, 있으면 오늘 기준 월로 리다이렉트 |
| `/onboarding` | 3단계 설정 마법사 | 통장 등록 완료 시 첫 달 뷰로 이동 |
| `/months` | 월 목록·피커 (YYYY 그리드) | 기록 있는 달만 활성, 없으면 연도 비활성 |
| `/months/[yyyymm]` | 월별 입력·요약·TransferPlan | 항목 0개면 "지난 달 복제" 또는 "템플릿 적용" CTA |
| `/stats` | 통계 (저축 대시보드·추이·카테고리 파이·지출 TOP) | 2개월 미만이면 "최소 2개월 기록 필요" 안내 |
| `/accounts` | 통장 관리 (CRUD·archive·savings 전환) | 온보딩 유도 |
| `/templates` | FixedTemplate 관리 | "첫 템플릿을 만들어보세요" |
| `/settings` | 앱 설정 (테마·데이터 경로·내보내기·백업) | — |

홈 리다이렉트 규칙은 `src/app/page.tsx`의 Server Component에서 처리.

## 월 뷰 레이아웃 (핵심 화면)

```
┌─────────────────────────────────────────────────────┐
│ [← 2026-03]  2026-04  [2026-05 →]    [📅 월 선택]   │  ← 네비
├─────────────────────────────────────────────────────┤
│ ┌────────────────┐  ┌──────────────────────────────┐│
│ │ 수입 (2)       │  │ 이번 달 요약                  ││
│ │ + 항목 추가    │  │ 총수입   ₩5,416,000          ││
│ │ 월급 · 우리    │  │ 총지출   ₩3,163,000          ││
│ │ 통신비 · 우리  │  │ ──────────────────           ││
│ │                │  │ 순잔액   ₩2,253,000          ││
│ │ 지출 (8)       │  │                              ││
│ │ + 항목 추가    │  │ 통장별 순변동                  ││
│ │ 월세 · 우리    │  │ 우리  +₩4,296,000            ││
│ │ 관리비 · 우리  │  │ 국민  -₩1,283,000  (부족)    ││
│ │ 신용카드 · 국민│  │ 카카오 +₩50,000              ││
│ │ ...            │  │                              ││
│ │                │  │ 💸 이체 권장 (2건)           ││
│ │                │  │ 우리→카카오 ₩4,296,000 [📋] ││
│ │                │  │ 카카오→국민 ₩1,283,000 [📋] ││
│ └────────────────┘  └──────────────────────────────┘│
└─────────────────────────────────────────────────────┘
         (모바일: 두 열을 세로로 스택, 요약 패널은 sticky 하단)
```

- 요약 패널은 **클라이언트 컴포넌트**로 실시간 갱신 (낙관적 업데이트).
- 항목 행은 **인라인 편집** (클릭 → 편집 모드 → Enter/Tab으로 이동).
- 색 외 텍스트 병기: 음수 flow는 빨강 + "(부족)" 텍스트 같이 표시.

## 통계 뷰 (확장)

UX 원칙에 따라 단순 추이 이상의 맥락 지표를 우선.

- **저축 대시보드 카드** (맨 위):
  - 이번 달 저축률 = `netBalance / totalIncome × 100`
  - 올해 누적 저축 = 월별 TransferPlan sweep 합계 (현재 savings 통장 기준)
  - 최근 12개월 평균 저축률
- **월별 시계열 선그래프**: totalIncome, totalExpense, netBalance 3선. 데이터 없는 달은 갭.
- **지출 카테고리 파이**: 현재 월 기본, "최근 12개월 평균" 토글. null은 "기타".
- **지출 TOP 5**: 범위 내 최대 금액 항목 5개. 이상치(표준편차 ±2 초과) 뱃지.
- **통장별 월간 순변동 막대**: 해당 월의 accountDelta.

범위 토글: `6개월 / 12개월 / 24개월 / 올해 / 작년 / 전체 / 직접 지정` (마지막은 from·to 월 피커).

추가로 **연도별 합계 표**: 선택 범위의 연도마다 수입·지출·순잔액·저축률·기록 개월 수를 행으로 표시. 여러 해를 한눈에 비교.

## 데이터 흐름

### 입력 흐름

```
[브라우저 폼]
   → [Server Action] (zod 검증 통과 시에만 진행)
      → [쿼리 함수] (Drizzle)
         → [SQLite: Items 테이블 삽입, audit timestamps 자동 기록]
      → [revalidatePath('/months/[yyyymm]')]  ← 캐시 무효화
```

### 조회 흐름 (월별 뷰)

```
[Server Component: src/app/months/[yyyymm]/page.tsx]
   → [쿼리: 해당 월 Items + 모든 Active Accounts]
   → [도메인 함수: 총합·통장별 delta·TransferPlan 계산]
   → [클라이언트로 전달, 표·요약·이체 권장 렌더]
```

### 통계 흐름

```
[통계 페이지]
   → [쿼리: 최근 N개월(기본 12) Items 전체 + Accounts + 카테고리]
   → [도메인 함수: aggregateTrend() → 시계열; aggregateByCategory() → 파이 데이터]
   → [Recharts 렌더]
```

## 도메인 모델 (ER)

```
Account
  id (pk), name, role ('spending'|'savings'),
  openingBalance (integer KRW),
  openingBalanceAsOfMonth (YYYY-MM),
  archivedAt (nullable, soft delete),
  createdAt, updatedAt

Month
  id (pk = 'YYYY-MM'),
  note (nullable),
  closedAt (nullable timestamp),  ← 사용자 "확인 완료" 소프트 플래그
  createdAt

IncomeItem
  id (pk), monthId (fk→Month),
  amount (integer KRW, >0),
  label (string, 1..100),
  destinationAccountId (fk→Account),
  createdAt, updatedAt

ExpenseItem
  id (pk), monthId (fk→Month),
  amount (integer KRW, >0),
  label (string, 1..100),
  category (nullable string, 1..50),
  sourceAccountId (fk→Account),
  createdAt, updatedAt

FixedTemplate
  id (pk), name,
  createdAt, updatedAt

FixedTemplateItem
  id (pk), templateId (fk→FixedTemplate),
  kind ('income'|'expense'),
  amount, label,
  category (nullable),
  accountId (fk→Account)
```

### 핵심 원칙 (불변)

- `IncomeItem`·`ExpenseItem`은 **한 통장에만** 연결된다 (split 없음).
- `Account.role = 'savings'`는 **어느 시점이든 정확히 하나**의 통장에만 부여된다 — DB 레벨 부분 유니크 인덱스로 강제 (`WHERE archivedAt IS NULL AND role = 'savings'`).
- `archivedAt` 설정된 Account는 **신규 참조 금지**, 과거 참조는 유지 (soft delete — 과거 데이터 훼손 방지).
- 금액은 항상 **정수, 원 단위, 양수** (IncomeItem/ExpenseItem; ADR-0003).
- 월 키는 **`YYYY-MM` 문자열만** (ADR-0004).
- `Month.closedAt`은 **정보성 소프트 플래그**다. 사용자가 "이번 달 확인 완료"를 체크하면 timestamp 기록, 해제하면 null. **편집을 막지 않고**, 통계·월 목록에서 ✓ 뱃지 표시와 "확정된 달만" 필터에 사용.

## TransferPlan 산출 규칙

**입력**: 한 Month의 IncomeItem·ExpenseItem 목록, Account 목록.

**출력**: `Array<{fromAccountId, toAccountId, amount, direction: 'sweep'|'cover'}>`

**알고리즘**:
```
savings = accounts.find(a => a.role === 'savings' && !a.archivedAt)
if (!savings) → 에러: "저축 통장이 지정되지 않았습니다"

for each spending account A (role='spending', not archived):
  netFlow(A) = sum(incomes to A) − sum(expenses from A)
  if netFlow(A) > 0:
    plan.push({from: A, to: savings, amount: netFlow(A), direction: 'sweep'})
  else if netFlow(A) < 0:
    plan.push({from: savings, to: A, amount: -netFlow(A), direction: 'cover'})
  else: (=0) skip
```

**의미**: 사용자가 이 계획을 은행 앱에서 실행하면 해당 월의 "spending 통장 순변동 = 0"이 되고, 모든 잉여·부족이 savings 통장으로 흡수된다.

**MVP 외 미구현**: 통장별 목표 잔액(buffer), 비율 배분, 카테고리별 배분 등.

## 새 달 시작 (FixedTemplate + Clone Previous Month)

둘 다 `src/domain/clone-items.ts`의 동일한 순수 함수를 재사용; 입력 소스만 다르다.

- **FixedTemplate 적용**: 사용자가 관리하는 프리셋을 복사. 여러 템플릿 저장·선택 가능. 고정지출 구성이 바뀔 때 템플릿 편집.
- **지난 달 복제**: 직전 Month의 모든 Income/Expense를 그대로 복제. 명시적 템플릿 관리가 귀찮을 때.

**엣지 케이스**:
- 해당 Month에 이미 항목이 있으면: 사용자에게 확인 후 **덧붙이기/덮어쓰기** 선택.
- 참조하는 Account가 archived 상태라면: 그 항목만 스킵하고 사용자에게 경고.
- 직전 달이 없는 첫 Month라면: "지난 달 복제" 버튼 비활성화. FixedTemplate 적용 또는 수동 입력만.

## 엣지 케이스 & 예외 처리

### 입력·검증

- **금액 0 또는 음수**: zod에서 거절. 에러 메시지 "금액은 1원 이상이어야 합니다".
- **라벨 공백**: trim 후 비면 거절.
- **잘못된 월 키**: `/^\d{4}-(0[1-9]|1[0-2])$/` 정규식 검증. 2026-13, 2026-00 등 거절.
- **존재하지 않는 accountId 참조**: zod + DB FK 이중 방어.
- **금액 상한**: MVP에서 소프트 경고만 (예: 1억 초과 시 "정말 맞나요?" 확인 다이얼로그). 하드 제한은 두지 않음.

### 통장 관리

- **이름 변경**: 자유롭게 허용. FK는 id 기반이라 무영향. UI는 변경 후 이름으로 즉시 갱신.
- **삭제 요청**: Soft delete만 허용. `archivedAt`을 설정. 과거 항목 표시는 유지(이름 뒤에 `(보관)` 표시). 신규 입력 시 선택지에서 제외.
- **archived 통장을 복구**: 지원 (archivedAt을 null로). 단 savings 유일성 제약 때문에 역할 자동 조정.
- **savings 역할 전환**: 트랜잭션. 기존 savings의 role을 'spending'으로, 새 대상의 role을 'savings'로 원자적 변경. 부분 유니크 인덱스로 중간 상태 방지.
- **마지막 남은 spending 통장을 savings로 바꾸려는 시도**: 거절. 최소 1개의 spending 통장이 필요.
- **첫 Account가 아직 없을 때 월 진입**: 온보딩 리다이렉트.

### 수입·지출

- **같은 월에 중복처럼 보이는 항목** (같은 라벨 + 같은 금액 + 같은 통장): 중복일 수 있다는 소프트 경고만, 저장은 허용 (실제로 같은 카페에서 두 번 결제하는 등 정당한 케이스 있음).
- **미래 월 입력**: 허용 (예산 초안 용도). 현재 월과 시각적 구분만.
- **오래된 과거 월 수정**: 허용하되, Month에 `closedAt` 개념 도입은 Phase 2로 유보.
- **카테고리 표준화**: MVP는 자유 문자열 + 자동완성(과거 사용 카테고리 제안). 오타로 "월세"/"월 세" 분리되면 사용자 책임 — Phase 2에서 Category 정규화 테이블로 승격 검토.

### 계산

- **음수 netFlow**: TransferPlan에 `direction: 'cover'`로 표시. UI에서 색상 구분(빨강).
- **savings 통장이 지정 안 됨**: TransferPlan 영역에 "저축 통장을 먼저 지정하세요" 안내. 다른 집계는 정상 동작.
- **모든 Income·Expense가 같은 통장**: netFlow 1개만 생성. 정상.
- **Income만 있고 Expense 없음 / 반대**: 정상. 각각 0으로 처리.
- **openingBalance 시점 이전 달을 조회**: "이 달은 기록 개시 이전입니다" 배너. 집계는 숨김.

### 데이터 무결성

- **DB 파일 없음**: `pnpm db:migrate`로 신규 생성 후 온보딩.
- **마이그레이션 실패**: 실행 중단, `paynote.db.bak`(자동 백업 파일)로 롤백 지침 표시. 운영 중 자동 복구는 하지 않음.
- **동시 편집**: 단일 사용자 전제라 별도 락 없음. 만약 두 탭에서 동시에 같은 Month 편집 시 Next.js `revalidatePath` 기반 마지막-쓰기-승리(last-write-wins).

## 입력 검증 전략 (ADR-0005)

- **경계에서만 검증**: 모든 Server Action의 첫 줄은 `const parsed = schema.parse(formData)`. 도메인 함수는 검증된 타입만 받음.
- **스키마 위치**: `src/lib/validators/` 한곳. UI·Server Action·테스트에서 공유.
- **에러 UX**: Server Action이 `{ error: { field, message } }`을 반환 → useFormState로 폼 인라인 표시.
- **DB 제약과 중복**: zod에서 논리적 거절, FK/CHECK 제약은 최후 방어선. 방어 계층 두 개 유지.

## 에러 처리 전략

- **사용자 입력 오류**: Server Action에서 구조화된 에러 반환. 폼 필드 옆 표시.
- **DB 제약 위반** (중복·FK): 상위 try/catch에서 잡아 한국어 메시지로 변환.
- **예상치 못한 예외**: Next.js `error.tsx`가 받음. 콘솔 스택 + "다시 시도" 버튼.
- **로그**: 개발 중 `console.error`로 충분. 외부 로깅 서비스 없음 (로컬 앱).

## Audit timestamps

- 모든 Items·Accounts·Templates에 `createdAt`, `updatedAt` (둘 다 SQLite `CURRENT_TIMESTAMP` 디폴트).
- `updatedAt`은 Drizzle의 `$onUpdate(() => new Date())` 훅으로 자동 갱신.
- 표시는 기본적으로 안 함. "마지막 수정" 표시가 필요한 뷰에서만 출력.

## 통계 계산

- **월별 추이 (선그래프)**: 최근 N개월(기본 12, 설정 가능) 각각의 `totalIncome`, `totalExpense`, `netBalance`를 점으로. 데이터 없는 월은 **0이 아닌 갭**으로 표시 (값 혼동 방지).
- **지출 카테고리 비중 (파이)**: 현재 보고 있는 월 기준. `category`가 null인 항목은 "기타"로 묶음.
- **통장별 월간 순변동 (막대)**: 해당 월의 통장별 `accountDelta`.
- **누적 근사 잔액**: `openingBalance + sum(accountDelta)` — **근사값임을 UI에 명시** (InternalTransfer 미모델링으로 인한 부정확).

## 백업 & 복구

- **자동 백업**: `pnpm dev` 기동 시 `paynote.db`를 `paynote.db.bak-YYYY-MM-DD`로 스냅샷 복사. 최근 7개만 유지, 나머지 삭제.
- **마이그레이션 전 백업**: `pnpm db:migrate`가 자동으로 `paynote.db.premigrate-<timestamp>` 생성.
- **수동 내보내기**: `pnpm db:export`가 JSON 전체 덤프를 `exports/YYYY-MM-DD.json`에 저장. 이관·보관·클라우드 업로드 시 사용.
- **복구**: 백업 파일을 `paynote.db`로 덮어쓴 뒤 `pnpm db:migrate` 실행.

## 스키마 마이그레이션

- Drizzle-kit으로 생성: `pnpm db:generate` → `drizzle/NNNN_*.sql`.
- 한 번 생성된 마이그레이션 **파일은 건드리지 않음** (CLAUDE.md Never). 수정이 필요하면 새 마이그레이션 추가.
- 마이그레이션 실행 전 `premigrate` 백업 생성 (위).
- Postgres 호환 유지: JSON 컬럼·배열·SQLite 전용 함수 사용 금지.

## 외부 의존성

| 의존성 | 용도 | 장애 시 파급 | 대체 |
|---|---|---|---|
| better-sqlite3 | DB 엔진 | 전체 | libsql, Postgres 이관 |
| Drizzle ORM | 쿼리·마이그레이션 | 전체 | Kysely, Prisma |
| Next.js | UI·Server Action | 전체 | Remix |
| Tailwind | 스타일 | 시각만 | CSS Modules |
| Recharts | 차트 | 통계 뷰만 | visx, victory |
| zod | 입력 검증 | 검증 경로만 | valibot |

## 성능 & 데이터 규모

### 가정

- 단일 사용자, 연 12개월, 매월 수입·지출 합 ~15개 → **연 ~180건**.
- 10년 누적 ~1,800건. SQLite에 부담 없는 규모.
- 카테고리·통장·템플릿은 수십 개 이내.

### 인덱스

Drizzle 스키마에 명시적으로 선언:

- `IncomeItems(monthId)`, `IncomeItems(destinationAccountId)`
- `ExpenseItems(monthId)`, `ExpenseItems(sourceAccountId)`, `ExpenseItems(category)`
- `Accounts(archivedAt, role)` — savings 유일성 부분 유니크 인덱스 (`WHERE archivedAt IS NULL AND role = 'savings'`)
- `Months(closedAt)` — "확정된 달만" 통계 필터용

### 조회 패턴

- 월별 뷰: 한 Month의 Items + 모든 Active Accounts. 조회량 O(수십).
- 통계 뷰: 최근 N개월 Items 전체. 12개월 × 15건 = 180건. 단일 쿼리 수 ms.
- 집계는 도메인 함수에서 (ADR-0002). DB에서 SUM 집계 쓰지 않음.

### 캐싱

- Next.js App Router의 **`revalidatePath`** 기반 서버 컴포넌트 캐시.
- 입력 Server Action은 해당 월 경로와 통계 경로 둘 다 무효화.
- 별도 캐시 레이어(Redis 등) 불채용.

### 유지관리

- 수년 후 DB 크기 증가 시 `VACUUM;` 수동 실행 (설정 > 데이터 탭에 "DB 최적화" 버튼).
- `paynote.db` 크기는 설정 > 정보에 표시.

## 보안 / 프라이버시

### 네트워크 노출 범위

- 기본 `next dev`·`next start`는 `localhost` (127.0.0.1)에만 바인드 — 외부 기기 접근 불가.
- 홈 네트워크 내 폰 접속을 원할 때만 `pnpm dev -H 0.0.0.0` (사용자 명시적 선택). 이때도 방화벽·라우터 설정으로 외부 차단 유지.
- 외부 노출(재택에서 회사 폰 접근 등)은 VPN·Cloudflare Tunnel 등 사용자 판단. paynote은 관여하지 않음.

### 데이터 저장

- 민감 데이터는 `paynote.db` 파일 한 곳에만. 로그·에러 메시지에 계좌 세부나 개별 금액이 찍히지 않도록 로거 wrapper (`src/lib/logger.ts`) 경유.
- 파일 자체 암호화는 **하지 않음** — macOS FileVault(또는 동등한 OS 디스크 암호화) 전제. 다른 OS·외장 디스크에 둘 경우 SQLCipher 도입은 로드맵에.

### 네트워크 호출

- paynote 런타임은 **외부 네트워크 호출 없음**. 의존성은 로컬 설치 후 실행 시 네트워크 불필요.
- Next.js 기본 텔레메트리는 `pnpm dlx next telemetry disable`로 끄기 (setup 스크립트에 포함).
- 광고·분석 SDK **일체 금지** (로드맵의 "거절" 섹션).

### 업데이트

- 자동 업데이트 없음. 사용자가 `git pull && pnpm install && pnpm db:migrate && pnpm start`로 수동.
- 마이그레이션 전 `premigrate-<timestamp>` 자동 백업 (ADR-0001 관련).

### 위협 모델 (간단)

- **신뢰 대상**: 본인·본인의 기기·본인의 브라우저.
- **신뢰 안 함**: 외부 네트워크, 제3자 서비스.
- **위협 아님(Out of threat model)**: OS·하드웨어 수준 침해 — 그 단계는 FileVault·OS 패치 몫.

## 테스트 전략

별도 문서 `docs/testing.md` 참조. 요약:

- **Vitest** 프레임워크.
- **도메인 함수 100% 커버리지 목표** — 계산 정확성이 프로젝트의 존재 이유.
- Validator·헬퍼는 edge case 위주.
- 쿼리·Server Action은 핵심 경로만 스모크.
- UI 컴포넌트는 원칙적 무시, 수동 확인.
- Pre-commit 훅이 `pnpm test:ci` 강제.

## 알려진 제약 / 트레이드오프

- **단일 기기·단일 사용자** 전제. 모바일/다기기 동시 편집 불가.
- **`paynote.db` 백업**은 기본은 앱이 로컬 스냅샷 생성, 원격 보관은 사용자 책임 (iCloud/Google Drive 동기화 폴더에 프로젝트 배치 권장).
- **통장별 누적 실잔액은 근사값** — InternalTransfer 미모델링 때문 (ADR-0006). 정확한 현재 잔액은 은행 앱에서 확인.
- **통계 집계를 SQL 한 방에 끝내지 못함** — 도메인 함수를 경유 (ADR-0002).
- **카테고리 자유 문자열** — 오타로 인한 분리 가능성. Phase 2에서 정규화 테이블 승격 고려.

## 운영 원칙

- **파생값은 계산, 사실만 저장** — 항목 단위의 원자적 사실만 컬럼화 (ADR-0002).
- **금액은 원 단위 정수**, float 금지, 포맷팅은 경계(UI) 레이어에서만 (ADR-0003).
- **월 키는 `YYYY-MM` 문자열**, `Date` 비교 금지 (ADR-0004).
- **입력은 Server Action 경계에서만 검증**, 도메인 함수는 검증된 타입만 (ADR-0005).
- **UI는 쿼리 레이어만 호출**, 도메인 함수는 쿼리 결과에만 의존 — 계층 간 경계 유지.
- **삭제는 기본 soft delete** — 과거 데이터 훼손 방지.
- **파괴적 동작은 토스트 undo**, 재확인 다이얼로그 금지 (ADR-0007).
- **UX 마찰 최소화** — 매달 루틴이 1~2분 안에 끝나도록 (상세: `docs/ux.md`).
