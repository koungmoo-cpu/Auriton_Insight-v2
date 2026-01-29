// 현재 선택된 모드 ('saju' 또는 'astrology')
let currentMode = '';
let currentUserInfo = {};

// 화면 전환 함수
function selectMethod(method) {
    currentMode = method;
    document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
    
    if (method === 'saju') {
        document.getElementById('saju-screen').classList.add('active');
    } else {
        document.getElementById('astrology-screen').classList.add('active');
    }
}

function backToSelection() {
    document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
    document.getElementById('selection-screen').classList.add('active');
    // 채팅창 초기화
    document.getElementById('chat-box').innerHTML = '';
}

function showResultScreen() {
    document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
    document.getElementById('result-screen').classList.add('active');
}

// 성별 버튼 선택 로직
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

// 메시지 추가 함수
function appendMessage(sender, text) {
    const chatBox = document.getElementById('chat-box');
    const msgDiv = document.createElement('div');
    msgDiv.className = sender === 'user' ? 'user-message' : 'ai-message';
    msgDiv.innerText = text;
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// API 호출 함수
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

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    setupGenderButtons('saju-gender-group');
    setupGenderButtons('astro-gender-group');

    // 사주 폼 제출
    document.getElementById('saju-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('saju-name').value;
        const genderBtn = document.querySelector('#saju-gender-group .active');
        const gender = genderBtn ? genderBtn.dataset.value : 'unknown';
        const date = document.getElementById('saju-date').value;
        const time = document.getElementById('saju-time').value;

        currentUserInfo = { name, gender, birthDate: `${date} ${time}` };
        
        showResultScreen();
        appendMessage('ai', '데이터 처리 중... 운명을 해석하고 있습니다.');

        const res = await callApi('/api/saju/consultation', { rawData: { userInfo: currentUserInfo } });
        if (res.success) {
            appendMessage('ai', res.consultation);
        } else {
            appendMessage('ai', '오류가 발생했습니다: ' + res.error);
        }
    });

    // 점성술 폼 제출
    document.getElementById('astro-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('astro-name').value;
        const genderBtn = document.querySelector('#astro-gender-group .active');
        const gender = genderBtn ? genderBtn.dataset.value : 'unknown';
        const date = document.getElementById('astro-date').value;
        const time = document.getElementById('astro-time').value || '00:00';

        currentUserInfo = { name, gender, birthDate: `${date} ${time}` };
        
        showResultScreen();
        appendMessage('ai', '별들의 위치를 계산 중입니다...');

        const res = await callApi('/api/astrology/consultation', { rawData: { userInfo: currentUserInfo } });
        if (res.success) {
            appendMessage('ai', res.consultation);
        } else {
            appendMessage('ai', '오류가 발생했습니다: ' + res.error);
        }
    });

    // 채팅 전송
    document.getElementById('send-btn').addEventListener('click', async () => {
        const input = document.getElementById('user-input');
        const message = input.value.trim();
        if (!message) return;

        appendMessage('user', message);
        input.value = '';

        const endpoint = currentMode === 'saju' ? '/api/saju/chat' : '/api/astrology/chat';
        
        // 로딩 표시
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'ai-message';
        loadingDiv.innerText = '...';
        loadingDiv.id = 'loading-msg';
        document.getElementById('chat-box').appendChild(loadingDiv);

        const res = await callApi(endpoint, { 
            userMessage: message, 
            rawData: { userInfo: currentUserInfo } 
        });

        document.getElementById('loading-msg').remove();

        if (res.success) {
            appendMessage('ai', res.answer);
        } else {
            appendMessage('ai', '죄송합니다. 응답을 받아오지 못했습니다.');
        }
    });
});