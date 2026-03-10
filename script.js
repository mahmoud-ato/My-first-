(function() {
    let system = { work: 12, holiday: 3 };
    let firstHolidayDate = '';
    let currentTheme = 'theme-light';
    let currentMonth = new Date();
    let manualOverrides = {};

    function loadSettings() {
        const sys = localStorage.getItem('yomyati_sys');
        if (sys) system = JSON.parse(sys);
        firstHolidayDate = localStorage.getItem('yomyati_date') || '';
        currentTheme = localStorage.getItem('yomyati_theme') || 'theme-light';
        document.body.className = currentTheme;
        const manual = localStorage.getItem('yomyati_manual');
        if (manual) manualOverrides = JSON.parse(manual);
    }

    function saveSettings() {
        localStorage.setItem('yomyati_sys', JSON.stringify(system));
        localStorage.setItem('yomyati_date', firstHolidayDate);
        localStorage.setItem('yomyati_theme', currentTheme);
        localStorage.setItem('yomyati_manual', JSON.stringify(manualOverrides));
    }

    function getDayType(date) {
        const dateStr = date.toISOString().split('T')[0];
        if (manualOverrides[dateStr]) return manualOverrides[dateStr];
        if (!firstHolidayDate) return 'work';

        const start = new Date(firstHolidayDate);
        start.setHours(0,0,0,0);
        const current = new Date(date);
        current.setHours(0,0,0,0);

        const diffTime = current - start;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const cycle = system.work + system.holiday;
        let mod = diffDays % cycle;
        if (mod < 0) mod += cycle;
        return mod < system.holiday ? 'holiday' : 'work';
    }

    function renderCalendar() {
        const grid = document.getElementById('calendar-grid');
        grid.innerHTML = '';
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();

        document.getElementById('display-month').innerText = 
            new Intl.DateTimeFormat('ar-EG', { month: 'long', year: 'numeric' }).format(currentMonth);

        const firstDay = new Date(year, month, 1).getDay();
        const offset = (firstDay + 1) % 7; // يبدأ السبت
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        for (let i = 0; i < offset; i++) grid.appendChild(document.createElement('div'));

        const today = new Date().toDateString();

        for (let d = 1; d <= daysInMonth; d++) {
            const cellDate = new Date(year, month, d);
            const type = getDayType(cellDate);
            const dateStr = cellDate.toISOString().split('T')[0];

            const cell = document.createElement('div');
            cell.className = `day-cell ${type === 'work' ? 'work-day' : 'holiday-day'}`;
            if (cellDate < new Date().setHours(0,0,0,0)) cell.classList.add('past-day');
            if (cellDate.toDateString() === today) cell.classList.add('today');

            cell.innerHTML = `<span>${d}</span><span class="hijri-date">${new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {day:'numeric'}).format(cellDate)}</span>`;
            if (manualOverrides[dateStr]) {
                const dot = document.createElement('div');
                dot.className = 'manual-dot';
                cell.appendChild(dot);
            }

            cell.onclick = () => {
                manualOverrides[dateStr] = type === 'work' ? 'holiday' : 'work';
                saveSettings();
                renderCalendar();
            };
            grid.appendChild(cell);
        }
    }

    function showScreen(id) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(id).classList.add('active');
    }

    document.addEventListener('DOMContentLoaded', () => {
        loadSettings();
        setTimeout(() => {
            if (firstHolidayDate) { showScreen('main-screen'); renderCalendar(); }
            else { showScreen('welcome-screen'); }
        }, 1500);

        document.getElementById('start-btn').onclick = () => showScreen('system-screen');
        document.querySelectorAll('[data-system]').forEach(btn => {
            btn.onclick = () => {
                if (btn.dataset.system === 'custom') document.getElementById('customModal').classList.add('active');
                else {
                    const [w, h] = btn.dataset.system.split('-').map(Number);
                    system = { work: w, holiday: h };
                    showScreen('date-screen');
                }
            };
        });

        document.getElementById('saveCustom').onclick = () => {
            system = { work: Number(document.getElementById('workDays').value), holiday: Number(document.getElementById('holidayDays').value) };
            document.getElementById('customModal').classList.remove('active');
            showScreen('date-screen');
        };

        document.getElementById('date-next').onclick = () => {
            firstHolidayDate = document.getElementById('first-holiday').value;
            if (firstHolidayDate) showScreen('theme-screen');
        };

        document.querySelectorAll('.theme-item').forEach(item => {
            item.onclick = () => { currentTheme = item.dataset.theme; document.body.className = currentTheme; };
        });

        document.getElementById('theme-next').onclick = () => { saveSettings(); showScreen('main-screen'); renderCalendar(); };
        
        document.getElementById('menu-btn').onclick = () => { 
            document.getElementById('sideDrawer').classList.add('open'); 
            document.getElementById('overlay').classList.add('show'); 
        };
        
        document.getElementById('overlay').onclick = () => {
            document.getElementById('sideDrawer').classList.remove('open');
            document.getElementById('overlay').classList.remove('show');
        };

        document.getElementById('reset-system').onclick = () => { localStorage.clear(); location.reload(); };
        document.getElementById('change-theme').onclick = () => showScreen('theme-screen');

        let startX = 0;
        document.getElementById('calendar-container').ontouchstart = e => startX = e.touches[0].clientX;
        document.getElementById('calendar-container').ontouchend = e => {
            const diff = e.changedTouches[0].clientX - startX;
            if (Math.abs(diff) > 50) {
                currentMonth.setMonth(currentMonth.getMonth() + (diff > 0 ? -1 : 1));
                renderCalendar();
            }
        };
    });
})();
