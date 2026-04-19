# ADR 0005: 입력 검증은 Server Action 경계에서 zod로만 수행한다

- **Date**: 2026-04-18
- **Status**: Accepted
- **Deciders**: 본인

## Context

paynote은 폼 기반 CRUD가 지배적이다 — 수입·지출·통장·템플릿 입력이 전부 Server Action을 통한다. 입력 검증을 어디서·어떻게 할지는 초기에 결정해두지 않으면 "UI에서 한 번, Server Action에서 또 한 번, 도메인 함수에서 또 한 번" 반복되며 어긋나기 시작한다.

제약:
- 사용자는 본인 한 명이지만, 브라우저 DevTools로 폼을 우회한 요청을 보낼 가능성이 있어 **서버 측 검증은 필수**.
- TypeScript의 타입은 런타임에 강제되지 않음 — "이 필드는 string"이어도 DB에는 `undefined`가 들어갈 수 있음.
- 검증 실패 메시지는 한국어 UX로 렌더링되어야 함.

## Decision

**zod**를 유일한 검증 라이브러리로 사용하고, **모든 Server Action의 첫 줄**에서 입력을 파싱한다. 통과 후에만 쿼리/도메인 함수를 호출한다.

- 스키마 위치: `src/lib/validators/` — entity 단위로 분리 (`incomeItem.ts`, `expenseItem.ts`, `account.ts`, 등).
- Server Action 규약:
  ```ts
  'use server'
  export async function addExpense(prev: State, formData: FormData) {
    const parsed = expenseItemSchema.safeParse(Object.fromEntries(formData))
    if (!parsed.success) return { error: parsed.error.flatten() }
    // 여기 아래로는 parsed.data가 완전히 검증된 타입
    await db.insertExpense(parsed.data)
    revalidatePath(`/months/${parsed.data.monthId}`)
    return { ok: true }
  }
  ```
- 에러는 `useFormState`로 폼 인라인 표시. 한국어 메시지는 스키마에서 직접 지정 (`.min(1, '금액은 1원 이상이어야 합니다')`).
- 도메인 함수는 zod 추론 타입(`z.infer<typeof schema>`)을 파라미터로 받아 **"이미 검증됨"** 전제를 강제.

## Alternatives considered

- **valibot**: zod 유사 API, 번들 사이즈 30%. Next.js/Drizzle 생태계에서 zod가 사실상 표준이라 커뮤니티·문서가 풍부 → zod 유지. paynote은 로컬 앱이라 번들 사이즈가 critical하지 않음.
- **TypeBox** (JSON Schema 기반): OpenAPI 연동이 강점. paynote엔 API 불필요.
- **manual validation (`if` 연쇄)**: 처음엔 빠르지만 엔티티가 늘면 곧 지옥. 거절.
- **UI에서만 검증**: 폼을 우회하면 DB 제약만 남음. 메시지 품질도 저하.
- **도메인 함수 내부에서 검증**: "검증된 타입만 받는다"는 경계가 흐려짐 → 매 호출마다 재검증 필요.

## Consequences

### 얻은 것

- "경계에서만 검증"이라는 단일 규칙 → 어디를 봐야 하는지 명확.
- zod 스키마가 TS 타입의 **단일 출처** (`z.infer<typeof schema>`). 중복 정의 불필요.
- 런타임·타입·에러 메시지가 한 선언에 모임.

### 포기한 것

- 초기 설치 비용(zod 학습, 스키마 작성) 있음. 장기 유지보수에서 상쇄.
- zod는 bundle size가 작지 않음 (~12KB gzip). 로컬 앱에서는 허용 범위.

### 유지 비용

- 새 필드 추가 시 **스키마부터** 업데이트해야 함 — 규약으로 강제.
- 에러 메시지 번역은 스키마 정의에서 직접 관리 (한국어 고정).
- DB 제약(NOT NULL, CHECK 등)과 zod 제약이 중복될 수 있음 — 의도적 2중 방어로 유지.

## 관련

- `src/lib/validators/` — 스키마 모음
- ADR-0003 — 금액 정수 제약을 스키마에서 강제
- ADR-0004 — 월 키 정규식을 스키마에서 강제
- CLAUDE.md — "Server Action은 첫 줄에서 validate" 규칙
