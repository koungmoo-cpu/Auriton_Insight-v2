/* ============================================
   🖥️ Auriton InsightAI v4.0 - Enhanced Server
   Features: Validated Saju + Western Astrology with Houses
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
if (apiKey) {
    const genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
}

async function callGeminiAPI(prompt, maxTokens = 2500) {
    if (!model) throw new Error('API Key 설정이 필요합니다.');
    const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: maxTokens }
    });
    return await result.response.text();
}

// [3] 한글 매핑
const HAN_TO_HANGUL = {
    '甲': '갑', '乙': '을', '丙': '병', '丁': '정', '戊': '무', '己': '기', '庚': '경', '辛': '신', '壬': '임', '癸': '계',
    '子': '자', '丑': '축', '寅': '인', '卯': '묘', '辰': '진', '巳': '사', '午': '오', '未': '미', '申': '신', '酉': '유', '戌': '술', '亥': '해'
};

const toHangul = (str) => str.split('').map(char => HAN_TO_HANGUL[char] || char).join('');

// [4] 오행 분석 함수
const WUXING_MAP = {
    '갑': '목', '을': '목',
    '병': '화', '정': '화',
    '무': '토', '기': '토',
    '경': '금', '신': '금',
    '임': '수', '계': '수'
};

const EARTHLY_WUXING = {
    '자': '수', '축': '토', '인': '목', '묘': '목',
    '진': '토', '사': '화', '오': '화', '미': '토',
    '신': '금', '유': '금', '술': '토', '해': '수'
};

function analyzeWuxing(sajuText) {
    const counts = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
    
    // 천간 분석
    const stems = sajuText.match(/[갑을병정무기경신임계]/g) || [];
    stems.forEach(s => {
        if (WUXING_MAP[s]) counts[WUXING_MAP[s]]++;
    });
    
    // 지지 분석
    const branches = sajuText.match(/[자축인묘진사오미신유술해]/g) || [];
    branches.forEach(b => {
        if (EARTHLY_WUXING[b]) counts[EARTHLY_WUXING[b]]++;
    });
    
    return counts;
}

function getStrongestWeakest(wuxing) {
    const entries = Object.entries(wuxing).sort((a, b) => b[1] - a[1]);
    return {
        strongest: entries[0][0],
        weakest: entries.filter(e => e[1] === Math.min(...Object.values(wuxing)))[0][0]
    };
}

// [5] 점성학 - 태양 황경 계산 (간단 근사)
function calculateSunLongitude(year, month, day) {
    // Julian Date 근사 계산
    const a = Math.floor((14 - month) / 12);
    const y = year + 4800 - a;
    const m = month + 12 * a - 3;
    const jd = day + Math.floor((153 * m + 2) / 5) + 365 * y + 
               Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
    
    // 2000년 1월 1일 기준 차이
    const d = jd - 2451545.0;
    const L = (280.460 + 0.9856474 * d) % 360;
    
    return L < 0 ? L + 360 : L;
}

function getZodiacSign(longitude) {
    const signs = [
        '양자리', '황소자리', '쌍둥이자리', '게자리', '사자자리', '처녀자리',
        '천칭자리', '전갈자리', '사수자리', '염소자리', '물병자리', '물고기자리'
    ];
    return signs[Math.floor(longitude / 30)];
}

// [6] 하우스 계산 (Placidus 시스템 간단 근사)
function calculateHouses(lat, lng, year, month, day, hour, minute) {
    // 실제 구현에서는 swisseph 라이브러리 사용 권장
    // 여기서는 간단한 Equal House 시스템 사용
    const sunLon = calculateSunLongitude(year, month, day);
    
    // Local Sidereal Time 근사
    const jd = 2451545.0 + (year - 2000) * 365.25;
    const gmst = (280.46061837 + 360.98564736629 * (jd - 2451545.0)) % 360;
    const lst = (gmst + lng + (hour + minute / 60) * 15) % 360;
    
    // ASC (상승궁) = LST
    const asc = lst;
    
    // Equal House: 각 하우스는 30도씩
    const houses = [];
    for (let i = 0; i < 12; i++) {
        houses.push({
            number: i + 1,
            cusp: (asc + i * 30) % 360,
            sign: getZodiacSign((asc + i * 30) % 360)
        });
    }
    
    return { houses, ascendant: asc };
}

// [7] 통합 사주 계산 함수
function calculateSajuText(userInfo) {
    if (!userInfo || !userInfo.birthDate) return null;
    try {
        const dateStr = userInfo.birthDate.trim();
        const timeStr = userInfo.birthTime ? userInfo.birthTime.trim() : '12:00';
        
        const dateMatch = dateStr.match(/(\d{4})[.-]?(\d{1,2})[.-]?(\d{1,2})/);
        const timeMatch = timeStr.match(/(\d{1,2}):?(\d{2})?/);
        
        if (!dateMatch) return null;
        
        const year = parseInt(dateMatch[1]);
        const month = parseInt(dateMatch[2]);
        const day = parseInt(dateMatch[3]);
        const hour = timeMatch ? parseInt(timeMatch[1]) : 12;
        const minute = timeMatch && timeMatch[2] ? parseInt(timeMatch[2]) : 0;

        let eightChar;
        if (userInfo.calendarType === '음력') {
            eightChar = Lunar.fromYmdHms(year, month, day, hour, minute, 0).getEightChar();
        } else {
            eightChar = Solar.fromYmdHms(year, month, day, hour, minute, 0).getLunar().getEightChar();
        }

        const sajuText = `${toHangul(eightChar.getYearGan())}${toHangul(eightChar.getYearZhi())}년 ` +
                        `${toHangul(eightChar.getMonthGan())}${toHangul(eightChar.getMonthZhi())}월 ` +
                        `${toHangul(eightChar.getDayGan())}${toHangul(eightChar.getDayZhi())}일 ` +
                        `${toHangul(eightChar.getHourGan())}${toHangul(eightChar.getHourZhi())}시`;

        // 오행 분석
        const wuxing = analyzeWuxing(sajuText);
        const balance = getStrongestWeakest(wuxing);

        return {
            text: sajuText,
            wuxing: wuxing,
            balance: balance,
            dayMaster: toHangul(eightChar.getDayGan())
        };
    } catch (e) {
        console.error("Saju Calculation Error:", e);
        return null;
    }
}

// [8] 점성학 데이터 계산
function calculateAstrologyData(userInfo) {
    try {
        const dateStr = userInfo.birthDate.trim();
        const timeStr = userInfo.birthTime ? userInfo.birthTime.trim() : '12:00';
        
        const dateMatch = dateStr.match(/(\d{4})[.-]?(\d{1,2})[.-]?(\d{1,2})/);
        const timeMatch = timeStr.match(/(\d{1,2}):?(\d{2})?/);
        
        if (!dateMatch) return null;
        
        const year = parseInt(dateMatch[1]);
        const month = parseInt(dateMatch[2]);
        const day = parseInt(dateMatch[3]);
        const hour = timeMatch ? parseInt(timeMatch[1]) : 12;
        const minute = timeMatch && timeMatch[2] ? parseInt(timeMatch[2]) : 0;
        
        // 기본 위도/경도 (서울 기준, 실제로는 사용자 입력 받아야 함)
        const lat = userInfo.latitude || 37.5665;
        const lng = userInfo.longitude || 126.9780;
        
        const sunLon = calculateSunLongitude(year, month, day);
        const sunSign = getZodiacSign(sunLon);
        
        // 달 위치 근사 (실제로는 정확한 계산 필요)
        const moonLon = (sunLon + 13.176358 * day) % 360;
        const moonSign = getZodiacSign(moonLon);
        
        // 하우스 계산
        const houseData = calculateHouses(lat, lng, year, month, day, hour, minute);
        
        return {
            sunSign: sunSign,
            moonSign: moonSign,
            ascendant: getZodiacSign(houseData.ascendant),
            houses: houseData.houses,
            sunLongitude: sunLon.toFixed(2),
            moonLongitude: moonLon.toFixed(2)
        };
    } catch (e) {
        console.error("Astrology Calculation Error:", e);
        return null;
    }
}

// [9] 세션 관리 (간단한 메모리 저장소)
const userSessions = new Map();

function initSession(userId) {
    return {
        consultationCount: 0,
        questionCount: 0,
        userData: null,
        mode: null
    };
}

function getSession(userId) {
    if (!userSessions.has(userId)) {
        userSessions.set(userId, initSession(userId));
    }
    return userSessions.get(userId);
}

// [10] 프롬프트 생성
const BASE_INSTRUCTION = `
당신은 고대의 지혜와 미래의 AI가 결합된 'Auriton InsightAI'의 마스터입니다.
모든 답변은 한국어 경어체(해요체)로 작성하세요.
절대로 뻔한 이론적인 설명(예: "태양은 자아를 상징하며...")을 하지 마세요.
사용자는 점성학 강의를 듣고 싶은 게 아니라, "나에 대한 해석"을 원합니다.
직설적이고, 통찰력 있게, 사용자의 내면을 꿰뚫어 보는 듯한 톤으로 말하세요.
`;

function getSajuPrompt(sajuData, isInitial = true) {
    const charLimit = isInitial ? 680 : 500;
    
    return `
${BASE_INSTRUCTION}

[분석 데이터]
- 사주 명식: ${sajuData.text}
- 일간(日干): ${sajuData.dayMaster}
- 오행 분포: 목=${sajuData.wuxing.목} 화=${sajuData.wuxing.화} 토=${sajuData.wuxing.토} 금=${sajuData.wuxing.금} 수=${sajuData.wuxing.수}
- 가장 강한 기운: ${sajuData.balance.strongest}
- 가장 약한 기운: ${sajuData.balance.weakest}

[작성 규칙]
1. **반드시 첫 줄에 "사주 명식: ${sajuData.text}" 출력**
2. 글자 수 제한: **정확히 ${charLimit}자 이내** (공백 포함)
3. 일간(${sajuData.dayMaster})의 특성을 핵심으로 해석
4. 오행 균형을 바탕으로 성격과 운세 분석
5. 구체적인 개운 방법 제시 (색상, 방향, 행동 지침)
6. ${isInitial ? '전체적인 운명 해석' : '질문에 대한 명확한 답변'}

**중요: 글자 수를 정확히 지켜주세요. ${charLimit}자를 초과하면 안 됩니다.**
`;
}

function getAstrologyPrompt(astroData, isInitial = true) {
    const charLimit = isInitial ? 680 : 500;
    
    const houseDesc = astroData.houses.slice(0, 4).map(h => 
        `${h.number}하우스(${h.sign})`
    ).join(', ');
    
    return `
${BASE_INSTRUCTION}

[천문 데이터]
- 태양: ${astroData.sunSign} (황경 ${astroData.sunLongitude}°)
- 달: ${astroData.moonSign} (황경 ${astroData.moonLongitude}°)
- 상승궁(ASC): ${astroData.ascendant}
- 주요 하우스: ${houseDesc}

[작성 규칙]
1. 글자 수 제한: **정확히 ${charLimit}자 이내** (공백 포함)
2. Big 3(태양, 달, 상승궁) 중심 해석
3. 하우스별 생활 영역 분석 (1~4하우스)
4. 이론 설명 금지, 직관적 통찰만 제공
5. ${isInitial ? '전체 성격 및 운명 해석' : '질문에 대한 명확한 답변'}

**중요: 글자 수를 정확히 지켜주세요. ${charLimit}자를 초과하면 안 됩니다.**
`;
}

// [11] API 라우트
app.post('/api/saju/consultation', async (req, res) => {
    try {
        const { rawData, userId = 'default' } = req.body;
        const session = getSession(userId);
        
        const sajuData = calculateSajuText(rawData.userInfo);
        if (!sajuData) {
            return res.status(400).json({ 
                success: false, 
                error: '날짜 정보가 부족하거나 형식이 틀립니다.' 
            });
        }

        session.userData = sajuData;
        session.mode = 'saju';
        session.consultationCount = 1;
        session.questionCount = 0;

        const prompt = getSajuPrompt(sajuData, true);
        const consultation = await callGeminiAPI(prompt, 1500);
        
        res.json({ success: true, consultation });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/saju/chat', async (req, res) => {
    try {
        const { userMessage, rawData, userId = 'default' } = req.body;
        const session = getSession(userId);
        
        // 질문 횟수 제한 체크
        if (session.questionCount >= 5) {
            return res.json({ 
                success: true, 
                answer: '추가 질문은 5회까지만 가능합니다. 새로운 상담을 시작해주세요.' 
            });
        }
        
        const sajuData = session.userData || calculateSajuText(rawData.userInfo);
        if (!sajuData) {
            return res.json({ 
                success: false, 
                error: '사주 데이터를 불러올 수 없습니다.' 
            });
        }
        
        session.questionCount++;
        
        const prompt = `
${getSajuPrompt(sajuData, false)}

[추가 질문 ${session.questionCount}/5]
질문: "${userMessage}"

위 사주 명식을 바탕으로 질문에 답변하되, 500자 이내로 간결하게 작성하세요.
`;
        
        const answer = await callGeminiAPI(prompt, 1000);
        res.json({ success: true, answer, remainingQuestions: 5 - session.questionCount });
    } catch (e) {
        res.status(500).json({ success: false, error: 'Chat Error' });
    }
});

app.post('/api/astrology/consultation', async (req, res) => {
    try {
        const { rawData, userId = 'default' } = req.body;
        const session = getSession(userId);
        
        const astroData = calculateAstrologyData(rawData.userInfo);
        if (!astroData) {
            return res.status(400).json({ 
                success: false, 
                error: '생년월일 정보가 올바르지 않습니다.' 
            });
        }

        session.userData = astroData;
        session.mode = 'astrology';
        session.consultationCount = 1;
        session.questionCount = 0;

        const prompt = getAstrologyPrompt(astroData, true);
        const consultation = await callGeminiAPI(prompt, 1500);
        
        res.json({ success: true, consultation });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/astrology/chat', async (req, res) => {
    try {
        const { userMessage, rawData, userId = 'default' } = req.body;
        const session = getSession(userId);
        
        if (session.questionCount >= 5) {
            return res.json({ 
                success: true, 
                answer: '추가 질문은 5회까지만 가능합니다. 새로운 상담을 시작해주세요.' 
            });
        }
        
        const astroData = session.userData || calculateAstrologyData(rawData.userInfo);
        if (!astroData) {
            return res.json({ 
                success: false, 
                error: '점성학 데이터를 불러올 수 없습니다.' 
            });
        }
        
        session.questionCount++;
        
        const prompt = `
${getAstrologyPrompt(astroData, false)}

[추가 질문 ${session.questionCount}/5]
질문: "${userMessage}"

위 천문 데이터를 바탕으로 질문에 답변하되, 500자 이내로 간결하게 작성하세요.
`;
        
        const answer = await callGeminiAPI(prompt, 1000);
        res.json({ success: true, answer, remainingQuestions: 5 - session.questionCount });
    } catch (e) {
        res.status(500).json({ success: false, error: 'Chat Error' });
    }
});

// 세션 리셋 엔드포인트
app.post('/api/reset-session', (req, res) => {
    const { userId = 'default' } = req.body;
    userSessions.delete(userId);
    res.json({ success: true, message: '세션이 초기화되었습니다.' });
});

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log(`🚀 Server running: http://localhost:${PORT}`));
}

export default app;
