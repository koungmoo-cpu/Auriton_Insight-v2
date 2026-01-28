/* ============================================
   ⭐ AI Ultra Dosa Sentinel - Astro Module
   Updated: 2-Row Input Logic & '해요체' Stability
   ============================================ */

/**
 * 점성학 폼 초기화 함수예요.
 * 년, 월, 일, 시 옵션을 생성하고 이벤트 리스너를 연결해요.
 */
function initializeAstrologyForm() {
    populateYearOptions('astro-year');
    populateMonthOptions('astro-month');
    populateDayOptions('astro-day');
    populateHourOptions('astro-hour');
    setupGenderButtons('astro-form');
    
    const yearSelect = document.getElementById('astro-year');
    const monthSelect = document.getElementById('astro-month');
    if (yearSelect && monthSelect) {
        yearSelect.addEventListener('change', updateAstroDayOptions);
        monthSelect.addEventListener('change', updateAstroDayOptions);
    }
    
    const form = document.getElementById('astro-form');
    if (form) {
        form.querySelectorAll('input, select').forEach(input => {
            input.addEventListener('change', () => checkFormValidity('astro-form'));
        });
        form.addEventListener('submit', handleAstroSubmit);
    }

    // 시간 '모름' 선택 시 입력창 비활성화 핸들러예요.
    setupTimeUnknownHandler('astro');
}

/**
 * 선택된 년/월에 따라 일(Day) 옵션을 동적으로 업데이트해요.
 */
function updateAstroDayOptions() {
    const year = parseInt(document.getElementById('astro-year').value);
    const month = parseInt(document.getElementById('astro-month').value);
    const daySelect = document.getElementById('astro-day');
    
    if (year && month && daySelect) {
        const lastDay = getLastDayOfMonth(year, month);
        const currentDay = parseInt(daySelect.value);
        populateDayOptions('astro-day', lastDay);
        if (currentDay && currentDay <= lastDay) daySelect.value = currentDay;
    }
}

/**
 * 출생시간 '모름' 처리 핸들러예요.
 * PERIOD에서 'unknown'을 선택하면 시간과 분 선택창을 막아줘요.
 */
function setupTimeUnknownHandler(prefix) {
    const periodSelect = document.getElementById(`${prefix}-period`);
    const hourSelect = document.getElementById(`${prefix}-hour`);
    const minuteSelect = document.getElementById(`${prefix}-minute`);
    
    if (!periodSelect) return;
    
    periodSelect.addEventListener('change', function() {
        const isUnknown = this.value === 'unknown';
        
        if (hourSelect) {
            hourSelect.disabled = isUnknown;
            hourSelect.style.opacity = isUnknown ? '0.3' : '1';
            if (isUnknown) {
                hourSelect.value = ""; // 값 초기화
                hourSelect.removeAttribute('required');
            } else {
                hourSelect.setAttribute('required', 'required');
            }
        }
        
        if (minuteSelect) {
            minuteSelect.disabled = isUnknown;
            minuteSelect.style.opacity = isUnknown ? '0.3' : '1';
            if (isUnknown) {
                minuteSelect.value = ""; // 값 초기화
                minuteSelect.removeAttribute('required');
            } else {
                minuteSelect.setAttribute('required', 'required');
            }
        }
        
        checkFormValidity(`${prefix}-form`);
    });
}

// === 점성학 계산 (기존 알고리즘 보존) ===
const ZODIAC = ['양', '황소', '쌍둥이', '게', '사자', '처녀', '천칭', '전갈', '사수', '염소', '물병', '물고기'];

function getSign(index) {
    return { name: ZODIAC[index % 12] + '자리' };
}

function calculateAstrology(year, month, day, hour) {
    // 기존의 근사치 계산 로직을 그대로 유지해요.
    const sunIdx = (month - 3 + 12) % 12;
    const moonIdx = (day % 27) / 2.25;
    const ascIdx = (sunIdx + 12 - (hour / 2)) % 12;
    
    return {
        sun: { sign: getSign(Math.floor(sunIdx)) },
        moon: { sign: getSign(Math.floor(moonIdx)) },
        ascendant: { sign: getSign(Math.floor(ascIdx)) },
        location: 'Earth'
    };
}

/**
 * 폼 제출 시 실행되는 메인 로직이에요.
 * 데이터를 정화하고 서버에 분석을 요청해요.
 */
async function handleAstroSubmit(e) {
    e.preventDefault();
    
    // 입력값 정화 (XSS 방지)
    const name = sanitizeInput(document.getElementById('astro-name').value);
    const year = parseInt(document.getElementById('astro-year').value);
    const month = parseInt(document.getElementById('astro-month').value);
    const day = parseInt(document.getElementById('astro-day').value);
    const period = document.getElementById('astro-period').value;
    const location = sanitizeInput(document.getElementById('astro-location')?.value || 'Unknown');
    
    // 필수 정보 확인 (해요체 알림)
    if (!name || !currentGender) {
        return alert('성함과 성별을 정확히 입력해 주세요.');
    }

    // 시간 처리 (모름 선택 시 정오 12:00 기준)
    let hour24 = 12, minute = 0;
    if (period !== 'unknown') {
        const hour = parseInt(document.getElementById('astro-hour').value) || 12;
        minute = parseInt(document.getElementById('astro-minute').value) || 0;
        hour24 = convertTo24Hour(period, hour);
    }

    // 계산 수행
    const astroResult = calculateAstrology(year, month, day, hour24);
    
    // 서버 전송용 데이터 구성
    const analysisData = {
        method: 'astrology',
        userInfo: {
            name,
            gender: currentGender,
            birthDate: `${year}-${month}-${day}`,
            birthTime: period === 'unknown' ? '시간 모름' : `${period.toUpperCase()} ${hour24 % 12 || 12}:${minute}`,
            location
        },
        astrology: astroResult
    };
    
    // 분석 API 호출 (해요체 결과 화면 출력)
    await callAnalysisAPI('/api/astrology/consultation', analysisData, '⭐ ASTRO ANALYSIS RESULT');
}

// 글로벌 윈도우 객체에 등록하여 main.js에서 호출할 수 있게 해요.
window.initializeAstrologyForm = initializeAstrologyForm;