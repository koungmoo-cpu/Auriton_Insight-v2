# 🔮 Auriton InsightAI v5.0

> AI와 고대 지혜가 만나는 프리미엄 운세 플랫폼

[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)
[![Gemini](https://img.shields.io/badge/Google-Gemini%202.0-orange)](https://ai.google.dev/)

## ✨ 특징

### 🎨 프리미엄 UI
- **네트워크 애니메이션**: Canvas 기반 실시간 입자 효과
- **Glassmorphism**: 반투명 유리 효과의 현대적 디자인
- **그라데이션 & 글로우**: 보라/시안 색상의 조화로운 조명 효과
- **반응형 레이아웃**: 모바일/태블릿/데스크톱 완벽 지원

### 🔮 사주 명리학 (검증됨)
- 음양오행 분석 (목화토금수)
- 천간지지 사주팔자 계산
- 일간 기반 성격 분석
- 오행 균형 & 개운법

### ⭐ 서양 점성학 (검증됨)
- Big 3 (태양/달/상승궁) 계산
- 12하우스 시스템
- Julian Date 기반 정확한 황경 계산

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
├── index.html       # 메인 UI (이미지 2 디자인)
├── style.css        # 프리미엄 스타일
├── script.js        # 프론트엔드 로직 + Canvas 애니메이션
├── server.js        # 백엔드 (검증된 사주/점성학 계산)
├── package.json     # 의존성
├── vercel.json      # Vercel 배포 설정
└── .env.example     # 환경 변수 템플릿
```

## 🎯 주요 기능

### 선택 화면
- 2개 카드: 사주 명리학 / 서양 점성학
- 호버 효과: 글로우 + 애니메이션
- 사이드바 네비게이션

### 사주 입력 폼
- 성함, 성별, 생년월일, 출생시간
- 음력/양력 선택
- Select 드롭다운 (년/월/일)
- 개인정보 동의 체크박스

### 점성학 입력 폼
- 성함, 성별, 생년월일, 출생시간
- 출생 장소 (선택)
- Time picker

### 결과 화면
- AI 메시지: 좌측 정렬 + 골드 보더
- 사용자 메시지: 우측 정렬 + 시안 배경
- 실시간 채팅
- 새로운 분석 버튼

## 🎨 디자인 가이드

### 색상
```css
--bg-deep: #0a0e1a          /* 딥 다크 배경 */
--primary-purple: #b026ff   /* 보라색 (사주) */
--primary-cyan: #00d4ff     /* 시안색 (점성학) */
--accent-gold: #ffa726      /* 골드 (포인트) */
```

### 폰트
- **Cinzel**: 고급스러운 제목 (serif)
- **Orbitron**: 테크 느낌의 부제목
- **Noto Sans KR**: 본문 (가독성)

### 애니메이션
- **파티클 네트워크**: 80개 입자 + 연결선
- **글로우 효과**: hover 시 box-shadow
- **페이드인**: 화면 전환 시 0.5s

## 🔧 기술 스택

### Frontend
- Vanilla JavaScript (No Framework)
- CSS3 (Glassmorphism, Gradients)
- Canvas API (Network Animation)
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

## 📊 차이점 (vs 이전 버전)

| 항목 | v4.0 | v5.0 (현재) |
|------|------|-------------|
| 디자인 | 기본 | 프리미엄 (이미지 2 기반) |
| 배경 | 단순 그라데이션 | Canvas 네트워크 애니메이션 |
| 네비게이션 | 상단 버튼 | 사이드바 아이콘 |
| 폼 스타일 | 기본 input | Glassmorphism |
| 날짜 입력 | `<input type="date">` | Select 드롭다운 |
| 슬라이더 | ❌ 없음 | ❌ 없음 (사주/점성학 분리) |

## 🐛 트러블슈팅

### 네트워크 애니메이션 안 보임
→ Canvas 지원 브라우저인지 확인 (IE 제외)

### 폼 제출 안 됨
→ 개인정보 동의 체크박스 확인

### API 오류
→ .env 파일에 GEMINI_API_KEY 있는지 확인

## 📞 문의

- GitHub Issues
- Email: support@auriton.ai (가상)

---

**Made with 🔮 by Auriton Team**

**버전**: v5.0 Premium Edition  
**업데이트**: 2025-02-04
