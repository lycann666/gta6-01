// Synthesized sound only — WebAudio oscillators and filtered noise, no audio
// files, no network. Created lazily on the first user gesture (browsers block
// audio before interaction); every call is safe before that.
export function createAudio() {
  let ctx = null; let master = null; let engineOsc = null; let engineGain = null; let sirenOn = false; let sirenTimer = null;
  function ensure() {
    if (ctx) return true;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC(); master = ctx.createGain(); master.gain.value = 0.22; master.connect(ctx.destination);
      return true;
    } catch { return false; }
  }
  function tone(freq, dur, type, vol, slideTo) {
    if (!ensure()) return;
    try {
      const t = ctx.currentTime; const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = type || 'square'; o.frequency.setValueAtTime(freq, t);
      if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t + dur);
      g.gain.setValueAtTime(vol || 0.2, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.02);
    } catch { /* audio is decoration, never fatal */ }
  }
  function noise(dur, vol, freq) {
    if (!ensure()) return;
    try {
      const t = ctx.currentTime; const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
      const buf = ctx.createBuffer(1, len, ctx.sampleRate); const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = ctx.createBufferSource(); src.buffer = buf;
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = freq || 1200;
      const g = ctx.createGain(); g.gain.value = vol || 0.25;
      src.connect(f); f.connect(g); g.connect(master); src.start(t);
    } catch { /* ignore */ }
  }
  return {
    unlock() { if (ensure() && ctx.state === 'suspended') ctx.resume().catch(() => {}); },
    click() { tone(660, 0.07, 'sine', 0.15); },
    punch() { noise(0.12, 0.3, 500); tone(120, 0.1, 'sine', 0.25, 60); },
    gunshot() { noise(0.16, 0.4, 2500); tone(220, 0.12, 'sawtooth', 0.18, 50); },
    pickup() { tone(880, 0.09, 'sine', 0.18); setTimeout(() => tone(1320, 0.12, 'sine', 0.18), 90); },
    mission() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.16, 'triangle', 0.2), i * 110)); },
    busted() { tone(330, 0.5, 'sawtooth', 0.2, 110); },
    crash() { noise(0.25, 0.35, 700); },
    engine(speed01) {
      if (!ensure()) return;
      try {
        if (!engineOsc) {
          engineOsc = ctx.createOscillator(); engineOsc.type = 'sawtooth';
          engineGain = ctx.createGain(); engineGain.gain.value = 0;
          const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 500;
          engineOsc.connect(f); f.connect(engineGain); engineGain.connect(master); engineOsc.start();
        }
        engineOsc.frequency.value = 55 + speed01 * 130;
        engineGain.gain.value = speed01 > 0.02 ? 0.05 + speed01 * 0.05 : 0;
      } catch { /* ignore */ }
    },
    siren(on) {
      if (on === sirenOn) return; sirenOn = on;
      if (sirenTimer) { clearInterval(sirenTimer); sirenTimer = null; }
      if (on && ensure()) {
        let hi = true;
        sirenTimer = setInterval(() => { tone(hi ? 950 : 700, 0.28, 'sine', 0.06); hi = !hi; }, 300);
      }
    },
  };
}
