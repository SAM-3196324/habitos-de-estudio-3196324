import React, { useState } from 'react';
import { Trash2, Clock, Calendar, BookOpen, Flame, Award, AlertCircle, Check } from 'lucide-react';
import { SessionRecord, WeeklyStats } from '../types';

interface SessionsHistoryViewProps {
  sessions: SessionRecord[];
  weeklyStats: WeeklyStats | null;
  onDeleteSession: (sessionId: string) => void;
}

export const SessionsHistoryView: React.FC<SessionsHistoryViewProps> = ({
  sessions,
  weeklyStats,
  onDeleteSession,
}) => {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Formato horas y minutos
  const formatHoursAndMinutes = (totalMins: number) => {
    const hours = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    if (hours === 0) return `${mins} min`;
    if (mins === 0) return `${hours} h`;
    return `${hours} h ${mins} min`;
  };

  const handleDelete = (id: string) => {
    onDeleteSession(id);
    setDeleteConfirmId(null);
  };

  return (
    <div className="w-full space-y-6 animate-fadeIn">
      {/* 1. Cabecera con Métricas en Tiempo Real */}
      <div>
        <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#1c1917]">
          Historial Detallado de Sesiones
        </h1>
        <p className="text-xs text-[#78716c] mt-0.5">
          Registro cronológico con hora exacta y recálculo automático al eliminar
        </p>
      </div>

      {/* Tarjetas resumen en tiempo real */}
      {weeklyStats && (
        <div className="grid grid-cols-3 gap-2.5">
          <div className="p-3 bg-white rounded-2xl border border-[#e7dec8] shadow-2xs">
            <span className="text-[10px] font-semibold text-[#78716c] uppercase tracking-wider block">
              Foco Semanal
            </span>
            <div className="text-lg sm:text-xl font-mono font-bold text-[#1c1917] mt-0.5 tabular-nums">
              {formatHoursAndMinutes(weeklyStats.totalMinutes)}
            </div>
            <span className="text-[10px] text-[#78716c]">
              {weeklyStats.totalSessions} sesiones
            </span>
          </div>

          <div className="p-3 bg-[#fbeee9] rounded-2xl border border-[#c2593f]/30 shadow-2xs">
            <span className="text-[10px] font-semibold text-[#c2593f] uppercase tracking-wider block flex items-center gap-1">
              <Flame className="w-3 h-3 fill-current" />
              Día Récord
            </span>
            <div className="text-base sm:text-lg font-serif font-bold text-[#1c1917] mt-0.5 truncate">
              {weeklyStats.bestDay ? weeklyStats.bestDay.dayName : 'Sin datos'}
            </div>
            <span className="text-[10px] text-[#c2593f] font-medium">
              {weeklyStats.bestDay ? `${weeklyStats.bestDay.minutes} min` : '-'}
            </span>
          </div>

          <div className="p-3 bg-white rounded-2xl border border-[#e7dec8] shadow-2xs">
            <span className="text-[10px] font-semibold text-[#78716c] uppercase tracking-wider block flex items-center gap-1">
              <Award className="w-3 h-3 text-[#d97706]" />
              Materia Líder
            </span>
            <div className="text-base sm:text-lg font-serif font-bold text-[#1c1917] mt-0.5 truncate">
              {weeklyStats.subjectBreakdown.length > 0 ? weeklyStats.subjectBreakdown[0].name : 'Ninguna'}
            </div>
            <span className="text-[10px] text-[#78716c]">
              {weeklyStats.subjectBreakdown.length > 0 ? `${weeklyStats.subjectBreakdown[0].minutes} min` : '-'}
            </span>
          </div>
        </div>
      )}

      {/* 2. Listado detallado de cada sesión */}
      <div className="p-5 rounded-3xl bg-white border border-[#e7dec8] shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#f4efe6]">
          <span className="text-xs font-semibold text-[#78716c] uppercase tracking-wider">
            Sesiones registradas ({sessions.length})
          </span>
          <span className="text-[11px] text-[#78716c]">
            Orden cronológico más reciente
          </span>
        </div>

        {sessions.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <BookOpen className="w-8 h-8 text-[#ded4c0] mx-auto" />
            <p className="text-sm font-serif font-medium text-[#1c1917]">No hay sesiones en el historial</p>
            <p className="text-xs text-[#78716c]">
              Completa un ciclo de 25 minutos en el temporizador para ver tus registros aquí.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#f4efe6] mt-1">
            {sessions.map((sess) => {
              const dateObj = new Date(sess.timestamp);

              // Fecha legible
              const dateFormatted = dateObj.toLocaleDateString('es-ES', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              });

              // Hora exacta con segundos
              const exactTimeFormatted = dateObj.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              });

              const isConfirming = deleteConfirmId === sess.id;

              return (
                <div key={sess.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group">
                  {/* Detalles principales */}
                  <div className="space-y-1.5 min-w-0 flex-1">
                    {/* Materia y tiempo */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold"
                        style={{
                          backgroundColor: `${sess.subjectColor}15`,
                          color: sess.subjectColor,
                          border: `1px solid ${sess.subjectColor}35`,
                        }}
                      >
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: sess.subjectColor }}
                        />
                        {sess.subjectName}
                      </span>

                      {/* Duración */}
                      <span className="font-mono text-xs font-bold text-[#1c1917] bg-[#f4efe6] px-2 py-0.5 rounded-md">
                        {sess.durationMinutes} min
                      </span>

                      {/* Nivel de distracción si existe */}
                      {sess.distractionLevel && (
                        <span className="text-[11px] text-[#78716c]">
                          {sess.distractionLevel === 'cero' && '🛡️ Cero distracción'}
                          {sess.distractionLevel === 'baja' && '🌱 Distracción mínima'}
                          {sess.distractionLevel === 'media' && '⚠️ Distracción media'}
                          {sess.distractionLevel === 'alta' && '⚡ Alta tentación'}
                        </span>
                      )}
                    </div>

                    {/* Fecha y Hora Exacta */}
                    <div className="flex items-center gap-3 text-xs text-[#78716c] flex-wrap">
                      <span className="flex items-center gap-1 capitalize">
                        <Calendar className="w-3.5 h-3.5 text-[#a8a29e]" />
                        {dateFormatted}
                      </span>
                      <span className="flex items-center gap-1 font-mono text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-[#a8a29e]" />
                        Hora exacta: <strong className="text-[#44403c]">{exactTimeFormatted}</strong>
                      </span>
                    </div>

                    {/* Compromiso anti-distracción asumido */}
                    {sess.intention && (
                      <p className="text-[11px] text-[#78716c] italic line-clamp-1">
                        "{sess.intention}"
                      </p>
                    )}

                    {/* Notas si se redactaron */}
                    {sess.notes && (
                      <p className="text-xs text-[#44403c] bg-[#fbf8f3] p-2 rounded-lg border border-[#ded4c0] inline-block mt-1">
                        📝 {sess.notes}
                      </p>
                    )}
                  </div>

                  {/* Acciones de eliminación */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {isConfirming ? (
                      <div className="flex items-center gap-1.5 p-1 bg-rose-50 border border-rose-200 rounded-xl animate-fadeIn">
                        <span className="text-[11px] text-rose-800 font-medium px-1">¿Eliminar?</span>
                        <button
                          type="button"
                          onClick={() => handleDelete(sess.id)}
                          className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-semibold rounded-lg transition-colors cursor-pointer"
                        >
                          Sí
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-2 py-1 text-slate-600 hover:bg-slate-200 text-[11px] rounded-lg transition-colors cursor-pointer"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(sess.id)}
                        title="Eliminar sesión del historial"
                        aria-label="Eliminar sesión"
                        className="px-2.5 py-1.5 text-xs text-[#78716c] hover:text-rose-600 hover:bg-rose-50 border border-[#e7dec8] hover:border-rose-200 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Eliminar</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
