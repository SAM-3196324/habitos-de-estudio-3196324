import { SessionRecord, Subject, WeeklyStats } from '../types';

const STORAGE_KEYS = {
  SESSIONS: 'foco25_sessions_v1',
  SUBJECTS: 'foco25_subjects_v1',
  SOUND_ENABLED: 'foco25_sound_enabled_v1',
  ACTIVE_SUBJECT_ID: 'foco25_active_subject_id_v1',
  ACTIVE_INTENTION: 'foco25_active_intention_v1',
};

// Materias por defecto con paleta vintage cuidada
export const DEFAULT_SUBJECTS: Subject[] = [
  { id: 'sub-mat', name: 'Matemáticas', color: '#c2593f' }, // Terracota cálido
  { id: 'sub-prog', name: 'Programación', color: '#0891b2' }, // Cian vintage
  { id: 'sub-hist', name: 'Historia', color: '#d97706' }, // Ámbar dorado
  { id: 'sub-lit', name: 'Literatura', color: '#7c3aed' }, // Violeta sobrio
  { id: 'sub-ing', name: 'Inglés', color: '#059669' }, // Verde bosque suave
];

// Opciones de intenciones anti-distracción recomendadas
export const PRESET_INTENTIONS: string[] = [
  '📵 Acepto no tocar el celular por los próximos 25 minutos.',
  '✈️ Celular en Modo Avión y guardado en la mochila.',
  '🛡️ Cierro pestañas distractoras; solo el apunte y yo.',
  '🧘 Mente presente: una sola tarea hasta que suene la campana.',
  '✍️ Cuaderno abierto, lápiz en mano y concentración plena.',
];

/**
 * Genera datos de ejemplo para la semana en curso si el almacenamiento está vacío.
 * Esto permite que el usuario vea la gráfica semanal viva desde el primer momento.
 */
function generateInitialSampleSessions(): SessionRecord[] {
  const now = new Date();
  return [
    {
      id: 'demo-prog-1',
      subjectId: 'sub-prog',
      subjectName: 'Programación',
      subjectColor: '#0891b2',
      durationMinutes: 25,
      mode: 'work',
      intention: PRESET_INTENTIONS[0],
      timestamp: now.toISOString(),
      distractionLevel: 'cero',
      notes: 'Sesión inicial de enfoque',
    },
  ];
}

export function getSavedSubjects(): Subject[] {
  if (typeof window === 'undefined') return DEFAULT_SUBJECTS;
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SUBJECTS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(DEFAULT_SUBJECTS));
      return DEFAULT_SUBJECTS;
    }
    return JSON.parse(data);
  } catch {
    return DEFAULT_SUBJECTS;
  }
}

export function saveSubject(subject: Subject): Subject[] {
  const current = getSavedSubjects();
  const exists = current.some((s) => s.id === subject.id);
  const updated = exists ? current.map((s) => (s.id === subject.id ? subject : s)) : [...current, subject];
  try {
    localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(updated));
  } catch (e) {
    console.error('Error guardando materia:', e);
  }
  return updated;
}

export function getSavedSessions(): SessionRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    if (!data) {
      const initial = generateInitialSampleSessions();
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function saveSession(session: Omit<SessionRecord, 'id' | 'timestamp'>): SessionRecord {
  const current = getSavedSessions();
  const newSession: SessionRecord = {
    ...session,
    id: `sess-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
  };
  const updated = [newSession, ...current];
  try {
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(updated));
  } catch (e) {
    console.error('Error guardando sesión:', e);
  }
  return newSession;
}

export function deleteSession(sessionId: string): SessionRecord[] {
  const current = getSavedSessions();
  const updated = current.filter((s) => s.id !== sessionId);
  try {
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(updated));
  } catch (e) {
    console.error('Error eliminando sesión:', e);
  }
  return updated;
}

export function getSoundPreference(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const val = localStorage.getItem(STORAGE_KEYS.SOUND_ENABLED);
    return val === null ? true : val === 'true';
  } catch {
    return true;
  }
}

export function setSoundPreference(enabled: boolean) {
  try {
    localStorage.setItem(STORAGE_KEYS.SOUND_ENABLED, String(enabled));
  } catch {
    // Silencioso
  }
}

export function getActiveIntention(): string {
  if (typeof window === 'undefined') return PRESET_INTENTIONS[0];
  try {
    const val = localStorage.getItem(STORAGE_KEYS.ACTIVE_INTENTION);
    return val || PRESET_INTENTIONS[0];
  } catch {
    return PRESET_INTENTIONS[0];
  }
}

export function setActiveIntention(intention: string) {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_INTENTION, intention);
  } catch {
    // Silencioso
  }
}

/**
 * Calcula las métricas y la distribución semanal para la gráfica
 */
export function calculateWeeklyStats(sessions: SessionRecord[]): WeeklyStats {
  const now = new Date();
  
  // Determinamos el lunes de la semana actual
  const currentDayOfWeek = now.getDay(); // 0 es Domingo, 1 es Lunes...
  const distanceToMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - distanceToMonday);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  // Filtramos solo las sesiones de esta semana y modo 'work'
  const weekSessions = sessions.filter((s) => {
    if (s.mode !== 'work') return false;
    const sessionDate = new Date(s.timestamp);
    return sessionDate >= startOfWeek && sessionDate <= endOfWeek;
  });

  const totalMinutes = weekSessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
  const totalSessions = weekSessions.length;

  // Días de la semana en español
  const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const dayShorts = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  // Agrupación por día de la semana
  const dailyMinutes = dayNames.map((name, i) => {
    const targetDate = new Date(startOfWeek);
    targetDate.setDate(startOfWeek.getDate() + i);
    const dateStr = targetDate.toISOString().split('T')[0];

    // Buscar sesiones de este día
    const daySessions = weekSessions.filter((s) => {
      const sDate = new Date(s.timestamp).toISOString().split('T')[0];
      return sDate === dateStr;
    });

    const mins = daySessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
    const isToday = now.toISOString().split('T')[0] === dateStr;

    return {
      dayLabel: name,
      dayShort: dayShorts[i],
      dateStr,
      minutes: mins,
      sessionsCount: daySessions.length,
      isToday,
    };
  });

  // Día más productivo
  let bestDay: WeeklyStats['bestDay'] = null;
  const activeDaysWithMins = dailyMinutes.filter((d) => d.minutes > 0);
  if (activeDaysWithMins.length > 0) {
    const maxDay = activeDaysWithMins.reduce((prev, current) => (current.minutes > prev.minutes ? current : prev));
    bestDay = {
      dayName: maxDay.dayLabel,
      minutes: maxDay.minutes,
      dateStr: maxDay.dateStr,
    };
  }

  // Desglose por materia
  const subjectMap = new Map<string, { minutes: number; count: number; name: string; color: string }>();

  weekSessions.forEach((s) => {
    const existing = subjectMap.get(s.subjectId) || {
      minutes: 0,
      count: 0,
      name: s.subjectName,
      color: s.subjectColor || '#c2593f',
    };
    existing.minutes += s.durationMinutes || 0;
    existing.count += 1;
    subjectMap.set(s.subjectId, existing);
  });

  const subjectBreakdown = Array.from(subjectMap.entries()).map(([subId, val]) => ({
    subjectId: subId,
    name: val.name,
    color: val.color,
    minutes: val.minutes,
    percentage: totalMinutes > 0 ? Math.round((val.minutes / totalMinutes) * 100) : 0,
    sessionsCount: val.count,
  })).sort((a, b) => b.minutes - a.minutes);

  return {
    totalMinutes,
    totalSessions,
    bestDay,
    dailyMinutes,
    subjectBreakdown,
  };
}

/**
 * Exporta el respaldo completo en formato JSON
 */
export function exportBackupJSON() {
  const backupData = {
    app: 'FOCO 25',
    exportDate: new Date().toISOString(),
    sessions: getSavedSessions(),
    subjects: getSavedSubjects(),
    activeIntention: getActiveIntention(),
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
}

/**
 * Borra todos los datos y restablece el estado inicial
 */
export function resetAllData() {
  try {
    localStorage.removeItem(STORAGE_KEYS.SESSIONS);
    localStorage.removeItem(STORAGE_KEYS.SUBJECTS);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_INTENTION);
    localStorage.removeItem(STORAGE_KEYS.SOUND_ENABLED);
  } catch (e) {
    console.error('Error al resetear datos:', e);
  }
}

