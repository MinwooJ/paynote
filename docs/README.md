# Documentation (Layer 2 — Reference)

에이전트와 사람이 **필요할 때만** 펴 보는 두꺼운 맥락 층.
CLAUDE.md가 가리키고, Claude Code가 `Read` 도구로 열람합니다.

## 파일

- `architecture.md` — 시스템 구조·데이터 흐름·성능·보안·외부 의존성
- `ux.md` — 사용자 여정·인터랙션 패턴·접근성·빈 상태 처리
- `testing.md` — 테스트 전략·프레임워크·커버리지 목표
- `roadmap.md` — MVP 이후 후보 기능의 우선순위·근거
- `claude-design-brief.md` — 디자인 의뢰 시 통째로 보낼 브리프
- `decisions/` — ADR (Architecture Decision Records, 7건)
- `glossary.md` — 도메인·코드 규약·UX 용어집

## 읽기 순서 (새 contributor·에이전트용)

1. **[../README.md](../README.md)** — 프로젝트가 뭐하는 건지 1분
2. **[../CLAUDE.md](../CLAUDE.md)** — 스택·명령어·Never 규칙 2분
3. **[glossary.md](./glossary.md)** — 도메인 용어 정의 (나머지 문서 읽기 전제)
4. **[architecture.md](./architecture.md)** — 시스템의 모양 (ER, 데이터 흐름, 엣지 케이스)
5. **[ux.md](./ux.md)** — 사용자가 어떻게 쓰는지 (여정·인터랙션)
6. **[decisions/](./decisions/)** — "왜 이렇게?"가 궁금해졌을 때 해당 ADR만 부분 읽기
7. **[testing.md](./testing.md)** — 테스트 작성·실행할 때
8. **[roadmap.md](./roadmap.md)** — MVP 밖 아이디어 제안하거나 논의할 때

## 업데이트 트리거

| 이럴 때 | 이걸 업데이트 |
|---|---|
| 큰 기술 결정 (DB 선택, 인증 방식 등) | `decisions/` 에 새 ADR |
| 새 도메인 용어 등장 | `glossary.md` |
| 주요 구조 변경 (새 서비스, 폴더 재편) | `architecture.md` |
| 코드 파일 경로 변경 | `../CLAUDE.md` 의 코드 지도도 함께 |

## 철학

이 폴더는 **Slack 논의, 구두 전달, 사람 머릿속**에만 있던 맥락을
리포지토리 안으로 끌어오는 장치입니다.
<!-- OpenAI가 강조한 "system of record" 원칙 -->

에이전트 관점에서 "컨텍스트에 없으면 존재하지 않는 것"과 같습니다.
3개월 후 합류한 신규 입사자에게 알려지지 않은 정보는
에이전트에게도 알려지지 않은 정보입니다.
