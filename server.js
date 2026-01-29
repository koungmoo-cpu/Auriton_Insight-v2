/* ============================================
   🖥️ AI Ultra Dosa Sentinel - Public Test Server
   Mode: CORS Open (For Feedback & Testing)
   Model: Gemini 2.0 Flash
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

const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-2.0-flash";
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: MODEL_NAME });

console.log(`✅ System Online: Public Testing Mode [${MODEL_NAME}]`);

// ============================================
// 🔓 [수정됨] 접근 권한 (CORS) 개방
// ============================================

app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
}));

// 모든 곳에서의 접속 허용 (테스트 및 피드백용)
app.use(cors({
    origin: true, 
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(__dirname));

// 도배 방지 (여유 있게 설정)
const apiLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 8, 
    message: { success: false, error: '잠시 후 다시 시도해주세요.' }
});
app.use('/api/', apiLimiter);

// ============================================
// 🛡️ 입력값 세탁 및 AI 호출
// ============================================
function validateAndSanitize(input) {
    if (typeof input !== 'string') return '';
    
    // 기본 태그 제거 (XSS 방지)
    let clean = input.trim().replace(/[<>]/g, '').substring(0, 3000);

    // 악성 명령 필터링
    const badKeywords = ['ignore previous instructions', 'system prompt', 'jailbreak'];
    const lowerInput = clean.toLowerCase();
    for (const word of badKeywords) {
        if (lowerInput.includes(word)) {
            throw new Error("허용되지 않는 명령어가 포함되어 있습니다.");
        }
    }
    return clean;
}

async function callGeminiAPI(prompt) {
    try {
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 4000, // 긴 답변 보장
            }
        });
        return await result.response.text();
    } catch (error) {
        console.error('❌ AI Error:', error.message);
        throw new Error('AI 연결 상태가 불안정합니다. 잠시 후 다시 시도해주세요.');
    }
}

// 시스템 페르소나
const SENTINEL_SYSTEM = `
당신은 'AI Ultra Dosa Sentinel'입니다.
1. 역할: 사용자의 운명(사주, 점성술)을 분석하고 따뜻하게 상담해줍니다.
2. 말투: 예의 바르고 신비로운 '해요체'를 사용하세요.
3. 원칙: 답변이 끊기지 않도록 문장을 완벽하게 마무리하세요.
`;

// ============================================
// API 라우트
// ============================================

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// [사주 분석]
app.post('/api/saju/consultation', async (req, res) => {
    try {
        const { rawData } = req.body;
        const safeName = validateAndSanitize(rawData.userInfo.name);
        
        const prompt = `
        ${SENTINEL_SYSTEM}
        [내담자: ${safeName}, ${rawData.userInfo.gender}, ${rawData.userInfo.birthDate}]
        이 사주 명식을 바탕으로 '타고난 기질'과 '2026년 운세'를 1000자 내외로 분석해주세요.
        `;
        const consultation = await callGeminiAPI(prompt);
        res.json({ success: true, consultation });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// [점성술 분석]
app.post('/api/astrology/consultation', async (req, res) => {
    try {
        const { rawData } = req.body;
        const safeName = validateAndSanitize(rawData.userInfo.name);

        const prompt = `
        ${SENTINEL_SYSTEM}
        [내담자: ${safeName}, ${rawData.userInfo.gender}, ${rawData.userInfo.birthDate}]
        점성술 차트를 통해 '내면 심리'와 '미래 흐름'을 1000자 내외로 분석해주세요.
        `;
        const consultation = await callGeminiAPI(prompt);
        res.json({ success: true, consultation });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// [사주 채팅]
app.post('/api/saju/chat', async (req, res) => {
    try {
        const { userMessage, rawData } = req.body;
        const safeMessage = validateAndSanitize(userMessage);
        
        const context = rawData ? `(내담자 정보: ${rawData.userInfo.name}님 사주 분석 중)` : '';
        const prompt = `${SENTINEL_SYSTEM}\n${context}\n질문: "${safeMessage}"\n이에 대해 친절하게 답변해주세요.`;
        
        const answer = await callGeminiAPI(prompt);
        res.json({ success: true, answer });
    } catch (error) {
        res.status(500).json({ success: false, error: '응답 실패' });
    }
});

// [점성술 채팅]
app.post('/api/astrology/chat', async (req, res) => {
    try {
        const { userMessage, rawData } = req.body;
        const safeMessage = validateAndSanitize(userMessage);

        const context = rawData ? `(내담자 정보: ${rawData.userInfo.name}님 점성술 분석 중)` : '';
        const prompt = `${SENTINEL_SYSTEM}\n${context}\n질문: "${safeMessage}"\n별들의 관점에서 답변해주세요.`;
        
        const answer = await callGeminiAPI(prompt);
        res.json({ success: true, answer });
    } catch (error) {
        res.status(500).json({ success: false, error: '응답 실패' });
    }
});

// 서버 실행
const sslKeyPath = path.join(__dirname, 'ssl', 'localhost-key.pem');
const sslCertPath = path.join(__dirname, 'ssl', 'localhost-cert.pem');
if (fs.existsSync(sslKeyPath) && fs.existsSync(sslCertPath)) {
    https.createServer({ key: fs.readFileSync(sslKeyPath), cert: fs.readFileSync(sslCertPath) }, app).listen(PORT, () => {
        console.log(`🔒 HTTPS Server Running: https://localhost:${PORT}`);
    });
} else {
    http.createServer(app).listen(PORT, () => {
        console.log(`📡 HTTP Server Running: http://localhost:${PORT}`);
    });
}
// 파일 맨 아래에 추가
module.exports = app;