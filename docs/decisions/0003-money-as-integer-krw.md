# ADR 0003: 금액은 정수 KRW로만 저장·계산한다

- **Date**: 2026-04-18
- **Status**: Accepted
- **Deciders**: 본인

## Context

paynote이 다루는 데이터의 핵심은 **금액**이다. 금액 계산에서 오차가 한 번이라도 발생하면 이 프로젝트의 존재 이유(메모 방식 오차 제거)가 훼손된다.

- 대한민국 원(KRW)은 보조 단위가 없는 통화다 (전·푼 없음). 모든 거래는 정수 원 단위.
- JavaScript의 기본 숫자 타입은 IEEE 754 double precision — `0.1 + 0.2 !== 0.3` 같은 부동소수 오차가 발생한다.
- 금융 앱에서 흔히 쓰는 대안: BigInt, Decimal 라이브러리(dinero.js 등), 문자열 저장.
- paynote의 규모는 개인 가계부 수준 — 최대 금액은 수억 원 이하로 추정. Number.MAX_SAFE_INTEGER(2^53-1 ≈ 9,007조)를 훨씬 밑돔.

## Decision

금액은 **정수(integer)로만 저장·계산한다**. 단위는 **원(KRW)**. float·Decimal·BigInt 모두 사용하지 않는다.

- 스키마: Drizzle의 `integer('amount')` — SQLite의 INTEGER, Postgres의 INTEGER (32-bit)이지만 실사용 범위 내에서 문제없음. 필요 시 Postgres 이관 시 BIGINT로 승격 가능.
- TypeScript 타입: 그대로 `number`. 코드상으로는 "정수임"을 주석·zod(`z.number().int().positive()`)로 표현.
- UI 포맷팅: `src/lib/currency.ts`의 `formatKRW(n: number): string` 한 곳에서만 — `"1,283,000원"` 형태.
- UI 입력 파싱: `parseKRW(s: string): number` — 쉼표·공백 제거, 소수점 입력은 거절 (zod로 검증).

## Alternatives considered

- **float 그대로 사용**: 0.1+0.2 문제. 합계를 저장하지 않는 원칙(ADR-0002)이 있어도, 중간 계산 결과가 잠시라도 float이면 불안정. 거절.
- **BigInt**: Number보다 안전하지만 JSON 직렬화 번거로움(BigInt는 JSON.stringify 기본 미지원 → toString 필요), React 상태·props·차트 라이브러리 호환성 리스크. 개인 가계부 규모에서 overkill.
- **Decimal 라이브러리 (dinero.js, decimal.js)**: 다중 통화·소수 지원이 필요한 곳에는 적합하지만 paynote은 KRW 정수만 — 불필요한 의존성.
- **원 단위가 아닌 "전"(1/100원) 정수로 저장** (통화 일반 관례): KRW에는 보조 단위 자체가 없음. 혼란만 가중.

## Consequences

### 얻은 것

- **부동소수 오차 원천 제거**. 합계·평균 계산이 정확.
- JS `Number`로 직접 다뤄 JSON·React·Drizzle 연동에 마찰 없음.
- UI 포맷팅이 한 함수로 집중 → 로케일·표기 변경이 쉬움.

### 포기한 것

- 미래에 USD·EUR 등 소수점 통화를 다루게 되면 마이그레이션 비용 발생. 그때 ADR 재검토.
- 초거액(조 단위 이상)을 다룰 경우 Number.MAX_SAFE_INTEGER 근처에서 정밀도 손실 가능 — 개인 가계부 범위에서 발생할 일 없음.

### 유지 비용

- zod 스키마에서 `.int().positive()` 누락 시 float 입력이 흘러들 수 있음 → 검증 스키마는 반드시 validators/ 통과.
- 금액을 조작하는 모든 도메인 함수는 정수 전제하에 작성 (예: 나눗셈 시 `Math.floor` 또는 반올림 정책 명시).

## 관련

- `src/lib/currency.ts` — 포맷팅·파싱 한 곳
- `src/lib/validators/` — zod 스키마들
- ADR-0002 — 파생값 계산 원칙 (정수 연산의 정확성이 전제)
- ADR-0005 — 입력 검증 전략 (경계에서 정수 제약 강제)
