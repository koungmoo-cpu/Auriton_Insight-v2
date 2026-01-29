/* ============================================
   client-side logic: script.js
   ============================================ */

// 전역 변수 설정
window.currentMode = '';
window.currentUserInfo = {};

// 1. 화면 전환 함수 (window 객체에 직접 할당하여 HTML onclick에서 인식 가능하게 함)
window.selectMethod = function(method) {
    console.log("Method Selected:", method); // 디버깅용 로그
    window.currentMode = method;
    
    // 모든 화면 숨기기
    document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
    
    // 선택한 화면 보이기
    if (method === 'saju') {
        const sajuScreen = document.getElementById('saju-screen');
        if(sajuScreen) sajuScreen.classList.add('active');
    } else if (method === 'astrology') {
        const astroScreen = document.getElementById('astrology-screen');
        if(astroScreen) astroScreen.classList.add('active');
    }
}

window.backToSelection = function() {
    document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
    document.getElementById('selection-screen').classList.add('active');
    // 채팅창 초기화
    const chatBox = document.getElementById('chat-box');
    if(chatBox) chatBox.innerHTML = '';
}

window.showResultScreen = function() {
    document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
    document.getElementById('result-screen').classList.add('active');
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

// 3. 메시지 추가 함수
function appendMessage(sender, text) {
    const chatBox = document.getElementById('chat-box');
    if (!chatBox) return;
    
    const msgDiv = document.createElement('div');
    msgDiv.className = sender === 'user' ? 'user-message' : 'ai-message';
    msgDiv.innerText = text;
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// 4. API 호출 함수
async function callApi(endpoint, data) {
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        return { success: false, error: '서버 통신 오류' };
    }
}

// 5. 초기화 (DOM 로드 후 실행)
document.addEventListener('DOMContentLoaded', () => {
    console.log("Script Loaded & Ready"); // 디버깅용 로그

    setupGenderButtons('saju-gender-group');
    setupGenderButtons('astro-gender-group');

    // 사주 폼 제출
    const sajuForm = document.getElementById('saju-form');
    if (sajuForm) {
        sajuForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('saju-name').value;
            const genderBtn = document.querySelector('#saju-gender-group .active');
            const gender = genderBtn ? genderBtn.dataset.value : 'unknown';
            const date = document.getElementById('saju-date').value;
            const time = document.getElementById('saju-time').value;

            window.currentUserInfo = { name, gender, birthDate: `${date} ${time}` };
            
            window.showResultScreen();
            appendMessage('ai', '데이터 처리 중... 운명을 해석하고 있습니다.');

            const res = await callApi('/api/saju/consultation', { rawData: { userInfo: window.currentUserInfo } });
            if (res.success) {
                appendMessage('ai', res.consultation);
            } else {
                appendMessage('ai', '오류가 발생했습니다: ' + (res.error || '알 수 없는 오류'));
            }
        });
    }

    // 점성술 폼 제출
    const astroForm = document.getElementById('astro-form');
    if (astroForm) {
        astroForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('astro-name').value;
            const genderBtn = document.querySelector('#astro-gender-group .active');
            const gender = genderBtn ? genderBtn.dataset.value : 'unknown';
            const date = document.getElementById('astro-date').value;
            const time = document.getElementById('astro-time').value || '00:00';

            window.currentUserInfo = { name, gender, birthDate: `${date} ${time}` };
            
            window.showResultScreen();
            appendMessage('ai', '별들의 위치를 계산 중입니다...');

            const res = await callApi('/api/astrology/consultation', { rawData: { userInfo: window.currentUserInfo } });
            if (res.success) {
                appendMessage('ai', res.consultation);
            } else {
                appendMessage('ai', '오류가 발생했습니다: ' + (res.error || '알 수 없는 오류'));
            }
        });
    }

    // 채팅 전송
    const sendBtn = document.getElementById('send-btn');
    if (sendBtn) {
        sendBtn.addEventListener('click', async () => {
            const input = document.getElementById('user-input');
            const message = input.value.trim();
            if (!message) return;

            appendMessage('user', message);
            input.value = '';

            const endpoint = window.currentMode === 'saju' ? '/api/saju/chat' : '/api/astrology/chat';
            
            // 로딩 표시
            const loadingDiv = document.createElement('div');
            loadingDiv.className = 'ai-message';
            loadingDiv.innerText = '...';
            loadingDiv.id = 'loading-msg';
            document.getElementById('chat-box').appendChild(loadingDiv);

            const res = await callApi(endpoint, { 
                userMessage: message, 
                rawData: { userInfo: window.currentUserInfo } 
            });

            const loadingMsg = document.getElementById('loading-msg');
            if(loadingMsg) loadingMsg.remove();

            if (res.success) {
                appendMessage('ai', res.answer);
            } else {
                appendMessage('ai', '죄송합니다. 응답을 받아오지 못했습니다.');
            }
        });
    }
});