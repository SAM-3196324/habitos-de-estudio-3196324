/**
 * FOCO 25 - Lógica de la aplicación P0
 * Repositorio: habitos de estudio 3196324
 * Autor: Asistente Senior de Desarrollo Web
 */

// 1. CONSTANTES Y CONFIGURACIÓN
const WORK_MINUTES = 25;
const BREAK_MINUTES = 5;
const STORAGE_KEY = 'foco25_sessions_p0';

// Estado global de la aplicación
let timerMode = 'work'; // 'work' | 'break'
let secondsLeft = WORK_MINUTES * 60;
let timerInterval = null;
let isRunning = false;
let soundEnabled = true;

// Web Audio API para tictac analógico vintage
let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) audioCtx = new AudioContextClass();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Reproducción de tictac sutil
function playVintageTick(isHigh = false) {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.setValueAtTime(isHigh ? 1200 : 800, ctx.currentTime);
    gain.gain.setValueAtTime(0.03, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.02);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.025);
  } catch (e) {
    // Ignorar en navegadores con autoplay bloqueado
  }
}

// Campana de finalización
function playVintageBell() {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(659.25, ctx.currentTime); // Mi5
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 2.6);
  } catch (e) {}
}

// 2. REFERENCIAS AL DOM
const timeText = document.getElementById('timeText');
const timerStatus = document.getElementById('timerStatus');
const activeSubjectText = document.getElementById('activeSubjectText');
const selectSubject = document.getElementById('selectSubject');
const selectIntention = document.getElementById('selectIntention');
const btnTogglePlay = document.getElementById('btnTogglePlay');
const btnReset = document.getElementById('btnReset');
const btnManualLog = document.getElementById('btnManualLog');
const btnModeWork = document.getElementById('btnModeWork');
const btnModeBreak = document.getElementById('btnModeBreak');
const btnSoundToggle = document.getElementById('btnSoundToggle');
const soundIcon = document.getElementById('soundIcon');
const progressCircle = document.getElementById('progressCircle');

// Modales y métricas
const logModal = document.getElementById('logModal');
const modalSubject = document.getElementById('modalSubject');
const modalMins = document.getElementById('modalMins');
const modalNotes = document.getElementById('modalNotes');
const formSaveSession = document.getElementById('formSaveSession');
const btnCancelModal = document.getElementById('btnCancelModal');

const totalWeeklyMins = document.getElementById('totalWeeklyMins');
const totalWeeklySessions = document.getElementById('totalWeeklySessions');
const bestDayBadge = document.getElementById('bestDayBadge');
const weeklyBars = document.getElementById('weeklyBars');
const subjectBreakdownList = document.getElementById('subjectBreakdownList');
const sessionsHistory = document.getElementById('sessionsHistory');

// 3. ACTUALIZACIÓN VISUAL DEL TEMPORIZADOR
const CIRCUMFERENCE = 2 * Math.PI * 105; // 659.73 px

function updateTimerDisplay() {
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  timeText.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  const total = (timerMode === 'work' ? WORK_MINUTES : BREAK_MINUTES) * 60;
  const progressRatio = (total - secondsLeft) / total;
  const offset = CIRCUMFERENCE - progressRatio * CIRCUMFERENCE;
  progressCircle.style.strokeDashoffset = offset;
}

// Alternar entre Iniciar y Pausar
function togglePlay() {
  if (isRunning) {
    pauseTimer();
  } else {
    startTimer();
  }
}

function startTimer() {
  isRunning = true;
  timerStatus.textContent = timerMode === 'work' ? 'EN CONCENTRACIÓN' : 'DESCANSO';
  btnTogglePlay.textContent = 'Pausar';
  btnTogglePlay.style.background = '#1c1917';

  let tickCount = 0;
  timerInterval = setInterval(() => {
    if (secondsLeft <= 1) {
      clearInterval(timerInterval);
      isRunning = false;
      playVintageBell();
      secondsLeft = 0;
      updateTimerDisplay();
      if (timerMode === 'work') {
        openLogModal(WORK_MINUTES);
      }
      resetTimer();
      return;
    }

    secondsLeft--;
    tickCount++;
    playVintageTick(tickCount % 2 === 0);
    updateTimerDisplay();
  }, 1000);
}

function pauseTimer() {
  isRunning = false;
  clearInterval(timerInterval);
  timerStatus.textContent = 'EN PAUSA';
  btnTogglePlay.textContent = 'Continuar';
  btnTogglePlay.style.background = '#c2593f';
}

function resetTimer() {
  pauseTimer();
  secondsLeft = (timerMode === 'work' ? WORK_MINUTES : BREAK_MINUTES) * 60;
  timerStatus.textContent = 'LISTO';
  btnTogglePlay.textContent = 'Iniciar Foco';
  updateTimerDisplay();
}

function setMode(mode) {
  timerMode = mode;
  btnModeWork.classList.toggle('active', mode === 'work');
  btnModeBreak.classList.toggle('active', mode === 'break');
  progressCircle.style.stroke = mode === 'work' ? '#c2593f' : '#0891b2';
  resetTimer();
}

// 4. GESTIÓN DE SESIONES EN LOCALSTORAGE
function getSessions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Datos iniciales de demostración para ver el gráfico de inmediato
      const initial = [
        { id: '1', subject: 'Matemáticas', minutes: 25, date: new Date().toISOString(), notes: 'Ejercicios de cálculo' },
        { id: '2', subject: 'Programación', minutes: 25, date: new Date().toISOString(), notes: 'Algoritmos y listas' }
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

function saveSession(session) {
  const current = getSessions();
  current.unshift(session);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  renderWeeklyStats();
}

// 5. CÁLCULO Y RENDERIZADO DE ESTADÍSTICAS SEMANALES
function renderWeeklyStats() {
  const sessions = getSessions();
  const now = new Date();

  // Calcular inicio de semana (Lunes)
  const currentDay = now.getDay();
  const diffToMonday = currentDay === 0 ? 6 : currentDay - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diffToMonday);
  monday.setHours(0, 0, 0, 0);

  let totalMins = 0;
  const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const dailyTotals = [0, 0, 0, 0, 0, 0, 0];
  const subjectTotals = {};

  sessions.forEach((s) => {
    const sDate = new Date(s.date);
    if (sDate >= monday) {
      totalMins += s.minutes;
      const dayIndex = sDate.getDay() === 0 ? 6 : sDate.getDay() - 1;
      dailyTotals[dayIndex] += s.minutes;

      subjectTotals[s.subject] = (subjectTotals[s.subject] || 0) + s.minutes;
    }
  });

  // Totales
  totalWeeklyMins.textContent = `${totalMins} min`;
  totalWeeklySessions.textContent = sessions.length;

  // Encontrar el día récord
  const maxDayVal = Math.max(...dailyTotals);
  const bestDayIndex = dailyTotals.indexOf(maxDayVal);
  if (maxDayVal > 0) {
    bestDayBadge.textContent = `Día récord: ${dayNames[bestDayIndex]} (${maxDayVal} min)`;
  } else {
    bestDayBadge.textContent = 'Día récord: -';
  }

  // Renderizar barras del gráfico de 7 días
  weeklyBars.innerHTML = '';
  const scaleMax = Math.max(maxDayVal, 50);

  dailyTotals.forEach((mins, idx) => {
    const col = document.createElement('div');
    col.className = 'bar-col';

    const barHeightPercent = scaleMax > 0 ? (mins / scaleMax) * 100 : 0;
    const isPeak = mins === maxDayVal && mins > 0;

    col.innerHTML = `
      <div class="bar-pill ${isPeak ? 'peak' : ''}" style="height: ${Math.max(barHeightPercent, mins > 0 ? 10 : 4)}%"></div>
      <span class="bar-label">${dayNames[idx]}</span>
    `;
    weeklyBars.appendChild(col);
  });

  // Renderizar desglose por materias
  subjectBreakdownList.innerHTML = '';
  const subjectsArr = Object.entries(subjectTotals).sort((a, b) => b[1] - a[1]);
  if (subjectsArr.length === 0) {
    subjectBreakdownList.innerHTML = '<p class="stat-label">Sin sesiones esta semana</p>';
  } else {
    subjectsArr.forEach(([subj, mins]) => {
      const item = document.createElement('div');
      item.className = 'breakdown-item';
      item.innerHTML = `<span>${subj}</span><strong>${mins} min</strong>`;
      subjectBreakdownList.appendChild(item);
    });
  }

  // Renderizar historial reciente
  sessionsHistory.innerHTML = '';
  const recent = sessions.slice(0, 5);
  if (recent.length === 0) {
    sessionsHistory.innerHTML = '<p class="stat-label">No hay registros aún</p>';
  } else {
    recent.forEach((s) => {
      const d = new Date(s.date);
      const item = document.createElement('div');
      item.className = 'history-item';
      item.innerHTML = `
        <strong>${s.subject}</strong> · ${s.minutes} min · <small>${d.toLocaleDateString()}</small>
        ${s.notes ? `<div style="color:#78716c;font-size:0.75rem;">${s.notes}</div>` : ''}
      `;
      sessionsHistory.appendChild(item);
    });
  }
}

// 6. MODAL DE REGISTRO
function openLogModal(defaultMinutes = 25) {
  modalSubject.value = selectSubject.value;
  modalMins.value = defaultMinutes;
  modalNotes.value = '';
  logModal.classList.remove('hidden');
}

btnCancelModal.addEventListener('click', () => {
  logModal.classList.add('hidden');
});

formSaveSession.addEventListener('submit', (e) => {
  e.preventDefault();
  const session = {
    id: String(Date.now()),
    subject: modalSubject.value,
    minutes: parseInt(modalMins.value, 10) || 25,
    date: new Date().toISOString(),
    notes: modalNotes.value.trim()
  };
  saveSession(session);
  logModal.classList.add('hidden');
});

// 7. LISTENERS DE EVENTOS
btnTogglePlay.addEventListener('click', togglePlay);
btnReset.addEventListener('click', resetTimer);
btnManualLog.addEventListener('click', () => openLogModal(WORK_MINUTES));

btnModeWork.addEventListener('click', () => setMode('work'));
btnModeBreak.addEventListener('click', () => setMode('break'));

selectSubject.addEventListener('change', (e) => {
  activeSubjectText.textContent = e.target.value;
});

btnSoundToggle.addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  soundIcon.textContent = soundEnabled ? '🔔' : '🔕';
});

// Inicialización al cargar la página
document.addEventListener('DOMContentLoaded', () => {
  updateTimerDisplay();
  renderWeeklyStats();
});
