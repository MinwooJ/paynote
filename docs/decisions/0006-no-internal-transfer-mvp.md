# ADR 0006: MVP에서 InternalTransfer(통장 간 이체 기록)를 모델링하지 않는다

- **Date**: 2026-04-18
- **Status**: Accepted
- **Deciders**: 본인

## Context

paynote의 핵심 출력 중 하나는 **TransferPlan** — "월말에 각 통장에서 저축 통장으로 얼마 이체하면 되는가"를 자동 산출. 하지만 사용자가 이 권장안을 실제로 은행 앱에서 실행해도, paynote 자체는 그 이체를 기록하지 않는다.

이체 기록을 명시적으로 저장(`InternalTransfer` 테이블)하면 얻는 것:
- 통장별 누적 실잔액이 정확해짐. "지난 달 말 우리은행 실잔액" 계산 가능.
- "이번 달 이체 계획 vs 실제 실행" 대조 기능.
- Month 간 carry-over 로직이 명확.

하지만 복잡도 증가:
- 새 테이블·폼·UI·도메인 함수.
- TransferPlan 실행 시 "이 계획을 적용하시겠습니까?" → InternalTransfer 자동 생성 플로우.
- 사용자가 계획을 일부만 실행했을 때, 사용자가 임의로 다른 이체를 추가했을 때 등 엣지 케이스.
- 사용자가 은행 앱과 paynote에 **같은 이체를 두 번 입력**해야 하는 마찰.

사용자의 실제 사용 패턴 (메모 분석):
- 메모에 이체 기록은 없음. "남은 돈" 계산 + 통장별 현재 잔액만 기록.
- 사용자는 은행 앱을 정확한 현재 잔액의 single source of truth로 삼고 있음.
- paynote의 가치는 "**수기 계산 오차 제거**"이지 "**통장 잔액 미러링**"이 아님.

## Decision

**MVP에서 `InternalTransfer` 엔티티를 두지 않는다.** TransferPlan은 순수 "표시용 권장안"으로만 동작하고, 실행 기록은 DB에 남지 않는다.

- TransferPlan은 매 조회 시 IncomeItem·ExpenseItem·Account만으로 계산.
- 통장별 **projectedAccountBalance는 "근사값"** — UI에 명시 (툴팁·배지).
- 정확한 현재 잔액이 필요하면 사용자는 **은행 앱**에서 직접 확인.

### Phase 2 도입 시 추가할 것

- `InternalTransfer(id, date, fromAccountId, toAccountId, amount, note, createdAt, updatedAt)` 테이블.
- Account delta 계산에 이체를 반영: `delta = Σincomes − Σexpenses + Σ(transfers in) − Σ(transfers out)`.
- TransferPlan "실행" 버튼 → 해당 이체들을 InternalTransfer 레코드로 일괄 삽입.
- 선택적: `MonthEndActualBalance`와 함께 도입 검토 (계산 vs 실측 대조).

## Alternatives considered

- **지금 도입**: 위 복잡도 부담. 사용자의 메모 패턴에 이체 기록이 없어 요구 빈도 불명확. 실제 사용해보고 필요성이 확인되면 Phase 2에서 도입.
- **TransferPlan을 없애고 수동 관리**: 프로젝트의 핵심 가치(어디로 얼마 보낼지 자동 계산)를 포기. 거절.
- **TransferPlan 결과를 간이 로그로만 저장** (사실상 InternalTransfer-lite): 어차피 엔티티가 필요해지고, 이도 저도 아닌 형태가 됨.

## Consequences

### 얻은 것

- MVP 스키마·UI 복잡도 감소. 테이블 1개 + 폼 1개 + 엣지 케이스 5개 이상 절감.
- 사용자는 "paynote 데이터 입력"과 "실제 은행 이체"를 섞지 않음 — 멘탈 모델 단순.
- 구현 속도·초기 안정성 향상.

### 포기한 것

- **통장별 누적 잔액은 근사값**. `openingBalance + Σdelta`로 계산되지만 월말 이체가 반영 안 됨 → 실제 은행 잔액과 드리프트 발생.
- "과거 언제 얼마 이체했나" 조회 불가.
- "계획대로 실행했는지" 추적 불가.

### 유지 비용

- UI 곳곳에 "근사값" 표기 필요 (사용자 혼란 방지).
- 사용자가 주기적으로 `openingBalance`/`openingBalanceAsOfMonth`를 현재 실잔액으로 **리베이스(rebase)**해야 드리프트가 쌓이지 않음 — Phase 2 전까지의 운영 팁.

## 관련

- `src/domain/transfer-plan.ts` — 표시용 계산
- `docs/glossary.md` — InternalTransfer 항목에 "MVP 미구현" 표시
- `docs/architecture.md` — 누적 잔액 근사 특성 명시
- ADR-0002 — 파생값 계산 원칙 (TransferPlan은 그 연장)
