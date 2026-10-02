import React, { useState } from 'react';
import { BookOpen, Plus, X, Check } from 'lucide-react';
import { Subject } from '../types';

interface SubjectManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: Subject[];
  onAddSubject: (subject: Subject) => void;
  activeSubjectId: string;
  onSelectSubject: (id: string) => void;
}

const COLOR_PALETTE = [
  { hex: '#c2593f', label: 'Terracota' },
  { hex: '#d97706', label: 'Ámbar' },
  { hex: '#0891b2', label: 'Cian' },
  { hex: '#059669', label: 'Esmeralda' },
  { hex: '#7c3aed', label: 'Violeta' },
  { hex: '#b45309', label: 'Bronce' },
  { hex: '#be123c', label: 'Carmesí' },
  { hex: '#334155', label: 'Pizarra' },
];

export const SubjectManagerModal: React.FC<SubjectManagerModalProps> = ({
  isOpen,
  onClose,
  subjects,
  onAddSubject,
  activeSubjectId,
  onSelectSubject,
}) => {
  const [newSubjectName, setNewSubjectName] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLOR_PALETTE[0].hex);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newSubjectName.trim();
    if (!trimmed) {
      setErrorMsg('Por favor escribe el nombre de la materia.');
      return;
    }
    if (subjects.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) {
      setErrorMsg('Esta materia ya existe en la lista.');
      return;
    }

    const newSubject: Subject = {
      id: `sub-${Date.now()}`,
      name: trimmed,
      color: selectedColor,
    };

    onAddSubject(newSubject);
    onSelectSubject(newSubject.id);
    setNewSubjectName('');
    setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1c1917]/50 backdrop-blur-xs">
      <div 
        className="w-full max-w-md bg-[#fbf8f3] text-[#1c1917] rounded-2xl p-6 shadow-2xl border border-[#ded4c0] relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#e7dec8]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#f4efe6] text-[#c2593f] flex items-center justify-center font-bold">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-serif font-bold text-[#1c1917]">Materias de Estudio</h2>
              <p className="text-xs text-[#78716c]">Selecciona o crea una nueva materia</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            aria-label="Cerrar modal"
            className="p-1 text-[#78716c] hover:text-[#1c1917] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lista de materias existentes */}
        <div className="my-4">
          <label className="text-xs font-semibold text-[#78716c] uppercase tracking-wider block mb-2">
            Materias actuales
          </label>
          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {subjects.map((sub) => {
              const isCurrent = sub.id === activeSubjectId;
              return (
                <button
                  key={sub.id}
                  onClick={() => {
                    onSelectSubject(sub.id);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-sm transition-all cursor-pointer ${
                    isCurrent
                      ? 'border-[#c2593f] bg-[#fbeee9] font-semibold text-[#1c1917]'
                      : 'border-[#e7dec8] bg-white hover:bg-[#faf5ee] text-[#44403c]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0"
                      style={{ backgroundColor: sub.color }}
                    />
                    <span>{sub.name}</span>
                  </div>
                  {isCurrent && (
                    <span className="text-xs text-[#c2593f] font-medium flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Activa
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Formulario para agregar nueva materia */}
        <form onSubmit={handleSubmit} className="pt-3 border-t border-[#e7dec8]">
          <label className="text-xs font-semibold text-[#78716c] uppercase tracking-wider block mb-2">
            Añadir nueva materia
          </label>
          <div className="space-y-3">
            <div>
              <input
                type="text"
                value={newSubjectName}
                onChange={(e) => {
                  setNewSubjectName(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder="Nombre (ej. Física Cuántica, Química)"
                className="w-full text-sm p-2.5 rounded-xl border border-[#ded4c0] bg-white focus:outline-hidden focus:border-[#c2593f]"
              />
              {errorMsg && <p className="text-xs text-rose-600 mt-1">{errorMsg}</p>}
            </div>

            {/* Selector de color */}
            <div>
              <span className="text-xs text-[#78716c] block mb-1.5">Color distintivo</span>
              <div className="flex items-center gap-2 flex-wrap">
                {COLOR_PALETTE.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    title={c.label}
                    onClick={() => setSelectedColor(c.hex)}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform cursor-pointer ${
                      selectedColor === c.hex ? 'scale-110 ring-2 ring-offset-2 ring-[#c2593f]' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: c.hex }}
                  >
                    {selectedColor === c.hex && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-2.5 px-4 bg-[#1c1917] hover:bg-[#2e2a27] text-[#fbf8f3] text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Guardar y seleccionar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
