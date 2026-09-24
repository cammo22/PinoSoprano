/**
 * PINO SOPRANO — la Sala Pianoforte (NOVITÀ DaProd)
 *
 * Una tastiera disegnata su canvas con la "cascata" delle note: quelle del brano cadono dall'alto sui tasti
 * (mano sinistra ciano, destra magenta) e i tasti si abbassano mentre suonano; le note che suoni tu salgono
 * verso l'alto in verde menta. Si suona col mouse, con più dita sul telefono (anche trascinando),
 * con la tastiera del computer; barra spaziatrice = pedale. Si può registrare e riascoltare.
 */
"use strict";

const Sala = (() => {
  const TASTI_PC = {
    KeyZ: 0, KeyS: 1, KeyX: 2, KeyD: 3, KeyC: 4, KeyV: 5, KeyG: 6, KeyB: 7, KeyH: 8, KeyN: 9, KeyJ: 10, KeyM: 11, Comma: 12, KeyL: 13, Period: 14, Semicolon: 15, Slash: 16,
    KeyQ: 12, Digit2: 13, KeyW: 14, Digit3: 15, KeyE: 16, KeyR: 17, Digit5: 18, KeyT: 19, Digit6: 20, KeyY: 21, Digit7: 22, KeyU: 23, KeyI: 24, Digit9: 25, KeyO: 26, Digit0: 27, KeyP: 28, BracketLeft: 29, Equal: 30, BracketRight: 31
  };
  const NERI = new Set([1, 3, 6, 8, 10]);
  const COLORI = { s: [53, 232, 255], d: [255, 61, 242], tu: [93, 255, 180] };

  let cv, g, W = 0, H = 0, dpr = 1, attiva = false, raf = null;
  let vista = { lo: 36, hi: 96 }, intera = false, ultimaMossa = 0, geo = null;
  let ottavaBase = 48;
  const puntatori = new Map();       // pointerId -> midi
  const tastiera = new Map();        // code -> midi
  const mie = [];                    // note suonate a mano (per le scie che salgono)
  const accesi = new Map();          // midi -> {mano, vel} tenuti a mano
  const scintille = [];
  let registrando = false, reg = [], regInizio = 0, regAperte = new Map(), riproduzione = [];

  // ------------------------------------------------------------------ geometria
  function calcolaGeo() {
    const bianchi = [];
    for (let m = vista.lo; m <= vista.hi; m++) if (!NERI.has(m % 12)) bianchi.push(m);
    const wb = W / bianchi.length;
    const altezzaTasti = clamp(H * 0.3, 96, 190);
    const top = H - altezzaTasti;
    const tasti = new Map();
    bianchi.forEach((m, i) => tasti.set(m, { m, x: i * wb, w: wb, nero: false }));
    for (let m = vista.lo; m <= vista.hi; m++) {
      if (!NERI.has(m % 12)) continue;
      const dx = tasti.get(m + 1) || null;
      const x = dx ? dx.x : W;
      tasti.set(m, { m, x: x - wb * 0.31, w: wb * 0.62, nero: true });
    }
    geo = { tasti, top, altezzaTasti, wb, pps: clamp((top - 30) / 3.2, 60, 260) };
  }

  function ridimensiona() {
    const r = cv.parentElement.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = Math.max(280, Math.floor(r.width));
    H = Math.floor(clamp(window.innerHeight * 0.6, 320, 540));
    cv.width = Math.floor(W * dpr); cv.height = Math.floor(H * dpr);
    cv.style.height = H + "px";
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    vistaPredefinita(false);
  }
  function vistaPredefinita(forza) {
    if (intera) vista = { lo: 21, hi: 108 };
    else if (forza || !vista.personale) {
      if (W < 520) vista = { lo: 60, hi: 83 };
      else if (W < 900) vista = { lo: 48, hi: 84 };
      else vista = { lo: 36, hi: 96 };
    }
    calcolaGeo();
  }
  function sposta(ottave) {
    intera = false;
    const span = vista.hi - vista.lo;
    const lo = clamp(vista.lo + ottave * 12, 21, 108 - span);
    vista = { lo, hi: lo + span, personale: true };
    ultimaMossa = performance.now();
    calcolaGeo();
  }

  function tastoIn(x, y) {
    if (!geo || y < geo.top) return null;
    let bianco = null;
    for (const t of geo.tasti.values()) {
      if (x < t.x || x > t.x + t.w) continue;
      if (t.nero) { if (y < geo.top + geo.altezzaTasti * 0.62) return t; }
      else bianco = t;
    }
    return bianco;
  }

  // ------------------------------------------------------------------ suonare
  function giu(midi, vel) {
    if (midi == null || midi < 21 || midi > 108) return;
    Piano.premi(midi, vel, "tu");
    accesi.set(midi, { vel });
    mie.push({ midi, t0: performance.now(), t1: null });
    if (mie.length > 160) mie.splice(0, mie.length - 160);
    const t = geo && geo.tasti.get(midi);
    if (t) scintilla(t.x + t.w / 2, geo.top, COLORI.tu, 6);
    if (registrando) regAperte.set(midi, { midi, vel, t0: (performance.now() - regInizio) / 1000 });
    nascondiAvvio();
  }
  function su(midi) {
    if (midi == null) return;
    Piano.lascia(midi);
    accesi.delete(midi);
    for (let i = mie.length - 1; i >= 0; i--) if (mie[i].midi === midi && mie[i].t1 == null) { mie[i].t1 = performance.now(); break; }
    if (registrando && regAperte.has(midi)) {
      const n = regAperte.get(midi); regAperte.delete(midi);
      n.dur = Math.max(0.08, (performance.now() - regInizio) / 1000 - n.t0);
      reg.push(n);
    }
  }

  function velDaY(y) { return clamp(0.45 + ((y - geo.top) / geo.altezzaTasti) * 0.55, 0.3, 1); }

  function collegaPuntatore() {
    cv.addEventListener("pointerdown", e => {
      Piano.sblocca();
      const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      const t = tastoIn(x, y);
      if (!t) return;
      e.preventDefault();
      try { cv.setPointerCapture(e.pointerId); } catch (err) { /* niente */ }
      puntatori.set(e.pointerId, t.m);
      giu(t.m, velDaY(y));
    });
    cv.addEventListener("pointermove", e => {
      if (!puntatori.has(e.pointerId)) return;
      const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      const t = tastoIn(x, y), prima = puntatori.get(e.pointerId);
      if (t && t.m !== prima) { su(prima); puntatori.set(e.pointerId, t.m); giu(t.m, velDaY(y) * 0.9); }
    });
    const fine = e => { if (!puntatori.has(e.pointerId)) return; su(puntatori.get(e.pointerId)); puntatori.delete(e.pointerId); };
    cv.addEventListener("pointerup", fine);
    cv.addEventListener("pointercancel", fine);
    cv.addEventListener("lostpointercapture", fine);
    cv.addEventListener("contextmenu", e => e.preventDefault());
  }

  function collegaTastiera() {
    const valido = e => attiva && !e.metaKey && !e.ctrlKey && !e.altKey && !/INPUT|SELECT|TEXTAREA/.test((document.activeElement || {}).tagName || "") && $("article-overlay").classList.contains("open") === false && $("visita").hidden;
    document.addEventListener("keydown", e => {
      if (!valido(e)) return;
      if (e.code === "Space") { e.preventDefault(); if (!e.repeat) { Piano.sblocca(); Piano.pedale(true); } return; }
      if (!(e.code in TASTI_PC)) return;
      e.preventDefault();
      if (e.repeat || tastiera.has(e.code)) return;
      Piano.sblocca();
      const m = ottavaBase + TASTI_PC[e.code];
      tastiera.set(e.code, m);
      giu(m, 0.72);
    });
    document.addEventListener("keyup", e => {
      if (e.code === "Space" && attiva) { Piano.pedale(false); return; }
      if (!tastiera.has(e.code)) return;
      su(tastiera.get(e.code)); tastiera.delete(e.code);
    });
    window.addEventListener("blur", () => { tastiera.forEach(m => su(m)); tastiera.clear(); Piano.pedale(false); });
  }

  // ------------------------------------------------------------------ disegno
  function scintilla(x, y, col, n) {
    if (riduciMovimento()) return;
    for (let i = 0; i < n; i++) scintille.push({ x, y, vx: casuale(-40, 40), vy: casuale(-160, -60), vita: 1, col });
    if (scintille.length > 240) scintille.splice(0, scintille.length - 240);
  }

  function rett(x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  }

  // mentre suona un brano la tastiera segue le note (se non l'hai spostata tu da poco)
  function autoVista(evs, now) {
    if (intera || performance.now() - ultimaMossa < 12000) return;
    let lo = 200, hi = 0;
    for (const e of evs) if (e.midi && e.t < now + 3 && e.t + e.dur > now) { lo = Math.min(lo, e.midi); hi = Math.max(hi, e.midi); }
    if (hi === 0 || (lo >= vista.lo && hi <= vista.hi)) return;
    const span = vista.hi - vista.lo;
    if (hi - lo <= span) {
      let nlo = Math.floor(lo / 12) * 12;
      if (nlo + span < hi) nlo = hi - span;
      nlo = clamp(nlo, 21, 108 - span);
      vista = { lo: nlo, hi: nlo + span };
    } else vista = { lo: Math.max(21, Math.floor(lo / 12) * 12), hi: Math.min(108, Math.ceil((hi + 1) / 12) * 12 - 1) };
    calcolaGeo();
  }

  function disegna() {
    raf = requestAnimationFrame(disegna);
    if (!geo) return;
    const now = Piano.ora(), adesso = performance.now();
    const evs = Esecutore.eventi().concat(riproduzione);
    autoVista(evs, now);
    const { tasti, top, altezzaTasti, pps } = geo;

    // fondo
    const bg = g.createLinearGradient(0, 0, 0, top);
    bg.addColorStop(0, "#07060d"); bg.addColorStop(1, "#140c26");
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    g.lineWidth = 1;
    for (const t of tasti.values()) if (t.m % 12 === 0) { g.strokeStyle = "rgba(255,255,255,.05)"; g.beginPath(); g.moveTo(t.x + 0.5, 0); g.lineTo(t.x + 0.5, top); g.stroke(); }
    // la luce del palco
    const luce = g.createRadialGradient(W / 2, top, 10, W / 2, top, Math.max(W, H) * 0.7);
    luce.addColorStop(0, "rgba(255,61,242,.10)"); luce.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = luce; g.fillRect(0, 0, W, top);

    const attivi = new Map();
    // note che cadono
    g.save();
    g.beginPath(); g.rect(0, 0, W, top); g.clip();
    for (const e of evs) {
      if (!e.midi) continue;
      const dt = e.t - now;
      if (dt > 3.4 || e.t + e.dur < now - 0.05) continue;
      if (e.t <= now && e.t + e.dur > now) attivi.set(e.midi, e.mano);
      const t = tasti.get(e.midi);
      if (!t) continue;
      const yFine = top - dt * pps, yInizio = top - (dt + e.dur) * pps;
      const c = COLORI[e.mano] || COLORI.d;
      const x = t.x + (t.nero ? 0 : t.w * 0.1), w = t.nero ? t.w : t.w * 0.8;
      const alfa = 0.35 + 0.6 * (e.vel || 0.6);
      g.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${alfa * 0.22})`;
      rett(x - 3, yInizio - 3, w + 6, yFine - yInizio + 6, 6); g.fill();
      const grad = g.createLinearGradient(0, yInizio, 0, yFine);
      grad.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},${alfa * 0.55})`); grad.addColorStop(1, `rgba(${c[0]},${c[1]},${c[2]},${alfa})`);
      g.fillStyle = grad;
      rett(x, yInizio, w, Math.max(4, yFine - yInizio), 4); g.fill();
      if (!e._scintilla && e.t <= now) { e._scintilla = true; scintilla(t.x + t.w / 2, top, c, 4); }
    }
    // le tue note che salgono
    for (let i = mie.length - 1; i >= 0; i--) {
      const n = mie[i];
      const t = tasti.get(n.midi);
      const fine = n.t1 == null ? adesso : n.t1;
      const yBasso = top - (adesso - fine) / 1000 * pps * 0.8, yAlto = top - (adesso - n.t0) / 1000 * pps * 0.8;
      if (yBasso < -10) { mie.splice(i, 1); continue; }
      if (!t) continue;
      const c = COLORI.tu;
      g.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},.75)`;
      rett(t.x + (t.nero ? 0 : t.w * 0.14), yAlto, t.nero ? t.w : t.w * 0.72, Math.max(4, yBasso - yAlto), 4); g.fill();
    }
    // scintille
    g.globalCompositeOperation = "lighter";
    for (let i = scintille.length - 1; i >= 0; i--) {
      const s = scintille[i];
      s.x += s.vx / 60; s.y += s.vy / 60; s.vy += 4; s.vita -= 0.03;
      if (s.vita <= 0) { scintille.splice(i, 1); continue; }
      g.fillStyle = `rgba(${s.col[0]},${s.col[1]},${s.col[2]},${s.vita})`;
      g.fillRect(s.x - 1.5, s.y - 1.5, 3, 3);
    }
    g.globalCompositeOperation = "source-over";
    g.restore();

    accesi.forEach((v, m) => attivi.set(m, "tu"));
    // tastiera: prima i bianchi, poi i neri
    const bordo = g.createLinearGradient(0, top - 6, 0, top);
    bordo.addColorStop(0, "rgba(0,0,0,0)"); bordo.addColorStop(1, "rgba(255,213,74,.5)");
    g.fillStyle = bordo; g.fillRect(0, top - 6, W, 6);
    for (const t of tasti.values()) {
      if (t.nero) continue;
      const on = attivi.get(t.m);
      const giu = on ? 3 : 0;
      const gr = g.createLinearGradient(0, top, 0, top + altezzaTasti);
      if (on) { const c = COLORI[on] || COLORI.d; gr.addColorStop(0, `rgb(${c[0]},${c[1]},${c[2]})`); gr.addColorStop(1, `rgba(${c[0]},${c[1]},${c[2]},.55)`); }
      else { gr.addColorStop(0, "#f3ecdc"); gr.addColorStop(0.85, "#fffaf0"); gr.addColorStop(1, "#d8ccb4"); }
      g.fillStyle = gr;
      rett(t.x + 1, top + giu, t.w - 2, altezzaTasti - 2 - giu, 5); g.fill();
      if (t.m % 12 === 0 && t.w > 16) { g.fillStyle = on ? "#07060d" : "rgba(40,30,20,.45)"; g.font = `700 ${Math.min(11, t.w * 0.4)}px Rajdhani, sans-serif`; g.textAlign = "center"; g.fillText("Do" + (Math.floor(t.m / 12) - 1), t.x + t.w / 2, top + altezzaTasti - 10); }
    }
    for (const t of tasti.values()) {
      if (!t.nero) continue;
      const on = attivi.get(t.m);
      const h = altezzaTasti * 0.62;
      const gr = g.createLinearGradient(0, top, 0, top + h);
      if (on) { const c = COLORI[on] || COLORI.d; gr.addColorStop(0, `rgb(${c[0]},${c[1]},${c[2]})`); gr.addColorStop(1, `rgba(${c[0] * 0.5},${c[1] * 0.5},${c[2] * 0.5},1)`); }
      else { gr.addColorStop(0, "#2a2438"); gr.addColorStop(0.9, "#0b0910"); gr.addColorStop(1, "#3a3346"); }
      g.fillStyle = gr;
      rett(t.x, top - 1 + (on ? 2 : 0), t.w, h, 3); g.fill();
      if (on) { g.fillStyle = "rgba(255,255,255,.25)"; g.fillRect(t.x + t.w * 0.2, top + h - 8, t.w * 0.6, 3); }
    }
    // accordo e pedale
    const acc = Esecutore.accordo();
    g.textAlign = "left";
    if (acc) { g.font = "800 13px Orbitron, sans-serif"; g.fillStyle = "rgba(255,213,74,.9)"; g.fillText(acc, 12, 22); }
    if (Piano.pedaleGiu()) { g.font = "700 12px Rajdhani, sans-serif"; g.fillStyle = "#5dffb4"; g.textAlign = "right"; g.fillText("PEDALE ●", W - 12, 20); }
    if (riproduzione.length && now > riproduzione[riproduzione.length - 1].t + riproduzione[riproduzione.length - 1].dur + 1) riproduzione = [];
  }

  // ------------------------------------------------------------------ programma
  function renderProgramma() {
    const att = Esecutore.attivo();
    $("sala-programma").innerHTML = Object.entries(REPERTORIO).filter(([, r]) => !r.nascosto).map(([id, r]) =>
      `<button class="sp-card ${r.tipo} ${att === id ? "on" : ""}" data-brano="${id}">
        <span class="sp-ico">${r.icona}</span><b>${escapeHtml(r.titolo)}</b><small>${escapeHtml(r.sotto)}</small>
        <em>${r.tipo === "live" ? "● dal vivo" : "spartito"}</em></button>`).join("");
  }
  function info() {
    const att = Esecutore.attivo();
    if (att) {
      const r = REPERTORIO[att];
      $("sala-titolo").textContent = r.icona + " " + r.titolo;
      $("sala-sotto").textContent = r.sotto + (r.tipo === "live" ? " · non suonerà mai due volte uguale" : "");
      $("sala-play").innerHTML = "⏭ Un altro brano";
    } else {
      $("sala-titolo").textContent = "Il pianoforte è pronto";
      $("sala-sotto").textContent = tocco() ? "Scegli un brano oppure tocca i tasti, anche con più dita" : "Scegli un brano oppure suona: mouse, tastiera del computer, pedale con la barra spaziatrice";
      $("sala-play").innerHTML = "▶ Suona";
    }
    renderProgramma();
  }

  function nascondiAvvio() { $("sala-avvio").hidden = true; }

  function suonaBrano(id) {
    Piano.sblocca();
    nascondiAvvio();
    ultimaMossa = 0;
    Esecutore.suona(id, { fonte: "sala" });
  }

  function avviaRegistrazione() {
    if (registrando) {
      registrando = false;
      regAperte.forEach(n => { n.dur = Math.max(0.1, (performance.now() - regInizio) / 1000 - n.t0); reg.push(n); });
      regAperte.clear();
      $("sala-rec").innerHTML = "● Registra";
      $("sala-rec").classList.remove("rosso");
      $("sala-riascolta").disabled = !reg.length;
      toast(reg.length ? "Registrazione pronta" : "Registrazione vuota", reg.length ? `${reg.length} note: premi Riascolta` : "Suona qualcosa mentre registri", "", "🎙️");
      return;
    }
    registrando = true; reg = []; regInizio = performance.now();
    $("sala-rec").innerHTML = "■ Stop registrazione";
    $("sala-rec").classList.add("rosso");
    toast("Registrazione accesa", "Suona: ogni nota viene ricordata.", "rosso", "🎙️");
  }
  function riascolta() {
    if (!reg.length || !Piano.sblocca()) return;
    const t0 = Piano.ora() + 2.2;
    riproduzione = reg.map(n => ({ midi: n.midi, t: t0 + n.t0, dur: n.dur, vel: n.vel, mano: "tu" }));
    riproduzione.sort((a, b) => a.t - b.t);
    riproduzione.forEach(n => Piano.suona(n.midi, n.vel, n.t, n.dur, { mano: "tu" }));
    toast("Riascolto", "Guarda le tue note cadere sulla tastiera.", "", "▶");
  }

  function avvia() {
    cv = $("sala-canvas"); g = cv.getContext("2d");
    collegaPuntatore();
    collegaTastiera();
    renderProgramma();
    $("sala-programma").addEventListener("click", e => { const b = e.target.closest("[data-brano]"); if (b) suonaBrano(b.dataset.brano); });
    $("sala-accendi").onclick = () => { Piano.sblocca(); nascondiAvvio(); if (!Esecutore.attivo()) suonaBrano("pianobar"); };
    $("sala-play").onclick = () => {
      const lista = Object.keys(REPERTORIO).filter(k => !REPERTORIO[k].nascosto && k !== Esecutore.attivo());
      suonaBrano(Esecutore.attivo() ? scegli(lista) : "pianobar");
    };
    $("sala-stop").onclick = () => Esecutore.ferma();
    $("sala-timbro").onchange = e => { Piano.timbro(e.target.value); toast("Pianoforte: " + e.target.selectedOptions[0].textContent, "", "", "🎹"); };
    $("sala-volume").oninput = e => Piano.volume(e.target.value / 100);
    $("sala-tempo").oninput = e => Esecutore.velocita(e.target.value / 100);
    $("sala-pedale").onclick = () => { Piano.sblocca(); Piano.pedale(!Piano.pedaleGiu()); };
    $("sala-rec").onclick = avviaRegistrazione;
    $("sala-riascolta").onclick = riascolta;
    $("sala-giu").onclick = () => { sposta(-1); ottavaBase = clamp(ottavaBase - 12, 24, 84); };
    $("sala-su").onclick = () => { sposta(1); ottavaBase = clamp(ottavaBase + 12, 24, 84); };
    $("sala-zoom").onclick = () => { intera = !intera; ultimaMossa = performance.now(); vistaPredefinita(true); $("sala-zoom").classList.toggle("on", intera); };
    Bus.on("pedale", on => $("sala-pedale").classList.toggle("on", on));
    Bus.on("brano", info);
    Bus.on("sezione", d => {
      attiva = d.nuova === "sala";
      if (attiva) { ridimensiona(); info(); if (!raf) disegna(); if (Piano.pronto()) nascondiAvvio(); }
      else if (raf) { cancelAnimationFrame(raf); raf = null; }
    });
    if ("ResizeObserver" in window) new ResizeObserver(() => { if (attiva) ridimensiona(); }).observe($("sala-palco"));
    else window.addEventListener("resize", () => { if (attiva) ridimensiona(); });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && raf) { cancelAnimationFrame(raf); raf = null; }
      else if (!document.hidden && attiva && !raf) disegna();
    });
  }

  return { avvia, suonaBrano, vista: () => vista, geometria: () => geo, attiva: () => attiva };
})();
