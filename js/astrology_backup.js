/* ============================================
   ⭐ AI Ultra Dosa Sentinel - Astro Module
   Logic: 12:00 Default for Unknown Time
   ============================================ */

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

    // 모름 처리 핸들러 연결
    setupTimeUnknownHandler('astro');
}

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

// === 출생시간 모름 핸들러 (UI Logic) ===
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
            if (isUnknown) hourSelect.removeAttribute('required');
            else hourSelect.setAttribute('required', 'required');
        }
        
        if (minuteSelect) {
            minuteSelect.disabled = isUnknown;
            minuteSelect.style.opacity = isUnknown ? '0.3' : '1';
            if (isUnknown) minuteSelect.removeAttribute('required');
            else minuteSelect.setAttribute('required', 'required');
        }
        
        checkFormValidity(`${prefix}-form`);
    });
}

// === 점성학 계산 (Simplified) ===
const ZODIAC = ['양', '황소', '쌍둥이', '게', '사자', '처녀', '천칭', '전갈', '사수', '염소', '물병', '물고기'];

function getSign(index) {
    return { name: ZODIAC[index % 12] + '자리' };
}

function calculateAstrology(year, month, day, hour) {
    // 근사치 계산 (실제 천문력 없음)
    const sunIdx = (month - 3 + 12) % 12; // 3월 춘분점 기준 대략
    const moonIdx = (day % 27) / 2.25; // 달 주기 근사
    const ascIdx = (sunIdx + 12 - (hour / 2)) % 12; // 시간별 상승궁 이동
    
    return {
        sun: { sign: getSign(Math.floor(sunIdx)) },
        moon: { sign: getSign(Math.floor(moonIdx)) },
        ascendant: { sign: getSign(Math.floor(ascIdx)) },
        location: 'Earth'
    };
}

async function handleAstroSubmit(e) {
    e.preventDefault();
    const name = sanitizeInput(document.getElementById('astro-name').value);
    const year = parseInt(document.getElementById('astro-year').value);
    const month = parseInt(document.getElementById('astro-month').value);
    const day = parseInt(document.getElementById('astro-day').value);
    const period = document.getElementById('astro-period').value;
    const location = sanitizeInput(document.getElementById('astro-location')?.value || 'Unknown');
    
    // === 중요: 모름(Unknown) 처리 ===
    let hour24 = 12, minute = 0;
    
    if (period === 'unknown') {
        console.log('[Astro] Time Unknown -> Defaulting to 12:00');
        hour24 = 12;
    } else {
        const hour = parseInt(document.getElementById('astro-hour').value) || 12;
        minute = parseInt(document.getElementById('astro-minute').value) || 0;
        hour24 = convertTo24Hour(period, hour);
    }

    if (!name || !currentGender) return alert('필수 정보를 입력하세요.');

    const astroResult = calculateAstrology(year, month, day, hour24);
    
    const analysisData = {
        method: 'astrology',
        userInfo: {
            name,
            gender: currentGender,
            birthDate: `${year}-${month}-${day}`,
            birthTime: period === 'unknown' ? 'Unknown (12:00)' : `${hour24}:${minute}`,
            location
        },
        astrology: astroResult
    };
    
    await callAnalysisAPI('/api/astrology/consultation', analysisData, '⭐ ASTRO ANALYSIS RESULT');
}

window.initializeAstrologyForm = initializeAstrologyForm;