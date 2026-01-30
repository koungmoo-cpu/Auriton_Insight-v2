/* ============================================
   🖥️ Auriton InsightAI v3.0 - Server (Insight Edition)
   Updated: "No-Lecture" Policy & Gemini 2.5
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

// ⚡ Gemini 2.5 모델 설정
const apiKey = process.env.GEMINI_API_KEY;
let model = null;

if (apiKey && apiKey !== 'PLACEHOLDER_API_KEY') {
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        // 최신 2.5 Flash 모델 사용 (속도 + 추론 능력 강화)
        model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    } catch (e) { console.error("Model Init Failed", e); }
}

async function callGeminiAPI(prompt) {
    if (!model) throw new Error('API Key 설정이 필요합니다.');
    const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.85, maxOutputTokens: 2500 } // 창의성 높임
    });
    return await result.response.text();
}

// 🛑 [핵심 수정] "설명충 금지" 프롬프트 설계
const BASE_INSTRUCTION = `
당신은 고대의 지혜와 미래의 AI가 결합된 'Auriton InsightAI'의 마스터입니다.
모든 답변은 한국어 경어체(해요체)로 작성하세요.
절대로 뻔한 이론적인 설명(예: "태양은 자아를 상징하며...")을 하지 마세요.
사용자는 점성학 강의를 듣고 싶은 게 아니라, "나에 대한 해석"을 원합니다.
직설적이고, 통찰력 있게, 사용자의 내면을 꿰뚫어 보는 듯한 톤으로 말하세요.
`;

// 🔮 사주 프롬프트 (만세력 라이브러리 적용 및 사주단지 출력 강화)
function getSajuPrompt(rawData) {
    const { userInfo } = rawData;
    
    // 날짜 및 시간 파싱 (YYYY-MM-DD 형식 가정)
    const [year, month, day] = userInfo.birthDate.split('-').map(Number);
    const [hour, minute] = (userInfo.birthTime || "00:00").split(':').map(Number);

    let sajuText = "";
    let eightChar = null;

    try {
        if (userInfo.calendarType === '음력') {
            // 음력 계산
            const lunar = Lunar.fromYmdHms(year, month, day, hour, minute, 0);
            eightChar = lunar.getEightChar();
        } else {
            // 양력 계산
            const solar = Solar.fromYmdHms(year, month, day, hour, minute, 0);
            eightChar = solar.getLunar().getEightChar();
        }

        // 한글 명식 생성 (예: 갑자년 을축월 병인일 정묘시)
        sajuText = `${eightChar.getYearGan()}${eightChar.getYearZhi()}년 ` +
                   `${eightChar.getMonthGan()}${eightChar.getMonthZhi()}월 ` +
                   `${eightChar.getDayGan()}${eightChar.getDayZhi()}일 ` +
                   `${eightChar.getHourGan()}${eightChar.getHourZhi()}시`;
    } catch (e) {
        console.error("Saju Calculation Error:", e);
        sajuText = "사주 명식을 계산하는 중 오류가 발생했습니다.";
    }

    return `
${BASE_INSTRUCTION}

[분석 데이터]
- 이름: ${userInfo.name} (${userInfo.gender})
- 입력 정보: ${userInfo.birthDate} ${userInfo.birthTime} (${userInfo.calendarType || "양력"})
- **확정 사주 명식: ${sajuText}**

[임무: 사주 명식 기반 운명 독해]
**🚨 중요: 반드시 답변의 맨 첫 줄에 "사주 명식: ${sajuText}"를 한글로 출력한 후 해설을 시작하세요.**

1. **핵심 본성 (일간 분석)**:
   - 명식의 주인공인 일간의 기운을 중심으로, 이 사람이 어떤 기질을 타고났는지 신비로운 비유를 들어 설명하세요.
   
2. **에너지의 균형**:
   - 명식에서 가장 강한 기운과 부족한 기운이 삶의 태도나 선택에 어떤 영향을 미치는지 꿰뚫어 보세요.

3. **현대적 개운법 (실질적 조언)**:
   - 구체적인 색상, 시간대, 혹은 마음가짐 등 일상에서 바로 실천할 수 있는 팁을 제안하세요.

* 분량: 1000자 내외의 깊이 있는 에세이 형식.
`;
}

// ⭐ 점성학 프롬프트 (완전 개편: 설명 제거, 통찰 강화)
function getAstrologyPrompt(rawData) {
    const { userInfo } = rawData;

    return `
${BASE_INSTRUCTION}

[분석 대상]
- 이름: ${userInfo.name}
- 생년월일: ${userInfo.birthDate}
- 태어난 시간: ${userInfo.birthTime} (정확한 시간 기반)

[임무: 별의 배치로 본 영혼의 지도]
이 사람의 천궁도(Natal Chart)를 머릿속으로 그리고, '태양(Sun)', '달(Moon)', '상승궁(Ascendant)'의 조합(Big 3)을 중심으로 **통합적인 해석**을 내리세요.

🚨 **금지 사항 (엄격 준수):**
- "태양은 ...를 의미하고, 달은 ...를 의미합니다" 같은 **용어 설명 금지**.
- 행성 하나하나를 따로 떼어 나열하는 방식 금지.

✅ **작성 가이드:**
1. **The Core (당신은 누구인가)**:
   - 태양(본질)과 달(내면), 상승궁(가면)이 서로 충돌하는지, 조화를 이루는지 분석하여 이 사람의 모순점이나 매력을 찝어주세요.
   - 예: "당신은 겉으로는 차가운 이성(상승궁)을 보이지만, 속에는 끓어오르는 용암(달)을 감추고 있군요."

2. **Hidden Talent (숨겨진 재능)**:
   - 1하우스, 10하우스 등을 보고 이 사람이 사회에서 어떻게 빛날 수 있는지 구체적으로 말해주세요.

3. **Soul Message (영혼의 조언)**:
   - 현재 별들의 배치가 이 사람에게 주는 단 하나의 강렬한 메시지를 던지세요.

* 톤앤매너: 신비롭지만 뼈를 때리는 통찰력.
* 분량: 1000자 내외의 에세이 형식.
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
        console.error(error);
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
        console.error(error);
        res.status(500).json({ success: false, error: '분석 중 오류 발생' });
    }
});

// 채팅 기능
app.post('/api/saju/chat', async (req, res) => {
    try {
        const { userMessage, rawData } = req.body;
        const { userInfo } = rawData;

        // 1. 채팅 시에도 정확한 사주 명식을 다시 계산
        const [year, month, day] = userInfo.birthDate.split('-').map(Number);
        const [hour, minute] = (userInfo.birthTime || "00:00").split(':').map(Number);

        let sajuText = "";
        try {
            if (userInfo.calendarType === '음력') {
                const lunar = Lunar.fromYmdHms(year, month, day, hour, minute, 0);
                const eightChar = lunar.getEightChar();
                sajuText = `${eightChar.getYearGan()}${eightChar.getYearZhi()}년 ${eightChar.getMonthGan()}${eightChar.getMonthZhi()}월 ${eightChar.getDayGan()}${eightChar.getDayZhi()}일 ${eightChar.getHourGan()}${eightChar.getHourZhi()}시`;
            } else {
                const solar = Solar.fromYmdHms(year, month, day, hour, minute, 0);
                const eightChar = solar.getLunar().getEightChar();
                sajuText = `${eightChar.getYearGan()}${eightChar.getYearZhi()}년 ${eightChar.getMonthGan()}${eightChar.getMonthZhi()}월 ${eightChar.getDayGan()}${eightChar.getDayZhi()}일 ${eightChar.getHourGan()}${eightChar.getHourZhi()}시`;
            }
        } catch (e) {
            sajuText = "사주 명식 정보 확인 불가";
        }

        // 2. AI에게 전달할 프롬프트 구성 (사주 정보 포함)
        const prompt = `
${BASE_INSTRUCTION}
[상황: 사주 상세 상담 채팅]
- 사용자: ${userInfo.name} (${userInfo.gender})
- 확정된 사주 명식: ${sajuText}
- 사용자의 추가 질문: "${userMessage}"

🚨 **작성 지침:**
1. 위 '확정된 사주 명식'(${sajuText})을 모든 답변의 근거로 삼으세요. 다른 명식으로 해석해서는 안 됩니다.
2. 질문에 대해 명쾌한 결론을 먼저 말하고, 그 이유를 사주적 관점(오행의 흐름, 일간의 특징 등)에서 풀어서 설명하세요.
3. 실생활에 적용할 수 있는 구체적인 팁을 하나 포함하세요.
4. **분량**: 약 800자 내외로 깊이 있는 통찰을 전달하세요.
`;

        const answer = await callGeminiAPI(prompt);
        res.json({ success: true, answer });
    } catch (e) {
        console.error("Chat Error:", e);
        res.status(500).json({ success: false, error: 'Chat Error' });
    }
});

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log(`🚀 Server running: http://localhost:${PORT}`));
}

export default app;