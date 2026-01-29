/* ============================================
   🖥️ AI Ultra Dosa Sentinel - Final Secure Server
   Mode: Secure ESM | Persona: 해요체
   Updated: Gemini 2.0 Flash & Fixed Chat Routes
   ============================================ */

   import 'dotenv/config';
   import express from 'express';
   import cors from 'cors';
   import helmet from 'helmet';
   import rateLimit from 'express-rate-limit';
   import path from 'path';
   import { fileURLToPath } from 'url';
   import { GoogleGenerativeAI } from '@google/generative-ai';
   import https from 'https';
   import http from 'http';
   import fs from 'fs';
   
   const __filename = fileURLToPath(import.meta.url);
   const __dirname = path.dirname(__filename);
   
   const app = express();
   const PORT = process.env.PORT || 3000;
   
   // 1. API 키 확인
   const apiKey = process.env.GEMINI_API_KEY;
   if (!apiKey) {
       console.error("🚨 [CRITICAL ERROR] .env 파일에서 'GEMINI_API_KEY'를 찾을 수 없습니다.");
       process.exit(1);
   }
   
   // ⚡ 모델 설정: 최신 2.0 Flash 사용 (끊김 방지)
   const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-2.0-flash";
   console.log(`✅ System Initialized with Model: ${MODEL_NAME}`);
   
   // 2. 보안 설정
   app.use(helmet({
       contentSecurityPolicy: false,
       crossOriginEmbedderPolicy: false,
   }));
   
   // CORS 설정 (로컬 테스트 호환성 강화)
   app.use(cors({
       origin: true, // 개발 편의를 위해 모든 오리진 허용 (배포 시 특정 주소로 변경 권장)
       credentials: true
   }));
   
   app.use(express.json({ limit: '10mb' })); // 긴 데이터 허용
   app.use(express.urlencoded({ extended: true, limit: '10mb' }));
   app.use(express.static(__dirname));
   
   // 3. 속도 제한
   const apiLimiter = rateLimit({
       windowMs: 15 * 60 * 1000,
       max: 300, // 넉넉하게 설정
       message: { success: false, error: '⚠️ 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' }
   });
   app.use('/api/', apiLimiter);
   
   // 4. 유틸리티 & AI 호출 함수
   function sanitizeInput(input) {
       if (typeof input !== 'string') return '';
       return input.trim().replace(/[<>]/g, '').substring(0, 2000);
   }
   
   async function callGeminiAPI(prompt) {
       try {
           const genAI = new GoogleGenerativeAI(apiKey);
           const model = genAI.getGenerativeModel({ model: MODEL_NAME });
           
           const result = await model.generateContent({
               contents: [{ role: "user", parts: [{ text: prompt }] }],
               generationConfig: {
                   temperature: 0.7,
                   maxOutputTokens: 4000, // ⚡ 답변 끊김 완벽 해결
               }
           });
           return await result.response.text();
       } catch (error) {
           console.error('❌ Gemini API Error:', error.message);
           throw new Error('AI 연결 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
       }
   }
   
   const SENTINEL_SYSTEM = `
   당신은 'AI Ultra Dosa Sentinel'입니다.
   1. 말투: 예의 바르고 신비로운 '해요체' (~해요, ~군요).
   2. 역할: 사용자의 운명을 분석하여 희망적인 조언을 제공합니다.
   3. 원칙: 문장은 반드시 완결된 형태로 끝맺으세요.
   `;
   
   // ============================================
   // 5. API 라우트
   // ============================================
   
   app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
   
   // 🔮 사주 분석
   app.post('/api/saju/consultation', async (req, res) => {
       try {
           const { rawData } = req.body;
           const prompt = `
           ${SENTINEL_SYSTEM}
           [내담자: ${rawData.userInfo.name}, ${rawData.userInfo.gender}, ${rawData.userInfo.birthDate}]
           이 사주 명식을 바탕으로 '타고난 기질'과 '2025~2026년 운세'를 1000자 내외로 분석해주세요.
           `;
           const consultation = await callGeminiAPI(prompt);
           res.json({ success: true, consultation });
       } catch (error) {
           res.status(500).json({ success: false, error: error.message });
       }
   });
   
   // ⭐ 점성술 분석
   app.post('/api/astrology/consultation', async (req, res) => {
       try {
           const { rawData } = req.body;
           const prompt = `
           ${SENTINEL_SYSTEM}
           [내담자: ${rawData.userInfo.name}, ${rawData.userInfo.gender}, ${rawData.userInfo.birthDate}]
           점성술 차트를 통해 '내면 심리'와 '미래 흐름'을 1000자 내외로 분석해주세요.
           `;
           const consultation = await callGeminiAPI(prompt);
           res.json({ success: true, consultation });
       } catch (error) {
           res.status(500).json({ success: false, error: error.message });
       }
   });
   
   // ✅ 채팅 수정: Frontend가 요청하는 주소로 분리하여 복구
   app.post('/api/saju/chat', async (req, res) => {
       try {
           const { userMessage, rawData } = req.body;
           const context = rawData ? `(내담자 정보: ${rawData.userInfo.name}님 사주 분석 중)` : '';
           const prompt = `${SENTINEL_SYSTEM}\n${context}\n질문: "${sanitizeInput(userMessage)}"\n이에 대해 친절하게 답변해주세요.`;
           const answer = await callGeminiAPI(prompt);
           res.json({ success: true, answer });
       } catch (error) {
           res.status(500).json({ success: false, error: '응답 실패' });
       }
   });
   
   app.post('/api/astrology/chat', async (req, res) => {
       try {
           const { userMessage, rawData } = req.body;
           const context = rawData ? `(내담자 정보: ${rawData.userInfo.name}님 점성술 분석 중)` : '';
           const prompt = `${SENTINEL_SYSTEM}\n${context}\n질문: "${sanitizeInput(userMessage)}"\n별들의 관점에서 답변해주세요.`;
           const answer = await callGeminiAPI(prompt);
           res.json({ success: true, answer });
       } catch (error) {
           res.status(500).json({ success: false, error: '응답 실패' });
       }
   });
   
   // 6. 서버 실행 (SSL 자동 감지)
   const sslKeyPath = path.join(__dirname, 'ssl', 'localhost-key.pem');
   const sslCertPath = path.join(__dirname, 'ssl', 'localhost-cert.pem');
   if (fs.existsSync(sslKeyPath) && fs.existsSync(sslCertPath)) {
       https.createServer({ key: fs.readFileSync(sslKeyPath), cert: fs.readFileSync(sslCertPath) }, app).listen(PORT, () => {
           console.log(`🔒 SENTINEL ONLINE (HTTPS): https://localhost:${PORT}`);
       });
   } else {
       http.createServer(app).listen(PORT, () => {
           console.log(`📡 SENTINEL ONLINE (HTTP): http://localhost:${PORT}`);
       });
   }