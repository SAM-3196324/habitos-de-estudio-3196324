/**
 * FOCO 25 - Aplicación de Hábitos de Estudio y Concentración Pomodoro
 * Diseñado con estética Vintage Cálida & Minimalista.
 */

import React, { useState, useEffect } from 'react';
import { 
  Timer as TimerIcon, 
  BarChart3, 
  BookOpen, 
  ShieldCheck, 
  GitBranch, 
  Info, 
  Sparkles,
  Volume2,
  VolumeX,
  Plus,
  History
} from 'lucide-react';
import { DistractionLevel, SessionRecord, Subject, WeeklyStats } from './types';
import { 
  calculateWeeklyStats, 
  deleteSession, 
  getActiveIntention, 
  getSavedSessions, 
  getSavedSubjects, 
  getSoundPreference, 
  saveSession, 
  saveSubject, 
  setActiveIntention, 
  setSoundPreference 
} from './utils/storage';
import { vintageAudio } from './utils/audio';
import { PomodoroTimer } from './components/PomodoroTimer';
import { WeeklySummary } from './components/WeeklySummary';
import { SessionsHistoryView } from './components/SessionsHistoryView';
import { AnalogCommitmentModal } from './components/AnalogCommitmentModal';
import { SubjectManagerModal } from './components/SubjectManagerModal';
import { SessionCompletionModal } from './components/SessionCompletionModal';
import { GitInstructionsModal } from './components/GitInstructionsModal';
import { P0ScopeNoticeModal } from './components/P0ScopeNoticeModal';

export default function App() {
  // Estados principales de la aplicación
  const [activeTab, setActiveTab] = useState<'timer' | 'stats' | 'history'>('timer');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [activeSubjectId, setActiveSubjectId] = useState<string>('');
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [activeIntention, setActiveIntentionState] = useState<string>('');
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(true);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats | null>(null);
  const [globalNotification, setGlobalNotification] = useState<string | null>(null);

  // Estados de control de modales
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [isIntentionModalOpen, setIsIntentionModalOpen] = useState(false);
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [completionDuration, setCompletionDuration] = useState(25);
  const [isGitModalOpen, setIsGitModalOpen] = useState(false);
  const [isScopeModalOpen, setIsScopeModalOpen] = useState(false);

  // Carga inicial de datos desde LocalStorage
  useEffect(() => {
    const loadedSubjects = getSavedSubjects();
    setSubjects(loadedSubjects);
    if (loadedSubjects.length > 0) {
      setActiveSubjectId(loadedSubjects[0].id);
    }

    const loadedSessions = getSavedSessions();
    setSessions(loadedSessions);
    setWeeklyStats(calculateWeeklyStats(loadedSessions));

    const intention = getActiveIntention();
    setActiveIntentionState(intention);

    const sound = getSoundPreference();
    setSoundEnabledState(sound);
    vintageAudio.setSoundEnabled(sound);
  }, []);

  // Actualizar estadísticas al cambiar sesiones
  useEffect(() => {
    setWeeklyStats(calculateWeeklyStats(sessions));
  }, [sessions]);

  // Manejo de sonido
  const handleToggleSound = (enabled: boolean) => {
    setSoundEnabledState(enabled);
    setSoundPreference(enabled);
    vintageAudio.setSoundEnabled(enabled);
  };

  // Manejo de intención anti-distracción
  const handleSelectIntention = (intention: string) => {
    setActiveIntentionState(intention);
    setActiveIntention(intention);
  };

  // Manejo de materias
  const handleAddSubject = (newSubject: Subject) => {
    const updated = saveSubject(newSubject);
    setSubjects(updated);
    setActiveSubjectId(newSubject.id);
  };

  const activeSubject = subjects.find((s) => s.id === activeSubjectId) || subjects[0] || {
    id: 'sub-mat',
    name: 'Matemáticas',
    color: '#c2593f',
  };

  // Disparar flujo de finalización de sesión
  const handleTriggerCompletion = (durationMinutes: number = 25) => {
    setCompletionDuration(durationMinutes);
    setGlobalNotification(`🔔 ¡Tiempo de 25 min cumplido en ${activeSubject.name}! Confirmá el registro.`);
    setTimeout(() => setGlobalNotification(null), 6000);
    setIsCompletionModalOpen(true);
  };

  // Guardar sesión en la bitácora
  const handleSaveCompletedSession = (data: {
    subjectId: string;
    subjectName: string;
    subjectColor: string;
    durationMinutes: number;
    distractionLevel: DistractionLevel;
    notes: string;
  }) => {
    const newSession = saveSession({
      subjectId: data.subjectId,
      subjectName: data.subjectName,
      subjectColor: data.subjectColor,
      durationMinutes: data.durationMinutes,
      mode: 'work',
      intention: activeIntention,
      distractionLevel: data.distractionLevel,
      notes: data.notes,
    });
    setSessions((prev) => [newSession, ...prev]);
    setGlobalNotification(`✅ Sesión de ${data.durationMinutes} min guardada con éxito en ${data.subjectName}.`);
    setTimeout(() => setGlobalNotification(null), 4000);
  };

  // Eliminar sesión del historial
  const handleDeleteSession = (sessionId: string) => {
    const updated = deleteSession(sessionId);
    setSessions(updated);
    setGlobalNotification('🗑️ Registro eliminado y métricas recalculadas en tiempo real.');
    setTimeout(() => setGlobalNotification(null), 3000);
  };

  return (
    <div className="min-h-screen bg-[#fbf8f3] text-[#1c1917] flex flex-col paper-texture">
      {/* Notificación Global Emergente (Alertas y Guardado) */}
      {globalNotification && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 max-w-md w-[92%] p-3 bg-[#1c1917] text-[#fbf8f3] text-xs font-semibold rounded-2xl shadow-xl border border-[#44403c] flex items-center justify-between gap-2 animate-fadeIn">
          <span>{globalNotification}</span>
          <button
            onClick={() => setGlobalNotification(null)}
            className="text-[#a8a29e] hover:text-white px-1 text-sm font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. Barra Superior (Top Bar Contract: 3 zonas, limpia y sin sobrecarga) */}
      <header className="sticky top-0 z-30 bg-[#fbf8f3]/95 backdrop-blur-md border-b border-[#e7dec8] px-4 sm:px-8 py-3.5">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          {/* Zona 1: Marca con tipografía de bitácora antigua */}
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl font-serif font-bold tracking-tight text-[#1c1917]">
              FOCO 25
            </span>
            <span className="text-[10px] uppercase font-mono tracking-widest text-[#c2593f] bg-[#fbeee9] px-2 py-0.5 rounded-md border border-[#c2593f]/20 hidden sm:inline-block">
              Bitácora Pomodoro
            </span>
          </div>

          {/* Zona 2: Segmented Switch Principal en Pantallas Medianas/Grandes */}
          <nav className="hidden md:flex items-center gap-1 p-1 bg-[#f4efe6] rounded-xl border border-[#e7dec8]">
            <button
              onClick={() => setActiveTab('timer')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'timer'
                  ? 'bg-white text-[#1c1917] shadow-xs'
                  : 'text-[#78716c] hover:text-[#1c1917]'
              }`}
            >
              Temporizador
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'stats'
                  ? 'bg-white text-[#1c1917] shadow-xs'
                  : 'text-[#78716c] hover:text-[#1c1917]'
              }`}
            >
              Resumen Semanal
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'history'
                  ? 'bg-white text-[#1c1917] shadow-xs'
                  : 'text-[#78716c] hover:text-[#1c1917]'
              }`}
            >
              <History className="w-3.5 h-3.5 text-[#c2593f]" />
              <span>Historial</span>
            </button>
          </nav>

          {/* Zona 3: Botones de información y repositorio Git */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsGitModalOpen(true)}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl border border-[#e7dec8] bg-white hover:bg-[#f4efe6] text-xs font-medium text-[#44403c] transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
              title="Ver guía de comandos Git y estructura del repositorio"
            >
              <GitBranch className="w-3.5 h-3.5 text-[#c2593f]" />
              <span className="hidden sm:inline">Git P0</span>
            </button>
            <button
              type="button"
              onClick={() => setIsScopeModalOpen(true)}
              className="p-2 rounded-xl border border-[#e7dec8] bg-white hover:bg-[#f4efe6] text-[#78716c] hover:text-[#1c1917] transition-colors shadow-2xs cursor-pointer"
              title="Alcance de la versión P0"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. Área de Contenido Principal */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-8 py-6 pb-24 md:pb-12">
        {activeTab === 'timer' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Cabecera explicativa del contexto del estudiante */}
            <div className="text-center max-w-md mx-auto">
              <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#1c1917] tracking-tight">
                25 Minutos de Enfoque Sagrado
              </h1>
              <p className="text-xs text-[#78716c] mt-1 leading-relaxed">
                Deja el celular lejos de tu alcance. Estudia sin interrupciones, una materia a la vez.
              </p>
            </div>

            {/* Temporizador Pomodoro */}
            <PomodoroTimer
              activeSubject={activeSubject}
              onOpenSubjectModal={() => setIsSubjectModalOpen(true)}
              activeIntention={activeIntention}
              onOpenIntentionModal={() => setIsIntentionModalOpen(true)}
              soundEnabled={soundEnabled}
              onToggleSound={handleToggleSound}
              onCompleteSession={handleTriggerCompletion}
            />

            {/* Micro-resumen diario visible debajo del temporizador para feedback continuo */}
            {weeklyStats && (
              <div className="max-w-sm mx-auto p-4 rounded-2xl bg-[#f4efe6] border border-[#e7dec8] text-center">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#78716c] block">
                  Avance de hoy
                </span>
                <div className="text-lg font-mono font-bold text-[#1c1917] mt-0.5">
                  {weeklyStats.dailyMinutes.find((d) => d.isToday)?.minutes || 0} min acumulados
                </div>
                <div className="flex items-center justify-center gap-3 mt-1.5 text-xs font-semibold text-[#c2593f]">
                  <button
                    type="button"
                    onClick={() => setActiveTab('stats')}
                    className="hover:underline cursor-pointer"
                  >
                    Ver gráfica semanal →
                  </button>
                  <span className="text-[#a8a29e]">·</span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('history')}
                    className="hover:underline cursor-pointer"
                  >
                    Ver historial ({sessions.length}) →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="animate-fadeIn">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#1c1917]">
                  Bitácora y Rendimiento Semanal
                </h1>
                <p className="text-xs text-[#78716c] mt-0.5">
                  Seguimiento de minutos estudiados y días de mayor concentración
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('history')}
                  className="px-3.5 py-2 bg-white hover:bg-[#f4efe6] border border-[#e7dec8] text-[#1c1917] text-xs font-semibold rounded-xl shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <History className="w-3.5 h-3.5 text-[#c2593f]" />
                  Ver Historial Completo
                </button>
                <button
                  type="button"
                  onClick={() => handleTriggerCompletion(25)}
                  className="px-3.5 py-2 bg-[#c2593f] hover:bg-[#a84830] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Registrar manual
                </button>
              </div>
            </div>

            {weeklyStats && (
              <WeeklySummary
                stats={weeklyStats}
                recentSessions={sessions}
                onDeleteSession={handleDeleteSession}
                onOpenManualLogModal={() => handleTriggerCompletion(25)}
              />
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <SessionsHistoryView
            sessions={sessions}
            weeklyStats={weeklyStats}
            onDeleteSession={handleDeleteSession}
          />
        )}
      </main>

      {/* 3. Navegación Ergonómica Inferior para Teléfonos (Touch Anchor <= 15% altura) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#fbf8f3]/95 backdrop-blur-md border-t border-[#e7dec8] px-3 py-2">
        <div className="grid grid-cols-5 items-center h-12 max-w-md mx-auto">
          {/* Tab 1: Temporizador */}
          <button
            type="button"
            onClick={() => setActiveTab('timer')}
            className={`flex flex-col items-center justify-center py-1 transition-colors cursor-pointer ${
              activeTab === 'timer' ? 'text-[#c2593f]' : 'text-[#78716c]'
            }`}
          >
            <TimerIcon className="w-4.5 h-4.5" />
            <span className="text-[9px] font-medium tracking-tight mt-0.5">Foco</span>
          </button>

          {/* Tab 2: Gráfica Semanal */}
          <button
            type="button"
            onClick={() => setActiveTab('stats')}
            className={`flex flex-col items-center justify-center py-1 transition-colors cursor-pointer ${
              activeTab === 'stats' ? 'text-[#c2593f]' : 'text-[#78716c]'
            }`}
          >
            <BarChart3 className="w-4.5 h-4.5" />
            <span className="text-[9px] font-medium tracking-tight mt-0.5">Semana</span>
          </button>

          {/* Tab 3: Historial Detallado */}
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex flex-col items-center justify-center py-1 transition-colors cursor-pointer ${
              activeTab === 'history' ? 'text-[#c2593f]' : 'text-[#78716c]'
            }`}
          >
            <History className="w-4.5 h-4.5" />
            <span className="text-[9px] font-medium tracking-tight mt-0.5">Historial</span>
          </button>

          {/* Tab 4: Materias */}
          <button
            type="button"
            onClick={() => setIsSubjectModalOpen(true)}
            className="flex flex-col items-center justify-center py-1 text-[#78716c] hover:text-[#1c1917] transition-colors cursor-pointer"
          >
            <BookOpen className="w-4.5 h-4.5" />
            <span className="text-[9px] font-medium tracking-tight mt-0.5">Materias</span>
          </button>

          {/* Tab 5: Pacto Foco */}
          <button
            type="button"
            onClick={() => setIsIntentionModalOpen(true)}
            className="flex flex-col items-center justify-center py-1 text-[#78716c] hover:text-[#1c1917] transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-4.5 h-4.5" />
            <span className="text-[9px] font-medium tracking-tight mt-0.5">Pacto</span>
          </button>
        </div>
      </nav>

      {/* 4. Modales y Diálogos Flotantes */}
      <AnalogCommitmentModal
        isOpen={isIntentionModalOpen}
        onClose={() => setIsIntentionModalOpen(false)}
        currentIntention={activeIntention}
        onSelectIntention={handleSelectIntention}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
      />

      <SubjectManagerModal
        isOpen={isSubjectModalOpen}
        onClose={() => setIsSubjectModalOpen(false)}
        subjects={subjects}
        onAddSubject={handleAddSubject}
        activeSubjectId={activeSubjectId}
        onSelectSubject={setActiveSubjectId}
      />

      <SessionCompletionModal
        isOpen={isCompletionModalOpen}
        onClose={() => setIsCompletionModalOpen(false)}
        subjects={subjects}
        initialSubjectId={activeSubjectId}
        initialDurationMinutes={completionDuration}
        initialIntention={activeIntention}
        onSaveSession={handleSaveCompletedSession}
      />

      <GitInstructionsModal
        isOpen={isGitModalOpen}
        onClose={() => setIsGitModalOpen(false)}
      />

      <P0ScopeNoticeModal
        isOpen={isScopeModalOpen}
        onClose={() => setIsScopeModalOpen(false)}
      />
    </div>
  );
}
