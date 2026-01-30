/* ============================================
   ⭐ AI Ultra Dosa Sentinel - Astro Module
   Updated: Scroll Time Input
   ============================================ */
   console.log('[SYSTEM] Astro Module Loading...');

   window.initializeAstrologyForm = function() {
       console.log('⭐ Initializing Astro Form...');
       window.populateYearOptions('astro-year');
       window.populateMonthOptions('astro-month');
       window.populateDayOptions('astro-day');
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
   };
   
   function updateAstroDayOptions() {
       const year = parseInt(document.getElementById('astro-year').value);
       const month = parseInt(document.getElementById('astro-month').value);
       if (year && month) {
           const lastDay = window.getLastDayOfMonth(year, month);
           window.populateDayOptions('astro-day', lastDay);
       }
   }
   
   async function handleAstroSubmit(e) {
       e.preventDefault();
       const name = window.sanitizeInput(document.getElementById('astro-name').value);
       const year = document.getElementById('astro-year').value;
       const month = document.getElementById('astro-month').value;
       const day = document.getElementById('astro-day').value;
       const timeInput = document.getElementById('astro-time').value; // 스크롤 값
       
       if (!name || !window.currentGender || !year || !month || !day || !timeInput) {
           alert('필수 정보를 모두 입력해주세요.');
           return;
       }
   
       const analysisData = {
           method: 'astrology',
           userInfo: {
               name,
               gender: window.currentGender,
               birthDate: `${year}-${month}-${day}`,
               birthTime: timeInput,
               location: 'Unknown'
           }
       };
       
       await window.callAnalysisAPI('/api/astrology/consultation', analysisData, '⭐ ASTRO ANALYSIS RESULT');
   }