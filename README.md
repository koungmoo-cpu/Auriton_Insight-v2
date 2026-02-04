# 🔮 Auriton InsightAI

> AI 기반 사주명리 & 서양 점성학 운세 플랫폼

[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)
[![Gemini](https://img.shields.io/badge/Google-Gemini%202.0-orange)](https://ai.google.dev/)

## ✨ 특징

### 🔮 사주 명리학
- 음양오행 기반 운명 분석
- 천간지지 사주팔자 계산
- 음력/양력 자동 변환
- AI 기반 해석

### ⭐ 서양 점성학
- Big 3 해석 (태양/달/상승궁)
- 12하우스 분석
- 행성 배치 해석

## 🚀 빠른 시작

### 1. 설치
```bash
npm install
```

### 2. 환경 변수
```bash
cp .env.example .env
# .env 파일 열고 GEMINI_API_KEY 입력
```

### 3. 실행
```bash
npm start
```

### 4. 접속
```
http://localhost:3000
```

## 📁 파일 구조

```
project/
├── index.html       # 메인 UI (스타일 내장)
├── style.css        # 추가 스타일 (선택)
├── server.js        # 백엔드 서버
├── package.json     # 의존성
├── vercel.json      # Vercel 배포 설정
└── .env.example     # 환경 변수 템플릿
```

## 🔧 기술 스택

### Frontend
- HTML5 (스타일 내장)
- Tailwind CSS
- Vanilla JavaScript
- Google Fonts

### Backend
- Node.js 18+
- Express.js
- Gemini 2.0 Flash
- lunar-javascript

## 🌐 배포

### Vercel
```bash
vercel
```

환경 변수 설정:
1. Vercel Dashboard → Settings
2. Environment Variables
3. GEMINI_API_KEY 추가

## 🐛 트러블슈팅

### API 오류
→ .env 파일에 GEMINI_API_KEY 확인

### 스타일 안 보임
→ index.html에 스타일이 내장되어 있으므로 style.css는 선택사항

### 폼 제출 안 됨
→ 개인정보 동의 체크박스 확인

---

**Made with 🔮 by Auriton Team**

**업데이트**: 2025-02-04

