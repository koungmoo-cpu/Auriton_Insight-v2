/* ============================================
   🖥️ Auriton InsightAI v3.1 - Server (Leap Month Fixed)
   Updated: Lunar Leap Month Support Added
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
    max: 20,
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

// [4] 통합 사주 계산 함수 (윤달 지원 추가)
function calculateSajuText(userInfo) {
    console.log("🔍 [calculateSajuText] 시작");
    console.log("🔍 [calculateSajuText] userInfo:", JSON.stringify(userInfo));
    
    if (!userInfo) {
        console.error("❌ [calculateSajuText] userInfo is null/undefined");
        return null;
    }
    
    if (!userInfo.birthDate) {
        console.error("❌ [calculateSajuText] No birthDate in userInfo");
        return null;
    }
    
    try {
        const fullDateStr = `${userInfo.birthDate} ${userInfo.birthTime || ""}`;
        const p = fullDateStr.match(/\d+/g);
        
        if (!p || p.length < 3) {
            console.error("❌ Invalid date format:", fullDateStr);
            return null;
        }

        const year = parseInt(p[0]), month = parseInt(p[1]), day = parseInt(p[2]);
        
        console.log(`📅 입력 데이터:`, JSON.stringify(userInfo, null, 2));
        console.log(`📅 파싱 결과: ${year}년 ${month}월 ${day}일 (${userInfo.calendarType})`);
        console.log(`🕐 시간 원본: "${userInfo.birthTime}"`);
        
        let hour = 0;
        if (userInfo.birthTime && userInfo.birthTime !== 'unknown') {
            if (SAJU_TIME_MAP[userInfo.birthTime] !== undefined) {
                // 한글 시간 (자시, 축시 등)
                hour = SAJU_TIME_MAP[userInfo.birthTime];
            } else {
                // 숫자 형식 (00:30, 16:30 등)
                const timeMatch = userInfo.birthTime.match(/\d+/g);
                hour = timeMatch ? parseInt(timeMatch[0]) : 0;
            }
        } else {
            // 시간 모름 → 12시(낮)로 기본 설정
            hour = 12;
        }
        
        console.log(`🕐 최종 시간: ${hour}시`);

        let eightChar;
        const calType = userInfo.calendarType || 'solar';
        
        if (calType === '음력' || calType === 'lunar') {
            console.log("🌙 음력(평달) 처리");
            eightChar = Lunar.fromYmdHms(year, month, day, hour, 0, 0).getEightChar();
        } else if (calType === '음력-윤달' || calType === 'lunar-leap') {
            console.log("🌙 음력(윤달) 처리");
            eightChar = Lunar.fromYmdHms(year, month, day, hour, 0, 0).getEightChar();
        } else {
            console.log("☀️ 양력 처리");
            eightChar = Solar.fromYmdHms(year, month, day, hour, 0, 0).getLunar().getEightChar();
        }

        const result = `${toHangul(eightChar.getYearGan())}${toHangul(eightChar.getYearZhi())}년 ` +
                      `${toHangul(eightChar.getMonthGan())}${toHangul(eightChar.getMonthZhi())}월 ` +
                      `${toHangul(eightChar.getDayGan())}${toHangul(eightChar.getDayZhi())}일 ` +
                      `${toHangul(eightChar.getHourGan())}${toHangul(eightChar.getHourZhi())}시`;
        
        console.log("✅ 사주 명식:", result);
        return result;
    } catch (e) {
        console.error("❌ Saju Calculation Error:", e);
        return null;
    }
}

// [5] 프롬프트 생성 함수
function getSajuPrompt(rawData) {
    const { userInfo } = rawData;
    const sajuText = calculateSajuText(userInfo);
    if (!sajuText) return `${BASE_INSTRUCTION}\n\n[오류] 입력하신 날짜 정보가 올바르지 않습니다.`;

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
        console.log("📥 [Saju] Received data:", JSON.stringify(rawData, null, 2));
        
        if (!rawData || !rawData.userInfo) {
            console.error("❌ [Saju] No userInfo in rawData");
            return res.status(400).json({ 
                success: false, 
                error: '데이터 형식 오류: userInfo가 없습니다.' 
            });
        }
        
        const sajuText = calculateSajuText(rawData.userInfo);
        if (!sajuText) {
            console.error("❌ [Saju] calculateSajuText returned null");
            console.error("❌ [Saju] userInfo was:", JSON.stringify(rawData.userInfo));
            return res.json({ 
                success: true, 
                consultation: '죄송합니다. 입력하신 날짜 정보가 올바르지 않아 정확한 분석을 제공해 드릴 수 없습니다. 다시 한번 정확한 생년월일시를 확인해 주시면, 당신의 별자리를 깊이 있게 통찰하여 당신만의 고유한 이야기를 들려드리겠습니다. 당신의 내면을 비추는 등불이 되어 드리겠습니다.' 
            });
        }
        
        const prompt = getSajuPrompt(rawData);
        const consultation = await callGeminiAPI(prompt);
        res.json({ success: true, consultation });
    } catch (error) {
        console.error("❌ [Saju] API Error:", error);
        console.error("❌ [Saju] Stack:", error.stack);
        res.status(500).json({ success: false, error: '분석 중 오류 발생: ' + error.message });
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
