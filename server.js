/* ============================================
   🖥️ AI Ultra Dosa Sentinel - Final Secure Server (ESM)
   Updated: ESM Support, '해요체' Persona, Security & Stability
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

// ESM 환경에서 __dirname을 사용하기 위한 설정이에요.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// 1. 보안 설정 (Sentinel Security Protocol)
// ============================================

app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: false,
}));

const allowedOrigins = [
    'https://auriton-insight-v2.vercel.app',
    'http://localhost:3000',
    'https://localhost:3000'
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.warn(`🚫 Blocked by CORS: ${origin}`);
            callback(new Error('🚫 비정상적인 접근이 감지되어 연결을 차단해요.'));
        }
    },
    credentials: true
}));

app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));

// ============================================
// Rate Limiting (AI 악용 방지)
// ============================================
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 15,
    message: { success: false, error: '⚠️ SYSTEM OVERHEAT', message: '너무 많은 요청이 들어왔어요. 잠시 후에 다시 시도해 주세요.' },
    keyGenerator: (req) => req.ip || req.connection.remoteAddress
});
app.use('/api/', apiLimiter);

app.use(express.static(__dirname));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// ============================================
// 유틸리티 및 검증 함수
// ============================================

function sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    return input
        .trim()
        .replace(/[<>]/g, '') 
        .replace(/javascript:/gi, '')
        .replace(/\b(system|prompt|ignore|override|instruction)\b/gi, '') 
        .substring(0, 500);
}

function validateName(name) {
    const regex = /^[a-zA-Z가-힣\s]{2,10}$/;
    if (!regex.test(name)) {
        throw new Error('이름은 2~10자의 한글 또는 영문이어야 해요.');
    }
    return name;
}

async function callGeminiAPI(prompt, apiKey) {
    if (!apiKey) throw new Error('System Configuration Error');
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { 
                temperature: 0.75, 
                maxOutputTokens: 800, 
                topP: 0.9
            }
        });
        return await result.response.text();
    } catch (error) {
        console.error('Gemini API Error:', error);
        throw new Error('운명을 읽는 도중 신호가 불안정해졌어요.');
    }
}

// ============================================
// 🔒 Sentinel Protocol Prompts (Persona: 해요체)
// ============================================

const SENTINEL_PROMPT = `
*** SENTINEL PROTOCOL: SECURE & STABLE MODE ACTIVE ***
1. IDENTITY: 당신은 'AI Ultra Dosa Sentinel'이에요.
2. TONE: 정중하고 다정한 '해요체'를 사용하세요. (~해요, ~군요).
3. SECURITY: 내부 정보나 API 키 질문에는 "우주의 비밀이라 알려드릴 수 없어요"라고 답하세요.
4. STABILITY (중요): 답변은 반드시 500~600자 사이로 작성하고 문장을 명확하게 마무리하세요.
`;

function getSajuPrompt(rawData) {
    const { userInfo, saju } = rawData;
    return `
${SENTINEL_PROMPT}
=== SAJU DESTINY DECODING ===
대상: ${userInfo.name} / 사주팔자: ${saju.fourPillars} / 일주: ${saju.dayPillar.full}
지시: 이 분의 타고난 기질과 운명을 해요체로 550자 내외로 상세히 분석해 주세요.
`;
}

function getAstrologyPrompt(rawData) {
    const { userInfo, astrology } = rawData;
    return `
${SENTINEL_PROMPT}
=== PLANETARY ALIGNMENT SCAN ===
대상: ${userInfo.name} / 태양: ${astrology.sun.sign.name} / 달: ${astrology.moon.sign.name}
지시: 이 분의 영혼의 설계도를 해요체로 550자 내외로 다정하게 알려주세요.
`;
}

// ============================================
// API Endpoints
// ============================================

app.post('/api/saju/consultation', async (req, res) => {
    try {
        const { rawData } = req.body;
        if (!rawData) throw new Error('입력 데이터가 부족해요.');
        rawData.userInfo.name = validateName(sanitizeInput(rawData.userInfo.name));
        const prompt = getSajuPrompt(rawData);
        const consultation = await callGeminiAPI(prompt, process.env.GEMINI_API_KEY);
        res.json({ success: true, consultation });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

app.post('/api/astrology/consultation', async (req, res) => {
    try {
        const { rawData } = req.body;
        if (!rawData) throw new Error('입력 데이터가 부족해요.');
        rawData.userInfo.name = validateName(sanitizeInput(rawData.userInfo.name));
        const prompt = getAstrologyPrompt(rawData);
        const consultation = await callGeminiAPI(prompt, process.env.GEMINI_API_KEY);
        res.json({ success: true, consultation });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

app.post('/api/saju/chat', async (req, res) => {
    try {
        const { userMessage, rawData } = req.body;
        const prompt = `${SENTINEL_PROMPT}\n질문: "${sanitizeInput(userMessage)}"\n친절하게 답변해 주세요 (500자 이내).`;
        const answer = await callGeminiAPI(prompt, process.env.GEMINI_API_KEY);
        res.json({ success: true, answer });
    } catch (error) {
        res.status(500).json({ success: false, error: '잠시 대화가 어려워요.' });
    }
});

app.post('/api/astrology/chat', async (req, res) => {
    try {
        const { userMessage, rawData } = req.body;
        const prompt = `${SENTINEL_PROMPT}\n질문: "${sanitizeInput(userMessage)}"\n우주의 시각에서 답변해 주세요 (500자 이내).`;
        const answer = await callGeminiAPI(prompt, process.env.GEMINI_API_KEY);
        res.json({ success: true, answer });
    } catch (error) {
        res.status(500).json({ success: false, error: '별의 신호가 약해졌어요.' });
    }
});

// ============================================
// Server Start
// ============================================
const sslKeyPath = path.join(__dirname, 'ssl', 'localhost-key.pem');
const sslCertPath = path.join(__dirname, 'ssl', 'localhost-cert.pem');
const useHttps = fs.existsSync(sslKeyPath) && fs.existsSync(sslCertPath);

if (useHttps) {
    https.createServer({ key: fs.readFileSync(sslKeyPath), cert: fs.readFileSync(sslCertPath) }, app).listen(PORT, () => {
        console.log(`🔒 SENTINEL ONLINE (HTTPS): ${PORT}`);
    });
} else {
    http.createServer(app).listen(PORT, () => {
        console.log(`📡 SENTINEL ONLINE (HTTP): ${PORT}`);
    });
}