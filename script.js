/* ============================================
   Enhanced Client-side Logic: script.js
   Features: Question Counter, Session Management
   ============================================ */

// 전역 변수 설정
window.currentMode = '';
window.currentUserInfo = {};
window.questionCount = 0;
window.maxQuestions = 5;
window.userId = 'user_' + Date.now(); // 간단한 세션 ID

// 1. 화면 전환 함수
window.selectMethod = function(method) {
    console.log("Method Selected:", method);
    window.currentMode = method;
    
    document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
    
    if (method === 'saju') {
        const sajuScreen = document.getElementById('saju-screen');
        if(sajuScreen) sajuScreen.classList.add('active');
    } else if (method === 'astrology') {
        const astroScreen = document.getElementById('astrology-screen');
        if(astroScreen) astroScreen.classList.add('active');
    }
}

window.backToSelection = async function() {
    // 세션 리셋
    await fetch('/api/reset-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: window.userId })
    });
    
    window.questionCount = 0;
    updateQuestionCounter();
    
    document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
    document.getElementById('selection-screen').classList.add('active');
    
    const chatBox = document.getElementById('chat-box');
    if(chatBox) chatBox.innerHTML = '';
}

window.showResultScreen = function() {
    document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
    document.getElementById('result-screen').classList.add('active');
    
    // 질문 카운터 초기화
    window.questionCount = 0;
    updateQuestionCounter();
}

// 2. 성별 버튼 선택 로직
function setupGenderButtons(groupId) {
    const group = document.getElementById(groupId);
    if(!group) return;
    const buttons = group.querySelectorAll('.option-button');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
}

// 3. 질문 카운터 업데이트
function updateQuestionCounter() {
    const counter = document.getElementById('question-counter');
    if (counter) {
        const remaining = window.maxQuestions - window.questionCount;
        counter.textContent = `남은 질문: ${remaining}회`;
        counter.style.color = remaining <= 2 ? '#ff3333' : '#00F0FF';
    }
    
    // 입력창 비활성화
    const input = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    if (window.questionCount >= window.maxQuestions) {
        if (input) {
            input.disabled = true;
            input.placeholder = '추가 질문 횟수가 소진되었습니다';
        }
        if (sendBtn) sendBtn.disabled = true;
    } else {
        if (input) {
            input.disabled = false;
            input.placeholder = '추가 질문을 입력하세요...';
        }
        if (sendBtn) sendBtn.disabled = false;
    }
}

// 4. 메시지 추가 함수
function appendMessage(sender, text, isTyping = false) {
    const chatBox = document.getElementById('chat-box');
    if (!chatBox) return;
    
    const msgDiv = document.createElement('div');
    msgDiv.className = sender === 'user' ? 'user-message' : 'ai-message';
    
    if (isTyping && sender === 'ai') {
        // 타이핑 효과
        msgDiv.classList.add('typing-cursor');
        chatBox.appendChild(msgDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
        
        let index = 0;
        const interval = setInterval(() => {
            if (index < text.length) {
                msgDiv.textContent = text.substring(0, index + 1);
                index++;
                chatBox.scrollTop = chatBox.scrollHeight;
            } else {
                msgDiv.classList.remove('typing-cursor');
                clearInterval(interval);
            }
        }, 20);
    } else {
        msgDiv.textContent = text;
        chatBox.appendChild(msgDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
    }
}

// 5. API 호출 함수
async function callApi(endpoint, data) {
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...data, userId: window.userId })
        });
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        return { success: false, error: '서버 통신 오류' };
    }
}

// 6. 입력 검증 함수
function validateDate(dateStr) {
    const match = dateStr.match(/(\d{4})[.-]?(\d{1,2})[.-]?(\d{1,2})/);
    if (!match) return false;
    
    const year = parseInt(match[1]);
    const month = parseInt(match[2]);
    const day = parseInt(match[3]);
    
    if (year < 1900 || year > 2100) return false;
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;
    
    return true;
}

// 7. 초기화
document.addEventListener('DOMContentLoaded', () => {
    console.log("Enhanced Script Loaded");

    setupGenderButtons('saju-gender-group');
    setupGenderButtons('astro-gender-group');

    // 질문 카운터 UI 추가
    const chatInputArea = document.querySelector('.chat-input-area');
    if (chatInputArea) {
        const counterDiv = document.createElement('div');
        counterDiv.id = 'question-counter';
        counterDiv.style.cssText = 'color: #00F0FF; font-size: 0.9rem; margin-bottom: 0.5rem; text-align: right; font-family: Orbitron, sans-serif;';
        counterDiv.textContent = '남은 질문: 5회';
        chatInputArea.parentElement.insertBefore(counterDiv, chatInputArea);
    }

    // 사주 폼 제출
    const sajuForm = document.getElementById('saju-form');
    if (sajuForm) {
        sajuForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('saju-name').value.trim();
            const genderBtn = document.querySelector('#saju-gender-group .active');
            const gender = genderBtn ? genderBtn.dataset.value : 'unknown';
            const date = document.getElementById('saju-date').value;
            const time = document.getElementById('saju-time').value;
            const calendarType = document.querySelector('input[name="calendar"]:checked')?.value || '양력';

            // 입력 검증
            if (!name) {
                alert('이름을 입력해주세요.');
                return;
            }
            if (!validateDate(date)) {
                alert('올바른 날짜 형식이 아닙니다. (예: 1990-01-01)');
                return;
            }

            window.currentUserInfo = { 
                name, 
                gender, 
                birthDate: date,
                birthTime: time || '12:00',
                calendarType
            };
            
            window.showResultScreen();
            appendMessage('ai', '사주 명식을 계산하고 있습니다...', false);

            const res = await callApi('/api/saju/consultation', { 
                rawData: { userInfo: window.currentUserInfo } 
            });
            
            // 기존 메시지 제거
            const chatBox = document.getElementById('chat-box');
            if (chatBox) chatBox.innerHTML = '';
            
            if (res.success) {
                appendMessage('ai', res.consultation, true);
            } else {
                appendMessage('ai', '오류가 발생했습니다: ' + (res.error || '알 수 없는 오류'), false);
            }
        });
    }

    // 점성술 폼 제출
    const astroForm = document.getElementById('astro-form');
    if (astroForm) {
        astroForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('astro-name').value.trim();
            const genderBtn = document.querySelector('#astro-gender-group .active');
            const gender = genderBtn ? genderBtn.dataset.value : 'unknown';
            const date = document.getElementById('astro-date').value;
            const time = document.getElementById('astro-time').value || '12:00';

            if (!name) {
                alert('이름을 입력해주세요.');
                return;
            }
            if (!validateDate(date)) {
                alert('올바른 날짜 형식이 아닙니다. (예: 1990-01-01)');
                return;
            }

            window.currentUserInfo = { 
                name, 
                gender, 
                birthDate: date,
                birthTime: time
            };
            
            window.showResultScreen();
            appendMessage('ai', '별들의 위치를 계산하고 있습니다...', false);

            const res = await callApi('/api/astrology/consultation', { 
                rawData: { userInfo: window.currentUserInfo } 
            });
            
            const chatBox = document.getElementById('chat-box');
            if (chatBox) chatBox.innerHTML = '';
            
            if (res.success) {
                appendMessage('ai', res.consultation, true);
            } else {
                appendMessage('ai', '오류가 발생했습니다: ' + (res.error || '알 수 없는 오류'), false);
            }
        });
    }

    // 채팅 전송
    const sendBtn = document.getElementById('send-btn');
    const userInput = document.getElementById('user-input');
    
    async function sendMessage() {
        const message = userInput.value.trim();
        if (!message) return;
        
        if (window.questionCount >= window.maxQuestions) {
            appendMessage('ai', '추가 질문은 5회까지만 가능합니다. 새로운 상담을 시작해주세요.', false);
            return;
        }

        appendMessage('user', message, false);
        userInput.value = '';

        const endpoint = window.currentMode === 'saju' ? '/api/saju/chat' : '/api/astrology/chat';
        
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'ai-message typing-cursor';
        loadingDiv.textContent = '분석 중...';
        loadingDiv.id = 'loading-msg';
        document.getElementById('chat-box').appendChild(loadingDiv);
        document.getElementById('chat-box').scrollTop = document.getElementById('chat-box').scrollHeight;

        const res = await callApi(endpoint, { 
            userMessage: message, 
            rawData: { userInfo: window.currentUserInfo } 
        });

        const loadingMsg = document.getElementById('loading-msg');
        if(loadingMsg) loadingMsg.remove();

        if (res.success) {
            window.questionCount++;
            updateQuestionCounter();
            appendMessage('ai', res.answer, true);
            
            if (res.remainingQuestions !== undefined && res.remainingQuestions === 0) {
                setTimeout(() => {
                    appendMessage('ai', '모든 추가 질문이 소진되었습니다. 새로운 상담을 원하시면 "새로운 분석" 버튼을 눌러주세요.', false);
                }, 1000);
            }
        } else {
            appendMessage('ai', '죄송합니다. 응답을 받아오지 못했습니다.', false);
        }
    }
    
    if (sendBtn) {
        sendBtn.addEventListener('click', sendMessage);
    }
    
    if (userInput) {
        userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }
});
