export type TimerMode = 'work' | 'break';

export interface Subject {
  id: string;
  name: string;
  color: string; // Hex color code
}

export type DistractionLevel = 'cero' | 'baja' | 'media' | 'alta';

export interface SessionRecord {
  id: string;
  subjectId: string;
  subjectName: string;
  subjectColor: string;
  durationMinutes: number; // Por defecto 25 para Pomodoro
  mode: TimerMode;
  intention: string; // Compromiso anti-distracción elegido
  timestamp: string; // Formato ISO
  distractionLevel?: DistractionLevel;
  notes?: string;
}

export interface WeeklyStats {
  totalMinutes: number;
  totalSessions: number;
  bestDay: {
    dayName: string;
    minutes: number;
    dateStr: string;
  } | null;
  dailyMinutes: {
    dayLabel: string;
    dayShort: string;
    dateStr: string;
    minutes: number;
    sessionsCount: number;
    isToday: boolean;
  }[];
  subjectBreakdown: {
    subjectId: string;
    name: string;
    color: string;
    minutes: number;
    percentage: number;
    sessionsCount: number;
  }[];
}
