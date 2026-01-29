/* ============================================
   🖥️ AI Ultra Dosa Sentinel - Vercel Optimized
   Model: Gemini 2.0 Flash (Saju & Astrology Separated)
   ============================================ */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';

// 1. ESM 환경변수 및 경로 설정 (Vercel 호환성 필수)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// 2. Gemini API 설정
const apiKey = process.env.GEMINI_API_KEY;
let model = null;

if (!apiKey) {
    console.error("🚨 [SYSTEM] API Key가 설정되지 않았습니다.");
} else {
    const genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
}

// 3. 미들웨어 설정
app.use(helmet({
    contentSecurityPolicy: false, // 인라인 스크립트 허용 (필수)
    crossOriginEmbedderPolicy: false,
}));

app.use(cors({
    origin: true, 
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// [중요] 정적 파일 서빙 설정 수정
// Vercel에서는 루트 경로의 파일들을 명시적으로 서빙해야 합니다.
app.use(express.static(__dirname)); 
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/images', express.static(path.join(__dirname, 'images')));

// 도배 방지 (기존 유지)
const apiLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 20, 
    message: { success: false, error: '잠시 후 다시 시도해주세요.' }
});
app.use('/api/', apiLimiter);

// 4. 유틸리티 함수 (기존 유지)
function validateAndSanitize(input) {
    if (typeof input !== 'string') return '';
    return input.trim().replace(/[<>]/g, '').substring(0, 3000);
}

async function callGeminiAPI(prompt) {
    if (!model) throw new Error('서버 API 키 설정 오류입니다.');
    try {
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.75,
                maxOutputTokens: 4000,
            }
        });
        return await result.response.text();
    } catch (error) {
        console.error('❌ AI Error:', error.message);
        throw new Error('AI 분석 중 오류가 발생했습니다.');
    }
}

// ============================================
// 🎭 페르소나 정의 (기존 내용 복원 완료)
// ============================================

const BASE_PERSONA = `
당신은 'AI Ultra Dosa Sentinel'입니다.
말투: 신비롭고 예의 바른 '해요체'를 사용하세요.
원칙: 답변이 끊기지 않도록 문장을 완벽하게 마무리하세요.
`;

const SAJU_SYSTEM = `
${BASE_PERSONA}
역할: 정통 명리학(Saju) 전문가입니다.
지침: 음양오행, 십신, 신살 등 명리학 용어를 적절히 섞어 깊이 있게 분석하세요.
`;

const ASTRO_SYSTEM = `
${BASE_PERSONA}
역할: 서양 점성술(Astrology) 전문가입니다.
지침: 행성, 하우스, 별자리(Sign), 아스펙트 등 점성학 용어를 사용하여 우주적 관점에서 분석하세요.
`;

// ============================================
// 📡 API 라우트
// ============================================

// 메인 페이지 라우트 (명시적 지정)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// [사주 분석]
app.post('/api/saju/consultation', async (req, res) => {
    try {
        const { rawData } = req.body;
        // rawData가 없는 경우 방어 코드 추가
        if (!rawData || !rawData.userInfo) {
            throw new Error('사용자 정보가 누락되었습니다.');
        }
        
        const safeName = validateAndSanitize(rawData.userInfo.name);
        
        const prompt = `
        ${SAJU_SYSTEM}
        [내담자: ${safeName}, ${rawData.userInfo.gender}, ${rawData.userInfo.birthDate}]
        위 정보를 바탕으로 이 사람의 '타고난 기질'과 '2026년 신년 운세'를 상세히 분석해주세요.
        `;
        const consultation = await callGeminiAPI(prompt);
        res.json({ success: true, consultation });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// [점성술 분석]
app.post('/api/astrology/consultation', async (req, res) => {
    try {
        const { rawData } = req.body;
        if (!rawData || !rawData.userInfo) {
            throw new Error('사용자 정보가 누락되었습니다.');
        }

        const safeName = validateAndSanitize(rawData.userInfo.name);

        const prompt = `
        ${ASTRO_SYSTEM}
        [내담자: ${safeName}, ${rawData.userInfo.gender}, ${rawData.userInfo.birthDate}]
        위 정보를 바탕으로 이 사람의 '내면 심리'와 '별들의 흐름(운세)'을 상세히 분석해주세요.
        `;
        const consultation = await callGeminiAPI(prompt);
        res.json({ success: true, consultation });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// [사주 채팅]
app.post('/api/saju/chat', async (req, res) => {
    try {
        const { userMessage, rawData } = req.body;
        const safeMessage = validateAndSanitize(userMessage);
        
        const context = rawData && rawData.userInfo ? `(내담자: ${rawData.userInfo.name}님 사주 분석 중)` : '';
        const prompt = `${SAJU_SYSTEM}\n${context}\n질문: "${safeMessage}"\n명리학적 관점에서 답변해주세요.`;
        
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

        const context = rawData && rawData.userInfo ? `(내담자: ${rawData.userInfo.name}님 점성술 분석 중)` : '';
        const prompt = `${ASTRO_SYSTEM}\n${context}\n질문: "${safeMessage}"\n점성학적 관점에서 별들의 뜻을 전해주세요.`;
        
        const answer = await callGeminiAPI(prompt);
        res.json({ success: true, answer });
    } catch (error) {
        res.status(500).json({ success: false, error: '응답 실패' });
    }
});

// ============================================
// 🚀 서버 실행
// ============================================

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`🚀 Local Server running: http://localhost:${PORT}`);
    });
}

// Vercel용 Export
export default app;