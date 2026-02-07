/* ============================================
   🖥️ Auriton InsightAI v4.0 - Error Handling Enhanced
   Updated: 2025-02-05
   - 궁합 계산 오류 처리 추가
   - 운세 세분화 기능 추가 (일간/주간/월간/올해/10년/총운)
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

// [4] 사주 계산 함수
function calculateSajuText(userInfo) {
    console.log("🔍 [Calc Start] Input Data:", JSON.stringify(userInfo));

    try {
        if (!userInfo || !userInfo.birthDate) throw new Error("생년월일 정보가 누락되었습니다.");

        const parts = userInfo.birthDate.split('-');
        if (parts.length !== 3) throw new Error(`날짜 형식이 잘못되었습니다 (${userInfo.birthDate})`);

        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const day = parseInt(parts[2], 10);

        if (isNaN(year) || isNaN(month) || isNaN(day)) throw new Error("날짜에 숫자가 아닌 값이 포함되어 있습니다.");

        let hour = 12; 
        if (userInfo.birthTime && userInfo.birthTime !== 'unknown') {
            const timeMatch = userInfo.birthTime.match(/(\d+):(\d+)/);
            if (timeMatch) hour = parseInt(timeMatch[1], 10);
        }

        console.log(`📅 Parsed: ${year}-${month}-${day} ${hour}:00, Type: ${userInfo.calendarType}`);

        let eightChar;
        const calType = (userInfo.calendarType || 'solar').toLowerCase();

        // 음력 판단: 'lunar', '음력', '음력(윤)' 포함 시
        if (calType.includes('lunar') || calType.includes('음력')) {
            const isLeapMonth = calType.includes('윤') || calType.includes('leap');
            console.log(`🌙 Processing Lunar Date... ${isLeapMonth ? '(윤달)' : '(평달)'}`);
            
            try {
                const lunarObj = Lunar.fromYmdHms(year, month, day, hour, 0, 0, isLeapMonth ? 1 : 0);
                if (!lunarObj) throw new Error("음력 날짜 객체 생성 실패");
                eightChar = lunarObj.getEightChar();
            } catch (e) {
                throw new Error(`음력 날짜 처리 실패: ${e.message}`);
            }
        } else {
            // 그 외 모든 경우 양력으로 처리 ('solar', '양력', 기타)
            console.log("☀️ Processing Solar Date...");
            try {
                const solarObj = Solar.fromYmdHms(year, month, day, hour, 0, 0);
                if (!solarObj) throw new Error("양력 날짜 객체 생성 실패");
                eightChar = solarObj.getLunar().getEightChar();
            } catch (e) {
                throw new Error(`양력 날짜 처리 실패: ${e.message}`);
            }
        }

        const yearGan = toHangul(eightChar.getYearGan());
        const yearZhi = toHangul(eightChar.getYearZhi());
        const monthGan = toHangul(eightChar.getMonthGan());
        const monthZhi = toHangul(eightChar.getMonthZhi());
        const dayGan = toHangul(eightChar.getDayGan());
        const dayZhi = toHangul(eightChar.getDayZhi());
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

// [5-1] 궁합 계산 API (오류 처리 강화)
app.post('/api/compatibility', async (req, res) => {
    try {
        const { person1, person2 } = req.body;
        
        console.log("💞 [Compatibility Request]");
        console.log("Person 1:", JSON.stringify(person1));
        console.log("Person 2:", JSON.stringify(person2));
        
        if (!person1 || !person2) {
            return res.json({ 
                success: false, 
                error: '두 사람의 정보가 모두 필요합니다.' 
            });
        }

        console.log("🔮 Calculating Saju for Person 1...");
        const saju1 = calculateSajuText(person1);
        console.log("✅ Person 1 Saju:", saju1);
        
        console.log("🔮 Calculating Saju for Person 2...");
        const saju2 = calculateSajuText(person2);
        console.log("✅ Person 2 Saju:", saju2);
        
        if (saju1.startsWith('ERROR:') || saju2.startsWith('ERROR:')) {
            const errorMsg = saju1.startsWith('ERROR:') ? saju1 : saju2;
            console.error("❌ Saju Calculation Failed:", errorMsg);
            return res.json({ 
                success: false, 
                error: `궁합 계산 중 오류가 발생했습니다.\n\n${errorMsg.replace('ERROR: ', '')}\n\n입력 정보를 다시 확인해주세요.` 
            });
        }

        console.log("🤖 Generating AI Analysis...");
        const prompt = `
${BASE_INSTRUCTION}
[궁합 분석]
- 첫 번째 사람: ${person1.name} (${person1.gender}) - ${saju1}
- 두 번째 사람: ${person2.name} (${person2.gender}) - ${saju2}

두 사람의 사주 궁합을 음양오행 관점에서 분석하고, 관계 발전을 위한 조언을 해주세요.
1. 음양오행 조화도
2. 상생상극 관계
3. 관계 발전을 위한 구체적 조언
`;
        const result = await callGeminiAPI(prompt);
        console.log("✅ Analysis Complete");
        res.json({ success: true, analysis: result });
        
    } catch (error) {
        console.error("❌ [Compatibility Error]", error);
        res.json({ 
            success: false, 
            error: `궁합 분석 중 시스템 오류가 발생했습니다.\n\n오류 내용: ${error.message}\n\n잠시 후 다시 시도해주세요.` 
        });
    }
});

// [5-2] 운세 세분화 API
app.post('/api/saju/fortune', async (req, res) => {
    try {
        const { rawData, fortuneType } = req.body;
        
        const sajuText = calculateSajuText(rawData?.userInfo);
        
        if (!sajuText || sajuText.startsWith('ERROR:')) {
            return res.json({ 
                success: false, 
                error: '사주 정보를 불러올 수 없습니다.' 
            });
        }

        const fortunePrompts = {
            daily: {
                title: '오늘의 운세',
                maxLength: 700,
                instruction: '오늘 하루의 에너지 흐름과 주의사항을 700자 이내로 간결하게 설명하세요.'
            },
            weekly: {
                title: '이번 주 운세',
                maxLength: 700,
                instruction: '이번 주의 전반적인 흐름과 중요 포인트를 700자 이내로 설명하세요.'
            },
            monthly: {
                title: '이번 달 운세',
                maxLength: 700,
                instruction: '이번 달의 운세와 집중해야 할 영역을 700자 이내로 설명하세요.'
            },
            yearly: {
                title: '올해의 운세',
                maxLength: 1500,
                instruction: '올해 전체의 큰 흐름, 기회와 도전을 1500자 이내로 상세히 설명하세요.'
            },
            decade: {
                title: '10년 운세',
                maxLength: 4000,
                instruction: '향후 10년간의 대운 흐름과 각 시기별 특징을 4000자 이내로 깊이 있게 분석하세요.'
            },
            total: {
                title: '총운',
                maxLength: 2000,
                instruction: '일생의 큰 흐름과 타고난 운명적 특징을 2000자 이내로 종합적으로 설명하세요.'
            }
        };

        const config = fortunePrompts[fortuneType];
        if (!config) {
            return res.json({ success: false, error: '올바른 운세 타입이 아닙니다.' });
        }

        const prompt = `
${BASE_INSTRUCTION}
[${config.title} 분석]
- 이름: ${rawData.userInfo.name} (${rawData.userInfo.gender})
- 사주 명식: ${sajuText}
- 생년월일: ${rawData.userInfo.birthDate}

${config.instruction}

답변은 반드시 ${config.maxLength}자를 초과하지 않도록 작성하세요.
`;

        const fortune = await callGeminiAPI(prompt);
        res.json({ 
            success: true, 
            fortune: fortune,
            fortuneType: config.title
        });

    } catch (error) {
        console.error("❌ [Fortune Error]", error);
        res.json({ 
            success: false, 
            error: '운세 분석 중 오류가 발생했습니다.' 
        });
    }
});

// [5-3] 사주 상담 API
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

// [5-4] 점성학 상담 API
app.post('/api/astrology/consultation', async (req, res) => {
    try {
        const { rawData } = req.body;
        
        const calendarInfo = rawData.userInfo.calendarType 
            ? `(${rawData.userInfo.calendarType} 기준)` 
            : '';
        
        const prompt = `
${BASE_INSTRUCTION}
[점성학 분석]
- 이름: ${rawData.userInfo.name} (${rawData.userInfo.gender})
- 생년월일: ${rawData.userInfo.birthDate} ${rawData.userInfo.birthTime} ${calendarInfo}
- 출생지: ${rawData.userInfo.location}

서양 점성학 관점에서 이 사람의:
1. **Big 3 (태양/달/상승궁)**: 핵심 성격과 내면
2. **주요 행성 배치**: 금성, 화성, 수성의 영향
3. **현재 운행 흐름**: 2026년 주요 행성의 움직임이 미치는 영향

용어 설명은 최소화하고 실질적인 통찰을 제공하세요.
`;
        const consultation = await callGeminiAPI(prompt);
        res.json({ success: true, consultation });
    } catch (error) {
        console.error("❌ [Astrology Error]", error);
        res.json({ success: false, consultation: '점성학 분석 중 오류 발생.' });
    }
});

// [5-7] 점성학 운행 API (NEW!)
app.post('/api/astrology/transit', async (req, res) => {
    try {
        const { rawData, transitType } = req.body;
        
        const transitPrompts = {
            monthly: {
                title: '이번 달 행성 운행',
                maxLength: 700,
                instruction: '이번 달(2026년 2월)의 주요 행성 운행과 그것이 사용자에게 미치는 영향을 700자 이내로 설명하세요.'
            },
            yearly: {
                title: '올해 행성 운행',
                maxLength: 1500,
                instruction: '2026년 한 해 동안의 주요 행성 운행(목성, 토성, 천왕성 등)과 그 영향을 1500자 이내로 상세히 설명하세요.'
            },
            decade: {
                title: '10년 행성 운행',
                maxLength: 4000,
                instruction: '2026-2036년 10년간의 외행성(목성, 토성, 천왕성, 해왕성, 명왕성) 운행과 각 시기별 주요 영향을 4000자 이내로 깊이 있게 분석하세요.'
            }
        };

        const config = transitPrompts[transitType];
        if (!config) {
            return res.json({ success: false, error: '올바른 운행 타입이 아닙니다.' });
        }

        const prompt = `
${BASE_INSTRUCTION}
[점성학 ${config.title} 분석]
- 이름: ${rawData.userInfo.name} (${rawData.userInfo.gender})
- 출생 정보: ${rawData.userInfo.birthDate} ${rawData.userInfo.birthTime}
- 출생지: ${rawData.userInfo.location}

${config.instruction}

답변은 반드시 ${config.maxLength}자를 초과하지 않도록 작성하세요.
`;

        const transit = await callGeminiAPI(prompt);
        res.json({ 
            success: true, 
            transit: transit,
            transitType: config.title
        });

    } catch (error) {
        console.error("❌ [Transit Error]", error);
        res.json({ 
            success: false, 
            error: '행성 운행 분석 중 오류가 발생했습니다.' 
        });
    }
});

// [5-8] 점성학 채팅 API
app.post('/api/astrology/chat', async (req, res) => {
    try {
        const { userMessage, rawData } = req.body;
        
        const prompt = `
${BASE_INSTRUCTION}
[상황: 점성학 상세 상담 채팅]
- 사용자: ${rawData.userInfo.name}
- 출생 정보: ${rawData.userInfo.birthDate} ${rawData.userInfo.birthTime}
- 질문: "${userMessage}"

점성학적 관점에서 답변하되, 결론부터 말하고 이유를 설명하세요.
`;
        const answer = await callGeminiAPI(prompt);
        res.json({ success: true, answer });
    } catch (e) {
        res.status(500).json({ success: false, error: 'Chat Error' });
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

// [5-6] 점성학 채팅 API (서비스 예정)
app.post('/api/astrology/chat', async (req, res) => {
    res.json({ 
        success: true, 
        answer: '점성학 서비스는 현재 준비 중입니다. 조금만 기다려주세요! ⭐' 
    });
});

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log(`🚀 Server running: http://localhost:${PORT}`));
}

export default app;
