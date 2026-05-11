const STORAGE_KEY = 'brawlStarsTrackerData';
let appData = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
let selectedDate = getLocalISODate();
let realTodayDate = getLocalISODate(); 
let currentStreak = parseInt(localStorage.getItem('brawlStreak')) || 0;
let lastStreak = parseInt(localStorage.getItem('brawlLastStreak')) || 0; 
let chartInstance = null;
let calYear = new Date().getFullYear();
let calMonth = new Date().getMonth();

function init() {
    setInterval(updateClock, 1000);
    updateClock();
    const datePicker = document.getElementById('date-picker');
    datePicker.value = selectedDate;
    datePicker.addEventListener('change', (e) => {
        selectedDate = e.target.value;
        const parts = selectedDate.split('-');
        calYear = parseInt(parts[0]);
        calMonth = parseInt(parts[1]) - 1;
        renderUI();
    });
    updateStreakUI();
    renderUI();
}

function getLocalISODate() {
    const now = new Date();
    return now.toISOString().split('T')[0];
}

function updateClock() {
    const now = new Date();
    document.getElementById('clock').textContent = now.toLocaleString();
    const newTodayDate = getLocalISODate();
    if (newTodayDate !== realTodayDate) {
        realTodayDate = newTodayDate;
        selectedDate = realTodayDate;
        document.getElementById('date-picker').value = selectedDate;
        renderUI();
    }
}

function ensureDateExists(dateStr) {
    if (!appData[dateStr]) appData[dateStr] = { wins: 0, losses: 0, logs: [] };
}

function switchView(viewName) {
    document.getElementById('tracker-view').style.display = viewName === 'tracker' ? 'block' : 'none';
    document.getElementById('calendar-view').style.display = viewName === 'calendar' ? 'block' : 'none';
    if (viewName === 'calendar') renderCalendarAndChart();
    else renderUI();
}

function updateStreakUI() {
    const banner = document.getElementById('streak-banner');
    banner.textContent = `🔥 Racha: ${currentStreak}`;
}

function updateScore(type, amount) {
    if (selectedDate !== getLocalISODate()) return alert("🔒 Modo lectura.");
    ensureDateExists(selectedDate);
    const key = type === 'loss' ? 'losses' : 'wins';
    if (amount < 0 && appData[selectedDate][key] <= 0) return;
    appData[selectedDate][key] += amount;
    if (amount > 0) {
        if (type === 'win') currentStreak++;
        else { lastStreak = currentStreak; currentStreak = 0; }
    } else {
        if (type === 'win') currentStreak = Math.max(0, currentStreak - 1);
        else currentStreak = lastStreak; 
    }
    localStorage.setItem('brawlStreak', currentStreak);
    localStorage.setItem('brawlLastStreak', lastStreak);
    updateStreakUI();
    appData[selectedDate].logs.unshift({ type, action: amount > 0 ? '+1' : '-1', time: new Date().toLocaleTimeString() });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
    renderUI();
}

function undoLastAction() {
    if (selectedDate !== getLocalISODate()) return;
    if (!appData[selectedDate] || appData[selectedDate].logs.length === 0) return;
    const lastLog = appData[selectedDate].logs.shift();
    const key = lastLog.type === 'loss' ? 'losses' : 'wins';
    appData[selectedDate][key] = Math.max(0, appData[selectedDate][key] - (lastLog.action === '+1' ? 1 : -1));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
    renderUI();
}

function renderUI() {
    ensureDateExists(selectedDate);
    const dayData = appData[selectedDate];
    const isToday = selectedDate === getLocalISODate();
    document.querySelectorAll('.action-btn').forEach(btn => btn.disabled = !isToday);
    document.getElementById('read-only-badge').style.display = isToday ? 'none' : 'block';
    document.getElementById('win-score').textContent = dayData.wins;
    document.getElementById('loss-score').textContent = dayData.losses;
    document.getElementById('summary-win').textContent = dayData.wins;
    document.getElementById('summary-loss').textContent = dayData.losses;
    const wr = (dayData.wins + dayData.losses) > 0 ? Math.round((dayData.wins / (dayData.wins + dayData.losses)) * 100) : 0;
    document.getElementById('summary-wr').textContent = wr + '%';
    const logList = document.getElementById('log-list');
    logList.innerHTML = dayData.logs.map(log => `<li class="log-item"><span>${log.type.toUpperCase()}</span><span>${log.time}</span></li>`).join('');
}

function renderCalendarAndChart() {
    const grid = document.getElementById('cal-grid');
    grid.innerHTML = '';
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const cell = document.createElement('div');
        cell.className = 'day-cell';
        cell.textContent = day;
        if (appData[dateStr]) {
            const d = appData[dateStr];
            if (d.wins > d.losses) cell.classList.add('good');
            else if (d.losses > d.wins) cell.classList.add('bad');
        }
        cell.onclick = () => { selectedDate = dateStr; switchView('tracker'); };
        grid.appendChild(cell);
    }
}

window.onload = init;