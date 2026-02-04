/* ============================================
   Auriton InsightAI - Script
   ============================================ */

// Global Variables
let currentMode = '';
let currentUserInfo = {};
let currentRawData = {};

// ========== Canvas Network Animation ==========
function initNetworkCanvas() {
    const canvas = document.getElementById('network-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const particleCount = 80;
    
    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.vx = (Math.random() - 0.5) * 0.5;
            this.vy = (Math.random() - 0.5) * 0.5;
            this.radius = Math.random() * 2 + 1;
        }
        
        update() {
            this.x += this.vx;
            this.y += this.vy;
            
            if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
            if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
        }
        
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(176, 38, 255, 0.5)';
            ctx.fill();
        }
    }
    
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }
    
    function connectParticles() {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 150) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(0, 212, 255, ${(150 - distance) / 150 * 0.3})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }
    }
    
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach(particle => {
            particle.update();
            particle.draw();
        });
        
        connectParticles();
        requestAnimationFrame(animate);
    }
    
    animate();
    
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
}

// ========== Navigation ==========
function showSection(section) {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(s => s.classList.remove('active'));
    
    if (section === 'selection') {
        document.getElementById('selection-screen').classList.add('active');
    }
    
    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.onclick && item.onclick.toString().includes(section)) {
            item.classList.add('active');
        }
    });
}

function selectMethod(method) {
    currentMode = method;
    
    const screens = document.querySelectorAll('.screen');
    screens.forEach(s => s.classList.remove('active'));
    
    if (method === 'saju') {
        document.getElementById('saju-screen').classList.add('active');
    } else if (method === 'astrology') {
        document.getElementById('astrology-screen').classList.add('active');
    }
}

function backToSelection() {
    currentMode = '';
    currentUserInfo = {};
    currentRawData = {};
    
    const screens = document.querySelectorAll('.screen');
    screens.forEach(s => s.classList.remove('active'));
    document.getElementById('selection-screen').classList.add('active');
    
    // Clear chat
    const chatBox = document.getElementById('chat-box');
    if (chatBox) chatBox.innerHTML = '';
}

function showResultScreen() {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(s => s.classList.remove('active'));
    document.getElementById('result-screen').classList.add('active');
}

// ========== Form Helpers ==========
function setupOptionButtons(groupId) {
    const group = document.getElementById(groupId);
    if (!group) return;
    
    const buttons = group.querySelectorAll('.gender-btn, .calendar-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
}

function populateDateSelects() {
    const targets = [
        { y: 'saju-year', m: 'saju-month', d: 'saju-day' },
        { y: 'astro-year', m: 'astro-month', d: 'astro-day' }
    ];
    
    targets.forEach(target => {
        const ySelect = document.getElementById(target.y);
        const mSelect = document.getElementById(target.m);
        const dSelect = document.getElementById(target.d);
        
        if (ySelect) {
            const currentYear = new Date().getFullYear();
            for (let i = currentYear; i >= 1920; i--) {
                const opt = document.createElement('option');
                opt.value = i;
                opt.textContent = i + '년';
                ySelect.appendChild(opt);
            }
        }
        
        if (mSelect) {
            for (let i = 1; i <= 12; i++) {
                const opt = document.createElement('option');
                opt.value = i;
                opt.textContent = i + '월';
                mSelect.appendChild(opt);
            }
        }
        
        if (dSelect) {
            for (let i = 1; i <= 31; i++) {
                const opt = document.createElement('option');
                opt.value = i;
                opt.textContent = i + '일';
                dSelect.appendChild(opt);
            }
        }
    });
}

// ========== Chat Functions ==========
function appendMessage(sender, text) {
    const chatBox = document.getElementById('chat-box');
    if (!chatBox) return;
    
    const msgDiv = document.createElement('div');
    msgDiv.className = sender === 'user' ? 'user-message' : 'ai-message';
    msgDiv.innerHTML = text.replace(/\n/g, '<br>');
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

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

// ========== Astrology Calculation ==========
function calculateAstrology(year, month, day) {
    // Simple zodiac calculation
    const zodiacDates = [
        { sign: '양자리', start: [3, 21], end: [4, 19] },
        { sign: '황소자리', start: [4, 20], end: [5, 20] },
        { sign: '쌍둥이자리', start: [5, 21], end: [6, 21] },
        { sign: '게자리', start: [6, 22], end: [7, 22] },
        { sign: '사자자리', start: [7, 23], end: [8, 22] },
        { sign: '처녀자리', start: [8, 23], end: [9, 22] },
        { sign: '천칭자리', start: [9, 23], end: [10, 22] },
        { sign: '전갈자리', start: [10, 23], end: [11, 21] },
        { sign: '사수자리', start: [11, 22], end: [12, 21] },
        { sign: '염소자리', start: [12, 22], end: [1, 19] },
        { sign: '물병자리', start: [1, 20], end: [2, 18] },
        { sign: '물고기자리', start: [2, 19], end: [3, 20] }
    ];
    
    let sunSign = '물고기자리';
    for (const z of zodiacDates) {
        if ((month === z.start[0] && day >= z.start[1]) || 
            (month === z.end[0] && day <= z.end[1])) {
            sunSign = z.sign;
            break;
        }
    }
    
    return {
        sunSign: sunSign,
        year: year,
        month: month,
        day: day
    };
}

// ========== Init ==========
document.addEventListener('DOMContentLoaded', () => {
    console.log('Auriton InsightAI Loaded');
    
    // Initialize canvas animation
    initNetworkCanvas();
    
    // Setup forms
    setupOptionButtons('saju-gender-group');
    setupOptionButtons('saju-calendar-group');
    setupOptionButtons('astro-gender-group');
    populateDateSelects();
    
    // Saju Form Submit
    const sajuForm = document.getElementById('saju-form');
    if (sajuForm) {
        sajuForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!document.getElementById('saju-privacy').checked) {
                alert('개인정보 처리 방침에 동의해주세요.');
                return;
            }
            
            const name = document.getElementById('saju-name').value;
            const genderBtn = document.querySelector('#saju-gender-group .active');
            const gender = genderBtn ? genderBtn.dataset.value : 'male';
            const calendarBtn = document.querySelector('#saju-calendar-group .active');
            const calendarType = calendarBtn && calendarBtn.dataset.value === 'lunar' ? '음력' : '양력';
            
            const year = document.getElementById('saju-year').value;
            const month = document.getElementById('saju-month').value;
            const day = document.getElementById('saju-day').value;
            const time = document.getElementById('saju-time').value || '12:00';
            
            currentUserInfo = {
                name,
                gender: gender === 'male' ? '남성' : '여성',
                birthDate: `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`,
                birthTime: time,
                calendarType: calendarType
            };
            
            showResultScreen();
            appendMessage('ai', `분석을 시작합니다... [${calendarType}] ${year}년 ${month}월 ${day}일 정보를 분석 중입니다.`);
            
            const res = await callApi('/api/saju/consultation', { 
                rawData: { userInfo: currentUserInfo } 
            });
            
            appendMessage('ai', res.success ? res.consultation : '오류 발생: ' + res.error);
        });
    }
    
    // Astrology Form Submit
    const astroForm = document.getElementById('astro-form');
    if (astroForm) {
        astroForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!document.getElementById('astro-privacy').checked) {
                alert('개인정보 처리 방침에 동의해주세요.');
                return;
            }
            
            const name = document.getElementById('astro-name').value;
            const genderBtn = document.querySelector('#astro-gender-group .active');
            const gender = genderBtn ? genderBtn.dataset.value : 'male';
            
            const year = parseInt(document.getElementById('astro-year').value);
            const month = parseInt(document.getElementById('astro-month').value);
            const day = parseInt(document.getElementById('astro-day').value);
            const time = document.getElementById('astro-time').value || '12:00';
            const location = document.getElementById('astro-location').value || '서울, 대한민국';
            
            const fMonth = month.toString().padStart(2, '0');
            const fDay = day.toString().padStart(2, '0');
            
            currentUserInfo = {
                name,
                gender: gender === 'male' ? '남성' : '여성',
                birthDate: `${year}-${fMonth}-${fDay}`,
                birthTime: time,
                location: location
            };
            
            const astroResult = calculateAstrology(year, month, day);
            currentRawData = { userInfo: currentUserInfo, astrology: astroResult };
            
            showResultScreen();
            appendMessage('ai', '별들의 위치를 계산 중입니다. 출생지 정보를 연동합니다...');
            
            const res = await callApi('/api/astrology/consultation', { rawData: currentRawData });
            appendMessage('ai', res.success ? res.consultation : '오류: ' + res.error);
        });
    }
    
    // Chat Send Button
    const sendBtn = document.getElementById('send-btn');
    if (sendBtn) {
        sendBtn.addEventListener('click', async () => {
            const input = document.getElementById('user-input');
            const message = input.value.trim();
            if (!message) return;
            
            appendMessage('user', message);
            input.value = '';
            
            const endpoint = currentMode === 'saju' ? '/api/saju/chat' : '/api/astrology/chat';
            const res = await callApi(endpoint, { 
                userMessage: message, 
                rawData: currentRawData 
            });
            
            appendMessage('ai', res.success ? res.answer : '응답 실패');
        });
    }
    
    // Enter key for chat
    const userInput = document.getElementById('user-input');
    if (userInput) {
        userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('send-btn').click();
            }
        });
    }
});
