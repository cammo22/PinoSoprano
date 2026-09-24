/**
 * PINO SOPRANO — il pianoforte (NOVITÀ DaProd)
 *
 * Un pianoforte sintetizzato dal vivo con la Web Audio API: nessun file audio, ogni nota nasce adesso.
 *  - tre strumenti: "coda" (gran coda), "verticale" (verticale da osteria, un po' scordato), "elettrico"
 *  - corde doppie leggermente scordate (il battimento del pianoforte vero), martelletto, filtro che si chiude
 *    col tempo come le armoniche vere, decadimento più lungo nei bassi, pedale di risonanza
 *  - riverbero a convoluzione generato al volo (una sala), compressore, analizzatore per le luci del club
 *  - batteria ed effetti sintetizzati per il Piano Hot Club e per la fuga (sirena, fischietto, saracinesca…)
 */
"use strict";

const Piano = (() => {
  let ctx = null, bus = null, fxBus = null, master = null, comp = null, analizzatore = null, rumore = null, datiAn = null;
  let volume = 0.8, attenuato = false, timbro = "coda", pedale = false;
  const voci = [];            // voci in suono
  const vive = new Map();     // midi -> voci suonate a mano (tastiera)
  const onde = {};
  const MAX_VOCI = 60;

  const ARMONICHE = {
    // ampiezze delle armoniche 1..n (la 7ª e l'8ª più deboli: il martelletto colpisce vicino a quel nodo)
    coda: [0, 1, .52, .33, .24, .18, .12, .06, .05, .045, .035, .026, .02, .015, .011],
    verticale: [0, 1, .68, .5, .4, .32, .25, .14, .12, .11, .09, .07, .055, .04, .03]
  };

  function crea() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { ctx = new AC({ latencyHint: "interactive" }); } catch (e) { try { ctx = new AC(); } catch (e2) { return null; } }
    master = ctx.createGain(); master.gain.value = volume;
    comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16; comp.knee.value = 18; comp.ratio.value = 3.2; comp.attack.value = 0.004; comp.release.value = 0.22;
    analizzatore = ctx.createAnalyser(); analizzatore.fftSize = 512; datiAn = new Uint8Array(analizzatore.fftSize);
    bus = ctx.createGain(); bus.gain.value = 1;
    fxBus = ctx.createGain(); fxBus.gain.value = 0.72;
    const secco = ctx.createGain(); secco.gain.value = 0.86;
    const conv = ctx.createConvolver(); conv.buffer = impulso(2.8, 3.1);
    const umido = ctx.createGain(); umido.gain.value = 0.3;
    bus.connect(secco); secco.connect(comp);
    bus.connect(conv); conv.connect(umido); umido.connect(comp);
    fxBus.connect(comp);
    const fxRiverbero = ctx.createGain(); fxRiverbero.gain.value = 0.12; fxBus.connect(fxRiverbero); fxRiverbero.connect(conv);
    comp.connect(master); master.connect(analizzatore); analizzatore.connect(ctx.destination);
    rumore = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 1.2), ctx.sampleRate);
    const d = rumore.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return ctx;
  }

  // riverbero: rumore stereo che si spegne, con le prime riflessioni più fitte
  function impulso(sec, decad) {
    const sr = ctx.sampleRate, n = Math.floor(sr * sec), b = ctx.createBuffer(2, n, sr);
    for (let ch = 0; ch < 2; ch++) {
      const d = b.getChannelData(ch);
      let lp = 0;
      for (let i = 0; i < n; i++) {
        const t = i / n;
        const x = (Math.random() * 2 - 1) * Math.pow(1 - t, decad);
        lp += (x - lp) * (0.25 + 0.6 * (1 - t));   // le code sono più scure
        d[i] = i < sr * 0.012 ? 0 : lp;             // 12 ms di pre-delay
      }
    }
    return b;
  }

  function onda(nome, registro) {
    const k = nome + registro;
    if (onde[k]) return onde[k];
    const arm = ARMONICHE[nome];
    const real = new Float32Array(arm.length), imag = new Float32Array(arm.length);
    for (let i = 1; i < arm.length; i++) {
      let a = arm[i];
      if (registro === 0) a *= i < 7 ? 1.12 : 0.9;
      if (registro === 2) a *= Math.pow(0.5, i - 1);
      imag[i] = a;
    }
    onde[k] = ctx.createPeriodicWave(real, imag);
    return onde[k];
  }

  const freq = m => 440 * Math.pow(2, (m - 69) / 12);

  // costante di tempo del decadimento: i bassi cantano a lungo, gli acuti si spengono presto
  function tau(midi, nome) {
    if (nome === "elettrico") return clamp(1.7 * Math.pow(2, -(midi - 48) / 30), 0.35, 2.4);
    const t = clamp(2.5 * Math.pow(2, -(midi - 33) / 24), 0.22, 3.2);
    return nome === "verticale" ? t * 0.72 : t;
  }

  function sblocca() {
    if (!crea()) return false;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    return true;
  }
  const pronto = () => !!ctx && ctx.state === "running";
  const ora = () => (ctx ? ctx.currentTime : 0);

  // ------------------------------------------------------------------ una nota
  function suona(midi, vel, quando, durata, opz) {
    if (!crea()) return null;
    if (midi < 21 || midi > 108) return null;
    opz = opz || {};
    vel = clamp(vel == null ? 0.7 : vel, 0.05, 1);
    const nome = opz.timbro || timbro;
    const t = Math.max(ctx.currentTime + 0.005, quando || 0);
    const f = freq(midi);
    const T = tau(midi, nome);
    const peso = 1 - Math.abs(midi - 62) / 95;
    const amp = 0.3 * Math.pow(vel, 1.5) * peso * (nome === "elettrico" ? 1.15 : 1);

    const g = ctx.createGain();
    const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    if (pan) { pan.pan.value = clamp((midi - 62) / 70, -0.6, 0.6); g.connect(pan); pan.connect(bus); } else g.connect(bus);
    const oscs = [];

    if (nome === "elettrico") {
      // FM stile Rhodes: portante + modulatore che si calma + la "lamella" che fa din
      const car = ctx.createOscillator(); car.type = "sine"; car.frequency.value = f;
      const mod = ctx.createOscillator(); mod.type = "sine"; mod.frequency.value = f;
      const mg = ctx.createGain(); mg.gain.setValueAtTime(f * (0.6 + 1.8 * vel), t); mg.gain.setTargetAtTime(f * 0.18, t, 0.28);
      mod.connect(mg); mg.connect(car.frequency);
      const lam = ctx.createOscillator(); lam.type = "sine"; lam.frequency.value = f * 7.02;
      const lg = ctx.createGain(); lg.gain.setValueAtTime(amp * 0.22 * vel, t); lg.gain.setTargetAtTime(0, t, 0.05);
      lam.connect(lg); lg.connect(g);
      car.connect(g);
      oscs.push(car, mod, lam);
    } else {
      const reg = midi < 48 ? 0 : midi < 77 ? 1 : 2;
      const w = onda(nome, reg);
      const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.Q.value = 0.4;
      const fc = Math.min(15000, f * (2.2 + (nome === "verticale" ? 14 : 10) * vel) + 500 * vel);
      lp.frequency.setValueAtTime(fc, t);
      lp.frequency.setTargetAtTime(Math.max(f * 1.7, 260), t + 0.01, T * 0.55);
      lp.connect(g);
      const scordature = nome === "verticale" ? [0, 13 + Math.random() * 4, -9 - Math.random() * 3] : (midi < 40 ? [0, 2.2] : [0, 2.4 + Math.random() * 1.6]);
      for (const c of scordature) {
        const o = ctx.createOscillator(); o.setPeriodicWave(w); o.frequency.value = f; o.detune.value = c;
        o.connect(lp); oscs.push(o);
      }
      // martelletto: un soffio di rumore filtrato
      const nb = ctx.createBufferSource(); nb.buffer = rumore; nb.playbackRate.value = 0.8 + Math.random() * 0.4;
      const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = clamp(f * 3.2, 600, 5200); bp.Q.value = 1.1;
      const ng = ctx.createGain(); ng.gain.setValueAtTime(amp * (nome === "verticale" ? 0.75 : 0.45) * vel, t); ng.gain.setTargetAtTime(0, t + 0.002, 0.014);
      nb.connect(bp); bp.connect(ng); ng.connect(g);
      nb.start(t, Math.random() * 0.5); nb.stop(t + 0.09);
    }

    // inviluppo: attacco, "suono pronto" che scende in fretta, poi il lungo "dopo-suono"
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(amp, t + (nome === "elettrico" ? 0.006 : 0.003));
    g.gain.setTargetAtTime(amp * (nome === "elettrico" ? 0.6 : 0.36), t + 0.004, nome === "elettrico" ? 0.25 : 0.1);
    g.gain.setTargetAtTime(0.00001, t + 0.28, T);
    const fineNaturale = t + 0.3 + T * 7;
    oscs.forEach(o => { o.start(t); o.stop(fineNaturale); });

    const v = { midi, g, oscs, t, fine: fineNaturale, rilasciata: false, sostenuta: false, mano: opz.mano };
    oscs[0].onended = () => { const i = voci.indexOf(v); if (i >= 0) voci.splice(i, 1); try { g.disconnect(); } catch (e) { /* già */ } };
    voci.push(v);
    // troppe voci insieme: si spegne la più vecchia fra quelle GIÀ partite (mai una nota programmata nel futuro)
    const suonanti = voci.filter(x => !x.tagliata && x.t <= ctx.currentTime + 0.01);
    if (suonanti.length > MAX_VOCI) { const vecchia = suonanti[0]; vecchia.tagliata = true; rilascia(vecchia, ctx.currentTime, 0.03, true); }
    if (durata != null) rilascia(v, t + Math.max(0.05, durata), null);
    return v;
  }

  function rilascia(v, quando, tr, forza) {
    if (!v || !ctx || (v.rilasciata && !forza)) return;
    v.rilasciata = true;
    const t = Math.max(ctx.currentTime, quando || 0);
    if (t >= v.fine) return;
    const r = tr != null ? tr : (v.midi < 50 ? 0.16 : v.midi < 76 ? 0.1 : 0.06);
    v.g.gain.cancelScheduledValues(t);
    v.g.gain.setTargetAtTime(0, t, r);
    const stop = Math.min(v.fine, t + r * 9 + 0.05);
    v.oscs.forEach(o => { try { o.stop(stop); } catch (e) { /* già fermo */ } });
  }

  // ------------------------------------------------------------------ tastiera (a mano)
  function premi(midi, vel, mano) {
    if (!sblocca()) return null;
    lascia(midi, true);
    const v = suona(midi, vel == null ? 0.72 : vel, 0, null, { mano: mano || "tu" });
    if (v) vive.set(midi, v);
    Bus.emit("tasto", { midi, giu: true });
    return v;
  }
  function lascia(midi, subito) {
    const v = vive.get(midi);
    if (!v) return;
    vive.delete(midi);
    if (pedale && !subito) v.sostenuta = true;
    else rilascia(v, 0, subito ? 0.05 : null);
    if (!subito) Bus.emit("tasto", { midi, giu: false });
  }
  function impostaPedale(on) {
    pedale = !!on;
    if (!pedale) voci.forEach(v => { if (v.sostenuta) { v.sostenuta = false; rilascia(v, 0, null); } });
    Bus.emit("pedale", pedale);
  }

  function zittisci() {
    if (!ctx) return;
    voci.slice().forEach(v => rilascia(v, 0, 0.08, true));
    vive.clear();
  }

  // ------------------------------------------------------------------ volume e analisi
  function aggiornaVolume() { if (master) master.gain.setTargetAtTime(volume * (attenuato ? 0.32 : 1), ctx.currentTime, 0.25); }
  function impostaVolume(v) { volume = clamp(v, 0, 1); aggiornaVolume(); }
  function attenua(on) { attenuato = !!on; aggiornaVolume(); }
  function energia() {
    if (!analizzatore) return 0;
    analizzatore.getByteTimeDomainData(datiAn);
    let s = 0;
    for (let i = 0; i < datiAn.length; i += 2) { const x = (datiAn[i] - 128) / 128; s += x * x; }
    return clamp(Math.sqrt(s / (datiAn.length / 2)) * 3.2, 0, 1);
  }

  // ------------------------------------------------------------------ batteria (club)
  function rumoreFiltrato(t, tipo, f, q, a, dec, dest) {
    const s = ctx.createBufferSource(); s.buffer = rumore;
    const fl = ctx.createBiquadFilter(); fl.type = tipo; fl.frequency.value = f; fl.Q.value = q;
    const g = ctx.createGain(); g.gain.setValueAtTime(a, t); g.gain.setTargetAtTime(0, t + 0.001, dec);
    s.connect(fl); fl.connect(g); g.connect(dest || fxBus);
    s.start(t, Math.random() * 0.6); s.stop(t + dec * 8 + 0.02);
  }
  function batteria(tipo, quando, vel) {
    if (!crea()) return;
    const t = Math.max(ctx.currentTime + 0.003, quando || 0);
    vel = vel == null ? 0.7 : vel;
    if (tipo === "cassa") {
      const o = ctx.createOscillator(); o.type = "sine";
      o.frequency.setValueAtTime(160, t); o.frequency.exponentialRampToValueAtTime(44, t + 0.13);
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.9 * vel, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.38);
      o.connect(g); g.connect(fxBus); o.start(t); o.stop(t + 0.4);
      rumoreFiltrato(t, "highpass", 2500, 0.7, 0.12 * vel, 0.006);
    } else if (tipo === "schiocco") {           // battito di mani
      for (let i = 0; i < 3; i++) rumoreFiltrato(t + i * 0.011, "bandpass", 1300, 0.9, 0.34 * vel, i === 2 ? 0.07 : 0.008);
    } else if (tipo === "rullante") {
      rumoreFiltrato(t, "bandpass", 1900, 0.6, 0.3 * vel, 0.06);
      const o = ctx.createOscillator(); o.type = "triangle"; o.frequency.setValueAtTime(220, t); o.frequency.exponentialRampToValueAtTime(140, t + 0.08);
      const g = ctx.createGain(); g.gain.setValueAtTime(0.25 * vel, t); g.gain.setTargetAtTime(0, t, 0.035);
      o.connect(g); g.connect(fxBus); o.start(t); o.stop(t + 0.2);
    } else if (tipo === "spazzola") {
      const s = ctx.createBufferSource(); s.buffer = rumore;
      const fl = ctx.createBiquadFilter(); fl.type = "bandpass"; fl.frequency.value = 3200; fl.Q.value = 0.5;
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.14 * vel, t + 0.03); g.gain.setTargetAtTime(0, t + 0.03, 0.07);
      s.connect(fl); fl.connect(g); g.connect(fxBus); s.start(t, Math.random() * 0.5); s.stop(t + 0.5);
    } else if (tipo === "hh") rumoreFiltrato(t, "highpass", 7500, 0.8, 0.16 * vel, 0.018);
    else if (tipo === "hho") rumoreFiltrato(t, "highpass", 6800, 0.8, 0.14 * vel, 0.11);
    else if (tipo === "ride") {
      rumoreFiltrato(t, "bandpass", 7800, 1.6, 0.12 * vel, 0.16);
      [3150, 4870].forEach(fr => {
        const o = ctx.createOscillator(); o.type = "square"; o.frequency.value = fr;
        const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 3000;
        const g = ctx.createGain(); g.gain.setValueAtTime(0.012 * vel, t); g.gain.setTargetAtTime(0, t, 0.12);
        o.connect(hp); hp.connect(g); g.connect(fxBus); o.start(t); o.stop(t + 0.7);
      });
    }
  }

  // ------------------------------------------------------------------ effetti (club e fuga)
  function tono(t, f, dur, tipo, a, dest) {
    const o = ctx.createOscillator(); o.type = tipo || "sine"; o.frequency.setValueAtTime(f, t);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(a, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || fxBus); o.start(t); o.stop(t + dur + 0.05);
    return o;
  }
  function effetto(nome) {
    if (!sblocca()) return null;
    const t = ctx.currentTime + 0.01;
    switch (nome) {
      case "ding": tono(t, 1318.5, 0.25, "sine", 0.18); tono(t + 0.07, 1975.5, 0.35, "sine", 0.14); break;
      case "brindisi": tono(t, 2637, 0.9, "sine", 0.09); tono(t, 3520, 0.6, "sine", 0.05); tono(t + 0.12, 2793, 0.8, "sine", 0.07); break;
      case "fanfara": [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tono(t + i * 0.11, f, i === 3 ? 0.9 : 0.25, "triangle", 0.16)); break;
      case "fischietto": {
        [0, 0.42].forEach(dt => {
          const o = tono(t + dt, 2250, dt ? 0.62 : 0.3, "sine", 0.16);
          const lfo = ctx.createOscillator(); lfo.frequency.value = 32; const lg = ctx.createGain(); lg.gain.value = 110;
          lfo.connect(lg); lg.connect(o.frequency); lfo.start(t + dt); lfo.stop(t + dt + 0.7);
        });
        break;
      }
      case "beccato": [392, 370, 349.2, 311.1].forEach((f, i) => {
        const o = ctx.createOscillator(); o.type = "sawtooth"; o.frequency.setValueAtTime(f, t + i * 0.34);
        if (i === 3) o.frequency.linearRampToValueAtTime(f * 0.94, t + i * 0.34 + 0.8);
        const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 900;
        const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t + i * 0.34); g.gain.exponentialRampToValueAtTime(0.12, t + i * 0.34 + 0.04); g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.34 + (i === 3 ? 0.95 : 0.32));
        o.connect(lp); lp.connect(g); g.connect(fxBus); o.start(t + i * 0.34); o.stop(t + i * 0.34 + 1);
      }); break;
      case "saracinesca": {
        const s = ctx.createBufferSource(); s.buffer = rumore; s.loop = true;
        const fl = ctx.createBiquadFilter(); fl.type = "lowpass"; fl.frequency.value = 520;
        const am = ctx.createGain(); am.gain.value = 0;
        const lfo = ctx.createOscillator(); lfo.frequency.value = 17; const lg = ctx.createGain(); lg.gain.value = 0.22;
        lfo.connect(lg); lg.connect(am.gain);
        const g = ctx.createGain(); g.gain.setValueAtTime(0.9, t); g.gain.setTargetAtTime(0, t + 1.1, 0.08);
        s.connect(fl); fl.connect(am); am.connect(g); g.connect(fxBus);
        s.start(t); lfo.start(t); s.stop(t + 1.6); lfo.stop(t + 1.6);
        batteria("cassa", t + 1.15, 1);
        break;
      }
      case "sirena": {                       // bitonale, come quelle italiane; si ferma da sola dopo 3 s
        const o = ctx.createOscillator(); o.type = "triangle";
        for (let i = 0; i < 6; i++) o.frequency.setValueAtTime(i % 2 ? 950 : 725, t + i * 0.5);
        const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.07, t + 0.15); g.gain.setValueAtTime(0.07, t + 2.8); g.gain.exponentialRampToValueAtTime(0.0001, t + 3);
        o.connect(g); g.connect(fxBus); o.start(t); o.stop(t + 3.05);
        break;
      }
      case "bussa": [0, 0.16, 0.32].forEach(dt => { tono(t + dt, 95, 0.12, "sine", 0.5); rumoreFiltrato(t + dt, "lowpass", 900, 0.7, 0.25, 0.02); }); break;
      case "flash": rumoreFiltrato(t, "highpass", 3000, 0.7, 0.1, 0.03); tono(t, 4200, 0.12, "sine", 0.03); break;
      case "passo": rumoreFiltrato(t, "lowpass", 380, 0.8, 0.12, 0.03); break;
      default: break;
    }
    return true;
  }

  return {
    sblocca, pronto, ora, suona, premi, lascia, pedale: impostaPedale, pedaleGiu: () => pedale, zittisci,
    volume: impostaVolume, attenua, energia, batteria, effetto,
    timbro: n => { if (n) timbro = n; return timbro; },
    contesto: () => ctx, voci: () => voci.length
  };
})();
