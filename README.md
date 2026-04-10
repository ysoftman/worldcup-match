# FIFA 월드컵 시뮬레이터

56개국 중 32개국을 랜덤 선택하여 토너먼트를 진행하는 가상 월드컵 웹앱입니다.

## 기능

- 56개국 중 32개국 랜덤 추첨
- 버튼 클릭으로 라운드별 경기 진행 (32강 -> 16강 -> 8강 -> 4강 -> 결승)
- 동점 시 승부차기 자동 처리
- 우승팀 트로피 애니메이션
- 다크 모드 지원

## 기술 스택

- Vite + React + TypeScript
- bun (패키지 매니저)

## 실행 방법

```bash
# 의존성 설치
bun install

# 개발 서버 실행
bun run dev

# 프로덕션 빌드
bun run build
```

## 프로젝트 구조

```text
src/
├── data/countries.ts        # 국가 데이터 (이름, 코드, 국기)
├── types.ts                 # 타입 정의 (Match, Round 등)
├── utils/tournament.ts      # 토너먼트 로직 (셔플, 매치 생성, 시뮬레이션)
├── components/
│   ├── MatchCard.tsx        # 개별 매치 카드 컴포넌트
│   ├── RoundView.tsx        # 라운드별 매치 목록 컴포넌트
│   └── Champion.tsx         # 우승팀 표시 컴포넌트
├── App.tsx                  # 메인 앱 (토너먼트 상태 관리)
├── App.css                  # 앱 스타일 (다크모드 포함)
└── index.css                # 글로벌 스타일
```
