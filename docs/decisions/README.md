# Architecture Decision Records (ADR)

중요한 기술 결정을 기록합니다. 3개월 후 "왜 이렇게 했더라?" 방지.

## 언제 ADR을 쓰나

- 되돌리기 어려운 결정 (DB 선택, 인증 방식, 배포 방식, 프레임워크)
- 다른 대안을 **명시적으로 거절한** 결정
- 비엔지니어도 알아야 할 기술 결정

## 쓰지 않아도 되는 것

- 린터로 강제되는 규칙 (코드 스타일 등)
- 쉽게 되돌릴 수 있는 결정 (변수명 컨벤션 등)
- 너무 자명한 선택

## 작성법

1. `0000-template.md`를 복사
2. 다음 번호로 파일명: `NNNN-kebab-case-title.md`
   - 예: `0001-postgres-over-mongodb.md`
3. 한 번 매긴 번호는 바꾸지 않음. 취소·대체 시 Status만 변경.

## 상태 흐름

```
Proposed → Accepted → (optionally) Deprecated | Superseded by ADR-XXXX
```

## 목록

<!-- 새 ADR을 추가할 때마다 이 목록도 업데이트 -->

- [0001](0001-local-first-nextjs-sqlite.md) — 로컬 우선 Next.js + SQLite + Drizzle 스택
- [0002](0002-no-derived-totals.md) — 파생값은 저장하지 않고 항상 계산한다
- [0003](0003-money-as-integer-krw.md) — 금액은 정수 KRW로만 저장·계산한다
- [0004](0004-yyyymm-string-not-date.md) — 월 식별자는 `YYYY-MM` 문자열 (Date 금지)
- [0005](0005-zod-validation-at-boundaries.md) — 입력 검증은 Server Action 경계에서 zod로만
- [0006](0006-no-internal-transfer-mvp.md) — MVP에서 InternalTransfer를 모델링하지 않는다
- [0007](0007-toast-undo-over-confirmation-dialogs.md) — 파괴적 동작은 재확인 다이얼로그 대신 토스트 undo
