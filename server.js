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
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : [];

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://cdnjs.cloudflare.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https://raw.githubusercontent.com"],
            connectSrc: ["'self'"],
        }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: false,
}));

app.use(cors({
    origin: function (origin, callback) {
        // 같은 도메인(same-origin) 요청은 origin이 없거나 동일 → 허용
        if (!origin) return callback(null, true);
        // ALLOWED_ORIGINS 설정 시 해당 목록만 허용, 미설정 시 같은 도메인 요청 허용
        if (ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('CORS not allowed'));
        }
    },
    credentials: true
}));
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

// [1-2] 입력값 검증 헬퍼
function sanitizeString(str, maxLen = 100) {
    if (typeof str !== 'string') return '';
    return str.replace(/<[^>]*>/g, '').trim().slice(0, maxLen);
}

function validateBirthDate(dateStr) {
    if (typeof dateStr !== 'string') return false;
    const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return false;
    const [, y, m, d] = match.map(Number);
    if (y < 1900 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return false;
    return true;
}

function validateUserInfo(userInfo) {
    if (!userInfo || typeof userInfo !== 'object') return '사용자 정보가 누락되었습니다.';
    if (!userInfo.birthDate || !validateBirthDate(userInfo.birthDate)) return '생년월일 형식이 올바르지 않습니다. (YYYY-MM-DD)';
    if (userInfo.name) userInfo.name = sanitizeString(userInfo.name, 50);
    if (userInfo.gender) userInfo.gender = sanitizeString(userInfo.gender, 10);
    if (userInfo.location) userInfo.location = sanitizeString(userInfo.location, 100);
    if (userInfo.birthTime && !/^\d{2}:\d{2}$/.test(userInfo.birthTime)) userInfo.birthTime = '12:00';
    const validCalTypes = ['양력', '음력', '음력(윤)', 'solar', 'lunar', 'lunar-leap'];
    if (userInfo.calendarType && !validCalTypes.includes(userInfo.calendarType)) userInfo.calendarType = 'solar';
    return null;
}

function validateUserMessage(msg) {
    if (typeof msg !== 'string') return '';
    return msg.replace(/<[^>]*>/g, '').trim().slice(0, 500);
}

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

// 동적 날짜 생성 함수
const HEAVENLY_STEMS = ['경', '신', '임', '계', '갑', '을', '병', '정', '무', '기'];
const EARTHLY_BRANCHES = ['신', '유', '술', '해', '자', '축', '인', '묘', '진', '사', '오', '미'];
const ANIMALS = ['원숭이', '닭', '개', '돼지', '쥐', '소', '호랑이', '토끼', '용', '뱀', '말', '양'];
const STEM_COLORS = { '갑': '푸른', '을': '푸른', '병': '붉은', '정': '붉은', '무': '누런', '기': '누런', '경': '흰', '신': '흰', '임': '검은', '계': '검은' };

function getYearInfo(year) {
    const stemIdx = year % 10;
    const branchIdx = year % 12;
    const stem = HEAVENLY_STEMS[stemIdx];
    const branch = EARTHLY_BRANCHES[branchIdx];
    const animal = ANIMALS[branchIdx];
    const color = STEM_COLORS[stem] || '';
    return { stem, branch, animal, color, ganji: `${stem}${branch}` };
}

function getTodayString() {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    const d = now.getDate();
    const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    return `${y}년 ${m}월 ${d}일 (${days[now.getDay()]})`;
}

function buildBaseInstruction() {
    const now = new Date();
    const thisYear = now.getFullYear();
    const info = getYearInfo(thisYear);

    const nearbyYears = [];
    for (let y = thisYear - 3; y <= thisYear + 2; y++) {
        const yi = getYearInfo(y);
        const label = y === thisYear ? ' ← ★ 올해 ★' : y < thisYear ? ' - 이미 지남' : y === thisYear + 1 ? ' - 내년' : '';
        nearbyYears.push(`- ${y}년 = ${yi.ganji}년 (${yi.color} ${yi.animal})${label}`);
    }

    return `
당신은 고대의 지혜와 미래의 AI가 결합된 'Auriton InsightAI'의 마스터입니다.

**📅 현재 시점 정보 (절대 틀리지 마세요!)**
- 오늘 날짜: ${getTodayString()}
- 올해: ${thisYear}년 = ${info.ganji}년 = ${info.color} ${info.animal}의 해

**📆 주변 연도 참고 (절대 혼동하지 마세요):**
${nearbyYears.join('\n')}

**🚨 절대 규칙:**
1. "올해"는 항상 ${thisYear}년, ${info.ganji}년, ${info.color} ${info.animal}의 해입니다
2. ${thisYear}년을 다른 연도로 절대 착각하지 마세요
3. 연도를 언급할 때는 반드시 위 정보를 참고하세요
4. 10년 운세 등에서 연도를 나열할 때도 위 정보 기준으로 정확히 계산하세요

모든 답변은 한국어 경어체(해요체)로 작성하세요.
절대로 뻔한 이론적인 설명은 하지 말고, 사용자에 대한 통찰과 해석을 제공하세요.
`;
}

const BASE_INSTRUCTION = buildBaseInstruction();

const HAN_TO_HANGUL = {
    '甲': '갑', '乙': '을', '丙': '병', '丁': '정', '戊': '무', '己': '기', '庚': '경', '辛': '신', '壬': '임', '癸': '계',
    '子': '자', '丑': '축', '寅': '인', '卯': '묘', '辰': '진', '巳': '사', '午': '오', '未': '미', '申': '신', '酉': '유', '戌': '술', '亥': '해'
};

const toHangul = (str) => {
    if (!str) return '';
    return str.split('').map(char => HAN_TO_HANGUL[char] || char).join('');
};

// [3-2] 음력을 양력으로 변환하는 함수 (점성학용)
function convertToSolar(userInfo) {
    console.log("🔄 [Convert to Solar] Input:", JSON.stringify(userInfo));
    
    try {
        if (!userInfo || !userInfo.birthDate) {
            throw new Error("생년월일 정보가 누락되었습니다.");
        }

        const parts = userInfo.birthDate.split('-');
        if (parts.length !== 3) {
            throw new Error(`날짜 형식이 잘못되었습니다 (${userInfo.birthDate})`);
        }

        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const day = parseInt(parts[2], 10);

        if (isNaN(year) || isNaN(month) || isNaN(day)) {
            throw new Error("날짜에 숫자가 아닌 값이 포함되어 있습니다.");
        }

        const calType = (userInfo.calendarType || 'solar').toLowerCase();

        // 음력이면 양력으로 변환
        if (calType.includes('lunar') || calType.includes('음력')) {
            const isLeapMonth = calType.includes('윤') || calType.includes('leap');
            console.log(`🌙→☀️ Converting Lunar to Solar... ${isLeapMonth ? '(윤달)' : '(평달)'}`);
            
            try {
                const lunarObj = Lunar.fromYmdHms(year, month, day, 12, 0, 0, isLeapMonth ? 1 : 0);
                if (!lunarObj) throw new Error("음력 날짜 객체 생성 실패");
                
                const solarObj = lunarObj.getSolar();
                const solarYear = solarObj.getYear();
                const solarMonth = solarObj.getMonth();
                const solarDay = solarObj.getDay();
                
                console.log(`✅ Converted: ${year}-${month}-${day} (음력) → ${solarYear}-${solarMonth}-${solarDay} (양력)`);
                
                return {
                    birthDate: `${solarYear}-${String(solarMonth).padStart(2, '0')}-${String(solarDay).padStart(2, '0')}`,
                    originalDate: userInfo.birthDate,
                    originalCalendar: userInfo.calendarType,
                    converted: true
                };
            } catch (e) {
                throw new Error(`음력→양력 변환 실패: ${e.message}`);
            }
        } else {
            // 이미 양력이면 그대로 반환
            console.log("☀️ Already Solar, no conversion needed");
            return {
                birthDate: userInfo.birthDate,
                converted: false
            };
        }
    } catch (e) {
        console.error("❌ [Conversion Error]:", e.message);
        throw e;
    }
}

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

        if (!person1 || !person2) {
            return res.json({ success: false, error: '두 사람의 정보가 모두 필요합니다.' });
        }

        const err1 = validateUserInfo(person1);
        const err2 = validateUserInfo(person2);
        if (err1) return res.json({ success: false, error: `Person 1: ${err1}` });
        if (err2) return res.json({ success: false, error: `Person 2: ${err2}` });

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
            error: '궁합 분석 중 시스템 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
        });
    }
});

// [5-2] 운세 세분화 API
app.post('/api/saju/fortune', async (req, res) => {
    try {
        const { rawData, fortuneType } = req.body;

        const validFortuneTypes = ['daily', 'weekly', 'monthly', 'yearly', 'decade', 'total'];
        if (!validFortuneTypes.includes(fortuneType)) {
            return res.json({ success: false, error: '올바른 운세 타입이 아닙니다.' });
        }
        const vErr = validateUserInfo(rawData?.userInfo);
        if (vErr) return res.json({ success: false, error: vErr });

        const sajuText = calculateSajuText(rawData?.userInfo);
        
        if (!sajuText || sajuText.startsWith('ERROR:')) {
            return res.json({ 
                success: false, 
                error: '사주 정보를 불러올 수 없습니다.' 
            });
        }

        const now = new Date();
        const thisYear = now.getFullYear();
        const thisMonth = now.getMonth() + 1;
        const yi = getYearInfo(thisYear);

        const fortunePrompts = {
            daily: {
                title: '오늘의 운세',
                maxLength: 700,
                instruction: `${getTodayString()}(${yi.ganji}년) 오늘 하루의 에너지 흐름과 주의사항을 700자 이내로 간결하게 설명하세요.`
            },
            weekly: {
                title: '이번 주 운세',
                maxLength: 700,
                instruction: `${thisYear}년 ${thisMonth}월 이번 주의 전반적인 흐름과 중요 포인트를 700자 이내로 설명하세요.`
            },
            monthly: {
                title: '이번 달 운세',
                maxLength: 700,
                instruction: `${thisYear}년 ${thisMonth}월(${yi.ganji}년) 이번 달의 운세와 집중해야 할 영역을 700자 이내로 설명하세요.`
            },
            yearly: {
                title: '올해의 운세',
                maxLength: 1500,
                instruction: `${thisYear}년 ${yi.ganji}년(${yi.color} ${yi.animal}의 해) 전체의 큰 흐름, 기회와 도전을 1500자 이내로 상세히 설명하세요.`
            },
            decade: {
                title: '10년 운세',
                maxLength: 4000,
                instruction: `${thisYear}년(${yi.ganji}년)부터 ${thisYear + 10}년까지 향후 10년간의 대운 흐름과 각 시기별 특징을 4000자 이내로 깊이 있게 분석하세요. 각 연도의 간지를 정확히 계산하여 언급하세요.`
            },
            total: {
                title: '총운',
                maxLength: 2000,
                instruction: '일생의 큰 흐름과 타고난 운명적 특징을 2000자 이내로 종합적으로 설명하세요.'
            }
        };

        const config = fortunePrompts[fortuneType];

        const prompt = `
${BASE_INSTRUCTION}

**재확인: 오늘은 ${getTodayString()}, ${yi.ganji}년(${yi.color} ${yi.animal}의 해)입니다**

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
        const vErr = validateUserInfo(rawData?.userInfo);
        if (vErr) return res.json({ success: false, consultation: `입력 오류: ${vErr}` });

        const sajuText = calculateSajuText(rawData?.userInfo);
        
        if (!sajuText || sajuText.startsWith('ERROR:')) {
            const errorMsg = sajuText ? sajuText.replace('ERROR: ', '') : '알 수 없는 오류';
            return res.json({ 
                success: true, 
                consultation: `🚫 **분석 오류 발생**\n\n죄송합니다. 오류가 발생했습니다.\n\n**상세 에러:**\n${errorMsg}\n\n다시 시도해주세요.` 
            });
        }

        const timeWarning = rawData.userInfo.timeUnknown 
            ? '\n\n⚠️ **시간 정보 없음**: 시주(時柱)는 정오(12:00) 기준으로 참고만 하세요. 일주까지의 분석이 더 정확합니다.' 
            : '';

        const cyi = getYearInfo(new Date().getFullYear());
        const prompt = `
${BASE_INSTRUCTION}

**재확인: 오늘은 ${getTodayString()}, ${cyi.ganji}년(${cyi.color} ${cyi.animal}의 해)입니다**

[분석 데이터]
- 이름: ${rawData.userInfo.name} (${rawData.userInfo.gender})
- 확정 사주 명식: ${sajuText}${timeWarning}

**🚨 중요: 반드시 답변의 맨 첫 줄에 "사주 명식: ${sajuText}"를 출력한 후 해설을 시작하세요.**

1. **핵심 본성 (일간 분석)**: 이 사람이 어떤 기질을 타고났는지 비유를 들어 설명하세요.
2. **에너지의 균형**: 강한 기운과 부족한 기운이 삶에 미치는 영향을 분석하세요.
3. **${new Date().getFullYear()}년 ${cyi.ganji}년의 영향**: 올해 에너지가 이 사람에게 미치는 영향을 분석하세요.
4. **현대적 개운법**: 구체적인 색상, 행동 지침을 제안하세요.
`;
        const consultation = await callGeminiAPI(prompt);
        res.json({ success: true, consultation });

    } catch (error) {
        console.error("❌ [API Route Error]", error);
        res.json({ success: false, consultation: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' });
    }
});

// [5-4] 점성학 상담 API
app.post('/api/astrology/consultation', async (req, res) => {
    try {
        const { rawData } = req.body;
        const vErr = validateUserInfo(rawData?.userInfo);
        if (vErr) return res.json({ success: false, consultation: `입력 오류: ${vErr}` });
        
        // 음력이면 양력으로 변환
        const conversionResult = convertToSolar(rawData.userInfo);
        const solarDate = conversionResult.birthDate;
        
        let dateInfo = '';
        if (conversionResult.converted) {
            dateInfo = `\n- 원본 입력: ${conversionResult.originalDate} (${conversionResult.originalCalendar})\n- 변환된 양력: ${solarDate}`;
            console.log(`✅ Converted for Astrology: ${conversionResult.originalDate} → ${solarDate}`);
        } else {
            dateInfo = `\n- 양력: ${solarDate}`;
            console.log(`✅ Using Solar Date: ${solarDate}`);
        }

        const timeWarning = rawData.userInfo.timeUnknown 
            ? '\n\n⚠️ **시간 정보 없음**: 상승궁(ASC)은 정오(12:00) 기준이므로 정확하지 않을 수 있습니다. 태양, 달, 행성 배치 분석에 집중하세요.' 
            : '';
        
        const prompt = `
${BASE_INSTRUCTION}

**참고: 오늘은 ${getTodayString()}입니다**

[점성학 분석]
- 이름: ${rawData.userInfo.name} (${rawData.userInfo.gender})
- 생년월일: ${solarDate} ${rawData.userInfo.birthTime}${dateInfo}
- 출생지: ${rawData.userInfo.location}${timeWarning}

서양 점성학 관점에서 이 사람의:
1. **Big 3 (태양/달/상승궁)**: 핵심 성격과 내면
2. **주요 행성 배치**: 금성, 화성, 수성의 영향
3. **현재 운행 흐름**: ${new Date().getFullYear()}년 주요 행성의 움직임이 미치는 영향

**중요**: 점성학은 양력(태양력) 기반이므로, 위의 양력 날짜를 기준으로 분석하세요.
용어 설명은 최소화하고 실질적인 통찰을 제공하세요.
`;
        const consultation = await callGeminiAPI(prompt);
        res.json({ success: true, consultation });
    } catch (error) {
        console.error("❌ [Astrology Error]", error);
        res.json({
            success: false,
            consultation: '점성학 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
        });
    }
});

// [5-7] 점성학 운행 API (NEW!)
app.post('/api/astrology/transit', async (req, res) => {
    try {
        const { rawData, transitType } = req.body;

        const validTransitTypes = ['monthly', 'yearly', 'decade'];
        if (!validTransitTypes.includes(transitType)) {
            return res.json({ success: false, error: '올바른 운행 타입이 아닙니다.' });
        }
        const vErr = validateUserInfo(rawData?.userInfo);
        if (vErr) return res.json({ success: false, error: vErr });

        const tNow = new Date();
        const tYear = tNow.getFullYear();
        const tMonth = tNow.getMonth() + 1;

        const transitPrompts = {
            monthly: {
                title: '이번 달 행성 운행',
                maxLength: 700,
                instruction: `이번 달(${tYear}년 ${tMonth}월)의 주요 행성 운행과 그것이 사용자에게 미치는 영향을 700자 이내로 설명하세요.`
            },
            yearly: {
                title: '올해 행성 운행',
                maxLength: 1500,
                instruction: `${tYear}년 한 해 동안의 주요 행성 운행(목성, 토성, 천왕성 등)과 그 영향을 1500자 이내로 상세히 설명하세요.`
            },
            decade: {
                title: '10년 행성 운행',
                maxLength: 4000,
                instruction: `${tYear}-${tYear + 10}년 10년간의 외행성(목성, 토성, 천왕성, 해왕성, 명왕성) 운행과 각 시기별 주요 영향을 4000자 이내로 깊이 있게 분석하세요.`
            }
        };

        const config = transitPrompts[transitType];

        // 음력이면 양력으로 변환
        const conversionResult = convertToSolar(rawData.userInfo);
        const solarDate = conversionResult.birthDate;
        
        let dateInfo = '';
        if (conversionResult.converted) {
            dateInfo = ` (원본: ${conversionResult.originalDate} ${conversionResult.originalCalendar} → 변환: ${solarDate} 양력)`;
        }

        const prompt = `
${BASE_INSTRUCTION}
[점성학 ${config.title} 분석]
- 이름: ${rawData.userInfo.name} (${rawData.userInfo.gender})
- 출생 정보: ${solarDate} ${rawData.userInfo.birthTime}${dateInfo}
- 출생지: ${rawData.userInfo.location}

${config.instruction}

**중요**: 점성학은 양력 기반이므로 위의 양력 날짜로 분석하세요.
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
        const vErr = validateUserInfo(rawData?.userInfo);
        if (vErr) return res.json({ success: false, error: vErr });
        const safeMessage = validateUserMessage(userMessage);
        if (!safeMessage) return res.json({ success: false, error: '질문을 입력해주세요.' });

        // 음력이면 양력으로 변환
        const conversionResult = convertToSolar(rawData.userInfo);
        const solarDate = conversionResult.birthDate;

        const prompt = `
${BASE_INSTRUCTION}

**참고: 오늘은 ${getTodayString()}입니다**

[상황: 점성학 상세 상담 채팅]
- 사용자: ${rawData.userInfo.name}
- 출생 정보 (양력): ${solarDate} ${rawData.userInfo.birthTime}
- 질문: "${safeMessage}"

점성학적 관점에서 답변하되, 결론부터 말하고 이유를 설명하세요.
**중요**: 점성학은 양력 기반이므로 위의 양력 날짜로 분석하세요.
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
        const vErr = validateUserInfo(rawData?.userInfo);
        if (vErr) return res.json({ success: false, error: vErr });
        const safeMessage = validateUserMessage(userMessage);
        if (!safeMessage) return res.json({ success: false, error: '질문을 입력해주세요.' });

        const sajuText = calculateSajuText(rawData.userInfo);

        if (!sajuText || sajuText.startsWith('ERROR:')) {
             return res.json({ success: true, answer: "죄송합니다. 사주 정보를 불러오는 중 오류가 발생했습니다." });
        }

        const prompt = `
${BASE_INSTRUCTION}

**재확인: 오늘은 ${getTodayString()}입니다**

[상황: 사주 상세 상담 채팅]
- 사용자: ${rawData.userInfo.name}
- **확정 사주 명식: ${sajuText}**
- 질문: "${safeMessage}"

🚨 **작성 지침:**
1. 위 '확정 사주 명식'을 근거로 일관성 있게 답변하세요.
2. 결론부터 말하고 사주적 이유를 설명하세요.
3. 연도를 언급할 때는 2026년=병오년임을 명심하세요.
`;
        const answer = await callGeminiAPI(prompt);
        res.json({ success: true, answer });
    } catch (e) {
        res.status(500).json({ success: false, error: 'Chat Error' });
    }
});


if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log(`🚀 Server running: http://localhost:${PORT}`));
}

export default app;
