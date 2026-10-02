import React, { useState } from 'react';
import { GitBranch, FolderCheck, Terminal, Copy, Check, X, Info } from 'lucide-react';

interface GitInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GitInstructionsModal: React.FC<GitInstructionsModalProps> = ({ isOpen, onClose }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const repoName = 'habitos de estudio 3196324';
  const folderName = 'habitos-de-estudio-3196324';
  const commitMsg = 'P0: primera version generada con IA';

  const gitSteps = [
    { title: '1. Inicializar repositorio Git', command: `git init` },
    { title: '2. Añadir todos los archivos de la versión P0', command: `git add .` },
    { title: '3. Crear el primer commit oficial', command: `git commit -m "${commitMsg}"` },
    { title: '4. Conectar con el repositorio remoto de GitHub', command: `git remote add origin https://github.com/TU_USUARIO/${folderName}.git` },
    { title: '5. Subir la rama principal a GitHub', command: `git branch -M main && git push -u origin main` },
  ];

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1c1917]/50 backdrop-blur-xs">
      <div 
        className="w-full max-w-lg bg-[#fbf8f3] text-[#1c1917] rounded-3xl p-6 shadow-2xl border border-[#ded4c0] relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#e7dec8]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#fbeee9] text-[#c2593f] flex items-center justify-center font-bold">
              <GitBranch className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-serif font-bold text-[#1c1917]">Guía de Git & GitHub</h2>
              <p className="text-xs text-[#78716c]">Estructura y preparación del primer commit</p>
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

        <div className="my-4 space-y-4 text-xs">
          {/* Nombre exacto del repositorio */}
          <div className="p-3.5 bg-[#f4efe6] rounded-2xl border border-[#e7dec8]">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#1c1917] mb-1">
              <FolderCheck className="w-4 h-4 text-[#c2593f]" />
              <span>Nomenclatura solicitada</span>
            </div>
            <div className="text-[11px] text-[#78716c] space-y-1">
              <div>
                <strong>Nombre exacto en GitHub:</strong> <code className="bg-white px-1.5 py-0.5 rounded border border-[#ded4c0] text-[#c2593f]">{repoName}</code>
              </div>
              <div>
                <strong>Nombre de carpeta local recomendado:</strong> <code className="bg-white px-1.5 py-0.5 rounded border border-[#ded4c0] text-[#1c1917]">{folderName}</code>
              </div>
            </div>
          </div>

          {/* Comandos paso a paso */}
          <div className="space-y-2.5">
            <label className="font-semibold uppercase tracking-wider text-[#78716c] block text-[10px]">
              Comandos para preparar y subir el primer commit:
            </label>
            {gitSteps.map((step, idx) => (
              <div key={idx} className="bg-white p-3 rounded-xl border border-[#ded4c0] space-y-1">
                <span className="text-[11px] font-semibold text-[#44403c] block">{step.title}</span>
                <div className="flex items-center justify-between gap-2 bg-[#1c1917] text-[#fbf8f3] p-2 rounded-lg font-mono text-[11px]">
                  <span className="truncate">{step.command}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(step.command, idx)}
                    className="p-1 hover:text-[#c2593f] transition-colors shrink-0 cursor-pointer"
                    title="Copiar comando"
                  >
                    {copiedIndex === idx ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-3 border-t border-[#e7dec8] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-white bg-[#1c1917] hover:bg-[#2e2a27] rounded-xl transition-colors cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
