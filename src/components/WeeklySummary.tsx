import React, { useState } from 'react';
import { Flame, Clock, Award, Trash2, Calendar, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { SessionRecord, WeeklyStats } from '../types';

interface WeeklySummaryProps {
  stats: WeeklyStats;
  recentSessions: SessionRecord[];
  onDeleteSession: (sessionId: string) => void;
  onOpenManualLogModal: () => void;
}

export const WeeklySummary: React.FC<WeeklySummaryProps> = ({
  stats,
  recentSessions,
  onDeleteSession,
  onOpenManualLogModal,
}) => {
  const [showAllHistory, setShowAllHistory] = useState(false);

  // Formatear minutos en "X h Y min"
  const formatHoursAndMinutes = (totalMins: number) => {
    const hours = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    if (hours === 0) return `${mins} min`;
    if (mins === 0) return `${hours} h`;
    return `${hours} h ${mins} min`;
  };

  // Encontrar el valor máximo para la escala del gráfico
  const maxDayMinutes = Math.max(...stats.dailyMinutes.map((d) => d.minutes), 50);

  const displayedSessions = showAllHistory ? recentSessions : recentSessions.slice(0, 4);

  return (
    <div className="w-full space-y-6">
      {/* 1. Tarjetas de Métricas Clave de la Semana */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {/* Minutos totales */}
        <div className="p-4 rounded-2xl bg-white border border-[#e7dec8] shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#78716c] uppercase tracking-wider mb-1">
            <Clock className="w-3.5 h-3.5 text-[#c2593f]" />
            <span>Foco Semanal</span>
          </div>
          <div className="text-2xl font-mono font-bold text-[#1c1917] tabular-nums">
            {formatHoursAndMinutes(stats.totalMinutes)}
          </div>
          <div className="text-[11px] text-[#78716c] mt-0.5">
            {stats.totalSessions} {stats.totalSessions === 1 ? 'sesión completada' : 'sesiones completadas'}
          </div>
        </div>

        {/* Día más productivo */}
        <div className="p-4 rounded-2xl bg-[#fbeee9] border border-[#c2593f]/30 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#c2593f] uppercase tracking-wider mb-1">
            <Flame className="w-3.5 h-3.5 fill-current" />
            <span>Día Récord</span>
          </div>
          <div className="text-lg font-serif font-bold text-[#1c1917] truncate">
            {stats.bestDay ? stats.bestDay.dayName : 'Aún sin datos'}
          </div>
          <div className="text-[11px] font-medium text-[#c2593f] mt-0.5">
            {stats.bestDay ? `${stats.bestDay.minutes} min concentrado` : 'Completa tu primer foco'}
          </div>
        </div>

        {/* Materia Líder */}
        <div className="col-span-2 sm:col-span-1 p-4 rounded-2xl bg-white border border-[#e7dec8] shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#78716c] uppercase tracking-wider mb-1">
            <Award className="w-3.5 h-3.5 text-[#d97706]" />
            <span>Materia Líder</span>
          </div>
          <div className="text-base font-serif font-bold text-[#1c1917] truncate">
            {stats.subjectBreakdown.length > 0 ? stats.subjectBreakdown[0].name : 'Ninguna'}
          </div>
          <div className="text-[11px] text-[#78716c] mt-0.5">
            {stats.subjectBreakdown.length > 0
              ? `${stats.subjectBreakdown[0].minutes} min (${stats.subjectBreakdown[0].percentage}%)`
              : 'Empieza a registrar'}
          </div>
        </div>
      </div>

      {/* 2. Gráfico Visual Semanal (7 días) */}
      <div className="p-5 rounded-3xl bg-white border border-[#e7dec8] shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-serif font-bold text-[#1c1917]">Distribución Semanal de Enfoque</h3>
            <p className="text-xs text-[#78716c]">Minutos acumulados de lunes a domingo</p>
          </div>
          <span className="text-xs font-mono font-medium text-[#78716c] bg-[#f4efe6] px-2.5 py-1 rounded-lg">
            Total: {stats.totalMinutes}m
          </span>
        </div>

        {/* Columnas del gráfico */}
        <div className="pt-6 pb-2">
          <div className="grid grid-cols-7 gap-2 sm:gap-3 items-end h-40">
            {stats.dailyMinutes.map((day) => {
              const heightPercent = maxDayMinutes > 0 ? Math.round((day.minutes / maxDayMinutes) * 100) : 0;
              const isRecord = stats.bestDay && stats.bestDay.dateStr === day.dateStr && day.minutes > 0;

              return (
                <div key={day.dateStr} className="flex flex-col items-center h-full justify-end group">
                  {/* Tooltip con minutos */}
                  <div className="text-[10px] font-mono font-semibold text-[#78716c] mb-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                    {day.minutes > 0 ? `${day.minutes}m` : '-'}
                  </div>

                  {/* Barra vertical animada */}
                  <div className="w-full max-w-[34px] bg-[#f4efe6] rounded-t-xl overflow-hidden flex flex-col justify-end h-28 relative">
                    <div
                      className={`w-full rounded-t-xl transition-all duration-500 ease-out ${
                        isRecord
                          ? 'bg-[#c2593f]'
                          : day.isToday
                          ? 'bg-[#d97706]'
                          : day.minutes > 0
                          ? 'bg-[#a8a29e]'
                          : 'bg-transparent'
                      }`}
                      style={{ height: `${Math.max(heightPercent, day.minutes > 0 ? 8 : 0)}%` }}
                    />
                  </div>

                  {/* Etiqueta del día */}
                  <div className="mt-2 text-center">
                    <span
                      className={`text-[11px] block font-medium ${
                        day.isToday
                          ? 'text-[#c2593f] font-bold'
                          : 'text-[#78716c]'
                      }`}
                    >
                      {day.dayShort}
                    </span>
                    {day.isToday && (
                      <span className="w-1 h-1 bg-[#c2593f] rounded-full mx-auto mt-0.5 block" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Leyenda sutil sin píldoras */}
        <div className="mt-4 pt-3 border-t border-[#f4efe6] flex items-center justify-between text-[11px] text-[#78716c]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#c2593f]" />
              Día récord
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#d97706]" />
              Hoy
            </span>
          </div>
          <span>Metodología 25/5</span>
        </div>
      </div>

      {/* 3. Desglose Acumulado por Materia */}
      <div className="p-5 rounded-3xl bg-white border border-[#e7dec8] shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-serif font-bold text-[#1c1917]">Enfoque por Materia</h3>
            <p className="text-xs text-[#78716c]">Tiempo invertido en cada asignatura esta semana</p>
          </div>
          <button
            type="button"
            onClick={onOpenManualLogModal}
            className="text-xs font-semibold text-[#c2593f] hover:underline cursor-pointer"
          >
            + Registrar sesión
          </button>
        </div>

        {stats.subjectBreakdown.length === 0 ? (
          <div className="py-6 text-center text-xs text-[#78716c]">
            Aún no hay sesiones registradas esta semana. Completa un Pomodoro para comenzar.
          </div>
        ) : (
          <div className="space-y-3 pt-1">
            {stats.subjectBreakdown.map((item) => (
              <div key={item.subjectId} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-semibold text-[#1c1917]">{item.name}</span>
                    <span className="text-[#a8a29e]">({item.sessionsCount} {item.sessionsCount === 1 ? 'sesión' : 'sesiones'})</span>
                  </div>
                  <div className="font-mono font-medium text-[#44403c] tabular-nums">
                    {formatHoursAndMinutes(item.minutes)}{' '}
                    <span className="text-[#a8a29e] text-[10px]">({item.percentage}%)</span>
                  </div>
                </div>

                {/* Barra de progreso de la materia */}
                <div className="w-full h-2 bg-[#f4efe6] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Bitácora / Historial de Sesiones Recientes */}
      <div className="p-5 rounded-3xl bg-white border border-[#e7dec8] shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#c2593f]" />
            <h3 className="text-sm font-serif font-bold text-[#1c1917]">Bitácora de Sesiones Recientes</h3>
          </div>
          <span className="text-xs text-[#78716c]">
            {recentSessions.length} registradas
          </span>
        </div>

        {recentSessions.length === 0 ? (
          <p className="text-xs text-[#78716c] py-4 text-center">
            No hay sesiones registradas aún.
          </p>
        ) : (
          <div className="divide-y divide-[#f4efe6]">
            {displayedSessions.map((sess) => {
              const dateObj = new Date(sess.timestamp);
              const formattedDate = dateObj.toLocaleDateString('es-ES', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              });
              const formattedHour = dateObj.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div key={sess.id} className="py-3 flex items-start justify-between gap-3 group">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: sess.subjectColor }}
                      />
                      <span className="font-semibold text-[#1c1917] truncate">{sess.subjectName}</span>
                      <span className="text-[#a8a29e]">·</span>
                      <span className="font-mono text-[#78716c]">{sess.durationMinutes} min</span>
                      <span className="text-[#a8a29e]">·</span>
                      <span className="text-[#78716c] capitalize">{formattedDate} {formattedHour}</span>
                    </div>

                    {/* Intención pactada */}
                    {sess.intention && (
                      <p className="text-[11px] text-[#78716c] italic truncate">
                        "{sess.intention}"
                      </p>
                    )}

                    {/* Notas si las hay */}
                    {sess.notes && (
                      <p className="text-xs text-[#44403c] bg-[#fbf8f3] px-2 py-1 rounded-lg border border-[#f0e7d8] inline-block">
                        {sess.notes}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => onDeleteSession(sess.id)}
                    title="Eliminar de la bitácora"
                    aria-label="Eliminar sesión"
                    className="p-1.5 text-[#a8a29e] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors opacity-70 group-hover:opacity-100 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {recentSessions.length > 4 && (
          <div className="pt-3 text-center border-t border-[#f4efe6]">
            <button
              type="button"
              onClick={() => setShowAllHistory(!showAllHistory)}
              className="text-xs font-semibold text-[#c2593f] hover:underline flex items-center justify-center gap-1 mx-auto cursor-pointer"
            >
              {showAllHistory ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" /> Ver menos sesiones
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" /> Ver todas ({recentSessions.length})
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
