/* ============================================
   🖥️ Auriton InsightAI v3.4 - Final Fix
   Updated: Fixed function names (Hour -> Time)
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

// [1] 보안 및 미들웨어
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
    max: 50,
    message: { success: false, error: '⚠️ 잠시 후 다시 시도해주세요.' }
});
app.use('/api/', apiLimiter);

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// [2] Gemini API
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

// [3] 안전한 한글 매핑 로직
const BASE_INSTRUCTION = `
당신은 고대의 지혜와 미래의 AI가 결합된 'Auriton InsightAI'의 마스터입니다.
모든 답변은 한국어 경어체(해요체)로 작성하세요.
절대로 뻔한 이론적인 설명은 하지 말고, 사용자에 대한 통찰과 해석을 제공하세요.
`;

const HAN_TO_HANGUL = {
    '甲': '갑', '乙': '을', '丙': '병', '丁': '정', '戊': '무', '己': '기', '庚': '경', '辛': '신', '壬': '임', '癸': '계',
    '子': '자', '丑': '축', '寅': '인', '卯': '묘', '辰': '진', '巳': '사', '午': '오', '未': '미', '申': '신', '酉': '유', '戌': '술', '亥': '해'
};

const toHangul = (str) => {
    if (!str) return '';
    return str.split('').map(char => HAN_TO_HANGUL[char] || char).join('');
};

// [4] 사주 계산 함수 (함수명 수정됨!)
function calculateSajuText(userInfo) {
    console.log("🔍 [Calc Start] Input Data:", JSON.stringify(userInfo));

    try {
        if (!userInfo || !userInfo.birthDate) throw new Error("생년월일 정보가 누락되었습니다.");

        // 1. 날짜 파싱
        const parts = userInfo.birthDate.split('-');
        if (parts.length !== 3) throw new Error(`날짜 형식이 잘못되었습니다 (${userInfo.birthDate})`);

        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const day = parseInt(parts[2], 10);

        if (isNaN(year) || isNaN(month) || isNaN(day)) throw new Error("날짜에 숫자가 아닌 값이 포함되어 있습니다.");

        // 2. 시간 파싱
        let hour = 12; 
        if (userInfo.birthTime && userInfo.birthTime !== 'unknown') {
            const timeMatch = userInfo.birthTime.match(/(\d+):(\d+)/);
            if (timeMatch) hour = parseInt(timeMatch[1], 10);
        }

        console.log(`📅 Parsed: ${year}-${month}-${day} ${hour}:00, Type: ${userInfo.calendarType}`);

        // 3. 만세력 변환
        let eightChar;
        const calType = userInfo.calendarType || 'solar';

        if (calType.includes('음력') || calType.includes('lunar')) {
            console.log("🌙 Processing Lunar Date...");
            const lunarObj = Lunar.fromYmdHms(year, month, day, hour, 0, 0);
            if (!lunarObj) throw new Error("음력 날짜 객체 생성 실패");
            eightChar = lunarObj.getEightChar();
        } else {
            console.log("☀️ Processing Solar Date...");
            const solarObj = Solar.fromYmdHms(year, month, day, hour, 0, 0);
            if (!solarObj) throw new Error("양력 날짜 객체 생성 실패");
            eightChar = solarObj.getLunar().getEightChar();
        }

        // 4. 문자열 조합 (★ 여기가 수정된 핵심 부분입니다 ★)
        // getHourGan -> getTimeGan 으로 변경되었습니다.
        const yearGan = toHangul(eightChar.getYearGan());
        const yearZhi = toHangul(eightChar.getYearZhi());
        const monthGan = toHangul(eightChar.getMonthGan());
        const monthZhi = toHangul(eightChar.getMonthZhi());
        const dayGan = toHangul(eightChar.getDayGan());
        const dayZhi = toHangul(eightChar.getDayZhi());
        
        // [수정 완료] 라이브러리 함수명에 맞춰 Hour -> Time으로 변경
        const hourGan = toHangul(eightChar.getTimeGan()); 
        const hourZhi = toHangul(eightChar.getTimeZhi());

        const result = `${yearGan}${yearZhi}년 ${monthGan}${monthZhi}월 ${dayGan}${dayZhi}일 ${hourGan}${hourZhi}시`;
        console.log("✅ Result:", result);
        
        return result;

    } catch (e) {
        console.error("❌ [Calculation Error]:", e.message);
        return `ERROR: ${e.message}`;
    }
}

// [5] API 라우트
app.post('/api/saju/consultation', async (req, res) => {
    try {
        const { rawData } = req.body;
        
        const sajuText = calculateSajuText(rawData?.userInfo);
        
        if (!sajuText || sajuText.startsWith('ERROR:')) {
            const errorMsg = sajuText ? sajuText.replace('ERROR: ', '') : '알 수 없는 오류';
            return res.json({ 
                success: true, 
                consultation: `🚫 **분석 오류 발생**\n\n죄송합니다. 오류가 발생했습니다.\n\n**상세 에러:**\n${errorMsg}\n\n다시 시도해주세요.` 
            });
        }

        const prompt = `
${BASE_INSTRUCTION}
[분석 데이터]
- 이름: ${rawData.userInfo.name} (${rawData.userInfo.gender})
- 확정 사주 명식: ${sajuText}

**🚨 중요: 반드시 답변의 맨 첫 줄에 "사주 명식: ${sajuText}"를 출력한 후 해설을 시작하세요.**

1. **핵심 본성 (일간 분석)**: 이 사람이 어떤 기질을 타고났는지 비유를 들어 설명하세요.
2. **에너지의 균형**: 강한 기운과 부족한 기운이 삶에 미치는 영향을 분석하세요.
3. **현대적 개운법**: 구체적인 색상, 행동 지침을 제안하세요.
`;
        const consultation = await callGeminiAPI(prompt);
        res.json({ success: true, consultation });

    } catch (error) {
        console.error("❌ [API Route Error]", error);
        res.json({ success: false, consultation: `서버 내부 치명적 오류: ${error.message}` });
    }
});

app.post('/api/astrology/consultation', async (req, res) => {
    try {
        const { rawData } = req.body;
        const prompt = `
${BASE_INSTRUCTION}
[분석 대상]
- 이름: ${rawData.userInfo.name}
- 생년월일: ${rawData.userInfo.birthDate} ${rawData.userInfo.birthTime}
Big 3(태양, 달, 상승궁)를 중심으로 해석하되 용어 설명은 생략하세요.
`;
        const consultation = await callGeminiAPI(prompt);
        res.json({ success: true, consultation });
    } catch (error) {
        res.json({ success: false, consultation: '별자리 분석 중 오류 발생.' });
    }
});

app.post('/api/saju/chat', async (req, res) => {
    try {
        const { userMessage, rawData } = req.body;
        const sajuText = calculateSajuText(rawData.userInfo);
        
        if (!sajuText || sajuText.startsWith('ERROR:')) {
             return res.json({ success: true, answer: "죄송합니다. 사주 정보를 불러오는 중 오류가 발생했습니다." });
        }

        const prompt = `
${BASE_INSTRUCTION}
[상황: 사주 상세 상담 채팅]
- 사용자: ${rawData.userInfo.name}
- **확정 사주 명식: ${sajuText}**
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