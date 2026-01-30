/* ============================================
   🔮 AI Ultra Dosa Sentinel - Saju Module
   Updated: Calendar Type Support & Logic Integration
   ============================================ */
   console.log('[SYSTEM] Saju Module Loading...');

   // 기본값: 양력
   window.sajuCalendarType = 'solar';
   
   window.initializeSajuForm = function() {
       console.log('🔮 Initializing Saju Form...');
       
       // Dropdown Population (Main.js의 함수 사용)
       window.populateYearOptions('saju-year');
       window.populateMonthOptions('saju-month');
       window.populateDayOptions('saju-day');
       window.populateHourOptions('saju-hour'); // 시간 옵션 추가
       
       // Gender Button Setup
       window.setupGenderButtons('saju-form');
       
       // Calendar Type Toggle (양력/음력 전환)
       setupCalendarToggle();
       
       // Date Change Event Listeners
       const yearSelect = document.getElementById('saju-year');
       const monthSelect = document.getElementById('saju-month');
       
       if (yearSelect && monthSelect) {
           yearSelect.addEventListener('change', updateSajuDayOptions);
           monthSelect.addEventListener('change', updateSajuDayOptions);
       }
       
       // Form Validation Listener
       const form = document.getElementById('saju-form');
       if (form) {
           form.querySelectorAll('input, select').forEach(input => {
               input.addEventListener('change', () => window.checkFormValidity('saju-form'));
           });
           form.addEventListener('submit', handleSajuSubmit);
       }
       
       console.log('🔮 Saju Form Initialized.');
   };
   
   function setupCalendarToggle() {
       const calendarButtons = document.querySelectorAll('#saju-form .option-button[data-calendar]');
       calendarButtons.forEach(btn => {
           // 중복 방지용 Clone
           const newBtn = btn.cloneNode(true);
           btn.parentNode.replaceChild(newBtn, btn);
           
           newBtn.addEventListener('click', function() {
               const siblings = newBtn.parentNode.querySelectorAll('.option-button');
               siblings.forEach(b => b.classList.remove('active'));
               this.classList.add('active');
               
               window.sajuCalendarType = this.dataset.calendar;
               console.log('Calendar Type:', window.sajuCalendarType);
               window.checkFormValidity('saju-form');
           });
       });
   }
   
   function updateSajuDayOptions() {
       const year = parseInt(document.getElementById('saju-year').value);
       const month = parseInt(document.getElementById('saju-month').value);
       
       if (year && month) {
           const lastDay = window.getLastDayOfMonth(year, month);
           window.populateDayOptions('saju-day', lastDay);
       }
   }

   // [추가됨] 간단한 간지 계산 헬퍼 함수 (업데이트 소스 반영)
   function calculateManifestation(y, m, d, t) {
       const gan = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
       const zhi = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];
       return `${gan[y%10]} ${zhi[y%12]}년... (약식)`; 
   }
   
   async function handleSajuSubmit(e) {
       e.preventDefault();
       const name = window.sanitizeInput(document.getElementById('saju-name').value);
       const year = document.getElementById('saju-year').value;
       const month = document.getElementById('saju-month').value;
       const day = document.getElementById('saju-day').value;
       const time = document.getElementById('saju-hour').value;
       
       if (!name || !window.currentGender || !year || !month || !day) {
           alert('필수 정보를 모두 입력해주세요.');
           return;
       }

       // [추가됨] 간지 계산 실행
       const fourPillars = calculateManifestation(year, month, day, time);
   
       const analysisData = {
           method: 'saju',
           userInfo: {
               name,
               gender: window.currentGender,
               birthDate: `${year}-${month}-${day}`,
               birthTime: time,
               // [핵심 변경] 서버가 이해할 수 있도록 '양력'/'음력' 한글로 변환하여 전송
               calendarType: window.sajuCalendarType === 'solar' ? '양력' : '음력'
           },
           // [추가됨] 사주 상세 데이터 구조 포함
           saju: {
               fourPillars: fourPillars,
               dayPillar: { full: fourPillars.split(' ')[2] || '정보 없음' }
           }
       };
       
       await window.callAnalysisAPI('/api/saju/consultation', analysisData, '🔮 SAJU ANALYSIS RESULT');
   }