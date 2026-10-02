import React, { useState } from 'react';
import { Volume2, VolumeX, ShieldCheck, Sparkles, X, Check } from 'lucide-react';
import { PRESET_INTENTIONS } from '../utils/storage';

interface AnalogCommitmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentIntention: string;
  onSelectIntention: (intention: string) => void;
  soundEnabled: boolean;
  onToggleSound: (enabled: boolean) => void;
}

export const AnalogCommitmentModal: React.FC<AnalogCommitmentModalProps> = ({
  isOpen,
  onClose,
  currentIntention,
  onSelectIntention,
  soundEnabled,
  onToggleSound,
}) => {
  const [selected, setSelected] = useState<string>(currentIntention);
  const [customText, setCustomText] = useState<string>('');
  const [isCustom, setIsCustom] = useState<boolean>(!PRESET_INTENTIONS.includes(currentIntention));

  if (!isOpen) return null;

  const handleSave = () => {
    const finalIntention = isCustom && customText.trim().length > 0 ? customText.trim() : selected;
    onSelectIntention(finalIntention);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1c1917]/50 backdrop-blur-xs transition-opacity">
      <div 
        className="w-full max-w-lg bg-[#fbf8f3] text-[#1c1917] rounded-2xl p-6 shadow-2xl border border-[#ded4c0] relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del modal */}
        <div className="flex items-center justify-between pb-3 border-b border-[#e7dec8]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#fbeee9] text-[#c2593f] flex items-center justify-center font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-[#1c1917]">Pacto de Foco Analógico</h2>
              <p className="text-xs text-[#78716c]">Compromiso mental anti-distracción antes de estudiar</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            aria-label="Cerrar modal"
            className="p-1.5 text-[#78716c] hover:text-[#1c1917] hover:bg-[#f4efe6] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sección 1: Tictac y sonido vintage */}
        <div className="my-4 p-3.5 bg-[#f4efe6] rounded-xl border border-[#e7dec8] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${soundEnabled ? 'bg-[#c2593f]/15 text-[#c2593f]' : 'bg-[#ded4c0]/50 text-[#78716c]'}`}>
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </div>
            <div>
              <span className="text-sm font-semibold block text-[#1c1917]">Tictac Analógico Vintage</span>
              <span className="text-xs text-[#78716c] block">
                {soundEnabled ? 'Sonido mecánico rítmico y campana al finalizar' : 'Modo silencioso'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onToggleSound(!soundEnabled)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
              soundEnabled ? 'bg-[#c2593f]' : 'bg-[#ded4c0]'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                soundEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Sección 2: Selector de Intención */}
        <div className="space-y-3">
          <label className="text-xs font-semibold uppercase tracking-wider text-[#78716c] block">
            Elige tu intención para estos 25 minutos
          </label>

          <div className="space-y-2">
            {PRESET_INTENTIONS.map((intention, index) => {
              const isItemActive = !isCustom && selected === intention;
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    setSelected(intention);
                    setIsCustom(false);
                  }}
                  className={`w-full text-left p-3 rounded-xl border text-sm transition-all flex items-start gap-3 cursor-pointer ${
                    isItemActive
                      ? 'border-[#c2593f] bg-[#fbeee9] text-[#1c1917] shadow-xs'
                      : 'border-[#e7dec8] bg-white hover:bg-[#faf5ee] text-[#44403c]'
                  }`}
                >
                  <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                    isItemActive ? 'border-[#c2593f] bg-[#c2593f] text-white' : 'border-[#ded4c0]'
                  }`}>
                    {isItemActive && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </div>
                  <span className="leading-snug">{intention}</span>
                </button>
              );
            })}

            {/* Opción personalizada */}
            <div
              className={`p-3 rounded-xl border transition-all ${
                isCustom
                  ? 'border-[#c2593f] bg-[#fbeee9]'
                  : 'border-[#e7dec8] bg-white'
              }`}
            >
              <button
                type="button"
                onClick={() => setIsCustom(true)}
                className="w-full text-left text-sm flex items-center gap-3 cursor-pointer"
              >
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                  isCustom ? 'border-[#c2593f] bg-[#c2593f] text-white' : 'border-[#ded4c0]'
                }`}>
                  {isCustom && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </div>
                <span className="font-medium text-[#1c1917] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#d97706]" />
                  Escribir mi propio compromiso
                </span>
              </button>

              {isCustom && (
                <div className="mt-2.5 pl-7">
                  <input
                    type="text"
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    placeholder="Ej. Dejar el celular en otra habitación hasta terminar el capítulo"
                    className="w-full text-xs p-2.5 rounded-lg border border-[#ded4c0] bg-white focus:outline-hidden focus:border-[#c2593f] focus:ring-1 focus:ring-[#c2593f]"
                    autoFocus
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="mt-6 pt-4 border-t border-[#e7dec8] flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#78716c] hover:text-[#1c1917] rounded-lg transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 text-xs font-semibold text-white bg-[#c2593f] hover:bg-[#a84830] rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Asumir compromiso
          </button>
        </div>
      </div>
    </div>
  );
};
