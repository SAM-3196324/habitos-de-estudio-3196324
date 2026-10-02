/**
 * FOCO 25 - Lógica de la aplicación P0
 * Repositorio: habitos de estudio 3196324
 * Autor: Asistente Senior de Desarrollo Web
 */

// 1. CONSTANTES Y CONFIGURACIÓN DE LOCALSTORAGE
const WORK_MINUTES = 25;
const BREAK_MINUTES = 5;

// Claves de almacenamiento local
const STORAGE_KEYS = {
  SESSIONS: 'foco25_sessions_v1',
  SUBJECTS: 'foco25_subjects_v1',
  INTENTION: 'foco25_intention_v1',
};

// Materias iniciales por defecto con sus colores
const DEFAULT_SUBJECTS = [
  { name: 'Matemáticas', color: '#c2593f' },
  { name: 'Programación', color: '#0891b2' },
  { name: 'Historia', color: '#d97706' },
  { name: 'Literatura', color: '#7c3aed' },
  { name: 'Inglés', color: '#059669' },
];

// Registro inicial de ejemplo ("Programación - 25 min") para no iniciar en blanco
const DEFAULT_DEMO_SESSION = [
  {
    id: 'demo-prog-1',
    subject: 'Programación',
    minutes: 25,
    date: new Date().toISOString(),
    notes: 'Sesión inicial de enfoque',
  },
];

// Estado global de la aplicación
let timerMode = 'work'; // 'work' | 'break'
let secondsLeft = WORK_MINUTES * 60;
let timerInterval = null;
let isRunning = false;
let soundEnabled = true;

// Web Audio API para tictac analógico vintage
let audioCtx = null;

// ==========================================================
// 1. UTILIDADES DE SANITIZACIÓN Y NOTIFICACIÓN DE ERRORES (PUNTOS 1 y 5)
// ==========================================================

/**
 * Muestra una notificación visual accesible en español claro ante errores,
 * con fondo oscuro (#111827), bordes redondeados y texto legible.
 */
function showToastError(message) {
  let toast = document.getElementById('toastNotification');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toastNotification';
    toast.className = 'toast-notice';
    document.body.prepend(toast);
  }

  // Estilos de alto contraste y esquinas redondeadas
  toast.style.backgroundColor = '#111827';
  toast.style.color = '#fef2f2';
  toast.style.border = '1.5px solid #ef4444';
  toast.style.borderRadius = '14px';
  toast.style.padding = '0.85rem 1.15rem';
  toast.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.35)';

  toast.innerHTML = `
    <span style="font-size: 1.25rem; flex-shrink: 0;">⚠️</span>
    <span style="flex: 1; font-size: 1rem; font-weight: 600; line-height: 1.4;">${sanitizeHTML(message)}</span>
  `;
  toast.classList.remove('hidden');

  if (window.toastTimeout) clearTimeout(window.toastTimeout);
  window.toastTimeout = setTimeout(() => {
    toast.classList.add('hidden');
  }, 4000);
}

/**
 * Sanitiza caracteres especiales HTML para prevenir inyecciones (XSS).
 */
function sanitizeHTML(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Valida y sanitiza la materia: no vacía, sin espacios en blanco solos y máximo 40 caracteres.
 */
function validateAndSanitizeSubject(rawSubject) {
  const trimmed = (rawSubject || '').trim();
  if (!trimmed) {
    showToastError('El nombre de la materia no puede estar vacío.');
    return null;
  }
  if (trimmed.length > 40) {
    showToastError('El nombre de la materia no puede superar los 40 caracteres.');
    return null;
  }
  return sanitizeHTML(trimmed);
}

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
  // Punto 4: Limpieza preventiva de intervalos para evitar que el reloj se acelere
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  isRunning = true;
  timerStatus.textContent = timerMode === 'work' ? 'EN CONCENTRACIÓN' : 'DESCANSO';
  btnTogglePlay.textContent = 'Pausar';
  btnTogglePlay.style.background = '#1c1917';

  let tickCount = 0;
  timerInterval = setInterval(() => {
    if (secondsLeft <= 1) {
      clearInterval(timerInterval);
      timerInterval = null;
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
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  timerStatus.textContent = 'EN PAUSA';
  btnTogglePlay.textContent = 'Continuar';
  btnTogglePlay.style.background = '#c2593f';
}

function resetTimer() {
  pauseTimer();
  secondsLeft = (timerMode === 'work' ? WORK_MINUTES : BREAK_MINUTES) * 60;
  timerStatus.textContent = 'LISTO';
  btnTogglePlay.textContent = timerMode === 'work' ? 'Iniciar Foco' : 'Iniciar Descanso';
  updateTimerDisplay();
}

function setMode(mode) {
  // Punto 4: Detener y limpiar exhaustivamente intervalos activos para no acelerar el reloj
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  isRunning = false;
  timerMode = mode;
  secondsLeft = (mode === 'work' ? WORK_MINUTES : BREAK_MINUTES) * 60;

  btnModeWork.classList.toggle('active', mode === 'work');
  btnModeBreak.classList.toggle('active', mode === 'break');
  progressCircle.style.stroke = mode === 'work' ? '#c2593f' : '#0891b2';

  timerStatus.textContent = 'LISTO';
  btnTogglePlay.textContent = mode === 'work' ? 'Iniciar Foco' : 'Iniciar Descanso';
  btnTogglePlay.style.background = mode === 'work' ? '#c2593f' : '#0891b2';
  updateTimerDisplay();
}

// ==========================================================
// 4. GESTIÓN DE SESIONES CON BLOQUE TRY...CATCH BLINDADO (PUNTO 3)
// ==========================================================
function getSessions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(DEFAULT_DEMO_SESSION));
      return DEFAULT_DEMO_SESSION;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      throw new Error('Estructura de sesiones no es un array válido');
    }
    return parsed;
  } catch (err) {
    console.error('Error al recuperar sesiones de localStorage:', err);
    showToastError('Los datos del historial estaban dañados. Se restauró el registro inicial seguro.');
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(DEFAULT_DEMO_SESSION));
    return DEFAULT_DEMO_SESSION;
  }
}

function saveSession(session) {
  try {
    const current = getSessions();
    current.unshift(session);
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(current));
    renderWeeklyStats();
  } catch (err) {
    console.error('Error al guardar sesión en localStorage:', err);
    showToastError('No se pudo guardar la sesión. Es posible que el almacenamiento esté lleno.');
  }
}

function deleteSession(id) {
  try {
    const current = getSessions();
    const updated = current.filter((s) => s.id !== id);
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(updated));
    renderWeeklyStats();
  } catch (err) {
    console.error('Error al eliminar sesión en localStorage:', err);
    showToastError('Hubo un error al eliminar el registro del almacenamiento.');
  }
}

// Gestión de materias con try...catch
function getStoredSubjects() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SUBJECTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(DEFAULT_SUBJECTS));
      return DEFAULT_SUBJECTS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error('Materias corruptas');
    }
    return parsed;
  } catch (err) {
    console.error('Error al recuperar materias de localStorage:', err);
    localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(DEFAULT_SUBJECTS));
    return DEFAULT_SUBJECTS;
  }
}

function saveStoredSubjects(subjectsList) {
  try {
    localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(subjectsList));
  } catch (err) {
    console.error('Error al guardar materias:', err);
    showToastError('No se pudieron guardar las materias.');
  }
}

// Gestión del Pacto Anti-Distracción con try...catch
function getStoredIntention() {
  try {
    const val = localStorage.getItem(STORAGE_KEYS.INTENTION);
    return val || selectIntention.options[0].value;
  } catch (err) {
    return selectIntention.options[0].value;
  }
}

function saveStoredIntention(intentionText) {
  try {
    localStorage.setItem(STORAGE_KEYS.INTENTION, intentionText);
  } catch (err) {
    console.error('Error al guardar compromiso:', err);
  }
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

  // Totales en tiempo real
  const hours = Math.floor(totalMins / 60);
  const remMins = totalMins % 60;
  totalWeeklyMins.textContent = hours > 0 ? `${hours} h ${remMins} min` : `${totalMins} min`;
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

  // Renderizar historial con detalle (materia, fecha, hora exacta y botón de eliminar)
  sessionsHistory.innerHTML = '';
  if (sessions.length === 0) {
    sessionsHistory.innerHTML = '<p class="stat-label">No hay registros en la bitácora</p>';
  } else {
    sessions.forEach((s) => {
      const d = new Date(s.date);
      const dateFormatted = d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
      const exactTimeFormatted = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      const item = document.createElement('div');
      item.className = 'history-item';
      item.style.display = 'flex';
      item.style.justifyContent = 'space-between';
      item.style.alignItems = 'center';
      item.style.gap = '8px';

      item.innerHTML = `
        <div style="flex: 1; min-width: 0;">
          <div>
            <strong style="color:#c2593f;">${s.subject}</strong> · <strong>${s.minutes} min</strong>
          </div>
          <small style="color:#78716c; display:block;">${dateFormatted} · Hora: ${exactTimeFormatted}</small>
          ${s.notes ? `<small style="color:#44403c; display:block;">📝 ${s.notes}</small>` : ''}
        </div>
        <button type="button" class="btn-del" data-id="${s.id}" style="border: 1px solid #e7dec8; background: white; border-radius: 6px; padding: 4px 8px; font-size: 0.75rem; color: #a8a29e; cursor: pointer;">
          ✕ Eliminar
        </button>
      `;
      sessionsHistory.appendChild(item);
    });

    document.querySelectorAll('.btn-del').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        if (id) {
          const current = getSessions();
          const updated = current.filter((x) => x.id !== id);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          renderWeeklyStats();
        }
      });
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

  // Punto 2: Evitar el doble clic en el botón "Guardar Sesión" deshabilitándolo por 1.5 segundos
  const submitBtn = formSaveSession.querySelector('button[type="submit"]') || formSaveSession.querySelector('.btn-confirm');
  if (submitBtn) {
    if (submitBtn.disabled) return;
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.5';
    submitBtn.style.cursor = 'not-allowed';

    setTimeout(() => {
      submitBtn.disabled = false;
      submitBtn.style.opacity = '1';
      submitBtn.style.cursor = 'pointer';
    }, 1500);
  }

  // Punto 1: Validar campo de materia (no vacío, sin espacios puros, <= 40 caracteres y sanitizado)
  const validSubject = validateAndSanitizeSubject(modalSubject.value);
  if (!validSubject) {
    return; // showToastError ya informó la causa específica
  }

  const minsValue = parseInt(modalMins.value, 10);
  if (isNaN(minsValue) || minsValue <= 0 || minsValue > 300) {
    showToastError('Los minutos de concentración deben ser un número válido entre 1 y 300.');
    return;
  }

  const session = {
    id: String(Date.now()),
    subject: validSubject,
    minutes: minsValue,
    date: new Date().toISOString(),
    notes: sanitizeHTML(modalNotes.value.trim()),
  };

  saveSession(session);
  logModal.classList.add('hidden');
});

// 7. LISTENERS DE EVENTOS Y ACCIONES DE RESPALDO
btnTogglePlay.addEventListener('click', togglePlay);
btnReset.addEventListener('click', resetTimer);
btnManualLog.addEventListener('click', () => openLogModal(WORK_MINUTES));

btnModeWork.addEventListener('click', () => setMode('work'));
btnModeBreak.addEventListener('click', () => setMode('break'));

selectSubject.addEventListener('change', (e) => {
  activeSubjectText.textContent = e.target.value;
});

// Guardar automáticamente el estado del Pacto Anti-Distracción
selectIntention.addEventListener('change', (e) => {
  saveStoredIntention(e.target.value);
});

btnSoundToggle.addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  soundIcon.textContent = soundEnabled ? '🔔' : '🔕';
});

// Exportar Respaldo en archivo JSON descargable
const btnExportJSON = document.getElementById('btnExportJSON');
if (btnExportJSON) {
  btnExportJSON.addEventListener('click', () => {
    const backupData = {
      app: 'FOCO 25',
      exportDate: new Date().toISOString(),
      sessions: getSessions(),
      subjects: getStoredSubjects(),
      activeIntention: getStoredIntention(),
    };

    const jsonString = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `foco25_respaldo_${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
}

// Borrar todos los datos y restablecer valores iniciales
const btnClearAll = document.getElementById('btnClearAll');
if (btnClearAll) {
  btnClearAll.addEventListener('click', () => {
    const ok = confirm('¿Estás seguro de que deseas borrar todos los registros y restablecer FOCO 25?');
    if (ok) {
      localStorage.removeItem(STORAGE_KEYS.SESSIONS);
      localStorage.removeItem(STORAGE_KEYS.SUBJECTS);
      localStorage.removeItem(STORAGE_KEYS.INTENTION);

      // Re-inicializa con el registro por defecto ("Programación - 25 min")
      getSessions();
      renderWeeklyStats();
      alert('Datos borrados. Se restauró el registro inicial de ejemplo.');
    }
  });
}

// Inicialización automática al cargar la página (DOMContentLoaded)
document.addEventListener('DOMContentLoaded', () => {
  // Cargar materias guardadas en el selector
  const subjects = getStoredSubjects();
  selectSubject.innerHTML = '';
  subjects.forEach((sub) => {
    const opt = document.createElement('option');
    opt.value = sub.name;
    opt.textContent = sub.name;
    selectSubject.appendChild(opt);
  });

  if (subjects.length > 0) {
    activeSubjectText.textContent = subjects[0].name;
  }

  // Cargar el Pacto Anti-Distracción guardado
  const savedIntention = getStoredIntention();
  if (savedIntention) {
    selectIntention.value = savedIntention;
  }

  updateTimerDisplay();
  renderWeeklyStats();
});
