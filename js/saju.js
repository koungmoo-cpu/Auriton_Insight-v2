/* ============================================
   🔮 AI Ultra Dosa Sentinel - Saju Module
   Updated: Calendar Type Support
   ============================================ */
   console.log('[SYSTEM] Saju Module Loading...');

   window.sajuCalendarType = 'solar';
   
   window.initializeSajuForm = function() {
       console.log('🔮 Initializing Saju Form...');
       window.populateYearOptions('saju-year');
       window.populateMonthOptions('saju-month');
       window.populateDayOptions('saju-day');
       window.populateHourOptions('saju-hour');
       window.setupGenderButtons('saju-form');
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
               input.addEventListener('change', () => window.checkFormValidity('saju-form'));
           });
           form.addEventListener('submit', handleSajuSubmit);
       }
   };
   
   function setupCalendarToggle() {
       const calendarButtons = document.querySelectorAll('#saju-form .option-button[data-calendar]');
       calendarButtons.forEach(btn => {
           const newBtn = btn.cloneNode(true);
           btn.parentNode.replaceChild(newBtn, btn);
           newBtn.addEventListener('click', function() {
               const siblings = newBtn.parentNode.querySelectorAll('.option-button');
               siblings.forEach(b => b.classList.remove('active'));
               this.classList.add('active');
               window.sajuCalendarType = this.dataset.calendar;
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

       const fourPillars = calculateManifestation(year, month, day, time);
   
       const analysisData = {
           method: 'saju',
           userInfo: {
               name,
               gender: window.currentGender,
               birthDate: `${year}-${month}-${day}`,
               birthTime: time,
               calendarType: window.sajuCalendarType === 'solar' ? '양력' : '음력'
           },
           saju: {
               fourPillars: fourPillars,
               dayPillar: { full: fourPillars.split(' ')[2] || '정보 없음' }
           }
       };
       
       await window.callAnalysisAPI('/api/saju/consultation', analysisData, '🔮 SAJU ANALYSIS RESULT');
   }