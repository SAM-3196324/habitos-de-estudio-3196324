import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Coffee, Sparkles, Volume2, VolumeX, ShieldCheck, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Subject, TimerMode } from '../types';
import { vintageAudio } from '../utils/audio';

interface PomodoroTimerProps {
  activeSubject: Subject;
  onOpenSubjectModal: () => void;
  activeIntention: string;
  onOpenIntentionModal: () => void;
  soundEnabled: boolean;
  onToggleSound: (enabled: boolean) => void;
  onCompleteSession: (durationMinutes: number) => void;
}

const WORK_SECONDS = 25 * 60; // 25 minutos exactos
const BREAK_SECONDS = 5 * 60; // 5 minutos de descanso

export const PomodoroTimer: React.FC<PomodoroTimerProps> = ({
  activeSubject,
  onOpenSubjectModal,
  activeIntention,
  onOpenIntentionModal,
  soundEnabled,
  onToggleSound,
  onCompleteSession,
}) => {
  const [mode, setMode] = useState<TimerMode>('work');
  const [secondsLeft, setSecondsLeft] = useState<number>(WORK_SECONDS);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [tickToggle, setTickToggle] = useState<boolean>(false); // Para alternar tic-toc
  const [showVisualAlert, setShowVisualAlert] = useState<boolean>(false);

  const totalTime = mode === 'work' ? WORK_SECONDS : BREAK_SECONDS;
  const progressRatio = Math.max(0, Math.min(1, (totalTime - secondsLeft) / totalTime));

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Limpiar temporizador al desmontar
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Manejador del segundero y sonido analógico
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            // Tiempo completado a las 00:00
            clearInterval(intervalRef.current!);
            setIsRunning(false);
            vintageAudio.playBell();
            setShowVisualAlert(true);
            setTimeout(() => setShowVisualAlert(false), 5000);

            if (mode === 'work') {
              onCompleteSession(25);
            }
            return 0;
          }

          // Sonido de tictac mecánico
          setTickToggle((t) => {
            const next = !t;
            vintageAudio.playTick(next ? 'tick' : 'tock');
            return next;
          });

          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, mode, onCompleteSession]);

  const handleTogglePlay = () => {
    // Si estaba detenido en 0, reiniciar antes de arrancar
    if (secondsLeft === 0) {
      setSecondsLeft(mode === 'work' ? WORK_SECONDS : BREAK_SECONDS);
    }
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setSecondsLeft(mode === 'work' ? WORK_SECONDS : BREAK_SECONDS);
  };

  const handleSwitchMode = (newMode: TimerMode) => {
    setIsRunning(false);
    setMode(newMode);
    setSecondsLeft(newMode === 'work' ? WORK_SECONDS : BREAK_SECONDS);
  };

  // Formato MM:SS
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Geometría del anillo circular SVG
  const size = 260;
  const strokeWidth = 8;
  const center = size / 2;
  const radius = center - strokeWidth - 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - progressRatio * circumference;

  return (
    <div className="w-full flex flex-col items-center">
      {/* Notificación visual prominente al llegar a 00:00 */}
      {showVisualAlert && (
        <div className="w-full max-w-sm mb-4 p-3.5 bg-[#c2593f] text-white rounded-2xl shadow-lg border border-[#a84830] flex items-center justify-between gap-3 animate-bounce">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔔</span>
            <div>
              <span className="text-xs font-bold block">¡00:00 · Tiempo de Foco Cumplido!</span>
              <span className="text-[11px] opacity-90 block">Sesión completada en {activeSubject.name}</span>
            </div>
          </div>
          <button
            onClick={() => setShowVisualAlert(false)}
            className="text-xs underline text-white/90 hover:text-white"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* 1. Selector de Modo y Selector de Materia */}
      <div className="w-full max-w-sm flex items-center justify-between gap-2 mb-4">
        {/* Toggle Trabajo / Descanso */}
        <div className="flex items-center p-1 bg-[#f4efe6] rounded-xl border border-[#e7dec8] text-xs font-semibold">
          <button
            type="button"
            onClick={() => handleSwitchMode('work')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              mode === 'work'
                ? 'bg-[#c2593f] text-white shadow-xs'
                : 'text-[#78716c] hover:text-[#1c1917]'
            }`}
          >
            Foco (25m)
          </button>
          <button
            type="button"
            onClick={() => handleSwitchMode('break')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
              mode === 'break'
                ? 'bg-[#0891b2] text-white shadow-xs'
                : 'text-[#78716c] hover:text-[#1c1917]'
            }`}
          >
            <Coffee className="w-3 h-3" />
            Descanso (5m)
          </button>
        </div>

        {/* Botón de Materia Activa */}
        <button
          type="button"
          onClick={onOpenSubjectModal}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f4efe6] hover:bg-[#ede5d8] border border-[#e7dec8] rounded-xl text-xs font-medium text-[#1c1917] transition-colors max-w-[170px] cursor-pointer"
          title="Cambiar materia de estudio"
        >
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: activeSubject.color }}
          />
          <span className="truncate">{activeSubject.name}</span>
          <ChevronRight className="w-3 h-3 text-[#78716c] shrink-0" />
        </button>
      </div>

      {/* 2. Banner de Compromiso Anti-Distracción ("Foco Analógico") */}
      <div className="w-full max-w-sm mb-4">
        <button
          type="button"
          onClick={onOpenIntentionModal}
          className="w-full text-left p-3 rounded-2xl bg-white border border-[#e7dec8] hover:border-[#c2593f]/50 transition-all shadow-xs flex items-center justify-between gap-2.5 group cursor-pointer"
        >
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="mt-0.5 w-6 h-6 rounded-lg bg-[#fbeee9] text-[#c2593f] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#78716c] block">
                Pacto anti-distracción
              </span>
              <p className="text-xs font-medium text-[#1c1917] truncate leading-tight">
                {activeIntention}
              </p>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-[#c2593f] group-hover:underline shrink-0">
            Cambiar
          </span>
        </button>
      </div>

      {/* 3. Reloj Analógico / Temporizador Pomodoro */}
      <div className="relative flex items-center justify-center my-2">
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Círculo base estilo bitácora / latón suave */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="#f4efe6"
            stroke="#e7dec8"
            strokeWidth={strokeWidth}
          />

          {/* Marcas horarias analógicas discretas */}
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
            <line
              key={deg}
              x1={center + (radius - 12) * Math.cos((deg * Math.PI) / 180)}
              y1={center + (radius - 12) * Math.sin((deg * Math.PI) / 180)}
              x2={center + (radius - 4) * Math.cos((deg * Math.PI) / 180)}
              y2={center + (radius - 4) * Math.sin((deg * Math.PI) / 180)}
              stroke="#ded4c0"
              strokeWidth={deg % 90 === 0 ? 2 : 1}
            />
          ))}

          {/* Anillo de progreso dinámico */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke={mode === 'work' ? '#c2593f' : '#0891b2'}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-300 ease-linear"
          />
        </svg>

        {/* Contenido Central del Reloj */}
        <div className="absolute inset-0 flex flex-col items-center justify-center select-none">
          {/* Indicador analógico rítmico (corazón del reloj mecánico) */}
          <div className="flex items-center gap-1.5 mb-1">
            <span
              className={`w-2 h-2 rounded-full transition-transform ${
                isRunning
                  ? tickToggle
                    ? 'bg-[#c2593f] scale-125'
                    : 'bg-[#d97706] scale-90'
                  : 'bg-[#ded4c0]'
              }`}
            />
            <span className="text-[11px] font-mono tracking-wider text-[#78716c] uppercase">
              {isRunning ? (mode === 'work' ? 'Enfoque Activo' : 'Descanso') : 'En Pausa'}
            </span>
          </div>

          {/* Tiempo Grande MM:SS con fuente mono y números tabulares */}
          <div className="text-5xl font-mono font-bold tracking-tight text-[#1c1917] tabular-nums my-1">
            {formattedTime}
          </div>

          {/* Porcentaje o detalle de materia */}
          <div className="text-xs text-[#78716c] font-medium flex items-center gap-1">
            <span
              className="w-2 h-2 rounded-full inline-block"
              style={{ backgroundColor: activeSubject.color }}
            />
            <span className="max-w-[120px] truncate">{activeSubject.name}</span>
            <span className="text-[#a8a29e]">· {Math.round(progressRatio * 100)}%</span>
          </div>
        </div>
      </div>

      {/* 4. Barra de Acciones y Controles (Ergonomía de pulgar) */}
      <div className="w-full max-w-sm mt-5 space-y-3">
        {/* Fila principal de controles: Reiniciar, Iniciar/Pausar, Sonido */}
        <div className="flex items-center justify-center gap-4">
          {/* Botón Reiniciar */}
          <button
            type="button"
            onClick={handleReset}
            title="Reiniciar temporizador"
            aria-label="Reiniciar temporizador"
            className="w-12 h-12 rounded-2xl bg-white border border-[#e7dec8] text-[#78716c] hover:text-[#1c1917] hover:bg-[#f4efe6] flex items-center justify-center transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          {/* Botón Principal INICIAR / PAUSAR */}
          <button
            type="button"
            onClick={handleTogglePlay}
            className={`flex-1 h-14 rounded-2xl font-semibold text-base flex items-center justify-center gap-2.5 shadow-md transition-all active:scale-[0.98] cursor-pointer ${
              isRunning
                ? 'bg-[#1c1917] text-[#fbf8f3] hover:bg-[#2c2825]'
                : mode === 'work'
                ? 'bg-[#c2593f] text-white hover:bg-[#a84830] shadow-[#c2593f]/20'
                : 'bg-[#0891b2] text-white hover:bg-[#0e7490] shadow-[#0891b2]/20'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-5 h-5 fill-current" />
                <span>Pausar</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current ml-0.5" />
                <span>{secondsLeft === totalTime ? 'Iniciar Foco' : 'Continuar'}</span>
              </>
            )}
          </button>

          {/* Botón Interruptor de Tictac y Campana */}
          <button
            type="button"
            onClick={() => onToggleSound(!soundEnabled)}
            title={soundEnabled ? 'Silenciar tictac' : 'Activar tictac analógico'}
            aria-label={soundEnabled ? 'Silenciar tictac' : 'Activar tictac analógico'}
            className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-all shadow-xs active:scale-95 cursor-pointer ${
              soundEnabled
                ? 'bg-[#fbeee9] border-[#c2593f]/30 text-[#c2593f]'
                : 'bg-white border-[#e7dec8] text-[#a8a29e]'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
        </div>

        {/* Botón de escape rápido para registrar sesión completada manualmente */}
        {mode === 'work' && (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => onCompleteSession(25)}
              className="w-full py-2.5 px-3 text-xs font-medium text-[#78716c] hover:text-[#1c1917] hover:bg-[#f4efe6] rounded-xl border border-dashed border-[#ded4c0] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
              <span>¿Ya estudiaste? Registrar 25 min directamente en bitácora</span>
            </button>

            {/* Atajo de prueba rápida de 00:00 para evaluación inmediata */}
            <button
              type="button"
              onClick={() => {
                setSecondsLeft(3);
                setIsRunning(true);
              }}
              className="w-full py-1.5 text-[11px] text-[#c2593f] hover:bg-[#fbeee9] rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
              title="Ajusta el reloj a 3 segundos y lo inicia para probar la campana y el modal de 00:00"
            >
              <Sparkles className="w-3 h-3" />
              <span>Probar llegada a 00:00 (en 3 segundos)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
