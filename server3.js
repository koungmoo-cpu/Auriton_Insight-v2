/* ============================================
   🖥️ Auriton InsightAI v3.2 - Server (Fixed)
   Updated: robust date parsing & typo fix
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

// [2] Gemini API 설정
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

// [3] 공통 설정 및 한글 매핑 로직 (오타 수정됨)
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

// [4] 통합 사주 계산 함수 (Robust Version)
function calculateSajuText(userInfo) {
    console.log("🔍 [Saju Calc] UserInfo:", JSON.stringify(userInfo));

    if (!userInfo || !userInfo.birthDate) {
        console.error("❌ [Saju Calc] Missing birthDate");
        return null;
    }

    try {
        // 1. 날짜 파싱 (안전하게 split 사용)
        // birthDate 형식: "YYYY-MM-DD"
        const [yearStr, monthStr, dayStr] = userInfo.birthDate.split('-');
        const year = parseInt(yearStr, 10);
        const month = parseInt(monthStr, 10);
        const day = parseInt(dayStr, 10);

        if (isNaN(year) || isNaN(month) || isNaN(day)) {
            throw new Error(`날짜 형식이 올바르지 않습니다: ${userInfo.birthDate}`);
        }

        // 2. 시간 파싱
        let hour = 12; // 기본값: 낮 12시
        if (userInfo.birthTime && userInfo.birthTime !== 'unknown') {
            // "16:30" 같은 문자열에서 숫자만 추출
            const timeMatch = userInfo.birthTime.match(/(\d+):(\d+)/);
            if (timeMatch) {
                hour = parseInt(timeMatch[1], 10);
            }
        }
        console.log(`📅 Parsed: ${year}-${month}-${day}, Hour: ${hour}, Type: ${userInfo.calendarType}`);

        // 3. 만세력 계산 (Lunar library)
        let eightChar;
        const calType = userInfo.calendarType || 'solar';

        if (calType.includes('음력') || calType.includes('lunar')) {
             // 음력 (윤달 처리 포함 - 단, 라이브러리 지원 범위 내)
             // 주의: lunar-javascript의 기본 fromYmdHms는 평달 기준입니다.
             // 윤달을 정확히 지정하려면 라이브러리 스펙에 따라 Lunar.fromYmdHms(yyyy, -mm, ...) 등을 써야 할 수 있으나
             // 여기서는 일반 음력 변환을 수행합니다.
            eightChar = Lunar.fromYmdHms(year, month, day, hour, 0, 0).getEightChar();
        } else {
            // 양력
            eightChar = Solar.fromYmdHms(year, month, day, hour, 0, 0).getLunar().getEightChar();
        }

        // 4. 결과 문자열 조합
        // toHangul 함수가 null/undefined 체크를 하도록 수정됨
        const result = `${toHangul(eightChar.getYearGan())}${toHangul(eightChar.getYearZhi())}년 ` +
                       `${toHangul(eightChar.getMonthGan())}${toHangul(eightChar.getMonthZhi())}월 ` +
                       `${toHangul(eightChar.getDayGan())}${toHangul(eightChar.getDayZhi())}일 ` +
                       `${toHangul(eightChar.getHourGan())}${toHangul(eightChar.getHourZhi())}시`;

        console.log("✅ [Saju Calc] Result:", result);
        return result;

    } catch (e) {
        console.error("❌ [Saju Calc Error] 상세 에러:", e);
        // 사용자에게 보여줄 에러 메시지가 필요하면 여기서 throw 하거나 null 리턴
        return null;
    }
}

// [5] 프롬프트 생성 함수
function getSajuPrompt(rawData) {
    const { userInfo } = rawData;
    const sajuText = calculateSajuText(userInfo);
    
    // 계산 실패 시
    if (!sajuText) return null;

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
        console.log("📥 [Saju API] Call Received");
        
        if (!rawData || !rawData.userInfo) {
            return res.json({ success: false, consultation: '데이터 오류: 사용자 정보가 없습니다.' });
        }

        const prompt = getSajuPrompt(rawData);
        
        // 사주 계산 실패 감지
        if (!prompt) {
            return res.json({ 
                success: true, 
                consultation: '죄송합니다. 날짜 정보를 변환하는 중 오류가 발생했습니다.\n(존재하지 않는 날짜이거나(예: 음력 2월 30일), 서버 내부 계산 오류입니다.)' 
            });
        }
        
        const consultation = await callGeminiAPI(prompt);
        res.json({ success: true, consultation });
    } catch (error) {
        console.error("❌ [Saju API Error]", error);
        res.json({ success: false, consultation: '시스템 오류가 발생했습니다: ' + error.message });
    }
});

app.post('/api/astrology/consultation', async (req, res) => {
    try {
        const { rawData } = req.body;
        const prompt = getAstrologyPrompt(rawData);
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