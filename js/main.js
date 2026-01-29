/* ============================================
   🌟 AI Ultra Dosa Sentinel v2.0 - Main Core
   Updated: Added Missing Chat Functionality
   ============================================ */

   console.log('[SYSTEM] Main Core Initializing...');

   // 전역 변수 선언
   window.currentMethod = null;
   window.currentGender = null;
   window.currentRawData = null;
   window.currentCalendarType = 'solar';
   
   // 화면 전환 함수
   window.selectMethod = function(method) {
       console.log(`[SYSTEM] Method Selected: ${method}`);
       window.currentMethod = method;
       hideScreen('selection-screen');
       
       if (method === 'saju') {
           showScreen('saju-screen');
           // 사주 초기화 함수가 로드되었는지 확인 후 실행
           if (typeof window.initializeSajuForm === 'function') {
               window.initializeSajuForm();
           } else {
               console.error('[ERROR] initializeSajuForm not found!');
           }
       } else if (method === 'astrology') {
           showScreen('astrology-screen');
           // 점성술 초기화 함수 확인 후 실행
           if (typeof window.initializeAstrologyForm === 'function') {
               window.initializeAstrologyForm();
           } else {
               console.error('[ERROR] initializeAstrologyForm not found!');
           }
       }
   };
   
   window.backToSelection = function() {
       hideScreen('saju-screen');
       hideScreen('astrology-screen');
       hideScreen('result-screen');
       showScreen('selection-screen');
       
       document.getElementById('saju-form')?.reset();
       document.getElementById('astro-form')?.reset();
       window.currentMethod = null;
       window.currentGender = null;
       window.currentRawData = null;
       
       // 버튼 활성 상태 초기화
       document.querySelectorAll('.option-button').forEach(btn => btn.classList.remove('active'));
       // 기본 양력 버튼은 활성화
       const defaultSolar = document.querySelector('[data-calendar="solar"]');
       if(defaultSolar) defaultSolar.classList.add('active');
   };
   
   window.startNewAnalysis = function() {
       window.backToSelection();
   };
   
   function showScreen(screenId) {
       const screen = document.getElementById(screenId);
       if (screen) {
           screen.classList.add('active');
           screen.style.display = 'block';
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
   // 유틸리티 함수 (전역 등록)
   // ============================================
   
   window.sanitizeInput = function(input) {
       if (typeof input !== 'string') return '';
       return input.trim().replace(/[<>]/g, '').substring(0, 500);
   };
   
   window.populateYearOptions = function(selectId) {
       const select = document.getElementById(selectId);
       if (!select) return;
       const currentYear = new Date().getFullYear();
       select.innerHTML = '<option value="">년(Year)</option>';
       for (let year = currentYear; year >= 1900; year--) {
           const option = document.createElement('option');
           option.value = year;
           option.textContent = year + '년';
           select.appendChild(option);
       }
   };
   
   window.populateMonthOptions = function(selectId) {
       const select = document.getElementById(selectId);
       if (!select) return;
       select.innerHTML = '<option value="">월(Month)</option>';
       for (let month = 1; month <= 12; month++) {
           const option = document.createElement('option');
           option.value = month;
           option.textContent = month + '월';
           select.appendChild(option);
       }
   };
   
   window.populateDayOptions = function(selectId, maxDay = 31) {
       const select = document.getElementById(selectId);
       if (!select) return;
       const currentVal = select.value; // 기존 선택 유지 노력
       select.innerHTML = '<option value="">일(Day)</option>';
       for (let day = 1; day <= maxDay; day++) {
           const option = document.createElement('option');
           option.value = day;
           option.textContent = day + '일';
           select.appendChild(option);
       }
       if (currentVal && currentVal <= maxDay) select.value = currentVal;
   };
   
   window.populateHourOptions = function(selectId) {
       const select = document.getElementById(selectId);
       if (!select) return;
       select.innerHTML = '<option value="">시</option>';
       for (let hour = 1; hour <= 12; hour++) {
           const option = document.createElement('option');
           option.value = hour;
           option.textContent = hour + '시';
           select.appendChild(option);
       }
   };
   
   window.getLastDayOfMonth = function(year, month) {
       return new Date(year, month, 0).getDate();
   };
   
   window.convertTo24Hour = function(period, hour) {
       if (period === 'unknown') return 12;
       const h = parseInt(hour);
       if (isNaN(h)) return 12;
       
       if (period === 'am') return h === 12 ? 0 : h;
       if (period === 'pm') return h === 12 ? 12 : h + 12;
       return 12;
   };
   
   window.setupGenderButtons = function(formId) {
       const form = document.getElementById(formId);
       if (!form) return;
       const buttons = form.querySelectorAll('.option-button[data-gender]');
       
       buttons.forEach(btn => {
           // 기존 리스너 제거 (중복 방지)
           const newBtn = btn.cloneNode(true);
           btn.parentNode.replaceChild(newBtn, btn);
           
           newBtn.addEventListener('click', function() {
               // 형제 버튼들 active 제거
               const siblings = newBtn.parentNode.querySelectorAll('.option-button');
               siblings.forEach(b => b.classList.remove('active'));
               
               // 본인 active 추가
               this.classList.add('active');
               window.currentGender = this.dataset.gender;
               console.log('Gender selected:', window.currentGender);
               window.checkFormValidity(formId);
           });
       });
   };
   
   window.checkFormValidity = function(formId) {
       const form = document.getElementById(formId);
       if (!form) return;
       const submitBtn = form.querySelector('button[type="submit"]');
       if (!submitBtn) return;
       
       let isValid = true;
       const requiredInputs = form.querySelectorAll('[required]');
       const prefix = formId.replace('-form', '');
       const periodSelect = document.getElementById(`${prefix}-period`);
       const isUnknownTime = periodSelect && periodSelect.value === 'unknown';
   
       requiredInputs.forEach(input => {
           // 시간 모름일 경우 시간/분 입력 체크 건너뜀
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
   
       if (!window.currentGender) isValid = false;
       
       submitBtn.disabled = !isValid;
       return isValid;
   };
   
   // ============================================
   // API & Chat Logic
   // ============================================
   
   window.displayResult = function(title, message) {
       hideScreen('saju-screen');
       hideScreen('astrology-screen');
       showScreen('result-screen');
       
       document.getElementById('result-title').textContent = title;
       const chatMessages = document.getElementById('chat-messages');
       chatMessages.innerHTML = '';
       
       addChatMessage(message, 'ai');
   };
   
   function addChatMessage(text, sender) {
       const chatMessages = document.getElementById('chat-messages');
       if (!chatMessages) return;
       
       const messageDiv = document.createElement('div');
       if (sender === 'ai') {
           messageDiv.className = 'ai-message';
           chatMessages.appendChild(messageDiv);
           typeWriter(messageDiv, text, 30);
       } else {
           if (sender === 'user') messageDiv.className = 'user-message';
           if (sender === 'system') {
               messageDiv.className = 'ai-message';
               messageDiv.style.color = '#FF2A2A';
               text = '🚨 ' + text;
           }
           messageDiv.innerText = text;
           chatMessages.appendChild(messageDiv);
       }
       chatMessages.scrollTop = chatMessages.scrollHeight;
   }
   
   function typeWriter(element, text, speed) {
       let i = 0;
       element.innerHTML = "";
       const cursorSpan = document.createElement('span');
       cursorSpan.classList.add('dosa-cursor');
       element.appendChild(cursorSpan);
   
       function type() {
           if (i < text.length) {
               const char = text.charAt(i);
               const textNode = document.createTextNode(char);
               element.insertBefore(textNode, cursorSpan);
               i++;
               const container = document.getElementById('chat-messages');
               if(container) container.scrollTop = container.scrollHeight;
               setTimeout(type, speed);
           } else {
               setTimeout(() => { cursorSpan.style.display = 'none'; }, 2000);
           }
       }
       type();
   }
   
   window.callAnalysisAPI = async function(endpoint, data, resultTitle) {
       const formId = window.currentMethod === 'saju' ? 'saju-form' : 'astro-form';
       const submitBtn = document.querySelector(`#${formId} button[type="submit"]`);
       if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'ANALYZING...'; }
       
       try {
           // 실제 API 호출
           const response = await fetch(endpoint, {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ rawData: data })
           });
           const result = await response.json();
           
           if (result.success) {
               window.currentRawData = data;
               window.displayResult(resultTitle, result.consultation);
           } else {
               alert(`⚠️ Error: ${result.error}`);
           }
       } catch (error) {
           console.warn('API Fail, switching to demo mode');
           window.currentRawData = data;
           const demoText = `[DEMO MODE]\nSimon님, 입력하신 데이터(${data.userInfo.birthDate})를 바탕으로 분석 결과입니다.\n\n현재 로컬호스트 테스트 중이므로 서버 응답 대신 이 메시지가 표시됩니다.\n\n올해의 운세는 매우 강력한 변화의 기운이 감지됩니다...`;
           window.displayResult(resultTitle, demoText);
       } finally {
           if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'ACTIVATE ANALYSIS'; }
       }
   };

   // ============================================
   // 🟢 [추가됨] 채팅 전송 기능
   // ============================================
   async function sendChatMessage() {
       const input = document.getElementById('chat-input');
       const message = input.value.trim();
       if (!message) return;
       
       // 1. 사용자 메시지 표시
       addChatMessage(message, 'user');
       input.value = '';
       
       const sendBtn = document.getElementById('send-button');
       if(sendBtn) { sendBtn.disabled = true; sendBtn.innerText = '...'; }

       try {
           // 현재 모드(사주/점성술)에 맞춰 API 주소 선택
           const endpoint = window.currentMethod === 'saju' ? '/api/saju/chat' : '/api/astrology/chat';
           
           const response = await fetch(endpoint, {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ 
                   userMessage: message, 
                   rawData: window.currentRawData 
               })
           });
           
           const data = await response.json();
           
           if (data.success) {
               addChatMessage(data.answer, 'ai');
           } else {
               addChatMessage('오류 발생: ' + data.error, 'system');
           }
       } catch (error) {
           addChatMessage('서버 연결이 끊어졌어요.', 'system');
       } finally {
           if(sendBtn) { sendBtn.disabled = false; sendBtn.innerText = 'TRANSMIT'; }
           input.focus();
       }
   }
   
   // 초기화 이벤트
   document.addEventListener('DOMContentLoaded', () => {
       console.log('✅ Main Loaded. Ready.');
       
       // 채팅 버튼 및 엔터키 이벤트 연결
       const sendBtn = document.getElementById('send-button');
       const chatInput = document.getElementById('chat-input');
       
       if (sendBtn) sendBtn.addEventListener('click', sendChatMessage);
       
       if (chatInput) {
           chatInput.addEventListener('keypress', function(e) {
               if (e.key === 'Enter') {
                   e.preventDefault(); 
                   sendChatMessage();
               }
           });
       }
   });