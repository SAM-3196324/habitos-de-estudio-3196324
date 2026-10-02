import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Award, BookOpen, Check, Clock, X, Smartphone, FileText } from 'lucide-react';
import { DistractionLevel, Subject } from '../types';

interface SessionCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: Subject[];
  initialSubjectId: string;
  initialDurationMinutes: number;
  initialIntention: string;
  onSaveSession: (data: {
    subjectId: string;
    subjectName: string;
    subjectColor: string;
    durationMinutes: number;
    distractionLevel: DistractionLevel;
    notes: string;
  }) => void;
}

export const SessionCompletionModal: React.FC<SessionCompletionModalProps> = ({
  isOpen,
  onClose,
  subjects,
  initialSubjectId,
  initialDurationMinutes,
  initialIntention,
  onSaveSession,
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState(initialSubjectId);
  const [duration, setDuration] = useState(initialDurationMinutes);
  const [distractionLevel, setDistractionLevel] = useState<DistractionLevel>('cero');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Disparar confeti sutil de celebración al abrir el modal
  useEffect(() => {
    if (isOpen) {
      setSelectedSubjectId(initialSubjectId);
      setDuration(initialDurationMinutes);
      setIsSaving(false);

      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.65 },
          colors: ['#c2593f', '#d97706', '#0891b2', '#e7dec8'],
          disableForReducedMotion: true,
        });
      } catch {
        // Silencioso
      }
    }
  }, [isOpen, initialSubjectId, initialDurationMinutes]);

  if (!isOpen) return null;

  const currentSubject = subjects.find((s) => s.id === selectedSubjectId) || subjects[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSubject || isSaving) return;

    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 1500);

    onSaveSession({
      subjectId: currentSubject.id,
      subjectName: currentSubject.name,
      subjectColor: currentSubject.color,
      durationMinutes: duration,
      distractionLevel,
      notes: notes.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1c1917]/55 backdrop-blur-xs">
      <div 
        className="w-full max-w-lg bg-[#fbf8f3] text-[#1c1917] rounded-3xl p-6 shadow-2xl border border-[#ded4c0] relative max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado festivo sobrio */}
        <div className="flex items-center justify-between pb-3 border-b border-[#e7dec8]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#fbeee9] text-[#c2593f] flex items-center justify-center shadow-xs">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-mono font-bold text-[#c2593f] bg-[#fbeee9] px-2 py-0.5 rounded">
                  00:00 · TIEMPO CUMPLIDO
                </span>
              </div>
              <h2 className="text-lg font-serif font-bold text-[#1c1917] mt-0.5">
                Guardar Sesión en {currentSubject?.name || 'Materia'}
              </h2>
            </div>
          </div>
          <button 
            onClick={onClose}
            aria-label="Cerrar modal"
            className="p-1.5 text-[#78716c] hover:text-[#1c1917] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Compromiso cumplido */}
        {initialIntention && (
          <div className="mt-4 p-3 bg-[#f4efe6] rounded-xl border border-[#e7dec8] text-xs text-[#44403c] flex items-start gap-2.5">
            <Check className="w-4 h-4 text-[#c2593f] shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block text-[#1c1917]">Compromiso cumplido:</span>
              <span>{initialIntention}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Selector de Materia */}
          <div>
            <label className="text-xs font-semibold text-[#78716c] uppercase tracking-wider block mb-1.5">
              Materia estudiada
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {subjects.map((sub) => {
                const isSelected = sub.id === selectedSubjectId;
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setSelectedSubjectId(sub.id)}
                    className={`p-2.5 rounded-xl border text-xs font-medium text-left flex items-center gap-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#c2593f] bg-[#fbeee9] text-[#1c1917] font-semibold ring-1 ring-[#c2593f]'
                        : 'border-[#e7dec8] bg-white hover:bg-[#faf5ee] text-[#44403c]'
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: sub.color }}
                    />
                    <span className="truncate">{sub.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Duración */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#78716c] uppercase tracking-wider block mb-1.5">
                Tiempo concentrado
              </label>
              <div className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-[#ded4c0]">
                <Clock className="w-4 h-4 text-[#78716c]" />
                <input
                  type="number"
                  min="5"
                  max="180"
                  step="5"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full text-sm font-semibold text-[#1c1917] focus:outline-hidden"
                />
                <span className="text-xs text-[#78716c]">min</span>
              </div>
            </div>

            {/* Distracción del Celular */}
            <div>
              <label className="text-xs font-semibold text-[#78716c] uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5 text-[#c2593f]" />
                Tentación celular
              </label>
              <select
                value={distractionLevel}
                onChange={(e) => setDistractionLevel(e.target.value as DistractionLevel)}
                className="w-full text-xs font-medium p-2.5 rounded-xl border border-[#ded4c0] bg-white text-[#1c1917] focus:outline-hidden focus:border-[#c2593f]"
              >
                <option value="cero">🛡️ Cero tentación (Invicto)</option>
                <option value="baja">🌱 Mínima (Controlado)</option>
                <option value="media">⚠️ Regular (Costó dejarlo)</option>
                <option value="alta">⚡ Fuerte tentación</option>
              </select>
            </div>
          </div>

          {/* Notas / Tema abordado */}
          <div>
            <label className="text-xs font-semibold text-[#78716c] uppercase tracking-wider block mb-1.5 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-[#78716c]" />
              ¿Qué lograste avanzar? (Opcional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Realicé 5 ejercicios prácticos y resumí la teoría"
              className="w-full text-xs p-2.5 rounded-xl border border-[#ded4c0] bg-white focus:outline-hidden focus:border-[#c2593f]"
            />
          </div>

          {/* Botones */}
          <div className="pt-3 border-t border-[#e7dec8] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#78716c] hover:text-[#1c1917] rounded-xl transition-colors cursor-pointer"
            >
              Descartar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className={`px-5 py-2.5 text-xs font-semibold text-white bg-[#c2593f] hover:bg-[#a84830] rounded-xl shadow-xs transition-colors flex items-center gap-1.5 ${
                isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              {isSaving ? 'Guardando...' : 'Guardar en Bitácora'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
