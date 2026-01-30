/* ============================================
   🖥️ Auriton InsightAI v3.0 - Server (Insight Edition)
   Updated: "No-Lecture" Policy & Saju Logic Fixed
   ============================================ */

import 'dotenv/config';
import { Solar, Lunar } from 'lunar-javascript';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// 보안 설정
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: false,
}));

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(__dirname));

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 8,
    message: { success: false, error: '⚠️ 잠시 후 다시 시도해주세요.' }
});
app.use('/api/', apiLimiter);

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// ⚡ Gemini 2.0 모델 설정
const apiKey = process.env.GEMINI_API_KEY;
let model = null;

if (apiKey && apiKey !== 'PLACEHOLDER_API_KEY') {
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    } catch (e) { console.error("Model Init Failed", e); }
}

async function callGeminiAPI(prompt) {
    if (!model) throw new Error('API Key 설정이 필요합니다.');
    const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.85, maxOutputTokens: 2500 }
    });
    return await result.response.text();
}

// 🛑 "설명충 금지" 프롬프트 설계
const BASE_INSTRUCTION = `
당신은 고대의 지혜와 미래의 AI가 결합된 'Auriton InsightAI'의 마스터입니다.
모든 답변은 한국어 경어체(해요체)로 작성하세요.
절대로 뻔한 이론적인 설명(예: "태양은 자아를 상징하며...")을 하지 마세요.
사용자는 점성학 강의를 듣고 싶은 게 아니라, "나에 대한 해석"을 원합니다.
직설적이고, 통찰력 있게, 사용자의 내면을 꿰뚫어 보는 듯한 톤으로 말하세요.
`;

// 🛠️ [추가] 한글 변환 매핑 및 공통 사주 계산 함수
const HAN_TO_HANGUL = {
    '甲': '갑', '乙': '을', '丙': '병', '丁': '정', '戊': '무', '己': '기', '庚': '경', '辛': '신', '壬': '임', '癸': '계',
    '子': '자', '丑': '축', '寅': '인', '卯': '묘', '辰': '진', '巳': '사', '午': '오', '未': '미', '申': '신', '酉': '유', '戌': '술', '亥': '해'
};

const toHangul = (str) => str.split('').map(char => HAN_TO_HANGUL[char] || char).join('');

// 날짜 형식에 상관없이 안전하게 사주를 계산하는 공통 함수
function calculateSajuText(userInfo) {
    try {
        const fullDateStr = `${userInfo.birthDate} ${userInfo.birthTime || ""}`;
        const p = fullDateStr.match(/\d+/g); // 숫자만 추출 (에러 방지 핵심)
        
        if (!p || p.length < 3) return null;

        const year = parseInt(p[0]), month = parseInt(p[1]), day = parseInt(p[2]);
        const hour = p[3] ? parseInt(p[3]) : 0;
        const minute = p[4] ? parseInt(p[4]) : 0;

        let eightChar;
        if (userInfo.calendarType === '음력') {
            eightChar = Lunar.fromYmdHms(year, month, day, hour, minute, 0).getEightChar();
        } else {
            eightChar = Solar.fromYmdHms(year, month, day, hour, minute, 0).getLunar().getEightChar();
        }

        return `${toHangul(eightChar.getYearGan())}${toHangul(eightChar.getYearZhi())}년 ` +
               `${toHangul(eightChar.getMonthGan())}${toHangul(eightChar.getMonthZhi())}월 ` +
               `${toHangul(eightChar.getDayGan())}${toHangul(eightChar.getDayZhi())}일 ` +
               `${toHangul(eightChar.getHourGan())}${toHangul(eightChar.getHourZhi())}시`;
    } catch (e) {
        console.error("Saju Calculation Error:", e);
        return null;
    }
}

// 🔮 사주 프롬프트
function getSajuPrompt(rawData) {
    const { userInfo } = rawData;
    const sajuText = calculateSajuText(userInfo);
    
    if (!sajuText) return `${BASE_INSTRUCTION}\n\n[오류] 입력된 날짜 정보를 확인해주세요.`;

    return `
${BASE_INSTRUCTION}
[분석 데이터]
- 이름: ${userInfo.name} (${userInfo.gender})
- 확정 사주 명식: ${sajuText}

[임무: 사주 명식 기반 운명 독해]
**🚨 중요: 반드시 답변의 맨 첫 줄에 "사주 명식: ${sajuText}"를 출력한 후 해설을 시작하세요.**

1. **핵심 본성 (일간 분석)**: 이 사람이 어떤 기질을 타고났는지 비유를 들어 설명하세요.
2. **에너지의 균형**: 강한 기운과 부족한 기운이 성격과 행동에 미치는 영향을 분석하세요.
3. **현대적 개운법 (실질적 조언)**: 구체적인 색상, 시간대, 행동 지침을 제안하세요.

* 분량: 1000자 내외.
`;
}

// ⭐ 점성학 프롬프트
function getAstrologyPrompt(rawData) {
    const { userInfo } = rawData;
    return `
${BASE_INSTRUCTION}
[분석 대상]
- 이름: ${userInfo.name}
- 생년월일: ${userInfo.birthDate}

[임무: 별의 배치로 본 영혼의 지도]
태양, 달, 상승궁을 중심으로 통합적인 해석을 내리세요. 용어 설명은 금지합니다.
`;
}

// API 라우트
app.post('/api/saju/consultation', async (req, res) => {
    try {
        const { rawData } = req.body;
        const prompt = getSajuPrompt(rawData);
        const consultation = await callGeminiAPI(prompt);
        res.json({ success: true, consultation });
    } catch (error) {
        res.status(500).json({ success: false, error: '분석 중 오류 발생' });
    }
});

app.post('/api/astrology/consultation', async (req, res) => {
    try {
        const { rawData } = req.body;
        const prompt = getAstrologyPrompt(rawData);
        const consultation = await callGeminiAPI(prompt);
        res.json({ success: true, consultation });
    } catch (error) {
        res.status(500).json({ success: false, error: '분석 중 오류 발생' });
    }
});

// 💬 [수정됨] 사주 채팅 기능 (일관성 및 에러 방지 강화)
app.post('/api/saju/chat', async (req, res) => {
    try {
        const { userMessage, rawData } = req.body;
        // 채팅 시에도 동일한 공통 함수를 사용하여 사주를 계산
        const sajuText = calculateSajuText(rawData.userInfo);

        const prompt = `
${BASE_INSTRUCTION}
[상황: 사주 상세 상담 채팅]
- 사용자: ${rawData.userInfo.name}
- **확정 사주 명식: ${sajuText || "정보 없음"}**
- 질문: "${userMessage}"

🚨 **작성 지침:**
1. 위 '확정 사주 명식'(${sajuText})을 근거로 일관성 있게 답변하세요.
2. 질문에 대해 명쾌한 결론을 먼저 말하고 사주적 관점에서 이유를 설명하세요.
3. 실생활에 적용할 수 있는 팁을 포함하세요.
4. 약 800자 내외로 깊이 있게 작성하세요.
`;
        const answer = await callGeminiAPI(prompt);
        res.json({ success: true, answer });
    } catch (e) {
        console.error("Chat Error:", e);
        res.status(500).json({ success: false, error: 'Chat Error' });
    }
});

app.post('/api/astrology/chat', async (req, res) => {
    try {
        const { userMessage, rawData } = req.body;
        const prompt = `
${BASE_INSTRUCTION}
[상황: 점성학 상담 채팅]
사용자: ${rawData.userInfo.name}
질문: "${userMessage}"
`;
        const answer = await callGeminiAPI(prompt);
        res.json({ success: true, answer });
    } catch (e) { res.status(500).json({ success: false, error: 'Chat Error' }); }
});

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log(`🚀 Server running: http://localhost:${PORT}`));
}

export default app;