/* ============================================
   🌟 AI Ultra Dosa Sentinel v2.0 - Main Core
   Logic: Form Validation & Typewriter Effect
   ============================================ */

let currentMethod = null;
let currentGender = null;
let currentRawData = null;
let currentCalendarType = 'solar';

// ============================================
// 화면 전환 Logic
// ============================================
function selectMethod(method) {
    console.log(`[SYSTEM] Method Selected: ${method}`);
    currentMethod = method;
    hideScreen('selection-screen');
    
    if (method === 'saju') {
        showScreen('saju-screen');
        if (typeof initializeSajuForm === 'function') initializeSajuForm();
    } else if (method === 'astrology') {
        showScreen('astrology-screen');
        if (typeof initializeAstrologyForm === 'function') initializeAstrologyForm();
    }
}

function backToSelection() {
    hideScreen('saju-screen');
    hideScreen('astrology-screen');
    hideScreen('result-screen');
    showScreen('selection-screen');
    
    // 폼 초기화
    document.getElementById('saju-form')?.reset();
    document.getElementById('astro-form')?.reset();
    currentMethod = null;
    currentGender = null;
    currentRawData = null;
}

function startNewAnalysis() {
    backToSelection();
}

function showScreen(screenId) {
    const screen = document.getElementById(screenId);
    if (screen) {
        screen.classList.add('active');
        screen.style.display = 'block';
        setTimeout(() => screen.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    }
}

function hideScreen(screenId) {
    const screen = document.getElementById(screenId);
    if (screen) {
        screen.classList.remove('active');
        screen.style.display = 'none';
    }
}

// ============================================
// 유틸리티
// ============================================
function sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    return input.trim().replace(/[<>]/g, '').substring(0, 500);
}

function populateYearOptions(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;
    const currentYear = new Date().getFullYear();
    while (select.options.length > 1) select.remove(1);
    for (let year = currentYear; year >= 1900; year--) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year + '년';
        select.appendChild(option);
    }
}

function populateMonthOptions(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;
    while (select.options.length > 1) select.remove(1);
    for (let month = 1; month <= 12; month++) {
        const option = document.createElement('option');
        option.value = month;
        option.textContent = month + '월';
        select.appendChild(option);
    }
}

function populateDayOptions(selectId, maxDay = 31) {
    const select = document.getElementById(selectId);
    if (!select) return;
    select.innerHTML = '<option value="">일</option>';
    for (let day = 1; day <= maxDay; day++) {
        const option = document.createElement('option');
        option.value = day;
        option.textContent = day + '일';
        select.appendChild(option);
    }
}

function populateHourOptions(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;
    while (select.options.length > 1) select.remove(1);
    for (let hour = 1; hour <= 12; hour++) {
        const option = document.createElement('option');
        option.value = hour;
        option.textContent = hour + '시';
        select.appendChild(option);
    }
}

function getLastDayOfMonth(year, month) {
    return new Date(year, month, 0).getDate();
}

function convertTo24Hour(period, hour) {
    if (period === 'unknown') return 12; // Unknown defaults to Noon
    if (period === 'am') return hour === 12 ? 0 : hour;
    if (period === 'pm') return hour === 12 ? 12 : hour + 12;
    return 12;
}

function setupGenderButtons(formId) {
    const form = document.getElementById(formId);
    if (!form) return;
    const buttons = form.querySelectorAll('.option-button[data-gender]');
    buttons.forEach(btn => {
        btn.addEventListener('click', function() {
            buttons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentGender = this.dataset.gender;
            checkFormValidity(formId);
        });
    });
}

// ============================================
// Core Logic: Form Validation (Unknown Time Handle)
// ============================================
function checkFormValidity(formId) {
    const form = document.getElementById(formId);
    if (!form) return;
    const submitBtn = form.querySelector('button[type="submit"]');
    if (!submitBtn) return;
    
    let isValid = true;
    const requiredInputs = form.querySelectorAll('[required]');
    
    // 폼 ID에 따른 prefix 확인 (saju 또는 astro)
    const prefix = formId.replace('-form', '');
    const periodSelect = document.getElementById(`${prefix}-period`);
    const isUnknownTime = periodSelect && periodSelect.value === 'unknown';

    requiredInputs.forEach(input => {
        // "Unknown" 선택 시 hour/minute 유효성 검사 패스
        if (isUnknownTime && (input.id.includes('hour') || input.id.includes('minute'))) {
            return; 
        }

        if (input.type === 'checkbox') {
            if (!input.checked) isValid = false;
        } else if (input.tagName === 'SELECT') {
            if (!input.value) isValid = false;
        } else {
            if (!input.value.trim()) isValid = false;
        }
    });

    if (!currentGender) isValid = false;
    submitBtn.disabled = !isValid;
    return isValid;
}

// ============================================
// Core Logic: Typewriter Effect
// ============================================
function displayResult(title, message) {
    hideScreen('saju-screen');
    hideScreen('astrology-screen');
    showScreen('result-screen');
    
    document.getElementById('result-title').textContent = title;
    const chatMessages = document.getElementById('chat-messages');
    chatMessages.innerHTML = ''; // Clear previous
    
    addChatMessage(message, 'ai');
}

/**
 * AI Ultra Dosa Sentinel 타자기 애니메이션
 * @param {HTMLElement} element - 글자가 출력될 HTML 요소
 * @param {string} text - 출력할 전체 텍스트
 * @param {number} speed - 출력 속도 (밀리초)
 */
function typeWriter(element, text, speed = 40) {
    let i = 0;
    element.innerHTML = ""; // 기존 내용 초기화
    
    // 커서(Cursor) 효과를 위한 span 추가
    const cursorSpan = document.createElement('span');
    cursorSpan.classList.add('dosa-cursor');
    element.appendChild(cursorSpan);

    function type() {
        if (i < text.length) {
            // 커서 앞에 한 글자씩 삽입
            const char = text.charAt(i);
            const textNode = document.createTextNode(char);
            element.insertBefore(textNode, cursorSpan);
            i++;
            
            // 자동 스크롤 (채팅창 하단 유지)
            const container = document.getElementById('chat-messages');
            if(container) container.scrollTop = container.scrollHeight;
            
            setTimeout(type, speed);
        } else {
            // 출력 완료 후 3초 뒤 커서 제거
            setTimeout(() => {
                cursorSpan.style.display = 'none';
            }, 3000);
        }
    }
    
    type();
}

function addChatMessage(text, sender) {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;
    
    const messageDiv = document.createElement('div');
    
    if (sender === 'ai') {
        messageDiv.className = 'ai-message';
        chatMessages.appendChild(messageDiv);
        // AI 메시지는 새로운 typeWriter 함수 사용
        typeWriter(messageDiv, text, 40);
    } else {
        // 유저/시스템 메시지는 즉시 출력
        if (sender === 'user') messageDiv.className = 'user-message';
        if (sender === 'system') {
            messageDiv.className = 'ai-message';
            messageDiv.style.color = '#FF2A2A';
            messageDiv.style.borderLeftColor = '#FF2A2A';
            text = '🚨 ' + text;
        }
        messageDiv.innerText = text;
        chatMessages.appendChild(messageDiv);
    }
    
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ============================================
// API & Chat Logic
// ============================================
async function sendChatMessage() {
    const input = document.getElementById('chat-input');
    if (!input) return;
    const message = sanitizeInput(input.value);
    
    if (!message || !currentRawData) return;
    
    addChatMessage(message, 'user');
    input.value = '';
    
    const sendBtn = document.getElementById('send-button');
    if (sendBtn) { sendBtn.disabled = true; sendBtn.textContent = 'TRANSMITTING...'; }
    
    try {
        const endpoint = currentMethod === 'saju' ? '/api/saju/chat' : '/api/astrology/chat';
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userMessage: message, rawData: currentRawData })
        });
        
        const data = await response.json();
        if (data.success) {
            addChatMessage(data.answer, 'ai');
        } else {
            addChatMessage(data.error || 'System Error', 'system');
        }
    } catch (error) {
        addChatMessage('Connection Lost', 'system');
    } finally {
        if (sendBtn) { sendBtn.disabled = false; sendBtn.textContent = 'TRANSMIT'; }
    }
}

async function callAnalysisAPI(endpoint, data, resultTitle) {
    const formId = currentMethod === 'saju' ? 'saju-form' : 'astro-form';
    const submitBtn = document.querySelector(`#${formId} button[type="submit"]`);
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'ANALYZING...'; }
    
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rawData: data })
        });
        const result = await response.json();
        
        if (result.success) {
            currentRawData = data;
            // displayResult 내부에서 addChatMessage를 호출하고, 
            // 거기서 typeWriter를 사용하므로 사주/점성학 결과 모두 타자기 효과가 적용됨.
            displayResult(resultTitle, result.consultation);
        } else {
            alert(`⚠️ SENTINEL ALERT: ${result.error}`);
        }
    } catch (error) {
        alert('⚠️ CRITICAL ERROR: Network Unreachable');
    } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'ACTIVATE ANALYSIS'; }
    }
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('👁️ AI Ultra Dosa Sentinel v2.0 Online');
    const sendBtn = document.getElementById('send-button');
    if (sendBtn) sendBtn.addEventListener('click', sendChatMessage);
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendChatMessage();
            }
        });
    }
});

window.selectMethod = selectMethod;
window.backToSelection = backToSelection;
window.startNewAnalysis = startNewAnalysis;