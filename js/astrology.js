/* ============================================
   ⭐ AI Ultra Dosa Sentinel - Astro Module
   ============================================ */
   console.log('[SYSTEM] Astro Module Loading...');

   window.initializeAstrologyForm = function() {
       console.log('⭐ Initializing Astro Form...');
       
       window.populateYearOptions('astro-year');
       window.populateMonthOptions('astro-month');
       window.populateDayOptions('astro-day');
       window.populateHourOptions('astro-hour');
       
       window.setupGenderButtons('astro-form');
       
       const yearSelect = document.getElementById('astro-year');
       const monthSelect = document.getElementById('astro-month');
       if (yearSelect && monthSelect) {
           yearSelect.addEventListener('change', updateAstroDayOptions);
           monthSelect.addEventListener('change', updateAstroDayOptions);
       }
       
       const form = document.getElementById('astro-form');
       if (form) {
           form.querySelectorAll('input, select').forEach(input => {
               input.addEventListener('change', () => window.checkFormValidity('astro-form'));
           });
           form.addEventListener('submit', handleAstroSubmit);
       }
       setupTimeUnknownHandler();
   };
   
   function updateAstroDayOptions() {
       const year = parseInt(document.getElementById('astro-year').value);
       const month = parseInt(document.getElementById('astro-month').value);
       
       if (year && month) {
           const lastDay = window.getLastDayOfMonth(year, month);
           window.populateDayOptions('astro-day', lastDay);
       }
   }
   
   function setupTimeUnknownHandler() {
       const periodSelect = document.getElementById('astro-period');
       const hourSelect = document.getElementById('astro-hour');
       const minuteSelect = document.getElementById('astro-minute');
       
       if (!periodSelect) return;
       
       // 기존 리스너 제거
       const newSelect = periodSelect.cloneNode(true);
       periodSelect.parentNode.replaceChild(newSelect, periodSelect);
       
       newSelect.addEventListener('change', function() {
           const isUnknown = this.value === 'unknown';
           if (hourSelect) {
               hourSelect.disabled = isUnknown;
               if (isUnknown) hourSelect.value = "";
           }
           if (minuteSelect) {
               minuteSelect.disabled = isUnknown;
               if (isUnknown) minuteSelect.value = "";
           }
           window.checkFormValidity('astro-form');
       });
   }
   
   async function handleAstroSubmit(e) {
       e.preventDefault();
       const name = window.sanitizeInput(document.getElementById('astro-name').value);
       const year = document.getElementById('astro-year').value;
       const month = document.getElementById('astro-month').value;
       const day = document.getElementById('astro-day').value;
       const period = document.getElementById('astro-period').value;
       
       if (!name || !window.currentGender || !year || !month || !day) {
           alert('필수 정보를 모두 입력해주세요.');
           return;
       }
   
       const analysisData = {
           method: 'astrology',
           userInfo: {
               name,
               gender: window.currentGender,
               birthDate: `${year}-${month}-${day}`,
               birthTime: period === 'unknown' ? 'Unknown' : `${period} ${document.getElementById('astro-hour').value}:${document.getElementById('astro-minute').value}`,
               location: 'Unknown'
           }
       };
       
       await window.callAnalysisAPI('/api/astrology/consultation', analysisData, '⭐ ASTRO ANALYSIS RESULT');
   }