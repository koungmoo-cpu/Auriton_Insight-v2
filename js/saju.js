/* ============================================
   🔮 AI Ultra Dosa Sentinel - Saju Module
   ============================================ */
   console.log('[SYSTEM] Saju Module Loading...');

   window.sajuCalendarType = 'solar';
   
   window.initializeSajuForm = function() {
       console.log('🔮 Initializing Saju Form...');
       
       // Dropdown Population (Main.js의 함수 사용)
       window.populateYearOptions('saju-year');
       window.populateMonthOptions('saju-month');
       window.populateDayOptions('saju-day');
       
       // Gender Button Setup
       window.setupGenderButtons('saju-form');
       
       // Calendar Type Toggle
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
   
       const analysisData = {
           method: 'saju',
           userInfo: {
               name,
               gender: window.currentGender,
               birthDate: `${year}-${month}-${day}`,
               birthTime: time,
               calendarType: window.sajuCalendarType
           }
       };
       
       await window.callAnalysisAPI('/api/saju/consultation', analysisData, '🔮 SAJU ANALYSIS RESULT');
   }