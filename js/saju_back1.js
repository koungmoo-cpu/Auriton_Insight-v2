/* ============================================
   🔮 AI Ultra Dosa Sentinel - Saju Module
   Logic: 12:00 Default for Unknown Time
   ============================================ */

let sajuCalendarType = 'solar';

function initializeSajuForm() {
    populateYearOptions('saju-year');
    populateMonthOptions('saju-month');
    populateDayOptions('saju-day');
    populateHourOptions('saju-hour');
    
    setupGenderButtons('saju-form');
    setupCalendarToggle();
    
    const yearSelect = document.getElementById('saju-year');
    const monthSelect = document.getElementById('saju-month');
    if (yearSelect && monthSelect) {
        yearSelect.addEventListener('change', updateSajuDayOptions);
        monthSelect.addEventListener('change', updateSajuDayOptions);
    }
    
    const form = document.getElementById('saju-form');
    if (form) {
        form.querySelectorAll('input, select').forEach(input => {
            input.addEventListener('change', () => checkFormValidity('saju-form'));
        });
        form.addEventListener('submit', handleSajuSubmit);
    }
    
    // 모름 처리 핸들러 연결
    setupTimeUnknownHandler('saju');
}

function setupCalendarToggle() {
    const calendarButtons = document.querySelectorAll('#saju-form .option-button[data-calendar]');
    const leapCheck = document.getElementById('leap-check');
    
    calendarButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            calendarButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            sajuCalendarType = this.dataset.calendar;
            
            if (leapCheck) {
                leapCheck.style.display = sajuCalendarType === 'lunar' ? 'block' : 'none';
            }
            checkFormValidity('saju-form');
        });
    });
}

function updateSajuDayOptions() {
    const year = parseInt(document.getElementById('saju-year').value);
    const month = parseInt(document.getElementById('saju-month').value);
    const daySelect = document.getElementById('saju-day');
    
    if (year && month && daySelect) {
        const lastDay = getLastDayOfMonth(year, month);
        const currentDay = parseInt(daySelect.value);
        populateDayOptions('saju-day', lastDay);
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

// === 사주 계산 (Simplified) ===
const HEAVENLY_STEMS = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
const EARTHLY_BRANCHES = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];
const FIVE_ELEMENTS = {
    '갑': '목', '을': '목', '병': '화', '정': '화', '무': '토', '기': '토',
    '경': '금', '신': '금', '임': '수', '계': '수', '인': '목', '묘': '목',
    '사': '화', '오': '화', '진': '토', '술': '토', '축': '토', '미': '토',
    '신': '금', '유': '금', '자': '수', '해': '수'
};

function getPillar(index, offset) {
    return {
        stem: HEAVENLY_STEMS[(index + offset) % 10],
        branch: EARTHLY_BRANCHES[(index + offset) % 12],
        full: HEAVENLY_STEMS[(index + offset) % 10] + EARTHLY_BRANCHES[(index + offset) % 12]
    };
}

function calculateSaju(year, month, day, hour24) {
    // Note: 실제 만세력 API 없이 근사치 계산 로직만 포함
    const yearPillar = getPillar(year - 4, 0); 
    const monthPillar = getPillar((year - 4) * 12 + month, 2);
    const dayPillar = getPillar((year * 365 + day), 4);
    
    // 시주 계산 (일간 기준)
    const hourBranch = Math.floor((hour24 + 1) / 2) % 12;
    const dayStemIdx = HEAVENLY_STEMS.indexOf(dayPillar.stem);
    const hourStemIdx = (dayStemIdx * 2 + hourBranch) % 10;
    
    const hourPillar = {
        stem: HEAVENLY_STEMS[hourStemIdx],
        branch: EARTHLY_BRANCHES[hourBranch],
        full: HEAVENLY_STEMS[hourStemIdx] + EARTHLY_BRANCHES[hourBranch]
    };

    const elements = { '목': 0, '화': 0, '토': 0, '금': 0, '수': 0 };
    [yearPillar, monthPillar, dayPillar, hourPillar].forEach(p => {
        elements[FIVE_ELEMENTS[p.stem]]++;
        elements[FIVE_ELEMENTS[p.branch]]++;
    });

    return {
        fourPillars: `${yearPillar.full} ${monthPillar.full} ${dayPillar.full} ${hourPillar.full}`,
        dayPillar,
        elements
    };
}

async function handleSajuSubmit(e) {
    e.preventDefault();
    const name = sanitizeInput(document.getElementById('saju-name').value);
    const year = parseInt(document.getElementById('saju-year').value);
    const month = parseInt(document.getElementById('saju-month').value);
    const day = parseInt(document.getElementById('saju-day').value);
    const period = document.getElementById('saju-period').value;
    const isLeap = document.getElementById('leap-month')?.checked || false;
    
    // === 중요: 모름(Unknown) 처리 ===
    let hour24 = 12, minute = 0;
    
    if (period === 'unknown') {
        console.log('[Saju] Time Unknown -> Defaulting to 12:00');
        hour24 = 12;
    } else {
        const hour = parseInt(document.getElementById('saju-hour').value) || 12;
        minute = parseInt(document.getElementById('saju-minute').value) || 0;
        hour24 = convertTo24Hour(period, hour);
    }
    
    if (!name || !currentGender) return alert('필수 정보를 입력하세요.');

    const sajuResult = calculateSaju(year, month, day, hour24);
    
    const analysisData = {
        method: 'saju',
        userInfo: {
            name,
            gender: currentGender,
            birthDate: `${year}-${month}-${day}`,
            birthTime: period === 'unknown' ? 'Unknown (12:00)' : `${hour24}:${minute}`,
            calendarType: sajuCalendarType,
            isLeap
        },
        saju: sajuResult
    };
    
    await callAnalysisAPI('/api/saju/consultation', analysisData, '🔮 SAJU ANALYSIS RESULT');
}

window.initializeSajuForm = initializeSajuForm;