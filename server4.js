/* ============================================
   🖥️ Auriton InsightAI v3.0 - Server (Insight Edition)
   Updated: Saju Logic Integration & Korean Mapping
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

// [1] 보안 및 미들웨어 설정
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
    max: 20, // 테스트를 위해 넉넉히 설정
    message: { success: false, error: '⚠️ 잠시 후 다시 시도해주세요.' }
});
app.use('/api/', apiLimiter);

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// [2] Gemini API 설정 (2.0 Flash)
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
        generationConfig: { temperature: 0.8, maxOutputTokens: 2500 }
    });
    return await result.response.text();
}

// [3] 공통 설정 및 한글 매핑 로직
const BASE_INSTRUCTION = `
당신은 고대의 지혜와 미래의 AI가 결합된 'Auriton InsightAI'의 마스터입니다.
모든 답변은 한국어 경어체(해요체)로 작성하세요.
절대로 뻔한 이론적인 설명(예: "태양은 자아를 상징하며...")을 하지 마세요.
사용자는 점성학 강의를 듣고 싶은 게 아니라, "나에 대한 해석"을 원합니다.
직설적이고, 통찰력 있게, 사용자의 내면을 꿰뚫어 보는 듯한 톤으로 말하세요.
`;

const HAN_TO_HANGUL = {
    '甲': '갑', '乙': '을', '丙': '병', '丁': '정', '戊': '무', '己': '기', '庚': '경', '辛': '신', '壬': '임', '癸': '계',
    '子': '자', '丑': '축', '寅': '인', '묘': '묘', '辰': '진', '巳': '사', '午': '오', '未': '미', '申': '신', '酉': '유', '戌': '술', '亥': '해'
};

const SAJU_TIME_MAP = {
    '자시': 0, '축시': 2, '인시': 4, '묘시': 6, '진시': 8, '사시': 10,
    '오시': 12, '미시': 14, '신시': 16, '유시': 18, '술시': 20, '해시': 22
};

const toHangul = (str) => str.split('').map(char => HAN_TO_HANGUL[char] || char).join('');

// [4] 통합 사주 계산 함수 (오류 방지 및 정확도 확보)
function calculateSajuText(userInfo) {
    if (!userInfo || !userInfo.birthDate) return null;
    try {
        // 날짜와 시간을 합쳐서 숫자만 추출
        const fullDateStr = `${userInfo.birthDate} ${userInfo.birthTime || ""}`;
        const p = fullDateStr.match(/\d+/g);
        
        if (!p || p.length < 3) return null;

        const year = parseInt(p[0]), month = parseInt(p[1]), day = parseInt(p[2]);
        
        // 시간 파싱: 텍스트(자시) 우선 확인 후 숫자(14:30) 추출
        let hour = 0;
        if (userInfo.birthTime && SAJU_TIME_MAP[userInfo.birthTime] !== undefined) {
            hour = SAJU_TIME_MAP[userInfo.birthTime];
        } else {
            const timeMatch = (userInfo.birthTime || "").match(/\d+/g);
            hour = timeMatch ? parseInt(timeMatch[0]) : 0;
        }

        let eightChar;
        // 음력/양력 유연하게 처리
        if (userInfo.calendarType === '음력' || userInfo.calendarType === 'lunar') {
            eightChar = Lunar.fromYmdHms(year, month, day, hour, 0, 0).getEightChar();
        } else {
            eightChar = Solar.fromYmdHms(year, month, day, hour, 0, 0).getLunar().getEightChar();
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

// [5] 프롬프트 생성 함수
function getSajuPrompt(rawData) {
    const { userInfo } = rawData;
    const sajuText = calculateSajuText(userInfo);
    if (!sajuText) return `${BASE_INSTRUCTION}\n\n[오류] 입력하신 날짜 정보가 올바르지 않습니다. (예: 1990-01-01 형식)`;

    return `
${BASE_INSTRUCTION}
[분석 데이터]
- 이름: ${userInfo.name} (${userInfo.gender})
- 확정 사주 명식: ${sajuText}

[임무: 사주 명식 기반 운명 독해]
**🚨 중요: 반드시 답변의 맨 첫 줄에 "사주 명식: ${sajuText}"를 출력한 후 해설을 시작하세요.**

1. **핵심 본성 (일간 분석)**: 이 사람이 어떤 기질을 타고났는지 비유를 들어 설명하세요.
2. **에너지의 균형**: 강한 기운과 부족한 기운이 삶에 미치는 영향을 분석하세요.
3. **현대적 개운법**: 구체적인 색상, 행동 지침을 제안하세요.
`;
}

function getAstrologyPrompt(rawData) {
    const { userInfo } = rawData;
    return `
${BASE_INSTRUCTION}
[분석 대상]
- 이름: ${userInfo.name}
- 생년월일: ${userInfo.birthDate} ${userInfo.birthTime}
Big 3(태양, 달, 상승궁)를 중심으로 해석하되 용어 설명은 생략하세요.
`;
}

// [6] API 라우트
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

app.post('/api/saju/chat', async (req, res) => {
    try {
        const { userMessage, rawData } = req.body;
        const sajuText = calculateSajuText(rawData.userInfo);
        const prompt = `
${BASE_INSTRUCTION}
[상황: 사주 상세 상담 채팅]
- 사용자: ${rawData.userInfo.name}
- **확정 사주 명식: ${sajuText || "정보 확인 불가"}**
- 질문: "${userMessage}"

🚨 **작성 지침:**
1. 위 '확정 사주 명식'을 근거로 일관성 있게 답변하세요.
2. 결론부터 말하고 사주적 이유를 설명하세요.
`;
        const answer = await callGeminiAPI(prompt);
        res.json({ success: true, answer });
    } catch (e) {
        res.status(500).json({ success: false, error: 'Chat Error' });
    }
});

app.post('/api/astrology/chat', async (req, res) => {
    try {
        const { userMessage, rawData } = req.body;
        const prompt = `${BASE_INSTRUCTION}\n사용자: ${rawData.userInfo.name}\n질문: "${userMessage}"\n별들의 배치를 기반으로 답변하세요.`;
        const answer = await callGeminiAPI(prompt);
        res.json({ success: true, answer });
    } catch (e) { res.status(500).json({ success: false, error: 'Chat Error' }); }
});

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log(`🚀 Server running: http://localhost:${PORT}`));
}

export default app;