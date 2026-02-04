# ⚡ 빠른 설치 가이드

## 1️⃣ 파일 교체

### 백업 (선택사항)
```bash
cp server.js server-backup.js
cp index.html index-backup.html
cp script.js script-backup.js
```

### 새 파일로 교체
다운로드한 파일들을 프로젝트 디렉토리에 복사하세요:
- `server.js` → 메인 서버 파일
- `index.html` → 프론트엔드 HTML
- `script.js` → (선택) 별도 스크립트 파일 사용 시

## 2️⃣ 서버 재시작

```bash
# 개발 모드
npm run dev

# 또는 프로덕션 모드
npm start
```

## 3️⃣ 테스트

1. 브라우저에서 `http://localhost:3000` 접속
2. 사주 명리학 선택
3. 정보 입력 후 분석 진행
4. **결과 화면 상단에 6개의 운세 버튼 확인** ✨
5. 각 버튼 클릭하여 운세 확인

## 4️⃣ Vercel 배포 (선택)

```bash
# Vercel CLI로 배포
vercel

# 환경 변수 설정 잊지 마세요!
# Dashboard → Settings → Environment Variables
# GEMINI_API_KEY 추가
```

## ✅ 확인사항

- [ ] 운세 버튼 6개가 결과 화면에 표시되는가?
- [ ] 각 버튼 클릭 시 해당 운세가 표시되는가?
- [ ] 궁합 계산 오류 시 명확한 메시지가 나오는가?
- [ ] 점성학 선택 시 "서비스 준비 중" 메시지가 나오는가?

## 🆘 문제 해결

### 운세 버튼이 안 보여요
→ 사주 분석을 먼저 완료해야 합니다. 분석 후 자동으로 버튼이 나타납니다.

### API 오류가 나요
→ `.env` 파일에 `GEMINI_API_KEY`가 올바르게 설정되어 있는지 확인하세요.

### 운세가 안 나와요
→ 브라우저 콘솔(F12)을 열어 에러 메시지를 확인하세요.

---

**설치 완료!** 🎉
