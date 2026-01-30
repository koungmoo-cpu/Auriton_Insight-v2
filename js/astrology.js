/* ============================================
   ⭐ AI Ultra Dosa Sentinel - Astro Module
   Updated: Time Input (Scroll Type)
   ============================================ */
   console.log('[SYSTEM] Astro Module Loading...');

   window.initializeAstrologyForm = function() {
       console.log('⭐ Initializing Astro Form...');
       
       // 1. 날짜 옵션 초기화 (기존 유지)
       window.populateYearOptions('astro-year');
       window.populateMonthOptions('astro-month');
       window.populateDayOptions('astro-day');
       // window.populateHourOptions('astro-hour'); // [삭제] 더 이상 필요 없음
       
       // 2. 성별 버튼 설정 (기존 유지)
       window.setupGenderButtons('astro-form');
       
       // 3. 날짜 변경 시 일(Day) 옵션 업데이트 (기존 유지)
       const yearSelect = document.getElementById('astro-year');
       const monthSelect = document.getElementById('astro-month');
       if (yearSelect && monthSelect) {
           yearSelect.addEventListener('change', updateAstroDayOptions);
           monthSelect.addEventListener('change', updateAstroDayOptions);
       }
       
       // 4. 폼 이벤트 리스너 (기존 유지)
       const form = document.getElementById('astro-form');
       if (form) {
           form.querySelectorAll('input, select').forEach(input => {
               input.addEventListener('change', () => window.checkFormValidity('astro-form'));
           });
           form.addEventListener('submit', handleAstroSubmit);
       }
       
       // setupTimeUnknownHandler(); // [삭제] 기존 복잡한 시간 핸들러 제거
   };
   
   // 날짜 계산 함수 (건드리지 않음)
   function updateAstroDayOptions() {
       const year = parseInt(document.getElementById('astro-year').value);
       const month = parseInt(document.getElementById('astro-month').value);
       
       if (year && month) {
           const lastDay = window.getLastDayOfMonth(year, month);
           window.populateDayOptions('astro-day', lastDay);
       }
   }
   
   // [핵심 수정] 데이터 전송 핸들러
   async function handleAstroSubmit(e) {
       e.preventDefault();
       
       // 기본 정보 가져오기
       const name = window.sanitizeInput(document.getElementById('astro-name').value);
       const year = document.getElementById('astro-year').value;
       const month = document.getElementById('astro-month').value;
       const day = document.getElementById('astro-day').value;
       
       // [변경됨] 복잡한 시간 조합 대신, 스크롤 입력값(HH:mm) 하나만 가져옴
       const timeInput = document.getElementById('astro-time').value;
       
       // 필수값 체크 (시간 포함)
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
               birthTime: timeInput, // [변경됨] 예: "14:30" 그대로 전송
               location: 'Unknown'   // 위치 정보는 추후 확장 가능
           }
       };
       
       await window.callAnalysisAPI('/api/astrology/consultation', analysisData, '⭐ ASTRO ANALYSIS RESULT');
   }