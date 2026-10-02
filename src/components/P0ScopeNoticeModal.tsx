import React from 'react';
import { X, ShieldAlert, CheckCircle2, AlertCircle } from 'lucide-react';

interface P0ScopeNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const P0ScopeNoticeModal: React.FC<P0ScopeNoticeModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const excludedItems = [
    {
      title: '1. Autenticación de usuarios / Login (OAuth o correo y contraseña)',
      why: 'Para P0 es crítico que el estudiante comience a concentrarse en menos de 3 segundos sin fricción de registro ni contraseñas. Se utilizó persistencia local con LocalStorage.',
    },
    {
      title: '2. Base de datos remota en la nube / backend multiusuario',
      why: 'Añadiría latencia de red, costo y dependencias de conectividad. Para la versión P0 se priorizó una arquitectura rápida y offline-first sin servidores de pago.',
    },
    {
      title: '3. Bloqueador a nivel de sistema operativo para aplicaciones del celular',
      why: 'Las aplicaciones web (PWA o navegador) no tienen permisos del sistema operativo para bloquear apps nativas (Instagram, TikTok). En su lugar se diseñó el "Pacto de Foco Analógico" para compromiso psicológico activo.',
    },
    {
      title: '4. Gamificación compleja (tienda de recompensas, avatares o multijugador)',
      why: 'Saturar la pantalla de elementos lúdicos genera distracción y rompe el minimalismo vintage de estudio. El progreso se enfoca en métricas reales de minutos acumulados.',
    },
    {
      title: '5. Sincronización en tiempo real multi-dispositivo',
      why: 'Reservado para la fase P1 una vez validada la adherencia del estudiante a la técnica Pomodoro.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1c1917]/50 backdrop-blur-xs">
      <div 
        className="w-full max-w-lg bg-[#fbf8f3] text-[#1c1917] rounded-3xl p-6 shadow-2xl border border-[#ded4c0] relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#e7dec8]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#fbeee9] text-[#c2593f] flex items-center justify-center font-bold">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-serif font-bold text-[#1c1917]">Alcance de la Versión P0</h2>
              <p className="text-xs text-[#78716c]">Qué se incluyó y qué se postergó justificadamente</p>
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

        <div className="my-4 space-y-3.5 text-xs">
          <div className="p-3 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <span className="leading-snug">
              <strong>P0 Implementado al 100%:</strong> Temporizador 25m/5m con tictac vintage opcional, selector de intención anti-distracción, registro por materias, resumen y gráfico semanal en vivo.
            </span>
          </div>

          <label className="font-semibold uppercase tracking-wider text-[#78716c] block text-[10px] pt-1">
            Lo que NO se hizo en esta versión P0 y su justificación técnica:
          </label>

          <div className="space-y-2.5">
            {excludedItems.map((item, idx) => (
              <div key={idx} className="p-3 bg-white rounded-xl border border-[#ded4c0] space-y-1">
                <span className="font-semibold text-[#1c1917] block flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-[#d97706] shrink-0" />
                  {item.title}
                </span>
                <p className="text-[11px] text-[#78716c] leading-relaxed pl-5">
                  {item.why}
                </p>
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
