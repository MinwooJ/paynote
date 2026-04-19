# ADR 0004: 월 식별자는 `YYYY-MM` 문자열 — `Date` 객체 금지

- **Date**: 2026-04-18
- **Status**: Accepted
- **Deciders**: 본인

## Context

paynote의 도메인은 **월(Month) 단위**다. "2025년 9월"은 **시점이 아니라 기간의 식별자**다. 그런데 JavaScript에는 "월"이라는 타입이 없고, 개발자는 흔히 `Date` 객체로 월을 표현한다.

`Date`를 월 식별자로 쓰면 생기는 문제들:

- 시간대에 의존 — `new Date('2025-09-01')`는 UTC 자정이므로 KST로는 8월 31일 09시. 사용자가 보기엔 9월이지만 서버 타임존에 따라 8월로 해석될 수 있음.
- 비교·직렬화가 애매 — `date1 === date2`는 false (객체 참조 비교), `date1.getTime() === date2.getTime()`은 true.
- URL·쿼리 파라미터로 전달 시 직렬화 포맷이 불일치 (`toISOString`, `toLocaleDateString` 등).
- 월의 개념에는 **일·시·분·초가 없다** — Date는 과잉 정보를 담아 실수를 초대.

## Decision

월 식별자는 **`YYYY-MM` 문자열**로만 표현한다 (예: `'2025-09'`).

- DB 컬럼: `text('id', { length: 7 })` (Months 테이블의 PK).
- TS 타입: `type MonthKey = string` + zod로 정규식 검증 (`/^\d{4}-(0[1-9]|1[0-2])$/`).
- URL: `/months/2025-09` 그대로 (인코딩·변환 불필요).
- 정렬: 문자열 사전순 정렬이 곧 시간순 정렬 (ISO 포맷의 장점).
- Date 객체는 **UI 레이어의 `<input type="month">` 파싱 시점에서만** 잠시 존재 → 즉시 문자열 변환 후 사용. 도메인·쿼리·Server Action 경계를 넘지 않는다.

## Alternatives considered

- **`Date` 객체**: 위 Context 참조.
- **Unix timestamp (number)**: 초·밀리초 단위라 "월" 개념과 불일치. "월의 시작 timestamp"로 쓰더라도 시간대 문제 재발.
- **(year: number, month: number) 두 컬럼/튜플**: 비교가 복합 조건(year > X OR (year = X AND month >= Y)). 문자열 한 컬럼보다 번거로움. 정렬·인덱싱 비효율.
- **ISO 8601 전체 (`2025-09-01T00:00:00Z`)**: 일·시 정보가 노이즈. 파싱 혼란. 그냥 `YYYY-MM`이 충분.
- **라이브러리(Temporal, date-fns PlainYearMonth)**: 런타임 의존성. 직렬화·DB 저장 시 결국 문자열로 변환. 순 이득 적음.

## Consequences

### 얻은 것

- 시간대 의존 완전 제거.
- URL·JSON·DB가 동일 표현 사용 → 변환 레이어 불필요.
- 문자열 비교가 그대로 시간순 비교.
- 타입·zod 정규식으로 유효성 보장.

### 포기한 것

- "월의 일수", "해당 월의 마지막 날짜" 같은 계산이 필요하면 별도 헬퍼 함수를 `src/lib/month-key.ts` 에 모음. (date-fns 없이 간단히 구현 가능.)
- `<input type="month">`의 네이티브 값(`'2025-09'`)과 운 좋게 일치 — 별도 변환 없음.

### 유지 비용

- 월 연산 헬퍼(`prevMonth('2025-09') → '2025-08'`, `monthRange('2025-01', '2025-12')` 등)는 직접 작성. 실수 방지를 위해 단위 테스트 필수.
- Drizzle 스키마에서 Date 타입을 잘못 받아들이지 않도록 `text` 타입을 고수.

## 관련

- `src/lib/month-key.ts` — 월 연산 헬퍼 (prev/next/range/format)
- `src/lib/validators/month.ts` — zod 정규식 스키마
- CLAUDE.md — Never 규칙에 명시
