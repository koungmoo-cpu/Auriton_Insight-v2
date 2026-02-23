/* ============================================
   🖥️ Auriton InsightAI v5.0 - Full Refactor
   Updated: 2025-02-24
   - 날짜 동적 처리 (하드코딩 제거)
   - 중복 라우트 제거 (astrology/chat)
   - validateUserInfo / getTodayString / getYearInfo 구현
   - 30일 일진 서버에서 정확히 계산 후 AI에 전달
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

// ─────────────────────────────────────────────
// [1] 보안 및 미들웨어
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// [2] Gemini API 초기화
// ─────────────────────────────────────────────
const apiKey = process.env.GEMINI_API_KEY;
let model = null;

if (apiKey && apiKey !== 'PLACEHOLDER_API_KEY') {
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    } catch (e) {
        console.error("Model Init Failed", e);
    }
}

async function callGeminiAPI(prompt, maxTokens = 2500) {
    if (!model) throw new Error('API Key 설정이 필요합니다.');
    const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: maxTokens }
    });
    return await result.response.text();
}

// ─────────────────────────────────────────────
// [3] 날짜 유틸리티 (동적 처리)
// ─────────────────────────────────────────────

/** 오늘 날짜를 "2026년 2월 24일 (월요일)" 형식으로 반환 */
function getTodayString() {
    const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    const now = new Date();
    return `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일 (${days[now.getDay()]})`;
}

/** 연도별 간지 정보 반환 */
function getYearInfo(year) {
    const ganjiList = [
        { ganji: '갑자', color: '푸른', animal: '쥐' },
        { ganji: '을축', color: '푸른', animal: '소' },
        { ganji: '병인', color: '붉은', animal: '호랑이' },
        { ganji: '정묘', color: '붉은', animal: '토끼' },
        { ganji: '무진', color: '누런', animal: '용' },
        { ganji: '기사', color: '누런', animal: '뱀' },
        { ganji: '경오', color: '흰', animal: '말' },
        { ganji: '신미', color: '흰', animal: '양' },
        { ganji: '임신', color: '검은', animal: '원숭이' },
        { ganji: '계유', color: '검은', animal: '닭' },
        { ganji: '갑술', color: '푸른', animal: '개' },
        { ganji: '을해', color: '푸른', animal: '돼지' },
        { ganji: '병자', color: '붉은', animal: '쥐' },
        { ganji: '정축', color: '붉은', animal: '소' },
        { ganji: '무인', color: '누런', animal: '호랑이' },
        { ganji: '기묘', color: '누런', animal: '토끼' },
        { ganji: '경진', color: '흰', animal: '용' },
        { ganji: '신사', color: '흰', animal: '뱀' },
        { ganji: '임오', color: '검은', animal: '말' },
        { ganji: '계미', color: '검은', animal: '양' },
        { ganji: '갑신', color: '푸른', animal: '원숭이' },
        { ganji: '을유', color: '푸른', animal: '닭' },
        { ganji: '병술', color: '붉은', animal: '개' },
        { ganji: '정해', color: '붉은', animal: '돼지' },
        { ganji: '무자', color: '누런', animal: '쥐' },
        { ganji: '기축', color: '누런', animal: '소' },
        { ganji: '경인', color: '흰', animal: '호랑이' },
        { ganji: '신묘', color: '흰', animal: '토끼' },
        { ganji: '임진', color: '검은', animal: '용' },
        { ganji: '계사', color: '검은', animal: '뱀' },
        { ganji: '갑오', color: '푸른', animal: '말' },
        { ganji: '을미', color: '푸른', animal: '양' },
        { ganji: '병신', color: '붉은', animal: '원숭이' },
        { ganji: '정유', color: '붉은', animal: '닭' },
        { ganji: '무술', color: '누런', animal: '개' },
        { ganji: '기해', color: '누런', animal: '돼지' },
        { ganji: '경자', color: '흰', animal: '쥐' },
        { ganji: '신축', color: '흰', animal: '소' },
        { ganji: '임인', color: '검은', animal: '호랑이' },
        { ganji: '계묘', color: '검은', animal: '토끼' },
        { ganji: '갑진', color: '푸른', animal: '용' },
        { ganji: '을사', color: '푸른', animal: '뱀' },
        { ganji: '병오', color: '붉은', animal: '말' },   // 2026
        { ganji: '정미', color: '붉은', animal: '양' },
        { ganji: '무신', color: '누런', animal: '원숭이' },
        { ganji: '기유', color: '누런', animal: '닭' },
        { ganji: '경술', color: '흰', animal: '개' },
        { ganji: '신해', color: '흰', animal: '돼지' },
        { ganji: '임자', color: '검은', animal: '쥐' },
        { ganji: '계축', color: '검은', animal: '소' },
        { ganji: '갑인', color: '푸른', animal: '호랑이' },
        { ganji: '을묘', color: '푸른', animal: '토끼' },
        { ganji: '병진', color: '붉은', animal: '용' },
        { ganji: '정사', color: '붉은', animal: '뱀' },
        { ganji: '무오', color: '누런', animal: '말' },
        { ganji: '기미', color: '누런', animal: '양' },
        { ganji: '경신', color: '흰', animal: '원숭이' },
        { ganji: '신유', color: '흰', animal: '닭' },
        { ganji: '임술', color: '검은', animal: '개' },
        { ganji: '계해', color: '검은', animal: '돼지' },
    ];
    // 갑자년 기준: 1924년이 갑자년 (60갑자 기준)
    const BASE_YEAR = 1924;
    const idx = ((year - BASE_YEAR) % 60 + 60) % 60;
    return ganjiList[idx];
}

/** 현재 연도 정보 문자열 생성 */
function buildDateContext() {
    const now = new Date();
    const year = now.getFullYear();
    const yi = getYearInfo(year);
    const prevYi = getYearInfo(year - 1);
    const nextYi = getYearInfo(year + 1);

    return `
**📅 현재 시점 정보 (절대 틀리지 마세요!)**
- 오늘 날짜: ${getTodayString()}
- 올해: ${year}년 = ${yi.ganji}년 = ${yi.color} ${yi.animal}의 해

**📆 주변 연도 참고:**
- ${year - 2}년 = ${getYearInfo(year - 2).ganji}년 (${getYearInfo(year - 2).color} ${getYearInfo(year - 2).animal}) - 이미 지남
- ${year - 1}년 = ${prevYi.ganji}년 (${prevYi.color} ${prevYi.animal}) - 작년
- ${year}년 = ${yi.ganji}년 (${yi.color} ${yi.animal}) ← ★ 올해 ★
- ${year + 1}년 = ${nextYi.ganji}년 (${nextYi.color} ${nextYi.animal}) - 내년

**🚨 절대 규칙:**
1. "올해"는 항상 ${year}년, ${yi.ganji}년, ${yi.color} ${yi.animal}의 해입니다.
2. 연도를 언급할 때는 반드시 위 정보를 기준으로 정확히 계산하세요.
`;
}

// ─────────────────────────────────────────────
// [4] BASE_INSTRUCTION (동적 날짜 포함)
// ─────────────────────────────────────────────
function buildBaseInstruction() {
    return `
당신은 고대의 지혜와 미래의 AI가 결합된 'Auriton InsightAI'의 마스터입니다.

${buildDateContext()}

모든 답변은 한국어 경어체(해요체)로 작성하세요.
절대로 뻔한 이론적인 설명은 하지 말고, 사용자에 대한 통찰과 해석을 제공하세요.
`;
}

// ─────────────────────────────────────────────
// [5] 한자 → 한글 매핑
// ─────────────────────────────────────────────
const HAN_TO_HANGUL = {
    '甲': '갑', '乙': '을', '丙': '병', '丁': '정', '戊': '무',
    '己': '기', '庚': '경', '辛': '신', '壬': '임', '癸': '계',
    '子': '자', '丑': '축', '寅': '인', '卯': '묘', '辰': '진',
    '巳': '사', '午': '오', '未': '미', '申': '신', '酉': '유',
    '戌': '술', '亥': '해'
};
const toHangul = (str) => str ? str.split('').map(c => HAN_TO_HANGUL[c] || c).join('') : '';

// ─────────────────────────────────────────────
// [6] 입력값 검증
// ─────────────────────────────────────────────
function validateUserInfo(userInfo) {
    if (!userInfo) return '사용자 정보가 없습니다.';
    if (!userInfo.name || userInfo.name.trim() === '') return '이름을 입력해주세요.';
    if (!userInfo.birthDate) return '생년월일을 입력해주세요.';
    const parts = userInfo.birthDate.split('-');
    if (parts.length !== 3) return '생년월일 형식이 올바르지 않습니다. (YYYY-MM-DD)';
    const [y, m, d] = parts.map(Number);
    if (isNaN(y) || isNaN(m) || isNaN(d)) return '생년월일에 숫자가 아닌 값이 포함되어 있습니다.';
    if (m < 1 || m > 12) return '월은 1~12 사이여야 합니다.';
    if (d < 1 || d > 31) return '일은 1~31 사이여야 합니다.';
    return null; // 오류 없음
}

// ─────────────────────────────────────────────
// [7] 음력 → 양력 변환
// ─────────────────────────────────────────────
function convertToSolar(userInfo) {
    console.log("🔄 [Convert to Solar] Input:", JSON.stringify(userInfo));
    try {
        const vErr = validateUserInfo(userInfo);
        if (vErr) throw new Error(vErr);

        const [year, month, day] = userInfo.birthDate.split('-').map(Number);
        const calType = (userInfo.calendarType || 'solar').toLowerCase();

        if (calType.includes('lunar') || calType.includes('음력')) {
            const isLeapMonth = calType.includes('윤') || calType.includes('leap');
            console.log(`🌙→☀️ Converting Lunar to Solar... ${isLeapMonth ? '(윤달)' : '(평달)'}`);
            const lunarObj = Lunar.fromYmdHms(year, month, day, 12, 0, 0, isLeapMonth ? 1 : 0);
            if (!lunarObj) throw new Error("음력 날짜 객체 생성 실패");
            const solarObj = lunarObj.getSolar();
            const sy = solarObj.getYear(), sm = solarObj.getMonth(), sd = solarObj.getDay();
            console.log(`✅ Converted: ${year}-${month}-${day} (음력) → ${sy}-${sm}-${sd} (양력)`);
            return {
                birthDate: `${sy}-${String(sm).padStart(2, '0')}-${String(sd).padStart(2, '0')}`,
                originalDate: userInfo.birthDate,
                originalCalendar: userInfo.calendarType,
                converted: true
            };
        } else {
            return { birthDate: userInfo.birthDate, converted: false };
        }
    } catch (e) {
        console.error("❌ [Conversion Error]:", e.message);
        throw e;
    }
}

// ─────────────────────────────────────────────
// [8] 사주 계산
// ─────────────────────────────────────────────
function calculateSajuText(userInfo) {
    console.log("🔍 [Calc Start] Input:", JSON.stringify(userInfo));
    try {
        const vErr = validateUserInfo(userInfo);
        if (vErr) throw new Error(vErr);

        const [year, month, day] = userInfo.birthDate.split('-').map(Number);
        let hour = 12;
        if (userInfo.birthTime && userInfo.birthTime !== 'unknown') {
            const m = userInfo.birthTime.match(/(\d+):(\d+)/);
            if (m) hour = parseInt(m[1], 10);
        }

        const calType = (userInfo.calendarType || 'solar').toLowerCase();
        let eightChar;

        if (calType.includes('lunar') || calType.includes('음력')) {
            const isLeapMonth = calType.includes('윤') || calType.includes('leap');
            const lunarObj = Lunar.fromYmdHms(year, month, day, hour, 0, 0, isLeapMonth ? 1 : 0);
            if (!lunarObj) throw new Error("음력 날짜 객체 생성 실패");
            eightChar = lunarObj.getEightChar();
        } else {
            const solarObj = Solar.fromYmdHms(year, month, day, hour, 0, 0);
            if (!solarObj) throw new Error("양력 날짜 객체 생성 실패");
            eightChar = solarObj.getLunar().getEightChar();
        }

        const result = [
            `${toHangul(eightChar.getYearGan())}${toHangul(eightChar.getYearZhi())}년`,
            `${toHangul(eightChar.getMonthGan())}${toHangul(eightChar.getMonthZhi())}월`,
            `${toHangul(eightChar.getDayGan())}${toHangul(eightChar.getDayZhi())}일`,
            `${toHangul(eightChar.getTimeGan())}${toHangul(eightChar.getTimeZhi())}시`,
        ].join(' ');

        console.log("✅ Saju Result:", result);
        return result;

    } catch (e) {
        console.error("❌ [Calculation Error]:", e.message);
        return `ERROR: ${e.message}`;
    }
}

// ─────────────────────────────────────────────
// [9] 30일 일진 서버에서 계산
// ─────────────────────────────────────────────
function calculate30DayJilJin(startDate) {
    const results = [];
    for (let i = 0; i < 30; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        try {
            const solar = Solar.fromYmdHms(d.getFullYear(), d.getMonth() + 1, d.getDate(), 12, 0, 0);
            const ec = solar.getLunar().getEightChar();
            results.push({
                date: `${d.getMonth() + 1}/${d.getDate()}`,
                jiljin: `${toHangul(ec.getDayGan())}${toHangul(ec.getDayZhi())}`
            });
        } catch (e) {
            results.push({ date: `${d.getMonth() + 1}/${d.getDate()}`, jiljin: '계산불가' });
        }
    }
    return results;
}

// ─────────────────────────────────────────────
// [10] API 라우트
// ─────────────────────────────────────────────

// [10-1] 궁합
app.post('/api/compatibility', async (req, res) => {
    try {
        const { person1, person2 } = req.body;
        if (!person1 || !person2) {
            return res.json({ success: false, error: '두 사람의 정보가 모두 필요합니다.' });
        }

        const saju1 = calculateSajuText(person1);
        const saju2 = calculateSajuText(person2);

        if (saju1.startsWith('ERROR:') || saju2.startsWith('ERROR:')) {
            const errMsg = saju1.startsWith('ERROR:') ? saju1 : saju2;
            return res.json({ success: false, error: `궁합 계산 오류\n\n${errMsg.replace('ERROR: ', '')}\n\n입력 정보를 다시 확인해주세요.` });
        }

        const prompt = `
${buildBaseInstruction()}

[궁합 분석]
- 첫 번째: ${person1.name} (${person1.gender}) - ${saju1}
- 두 번째: ${person2.name} (${person2.gender}) - ${saju2}

두 사람의 사주 궁합을 음양오행 관점에서 분석하고, 관계 발전을 위한 조언을 해주세요.
1. 음양오행 조화도
2. 상생상극 관계
3. 관계 발전을 위한 구체적 조언
`;
        const result = await callGeminiAPI(prompt);
        res.json({ success: true, analysis: result });

    } catch (error) {
        console.error("❌ [Compatibility Error]", error);
        res.json({ success: false, error: `궁합 분석 중 오류 발생\n\n${error.message}` });
    }
});

// [10-2] 운세 세분화 (일간/주간/월간/올해/10년/총운)
app.post('/api/saju/fortune', async (req, res) => {
    try {
        const { rawData, fortuneType } = req.body;
        const vErr = validateUserInfo(rawData?.userInfo);
        if (vErr) return res.json({ success: false, error: vErr });

        const sajuText = calculateSajuText(rawData.userInfo);
        if (sajuText.startsWith('ERROR:')) {
            return res.json({ success: false, error: sajuText.replace('ERROR: ', '') });
        }

        const now = new Date();
        const yi = getYearInfo(now.getFullYear());

        const fortunePrompts = {
            daily: {
                title: '오늘의 운세',
                maxLength: 700,
                instruction: `${getTodayString()} 오늘 하루의 에너지 흐름과 주의사항을 700자 이내로 간결하게 설명하세요.`
            },
            weekly: {
                title: '이번 주 운세',
                maxLength: 700,
                instruction: `${now.getFullYear()}년 ${now.getMonth() + 1}월 이번 주의 전반적인 흐름과 중요 포인트를 700자 이내로 설명하세요.`
            },
            monthly: {
                title: '이번 달 운세',
                maxLength: 700,
                instruction: `${now.getFullYear()}년 ${now.getMonth() + 1}월의 운세와 집중해야 할 영역을 700자 이내로 설명하세요.`
            },
            yearly: {
                title: '올해의 운세',
                maxLength: 1500,
                instruction: `${now.getFullYear()}년 ${yi.ganji}년(${yi.color} ${yi.animal}의 해) 전체의 큰 흐름, 기회와 도전을 1500자 이내로 상세히 설명하세요.`
            },
            decade: {
                title: '10년 운세',
                maxLength: 4000,
                instruction: `${now.getFullYear()}년(${yi.ganji}년)부터 ${now.getFullYear() + 10}년까지 향후 10년간의 대운 흐름과 각 시기별 특징을 4000자 이내로 깊이 있게 분석하세요. 각 연도의 간지를 정확히 계산하여 언급하세요.`
            },
            total: {
                title: '총운',
                maxLength: 2000,
                instruction: '일생의 큰 흐름과 타고난 운명적 특징을 2000자 이내로 종합적으로 설명하세요.'
            }
        };

        const config = fortunePrompts[fortuneType];
        if (!config) return res.json({ success: false, error: '올바른 운세 타입이 아닙니다.' });

        const prompt = `
${buildBaseInstruction()}

[${config.title} 분석]
- 이름: ${rawData.userInfo.name} (${rawData.userInfo.gender})
- 사주 명식: ${sajuText}
- 생년월일: ${rawData.userInfo.birthDate}

${config.instruction}

답변은 반드시 ${config.maxLength}자를 초과하지 않도록 작성하세요.
`;
        const tokenMap = { daily: 1200, weekly: 1200, monthly: 1200, yearly: 2500, decade: 4000, total: 3000 };
        const fortune = await callGeminiAPI(prompt, tokenMap[fortuneType] || 2500);
        res.json({ success: true, fortune, fortuneType: config.title });

    } catch (error) {
        console.error("❌ [Fortune Error]", error);
        res.json({ success: false, error: '운세 분석 중 오류가 발생했습니다.' });
    }
});

// [10-3] 사주 상담
app.post('/api/saju/consultation', async (req, res) => {
    try {
        const { rawData } = req.body;
        const vErr = validateUserInfo(rawData?.userInfo);
        if (vErr) return res.json({ success: false, error: vErr });

        const sajuText = calculateSajuText(rawData.userInfo);
        if (sajuText.startsWith('ERROR:')) {
            return res.json({ success: true, consultation: `🚫 **분석 오류**\n\n${sajuText.replace('ERROR: ', '')}\n\n다시 시도해주세요.` });
        }

        const timeWarning = rawData.userInfo.timeUnknown
            ? '\n\n⚠️ **시간 정보 없음**: 시주(時柱)는 정오(12:00) 기준으로 참고만 하세요.'
            : '';

        const prompt = `
${buildBaseInstruction()}

[분석 데이터]
- 이름: ${rawData.userInfo.name} (${rawData.userInfo.gender})
- 확정 사주 명식: ${sajuText}${timeWarning}

**🚨 중요: 반드시 답변의 맨 첫 줄에 "사주 명식: ${sajuText}"를 출력한 후 해설을 시작하세요.**

1. **핵심 본성 (일간 분석)**: 이 사람이 어떤 기질을 타고났는지 비유를 들어 설명하세요.
2. **에너지의 균형**: 강한 기운과 부족한 기운이 삶에 미치는 영향을 분석하세요.
3. **올해의 영향**: 올해 에너지가 이 사람에게 미치는 영향을 분석하세요.
4. **현대적 개운법**: 구체적인 색상, 행동 지침을 제안하세요.
`;
        const consultation = await callGeminiAPI(prompt);
        res.json({ success: true, consultation });

    } catch (error) {
        console.error("❌ [Consultation Error]", error);
        res.json({ success: false, error: `서버 오류: ${error.message}` });
    }
});

// [10-4] 점성학 상담
app.post('/api/astrology/consultation', async (req, res) => {
    try {
        const { rawData } = req.body;
        const vErr = validateUserInfo(rawData?.userInfo);
        if (vErr) return res.json({ success: false, error: vErr });

        const convResult = convertToSolar(rawData.userInfo);
        const solarDate = convResult.birthDate;
        const dateInfo = convResult.converted
            ? `\n- 원본: ${convResult.originalDate} (${convResult.originalCalendar}) → 변환된 양력: ${solarDate}`
            : `\n- 양력: ${solarDate}`;

        const timeWarning = rawData.userInfo.timeUnknown
            ? '\n\n⚠️ **시간 정보 없음**: 상승궁(ASC)은 정오(12:00) 기준이므로 정확하지 않을 수 있습니다.'
            : '';

        const prompt = `
${buildBaseInstruction()}

[점성학 분석]
- 이름: ${rawData.userInfo.name} (${rawData.userInfo.gender})
- 생년월일: ${solarDate} ${rawData.userInfo.birthTime}${dateInfo}
- 출생지: ${rawData.userInfo.location}${timeWarning}

서양 점성학 관점에서:
1. **Big 3 (태양/달/상승궁)**: 핵심 성격과 내면
2. **주요 행성 배치**: 금성, 화성, 수성의 영향
3. **현재 운행 흐름**: 올해 주요 행성의 움직임이 미치는 영향

**중요**: 점성학은 양력 기반이므로 위의 양력 날짜로 분석하세요.
용어 설명은 최소화하고 실질적인 통찰을 제공하세요.
`;
        const consultation = await callGeminiAPI(prompt);
        res.json({ success: true, consultation });

    } catch (error) {
        console.error("❌ [Astrology Error]", error);
        res.json({ success: false, error: `점성학 분석 오류: ${error.message}` });
    }
});

// [10-5] 점성학 운행
app.post('/api/astrology/transit', async (req, res) => {
    try {
        const { rawData, transitType } = req.body;
        const vErr = validateUserInfo(rawData?.userInfo);
        if (vErr) return res.json({ success: false, error: vErr });

        const now = new Date();
        const transitPrompts = {
            monthly: {
                title: '이번 달 행성 운행',
                maxLength: 700,
                instruction: `${now.getFullYear()}년 ${now.getMonth() + 1}월의 주요 행성 운행과 그것이 사용자에게 미치는 영향을 700자 이내로 설명하세요.`
            },
            yearly: {
                title: '올해 행성 운행',
                maxLength: 1500,
                instruction: `${now.getFullYear()}년 한 해 동안의 주요 행성 운행(목성, 토성, 천왕성 등)과 그 영향을 1500자 이내로 상세히 설명하세요.`
            },
            decade: {
                title: '10년 행성 운행',
                maxLength: 4000,
                instruction: `${now.getFullYear()}-${now.getFullYear() + 10}년 10년간의 외행성(목성, 토성, 천왕성, 해왕성, 명왕성) 운행과 각 시기별 주요 영향을 4000자 이내로 깊이 있게 분석하세요.`
            }
        };

        const config = transitPrompts[transitType];
        if (!config) return res.json({ success: false, error: '올바른 운행 타입이 아닙니다.' });

        const convResult = convertToSolar(rawData.userInfo);
        const solarDate = convResult.birthDate;
        const dateInfo = convResult.converted
            ? ` (원본: ${convResult.originalDate} ${convResult.originalCalendar} → 양력: ${solarDate})`
            : '';

        const prompt = `
${buildBaseInstruction()}

[점성학 ${config.title} 분석]
- 이름: ${rawData.userInfo.name} (${rawData.userInfo.gender})
- 출생 정보: ${solarDate} ${rawData.userInfo.birthTime}${dateInfo}
- 출생지: ${rawData.userInfo.location}

${config.instruction}

**중요**: 점성학은 양력 기반이므로 위의 양력 날짜로 분석하세요.
답변은 반드시 ${config.maxLength}자를 초과하지 않도록 작성하세요.
`;
        const transitTokenMap = { monthly: 1200, yearly: 2500, decade: 4000 };
        const transit = await callGeminiAPI(prompt, transitTokenMap[transitType] || 2500);
        res.json({ success: true, transit, transitType: config.title });

    } catch (error) {
        console.error("❌ [Transit Error]", error);
        res.json({ success: false, error: '행성 운행 분석 중 오류가 발생했습니다.' });
    }
});

// [10-6] 사주 채팅
app.post('/api/saju/chat', async (req, res) => {
    try {
        const { userMessage, rawData } = req.body;
        const sajuText = calculateSajuText(rawData.userInfo);
        if (sajuText.startsWith('ERROR:')) {
            return res.json({ success: true, answer: "죄송합니다. 사주 정보를 불러오는 중 오류가 발생했습니다." });
        }

        const prompt = `
${buildBaseInstruction()}

[사주 상세 상담 채팅]
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
        console.error("❌ [Saju Chat Error]", e);
        res.status(500).json({ success: false, error: 'Chat Error' });
    }
});

// [10-7] 점성학 채팅
app.post('/api/astrology/chat', async (req, res) => {
    try {
        const { userMessage, rawData } = req.body;
        const convResult = convertToSolar(rawData.userInfo);
        const solarDate = convResult.birthDate;

        const prompt = `
${buildBaseInstruction()}

[점성학 상세 상담 채팅]
- 사용자: ${rawData.userInfo.name}
- 출생 정보 (양력): ${solarDate} ${rawData.userInfo.birthTime}
- 질문: "${userMessage}"

점성학적 관점에서 답변하되, 결론부터 말하고 이유를 설명하세요.
**중요**: 점성학은 양력 기반이므로 위의 양력 날짜로 분석하세요.
`;
        const answer = await callGeminiAPI(prompt);
        res.json({ success: true, answer });

    } catch (e) {
        console.error("❌ [Astrology Chat Error]", e);
        res.status(500).json({ success: false, error: 'Chat Error' });
    }
});

// [10-8] 월간운세 30일 캘린더
app.post('/api/saju/monthly-calendar', async (req, res) => {
    try {
        const { rawData, startDate } = req.body;

        const vErr = validateUserInfo(rawData?.userInfo);
        if (vErr) return res.json({ success: false, error: vErr });

        const sajuText = calculateSajuText(rawData.userInfo);
        if (sajuText.startsWith('ERROR:')) {
            return res.json({ success: false, error: sajuText.replace('ERROR: ', '') });
        }

        // 시작 날짜 (클라이언트에서 명시적으로 전달받음, 없으면 다음 달 1일)
        let targetDate;
        if (startDate && typeof startDate === 'string' && startDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
            targetDate = new Date(startDate + 'T00:00:00');
        } else {
            const now = new Date();
            targetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        }

        const targetYear = targetDate.getFullYear();
        const targetMonth = targetDate.getMonth() + 1;
        const yi = getYearInfo(targetYear);

        // ✅ 서버에서 30일 일진 정확히 계산
        const jiljinData = calculate30DayJilJin(targetDate);
        const jiljinText = jiljinData.map(d => `  ${d.date}: ${d.jiljin}일`).join('\n');

        const prompt = `
${buildBaseInstruction()}

**재확인: 분석 기간은 ${targetYear}년 ${targetMonth}월, ${yi.ganji}년(${yi.color} ${yi.animal}의 해)입니다**

[30일 월간운세 캘린더 생성]
- 이름: ${rawData.userInfo.name} (${rawData.userInfo.gender})
- 사주 명식: ${sajuText}
- 생년월일: ${rawData.userInfo.birthDate}
- 분석 기간: ${targetYear}년 ${targetMonth}월 1일부터 30일까지

**✅ 서버에서 정확히 계산된 30일 일진 (반드시 이 데이터를 사용하세요):**
${jiljinText}

**필수 출력 형식:**

1. 전체 흐름 요약 (200자 이내)
\`\`\`
🔮 앞으로 30일의 흐름 (${targetYear}년 ${targetMonth}월)

이번 달은 [초반/중반/후반]에 [상승/하락/안정] 패턴을 보입니다.
[용신/희신]이 [강하게/약하게] 작용하는 시기로, [핵심 키워드] 에너지가 두드러집니다.

**핵심:** [2-3문장으로 전체 흐름 요약]
\`\`\`

2. 에너지 흐름 그래프
\`\`\`
📊 30일 에너지 흐름

 1  2  3  4  5  6  7  8  9 10 11 12 13 14 15
[▇▆▅▄▃▂▁ 중 선택]

16 17 18 19 20 21 22 23 24 25 26 27 28 29 30
[▇▆▅▄▃▂▁ 중 선택]

📈 최고점: [날짜] - [이유]
⚠ 조심 구간: [날짜] - [이유]
🔁 전환점: [날짜] - [이유]
\`\`\`

3. 핵심 인사이트
\`\`\`
⭐ 핵심 인사이트 요약

이번 달 특징
- 초반: [에너지 상태]
- 중반: [에너지 상태]
- 후반: [에너지 상태]

가장 좋은 날 → [날짜들]
조심할 구간 → [날짜들]
\`\`\`

4. 30일 달력 (${targetYear}년 ${targetMonth}월 실제 달력 요일 반영)
\`\`\`
📅 ${targetYear}년 ${targetMonth}월 운세 달력

일  월  화  수  목  금  토
[실제 달력 형태로 1-30일 배치]
[각 날짜에 ⭐⭐/⭐/🔁/⚠/▪ 기호 표시]

범례
⭐⭐ 매우 강한 날  ⭐ 좋은 날  🔁 전환점  ⚠ 조심  ▪ 보통
\`\`\`

5. 상세 날짜 예시 3~5개 (최고점/최저점/전환점 위주)
\`\`\`
📅 ${targetMonth}월 [일]일 – [타이틀] [기호]

일진: [위 제공된 일진 데이터 사용]

🔑 키워드
- [키워드1]
- [키워드2]
- [키워드3]

🔮 해석
[2-3문장 해석]

💡 행동 제안
👉 [구체적 행동 제안]

📊 세부 운세
- 재물운: [1줄]
- 인간관계: [1줄]
- 결정사항: [1줄]
\`\`\`

6. 상담 연결 유도
\`\`\`
🔗 더 알아보기

> 특정 날의 연애운이나 사업 운세가 궁금하신가요?
👉 채팅창에 질문을 남겨주세요.
\`\`\`

**계산 원칙:**
- 위에서 제공한 일진 데이터를 반드시 사용하세요 (임의 계산 금지)
- 사주 명식 "${sajuText}" 기반으로 용신/희신/기신 판단
- 십성(比劫, 食傷, 財星, 官星, 印星)과 신살(천을귀인, 천덕귀인, 공망, 원진 등) 모두 고려
- ${targetYear}년 ${targetMonth}월의 실제 달력 요일 정확히 반영

답변은 반드시 4000자를 초과하지 않도록 작성하세요.
`;

        const calendar = await callGeminiAPI(prompt, 4000);
        res.json({
            success: true,
            calendar,
            targetMonth: `${targetYear}년 ${targetMonth}월`,
            sajuText,
            jiljinData  // 프론트엔드에서도 활용 가능
        });

    } catch (error) {
        console.error("❌ [Monthly Calendar Error]", error);
        res.json({ success: false, error: '월간운세 캘린더 생성 중 오류가 발생했습니다.' });
    }
});

// ─────────────────────────────────────────────
// [11] 서버 시작
// ─────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log(`🚀 Server running: http://localhost:${PORT}`));
}

export default app;
