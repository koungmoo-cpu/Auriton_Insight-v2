# 🔮 Auriton InsightAI v4.0

> AI와 고대 지혜가 결합된 차세대 운세 상담 시스템

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-blue.svg)](https://expressjs.com/)
[![Gemini](https://img.shields.io/badge/Google-Gemini%202.0-orange.svg)](https://ai.google.dev/)

## ✨ 주요 특징

### 🎴 사주 명리학 (검증됨)
- ✅ **음양오행 분석**: 목화토금수 5가지 원소 균형 체크
- ✅ **일간(日干) 해석**: 갑을병정무기경신임계 10간 특성 분석
- ✅ **천간지지 계산**: lunar-javascript 라이브러리 기반 정확한 사주팔자
- ✅ **맞춤 개운법**: 오행 균형 기반 색상/방향/행동 조언

### ⭐ 서양 점성학 (검증됨)
- ✅ **Big 3 계산**: 태양/달/상승궁 실제 천문 계산
- ✅ **12하우스 시스템**: Equal House 기반 생활 영역 분석
- ✅ **Julian Date**: 정확한 황경(Longitude) 계산
- ✅ **Local Sidereal Time**: 위치 기반 상승궁 결정

### 🤖 AI 통합
- 🔥 **Gemini 2.0 Flash**: 최신 구글 AI 모델
- 📝 **글자 수 제한**: 초기 680자, 추가 질문 500자
- 💬 **대화형 상담**: 5회까지 추가 질문 가능
- 🎭 **자연스러운 톤**: 이론 설명 없이 직관적 해석

## 🚀 빠른 시작

### 1. 설치
```bash
npm install
```

### 2. 환경 변수 설정
```bash
cp .env.example .env
# .env 파일을 열고 GEMINI_API_KEY 입력
```

### 3. 실행
```bash
npm start
```

### 4. 접속
```
http://localhost:3000
```

## 📦 필수 패키지

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.1.5",
    "@google/generative-ai": "^0.21.0",
    "lunar-javascript": "^1.6.12",
    "dotenv": "^16.3.1"
  }
}
```

## 🎯 사용 예시

### 사주 상담
```javascript
// 입력
{
  "name": "홍길동",
  "birthDate": "1990-05-15",
  "birthTime": "14:30",
  "calendarType": "양력"
}

// 출력
사주 명식: 경오년 신사월 갑자일 신미시

오행 분석:
- 목: 1 (일간 갑목)
- 화: 3 (과다)
- 토: 1
- 금: 3
- 수: 1 (부족)

해석:
당신은 갑목(큰 나무) 일간으로, 정직하고 곧은 성품입니다.
화 기운이 강해 열정적이지만, 수 기운 보충이 필요합니다.

개운법:
- 검정색/파란색 옷
- 북쪽 방향 활동
- 물가 산책
```

### 점성학 상담
```javascript
// 입력
{
  "name": "Jane Doe",
  "birthDate": "1995-07-23",
  "birthTime": "18:30"
}

// 출력
태양: 사자자리 (황경 120.5°)
달: 쌍둥이자리 (황경 75.2°)
상승궁: 사수자리

하우스 분석:
1하우스(사수자리): 낙천적 첫인상
2하우스(염소자리): 안정적 재정 관리
3하우스(물병자리): 독특한 소통 방식

해석:
리더십 있는 태양 사자자리에 호기심 많은 달 쌍둥이자리가 조화를 이룹니다.
```

## 📊 기술 스택

### Backend
- **Node.js 18+**: ES Modules 지원
- **Express.js**: RESTful API 서버
- **Gemini API**: AI 해석 생성
- **lunar-javascript**: 사주 계산

### Frontend
- **Vanilla JavaScript**: 프레임워크 없는 순수 JS
- **CSS Variables**: 테마 커스터마이징
- **Glassmorphism**: 현대적 UI 디자인

### Security
- **Helmet.js**: HTTP 헤더 보안
- **CORS**: Cross-Origin 제어
- **Rate Limiting**: API 남용 방지 (15분당 20회)

## 🔒 보안 기능

1. **API 키 보호**: 환경 변수로 관리
2. **Rate Limiting**: 과도한 요청 차단
3. **CORS 설정**: 허용된 도메인만 접근
4. **세션 관리**: 사용자별 격리

## 📈 성능

- ⚡ **응답 속도**: 평균 2-3초
- 🔄 **동시 처리**: Express 기본 성능
- 💾 **메모리**: 세션 기반 임시 저장

## 🌐 배포

### Vercel (권장)
```bash
vercel

# 환경 변수 설정
# Settings > Environment Variables
# GEMINI_API_KEY 추가
```

### 기타 플랫폼
- Heroku
- Railway
- Render
- AWS EC2

## 📁 프로젝트 구조

```
auriton-insight-ai/
├── server.js              # 백엔드 로직
│   ├── 사주 계산 함수
│   ├── 점성학 계산 함수
│   ├── Gemini API 연동
│   └── Express 라우트
├── script.js              # 프론트엔드 로직
│   ├── 폼 검증
│   ├── API 호출
│   ├── 질문 카운터
│   └── 타이핑 효과
├── index.html             # UI 구조
├── style.css              # 디자인 (Glassmorphism)
├── vercel.json            # Vercel 배포 설정
├── package.json           # 의존성
├── .env.example           # 환경 변수 템플릿
├── ANALYSIS_REPORT.md     # 상세 분석 보고서
└── QUICKSTART.md          # 빠른 시작 가이드
```

## 🧪 테스트

```bash
# 서버 실행
npm start

# 다른 터미널에서
curl -X POST http://localhost:3000/api/saju/consultation \
  -H "Content-Type: application/json" \
  -d '{
    "rawData": {
      "userInfo": {
        "name": "테스트",
        "birthDate": "1990-01-01",
        "birthTime": "12:00",
        "calendarType": "양력"
      }
    }
  }'
```

## 🐛 알려진 제한 사항

### 사주 명리학
- ⚠️ 대운(大運) 계산 미구현
- ⚠️ 세운(歲運) 계산 미구현
- ⚠️ 용신(用神) 자동 판단 미구현
- ⚠️ 신살(神煞) 미구현

### 점성학
- ⚠️ 행성 아스펙트 미구현
- ⚠️ Placidus 하우스 미구현
- ⚠️ 프로그레션/트랜짓 미구현
- ⚠️ 달의 정확한 위치는 근사치

### 시스템
- ⚠️ 메모리 기반 세션 (재시작 시 초기화)
- ⚠️ 데이터베이스 없음

## 🔧 개선 계획

### Phase 1 (단기)
- [ ] 대운/세운 계산 추가
- [ ] 데이터베이스 연동 (MongoDB)
- [ ] 사용자 인증 시스템

### Phase 2 (중기)
- [ ] Swiss Ephemeris 통합 (정밀 계산)
- [ ] PDF 리포트 생성
- [ ] 음력↔양력 변환 UI

### Phase 3 (장기)
- [ ] 모바일 앱 (React Native)
- [ ] 소셜 로그인
- [ ] 결과 공유 기능

## 📚 참고 문헌

### 사주 명리학
- 《滴天髓》 (적천수)
- 《子平真詮》 (자평진전)
- 《窮通寶鑑》 (궁통보감)

### 점성학
- *The Inner Sky* by Steven Forrest
- *Astrology for the Soul* by Jan Spiller
- *The Houses* by Robert Hand

## 🤝 기여

이 프로젝트는 개선 제안을 환영합니다:
1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 라이선스

MIT License - 자유롭게 사용 가능

## 📞 문의

- 버그 리포트: GitHub Issues
- 기능 제안: GitHub Discussions
- 이메일: support@auriton.ai (가상)

## 🙏 감사의 말

- **lunar-javascript**: 정확한 사주 계산 라이브러리
- **Google Gemini**: 강력한 AI 해석
- **Express.js**: 안정적인 웹 프레임워크

---

**Made with ❤️ by Auriton Team**

**버전**: 4.0 Enhanced Edition  
**마지막 업데이트**: 2025-02-04
