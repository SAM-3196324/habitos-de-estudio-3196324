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

// ==========================================================
// 8. INTEGRACIÓN DE GEMINI AI - SELLO DE IA (EJERCICIO 29)
// "La IA lee el patrón de la semana e identifica la franja horaria en que la persona rinde mejor."
// ==========================================================

// Esquema JSON estricto requerido (responseSchema)
const GEMINI_RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    franjaOptima: { type: "STRING", description: "Ej: Noche (19:00 - 22:00)" },
    porcentajeEnfoque: { type: "NUMBER", description: "Porcentaje estimado de rendimiento en esa franja" },
    diagnostico: { type: "STRING", description: "Breve explicación en una frase sobre el patrón detectado" },
    recomendaciones: {
      type: "ARRAY",
      items: { type: "STRING" },
      description: "Dos consejos tácticos concretos para aprovechar esa franja"
    }
  },
  required: ["franjaOptima", "porcentajeEnfoque", "diagnostico", "recomendaciones"]
};

// Ejemplo de JSON de prueba para desarrollo y pruebas sin consumir cuota
const MOCK_TEST_INSIGHT = {
  franjaOptima: "Tarde (16:00 - 19:00)",
  porcentajeEnfoque: 72,
  diagnostico: "Concentraste el 72% de tus minutos de estudio efectivo durante las tardes con un nivel mínimo de distracciones.",
  recomendaciones: [
    "Reserva el bloque de 16:30 a 18:00 para la materia más desafiante (como Programación o Matemáticas).",
    "Deja el teléfono en otra habitación antes de las 16:00 para proteger tu pico de energía."
  ]
};

// Fallback local: Regla de decisión heurística cuando la IA no responde o no hay red
function calculateLocalFallbackInsight(sessionsList) {
  if (!sessionsList || sessionsList.length === 0) {
    return {
      franjaOptima: "Mañana (09:00 - 12:00)",
      porcentajeEnfoque: 100,
      diagnostico: "Aún no registraste suficientes bloques; la mañana suele ofrecer la menor interferencia cognitiva.",
      recomendaciones: [
        "Inicia tu primera sesión de 25 minutos apenas comience tu jornada de estudio.",
        "Usa el temporizador con teléfono en silencio antes de revisar mensajes."
      ]
    };
  }

  // Agrupación horaria por franjas
  const brackets = {
    "Mañana (07:00 - 12:00)": 0,
    "Tarde (12:00 - 19:00)": 0,
    "Noche (19:00 - 23:00)": 0,
    "Madrugada (23:00 - 07:00)": 0,
  };

  let totalMinutes = 0;
  sessionsList.forEach((s) => {
    const d = new Date(s.date);
    const hour = d.getHours();
    const mins = s.minutes || 25;
    totalMinutes += mins;

    if (hour >= 7 && hour < 12) brackets["Mañana (07:00 - 12:00)"] += mins;
    else if (hour >= 12 && hour < 19) brackets["Tarde (12:00 - 19:00)"] += mins;
    else if (hour >= 19 && hour < 23) brackets["Noche (19:00 - 23:00)"] += mins;
    else brackets["Madrugada (23:00 - 07:00)"] += mins;
  });

  let bestBracket = "Mañana (07:00 - 12:00)";
  let maxMins = -1;

  Object.entries(brackets).forEach(([bracket, mins]) => {
    if (mins > maxMins) {
      maxMins = mins;
      bestBracket = bracket;
    }
  });

  const percentage = totalMinutes > 0 ? Math.round((maxMins / totalMinutes) * 100) : 50;

  return {
    franjaOptima: bestBracket,
    porcentajeEnfoque: percentage,
    diagnostico: `Análisis local: Acumulaste el ${percentage}% de tu concentración en la franja ${bestBracket.toLowerCase()}.`,
    recomendaciones: [
      `Bloquea tu agenda para estudiar tus materias prioritarias durante la ${bestBracket.split(' ')[0].toLowerCase()}.`,
      "Activa el pacto de foco analógico 5 minutos antes de ingresar a tu franja óptima."
    ]
  };
}

// Llamada a la API de Gemini con variable de entorno y manejo de fallo robusto
async function getOptimalStudyTimeAnalysis(sessionsList) {
  // Lectura de la llave de API desde variable de entorno (nunca en duro)
  const apiKey = (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY)
    || (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY)
    || '';

  // Si no hay API key configurada, retornar análisis local con aviso
  if (!apiKey) {
    return {
      data: calculateLocalFallbackInsight(sessionsList),
      source: 'local_fallback',
      notice: 'Llave de API no detectada en entorno. Generado con regla analítica local.'
    };
  }

  // Preparar resumen semanal de sesiones para enviar a Gemini
  const promptData = sessionsList.map((s) => ({
    materia: s.subject,
    minutos: s.minutes,
    fechaHora: s.date,
    notas: s.notes || 'sin notas'
  }));

  const systemInstruction = "Eres un especialista en neurociencia y hábitos de estudio Pomodoro. " +
    "Analiza el historial semanal del estudiante e identifica en qué franja horaria rinde mejor. " +
    "Debes responder ESTRICTAMENTE con un objeto JSON que respete el esquema especificado.";

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 7500); // 7.5s timeout

  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Historial de sesiones de estudio de esta semana:\n${JSON.stringify(promptData, null, 2)}\n\n` +
                      `Identifica la franja horaria óptima, porcentaje de rendimiento, diagnóstico y dos recomendaciones.`
              }
            ]
          }
        ],
        systemInstruction: {
          parts: [{ text: systemInstruction }]
        },
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: GEMINI_RESPONSE_SCHEMA,
          temperature: 0.2
        }
      })
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Error en API Gemini: código HTTP ${response.status}`);
    }

    const result = await response.json();
    const candidateText = result?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      throw new Error('Respuesta vacía de la API de Gemini');
    }

    const parsedJson = JSON.parse(candidateText);

    // Validación estricta de propiedades requeridas
    if (!parsedJson.franjaOptima || typeof parsedJson.porcentajeEnfoque !== 'number') {
      throw new Error('El JSON devuelto no cumple el esquema requerido');
    }

    return {
      data: parsedJson,
      source: 'gemini',
      notice: null
    };
  } catch (error) {
    clearTimeout(timeoutId);
    console.warn('Fallo en la llamada a Gemini, activando fallback local:', error.message);
    showToastError('La IA no pudo responder a tiempo. Mostrando análisis calculado con regla local.');

    return {
      data: calculateLocalFallbackInsight(sessionsList),
      source: 'local_fallback',
      notice: 'Cálculo heurístico local por contingencia de red.'
    };
  }
}

// Renderizar tarjetas limpias de la IA en la sección "Resumen Semanal"
function renderAiInsightCard(insightResult) {
  const container = document.getElementById('aiInsightContent');
  if (!container) return;

  const { data, source, notice } = insightResult;

  container.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:0.75rem; margin-top:0.5rem;">
      <!-- Tarjeta destacada de Franja Óptima y Rendimiento -->
      <div style="background:var(--card-parchment); border:1.5px solid var(--border-parchment); border-radius:12px; padding:0.9rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
        <div>
          <span style="font-size:0.75rem; text-transform:uppercase; font-weight:700; color:var(--ink-muted); display:block;">
            Franja Horaria Más Productiva
          </span>
          <strong style="font-size:1.15rem; color:var(--ink); font-family:var(--font-serif); display:block; margin-top:2px;">
            ${sanitizeHTML(data.franjaOptima)}
          </strong>
        </div>
        <div style="background:#ffffff; border:1px solid var(--border-parchment); padding:0.4rem 0.75rem; border-radius:10px; text-align:right;">
          <span style="font-size:0.7rem; color:var(--ink-muted); display:block; font-weight:600;">Efectividad</span>
          <strong style="font-size:1.1rem; color:var(--terracotta); font-family:var(--font-mono);">${data.porcentajeEnfoque}%</strong>
        </div>
      </div>

      <!-- Tarjeta de Diagnóstico -->
      <div style="background:#ffffff; border:1px solid var(--border-parchment); border-radius:10px; padding:0.85rem;">
        <span style="font-size:0.75rem; font-weight:700; color:var(--ink-muted); text-transform:uppercase; display:block; margin-bottom:0.25rem;">
          Diagnóstico Semanal
        </span>
        <p style="font-size:0.95rem; color:var(--ink); line-height:1.45; margin:0;">
          ${sanitizeHTML(data.diagnostico)}
        </p>
      </div>

      <!-- Tarjeta de Consejos Tácticos -->
      <div style="background:#ffffff; border:1px solid var(--border-parchment); border-radius:10px; padding:0.85rem;">
        <span style="font-size:0.75rem; font-weight:700; color:var(--ink-muted); text-transform:uppercase; display:block; margin-bottom:0.4rem;">
          Recomendaciones Tácticas
        </span>
        <ul style="margin:0; padding-left:1.2rem; display:flex; flex-direction:column; gap:0.35rem;">
          ${data.recomendaciones.map((rec) => `
            <li style="font-size:0.9rem; color:var(--ink); line-height:1.4;">${sanitizeHTML(rec)}</li>
          `).join('')}
        </ul>
      </div>

      <!-- Pie con origen del análisis -->
      <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.75rem; color:var(--ink-muted); padding-top:0.25rem;">
        <span>Origen: <strong>${source === 'gemini' ? '✨ Gemini 3.8 Flash' : '📊 Análisis Local (Fallback)'}</strong></span>
        ${notice ? `<span style="font-style:italic;">${sanitizeHTML(notice)}</span>` : ''}
      </div>
    </div>
  `;
}

// Actualizar análisis de la IA al solicitarlo
async function triggerAiPatternAnalysis() {
  const container = document.getElementById('aiInsightContent');
  if (container) {
    container.innerHTML = `
      <div style="padding:1rem; text-align:center; color:var(--ink-muted); font-size:0.95rem;">
        ⏳ Analizando tu historial de estudio con IA...
      </div>
    `;
  }
  const sessions = getSessions();
  const result = await getOptimalStudyTimeAnalysis(sessions);
  renderAiInsightCard(result);
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

  // Botón para refrescar análisis de la IA
  const btnRefreshAi = document.getElementById('btnRefreshAiInsight');
  if (btnRefreshAi) {
    btnRefreshAi.addEventListener('click', triggerAiPatternAnalysis);
  }

  updateTimerDisplay();
  renderWeeklyStats();

  // Ejecución inicial del análisis de la IA
  triggerAiPatternAnalysis();
});
