# 🚀 Auriton InsightAI - 빠른 시작 가이드

## 📦 필수 패키지 설치

```bash
npm install express cors helmet express-rate-limit @google/generative-ai lunar-javascript dotenv
```

또는 `package.json` 생성:

```json
{
  "name": "auriton-insight-ai",
  "version": "4.0.0",
  "type": "module",
  "description": "AI-powered fortune telling with Saju and Western Astrology",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "NODE_ENV=development node server.js"
  },
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

## 🔑 환경 변수 설정

`.env` 파일 생성:

```env
GEMINI_API_KEY=여기에_실제_API_키_입력
NODE_ENV=development
PORT=3000
```

### Gemini API 키 발급 방법:
1. https://aistudio.google.com/ 접속
2. "Get API Key" 클릭
3. 키 복사 후 `.env` 파일에 붙여넣기

## 🎯 주요 기능

### ✅ 구현된 기능
1. **사주 명리학**
   - 음양오행 분석 (목화토금수)
   - 일간 기반 성격 분석
   - 오행 균형 체크
   - 맞춤 개운법 제시

2. **서양 점성학**
   - Big 3 (태양, 달, 상승궁) 계산
   - 12하우스 시스템 (Equal House)
   - 실제 천문 계산 (근사)
   - 생활 영역별 분석

3. **사용자 경험**
   - 초기 해설: 680자 제한
   - 추가 질문: 5회까지, 각 500자 제한
   - 타이핑 효과
   - 질문 카운터 표시

### ⚠️ 제한 사항
- 대운/세운 계산 미구현
- 행성 아스펙트 미구현
- 메모리 기반 세션 (재시작 시 초기화)
- 정밀 천문 계산은 Swiss Ephemeris 필요

## 🏃 실행 방법

```bash
# 1. 패키지 설치
npm install

# 2. 환경 변수 설정 (.env 파일)
echo "GEMINI_API_KEY=your_key_here" > .env

# 3. 서버 실행
npm start

# 4. 브라우저에서 접속
# http://localhost:3000
```

## 📁 파일 구조

```
project/
├── server.js          # 백엔드 (Express + Gemini API)
├── script.js          # 프론트엔드 로직
├── index.html         # UI
├── style.css          # 디자인
├── vercel.json        # Vercel 배포 설정
├── .env               # 환경 변수 (gitignore 필수!)
└── package.json       # 의존성
```

## 🌐 Vercel 배포

```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel

# 환경 변수 설정 (Vercel 대시보드)
# Settings > Environment Variables
# GEMINI_API_KEY 추가
```

## 🧪 테스트 시나리오

### 사주 테스트
1. 선택 화면에서 "사주명리학" 클릭
2. 다음 정보 입력:
   - 이름: 홍길동
   - 성별: 남성
   - 생년월일: 1990-05-15
   - 시간: 14:30
   - 달력: 양력
3. "운명 해석 시작" 클릭
4. 결과 확인:
   - 사주 명식 표시
   - 오행 분석
   - 성격 해석
   - 개운법
5. 추가 질문 테스트:
   - "올해 운세는 어떤가요?"
   - "직업 운은 어떤가요?"
   - 총 5회까지 가능

### 점성학 테스트
1. "서양 점성술" 선택
2. 정보 입력:
   - 이름: Jane Doe
   - 성별: 여성
   - 생년월일: 1995-07-23
   - 시간: 18:30
3. 결과 확인:
   - Big 3 (태양/달/상승)
   - 하우스 분석
   - 성격 및 운명 해석

## 🐛 문제 해결

### 1. "API Key 설정이 필요합니다" 오류
```bash
# .env 파일 확인
cat .env

# 없으면 생성
echo "GEMINI_API_KEY=your_actual_key" > .env
```

### 2. 포트 충돌 (EADDRINUSE)
```bash
# 다른 포트 사용
PORT=3001 npm start
```

### 3. 사주 계산 오류
- 날짜 형식 확인: YYYY-MM-DD
- 시간 형식 확인: HH:MM
- 음력/양력 선택 확인

### 4. 점성학 계산 오류
- 출생 시간이 필수 (상승궁 계산)
- 위도/경도는 기본값 (서울) 사용 중

## 📊 API 엔드포인트

```javascript
// 사주 상담 시작
POST /api/saju/consultation
{
  "rawData": {
    "userInfo": {
      "name": "홍길동",
      "gender": "남성",
      "birthDate": "1990-05-15",
      "birthTime": "14:30",
      "calendarType": "양력"
    }
  },
  "userId": "unique_user_id"
}

// 사주 추가 질문
POST /api/saju/chat
{
  "userMessage": "올해 운세는?",
  "rawData": { ... },
  "userId": "unique_user_id"
}

// 점성학 상담 시작
POST /api/astrology/consultation
{
  "rawData": {
    "userInfo": {
      "name": "Jane Doe",
      "birthDate": "1995-07-23",
      "birthTime": "18:30"
    }
  }
}

// 점성학 추가 질문
POST /api/astrology/chat
{
  "userMessage": "연애운은?",
  "rawData": { ... }
}

// 세션 리셋
POST /api/reset-session
{
  "userId": "unique_user_id"
}
```

## 🔐 보안 권장 사항

1. **환경 변수 보호**
```bash
# .gitignore에 추가
echo ".env" >> .gitignore
```

2. **Rate Limiting**
```javascript
// server.js에 이미 적용됨
// 15분당 20회 요청 제한
```

3. **CORS 설정**
```javascript
// 프로덕션에서는 특정 도메인만 허용
app.use(cors({ 
  origin: 'https://yourdomain.com',
  credentials: true 
}));
```

## 🎨 UI 커스터마이징

### 색상 변경 (style.css)
```css
:root {
    --void-black: #0B0E14;     /* 배경색 */
    --neon-gold: #FFD700;      /* 강조색 */
    --tech-cyan: #00F0FF;      /* 포인트색 */
}
```

### 폰트 변경
```html
<!-- index.html에서 구글 폰트 변경 -->
<link href="https://fonts.googleapis.com/css2?family=Your+Font&display=swap">
```

## 📈 성능 최적화

1. **캐싱 추가**
```javascript
// 동일한 사주는 캐싱
const cache = new Map();
if (cache.has(sajuKey)) {
    return cache.get(sajuKey);
}
```

2. **응답 압축**
```bash
npm install compression
```

```javascript
import compression from 'compression';
app.use(compression());
```

## 🚧 향후 개선 계획

### 우선순위 높음
- [ ] 대운(大運) 계산 추가
- [ ] Swiss Ephemeris 통합
- [ ] 데이터베이스 연동 (MongoDB/PostgreSQL)
- [ ] 사용자 인증 시스템

### 우선순위 중간
- [ ] 음력↔양력 변환 UI
- [ ] 출생지 위도/경도 입력
- [ ] PDF 리포트 생성
- [ ] 다국어 지원 (영어)

### 우선순위 낮음
- [ ] 소셜 공유 기능
- [ ] 결과 히스토리 저장
- [ ] 모바일 앱 (React Native)

## 📞 지원

문제가 있으면 다음을 확인하세요:
1. Node.js 버전: v18 이상 권장
2. npm 버전: v8 이상
3. `.env` 파일 존재 및 API 키 유효성

---

**버전**: 4.0 Enhanced
**마지막 업데이트**: 2025-02-04
