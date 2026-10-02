/**
 * Sintetizador de audio analógico usando la Web Audio API nativa.
 * No requiere archivos de audio externos, funciona 100% offline y sin latencia.
 */

class VintageAudioController {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;

  constructor() {
    // El AudioContext se inicializa en el primer gesto del usuario
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  public isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  /**
   * Genera el sonido sutil de tictac mecánico de reloj vintage.
   * Alterna entre un "tic" más agudo y un "toc" más grave.
   */
  public playTick(pitchType: 'tick' | 'tock' = 'tick') {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Generador de ruido de impacto metálico/madera breve
      const bufferSize = ctx.sampleRate * 0.025; // 25 milisegundos
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      // Filtro de banda para simular el escape de latón de un reloj antiguo
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = pitchType === 'tick' ? 1450 : 920;
      filter.Q.value = 4.5;

      // Envolvente de ganancia corta y tenue
      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0.045, now);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);

      whiteNoise.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      whiteNoise.start(now);
      whiteNoise.stop(now + 0.026);
    } catch {
      // Manejo silencioso en navegadores con políticas de autoplay restrictivas
    }
  }

  /**
   * Campanada cálida tipo cuenco tibetano / campana de latón
   * que suena al completarse una sesión de 25 min o descanso de 5 min.
   */
  public playBell() {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Fundamental y armónicos
      const frequencies = [523.25, 783.99, 1046.5]; // Do5, Sol5, Do6
      const weights = [0.15, 0.08, 0.04];

      frequencies.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        // Caída exponencial suave (reverberación natural)
        gain.gain.setValueAtTime(weights[idx], now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 3.0);
      });
    } catch {
      // Ignorar fallas menores de reproducción
    }
  }
}

export const vintageAudio = new VintageAudioController();
