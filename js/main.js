/**
 * PINO SOPRANO — avvio: collega tutte le sezioni, il pulsante 🎹 live e la scena della home.
 */
"use strict";

// la scena della home: luci sfocate da piano bar e una tastiera che si accende con le note live
const ScenaHero = (() => {
  let cv, g, W = 0, H = 0, raf = null, bokeh = [];
  function ridimensiona() {
    const r = cv.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    W = r.width; H = r.height;
    cv.width = Math.floor(W * dpr); cv.height = Math.floor(H * dpr);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function frame(t) {
    raf = requestAnimationFrame(frame);
    g.clearRect(0, 0, W, H);
    const lento = riduciMovimento() ? 0.2 : 1;
    g.globalCompositeOperation = "lighter";
    for (const b of bokeh) {
      const x = ((b.x + t * 0.000012 * b.v * lento) % 1.2 - 0.1) * W, y = (b.y + Math.sin(t * 0.0004 * lento + b.f) * 0.02) * H;
      const gr = g.createRadialGradient(x, y, 0, x, y, b.r);
      gr.addColorStop(0, `rgba(${b.c},${b.a})`); gr.addColorStop(1, `rgba(${b.c},0)`);
      g.fillStyle = gr; g.fillRect(x - b.r, y - b.r, b.r * 2, b.r * 2);
    }
    g.globalCompositeOperation = "source-over";
    // tastiera: 52 tasti bianchi, si accendono con le note che stanno suonando
    const now = Piano.ora(), on = new Map();
    for (const e of Esecutore.eventi()) if (e.midi && e.t <= now && e.t + e.dur > now) on.set(e.midi, e.mano);
    const bianchi = [];
    for (let m = 21; m <= 108; m++) if (![1, 3, 6, 8, 10].includes(m % 12)) bianchi.push(m);
    const w = W / bianchi.length, h = Math.min(34, H * 0.12), y0 = H - h;
    bianchi.forEach((m, i) => {
      const acc = on.get(m);
      g.fillStyle = acc ? (acc === "s" ? "rgba(53,232,255,.9)" : "rgba(255,61,242,.9)") : "rgba(243,230,200,.1)";
      g.fillRect(i * w + 0.5, y0, w - 1, h);
    });
    for (let m = 21; m <= 108; m++) {
      if (![1, 3, 6, 8, 10].includes(m % 12)) continue;
      const i = bianchi.indexOf(m + 1);
      const acc = on.get(m);
      g.fillStyle = acc ? (acc === "s" ? "#35e8ff" : "#ff3df2") : "rgba(7,6,13,.9)";
      g.fillRect(i * w - w * 0.3, y0, w * 0.6, h * 0.6);
    }
  }
  function avvia() {
    cv = $("hero-scena"); g = cv.getContext("2d");
    const col = ["255,213,74", "255,157,0", "255,61,242", "53,232,255", "255,230,180"];
    bokeh = Array.from({ length: 26 }, (_, i) => ({ x: Math.random() * 1.2, y: Math.random() * 0.85, r: 20 + Math.random() * 70, c: col[i % col.length], a: 0.05 + Math.random() * 0.1, v: 0.4 + Math.random(), f: Math.random() * 6 }));
    ridimensiona();
    window.addEventListener("resize", ridimensiona);
    const giro = () => {
      const vis = Classico.sezione() === "home" && !document.hidden;
      if (vis && !raf) { ridimensiona(); raf = requestAnimationFrame(frame); }
      if (!vis && raf) { cancelAnimationFrame(raf); raf = null; }
    };
    Bus.on("sezione", giro);
    document.addEventListener("visibilitychange", giro);
    giro();
  }
  return { avvia };
})();

pronto(() => {
  $("testa").querySelector(".versione").textContent = VERSIONE;
  $$(".crediti .versione").forEach(el => { el.textContent = VERSIONE; });
  Classico.avvia();
  Ascolta.avvia();
  Flusso.avvia();
  Visite.avvia();
  Sala.avvia();
  Club.avvia();
  Fuga.collega();
  ScenaHero.avvia();
  Aggiornamenti.avvia();
  Classico.apriDaIndirizzo();

  // 🎹 live: la radio del pianoforte, in sottofondo mentre giri per il sito
  const live = $("bPianoLive");
  function aggiornaLive() {
    const on = !!Esecutore.attivo();
    live.classList.toggle("on", on);
    live.setAttribute("aria-pressed", String(on));
    live.title = on ? "In sala: " + Esecutore.titolo() + " (tocca per fermare)" : "Pianoforte live in sottofondo";
    $("heroPiano").innerHTML = on ? "&#9632; Ferma il pianoforte" : "&#9654; Accendi il pianoforte";
  }
  function accendiSpegni() {
    if (Esecutore.attivo()) { Esecutore.ferma(); return; }
    if (!Piano.sblocca()) { toast("Audio non disponibile", "Questo browser non supporta la Web Audio API.", "rosso", "🔇"); return; }
    Esecutore.radio("live");
    toast("Pianoforte acceso", "Improvvisazioni e classici, senza fine. Nessuna registrazione: nasce tutto adesso.", "mag", "🎹");
  }
  live.onclick = accendiSpegni;
  $("heroPiano").onclick = accendiSpegni;
  Bus.on("brano", aggiornaLive);
  Bus.on("brano", d => { if (d && Esecutore.inRadio() && d.fonte === "live") toast("Ora suona: " + d.titolo, d.sotto, "", REPERTORIO[d.id].icona); });

  // per le prove automatiche e per chi vuole curiosare dalla console
  window.PS = { VERSIONE, Bus, Piano, Esecutore, Voce, Classico, Flusso, Visite, Sala, Club, Fuga, Ascolta, Memoria, REPERTORIO, VISITE, pronto: true };
});
