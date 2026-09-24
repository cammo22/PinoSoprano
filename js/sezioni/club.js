/**
 * PINO SOPRANO — il Piano Hot Club (NOVITÀ DaProd)
 *
 * La sezione Piano Hot diventa un night club: una scena disegnata dal vivo su canvas
 * (fari mobili, palla da discoteca, laser, pista che si accende a tempo, fumo, pubblico che balla,
 * un pianista su un gran coda che muove le mani sulle note vere che stanno suonando) e sulle pareti
 * le opere di Erotic Piano Photoart. L'orologio del locale corre (1 secondo = 1 minuto),
 * succedono cose a sorpresa, e la «pazienza del vicinato» scende se esageri col volume:
 * quando finisce arrivano i vigili a chiudere il locale… e bisogna scappare (fuga.js).
 * Niente stroboscopio: le luci sono morbide; con "riduci movimento" rallenta tutto.
 */
"use strict";

const Club = (() => {
  let cv, g, W = 0, H = 0, dpr = 1, raf = null, dentro = false, visibile = false, musica = true;
  let atm = 0, luci = "disco", pazienza = 100, minuti = 22 * 60, ultimoTick = 0, prossimoEvento = 0;
  let blackoutFino = 0, balloFino = 0, flash = [], coriandoli = [], allarme = null, avvisi = { sessanta: false, trenta: false }, mezzanotteFatta = false;
  let puntatore = { x: 0.5, y: 0.5 }, mani = { s: 0.35, d: 0.65 }, scossa = 0, pulsazione = 0, tempo = 0, livello = Memoria.get("fugaLivello", 1);
  let pubblico = [], quadri = [], fumo = [], inRichiesta = false;
  const NEON = ["255,61,242", "53,232,255", "255,213,74", "176,123,255", "93,255,180"];

  // ------------------------------------------------------------------ preparazione
  function preparaScena() {
    pubblico = [];
    for (let fila = 0; fila < 2; fila++) {
      const n = fila ? 11 : 15;
      for (let i = 0; i < n; i++) pubblico.push({ x: (i + 0.5 + casuale(-0.3, 0.3)) / n, fila, s: fila ? casuale(1.05, 1.25) : casuale(0.7, 0.82), fase: Math.random() * 6.28, braccia: Math.random() < 0.3, col: scegli(NEON), capelli: Math.random() });
    }
    fumo = Array.from({ length: 6 }, () => ({ x: Math.random(), y: casuale(0.35, 0.75), r: casuale(0.18, 0.35), v: casuale(-0.012, 0.012), a: casuale(0.03, 0.07) }));
    const scelte = shuffleArray(PIANO_HOT).slice(0, 6);
    quadri = scelte.map((src, i) => { const im = new Image(); im.src = src; return { im, lato: i < 3 ? -1 : 1, k: i % 3 }; });
  }

  function ridimensiona() {
    const r = cv.parentElement.getBoundingClientRect();
    dpr = Math.min(1.5, window.devicePixelRatio || 1);
    W = Math.max(300, Math.floor(r.width)); H = Math.floor(r.height);
    cv.width = Math.floor(W * dpr); cv.height = Math.floor(H * dpr);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  const energia = () => atm;           // per il generatore "club": 0 soft, 1 party, 2 delirio

  // ------------------------------------------------------------------ disegno
  function fascio(x, y, ang, lung, larg, col, a) {
    const x1 = x + Math.cos(ang - larg) * lung, y1 = y + Math.sin(ang - larg) * lung;
    const x2 = x + Math.cos(ang + larg) * lung, y2 = y + Math.sin(ang + larg) * lung;
    const gr = g.createLinearGradient(x, y, x + Math.cos(ang) * lung, y + Math.sin(ang) * lung);
    gr.addColorStop(0, `rgba(${col},${a})`); gr.addColorStop(1, `rgba(${col},0)`);
    g.fillStyle = gr;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x1, y1); g.lineTo(x2, y2); g.closePath(); g.fill();
  }

  function parete(orizzonte) {
    const gr = g.createLinearGradient(0, 0, 0, orizzonte);
    gr.addColorStop(0, "#0a0614"); gr.addColorStop(1, "#1d0c2c");
    g.fillStyle = gr; g.fillRect(0, 0, W, orizzonte);
    // tende di velluto ai lati
    for (const lato of [0, 1]) {
      const x0 = lato ? W * 0.86 : 0, w = W * 0.14;
      for (let i = 0; i < 7; i++) {
        const fx = x0 + (i / 7) * w, fw = w / 7;
        const tg = g.createLinearGradient(fx, 0, fx + fw, 0);
        tg.addColorStop(0, "#3a0717"); tg.addColorStop(0.5, "#7a1230"); tg.addColorStop(1, "#2a0410");
        g.fillStyle = tg; g.fillRect(fx, 0, fw + 1, orizzonte);
      }
    }
    // mattoni appena accennati
    g.strokeStyle = "rgba(255,255,255,.025)"; g.lineWidth = 1;
    for (let y = 18; y < orizzonte; y += 18) { g.beginPath(); g.moveTo(W * 0.14, y); g.lineTo(W * 0.86, y); g.stroke(); }
    // le opere appese: cornici d'oro
    const qh = Math.min(orizzonte * 0.26, W * 0.075), qw = qh * 0.75;
    quadri.forEach(q => {
      const cx = q.lato < 0 ? W * (0.2 + q.k * 0.075) : W * (0.8 - q.k * 0.075), cy = orizzonte * (0.38 + (q.k % 2) * 0.16);
      g.fillStyle = "#6b4a10"; g.fillRect(cx - qw / 2 - 4, cy - qh / 2 - 4, qw + 8, qh + 8);
      g.strokeStyle = "rgba(255,213,74,.8)"; g.lineWidth = 2; g.strokeRect(cx - qw / 2 - 3, cy - qh / 2 - 3, qw + 6, qh + 6);
      if (q.im.complete && q.im.naturalWidth) {
        const s = Math.max(qw / q.im.naturalWidth, qh / q.im.naturalHeight);
        g.save(); g.beginPath(); g.rect(cx - qw / 2, cy - qh / 2, qw, qh); g.clip();
        g.globalAlpha = 0.72; g.drawImage(q.im, cx - (q.im.naturalWidth * s) / 2, cy - (q.im.naturalHeight * s) / 2, q.im.naturalWidth * s, q.im.naturalHeight * s);
        g.restore();
      } else { g.fillStyle = "#1a1020"; g.fillRect(cx - qw / 2, cy - qh / 2, qw, qh); }
      const lu = g.createRadialGradient(cx, cy - qh * 0.7, 2, cx, cy, qh);
      lu.addColorStop(0, "rgba(255,220,150,.22)"); lu.addColorStop(1, "rgba(255,220,150,0)");
      g.fillStyle = lu; g.fillRect(cx - qh, cy - qh * 1.2, qh * 2, qh * 2.2);
    });
  }

  function insegna(cx, cy, s) {
    const acceso = !(Math.random() < 0.012) && Math.sin(tempo * 13) > -0.985;
    g.save();
    g.font = `900 ${s}px Orbitron, "Arial Black", sans-serif`;
    g.textAlign = "center"; g.textBaseline = "middle";
    const w1 = g.measureText("PIANO ").width, w2 = g.measureText("HOT").width, x0 = cx - (w1 + w2) / 2;
    g.textAlign = "left";
    g.shadowColor = "#ff3df2"; g.shadowBlur = acceso ? 22 + pulsazione * 18 : 4;
    g.fillStyle = acceso ? "#ffd0fb" : "#4a2040"; g.fillText("PIANO", x0, cy);
    const hotAcceso = acceso && !(allarme && Math.sin(tempo * 9) < 0);
    g.shadowColor = "#ffb300"; g.shadowBlur = hotAcceso ? 26 + pulsazione * 20 : 4;
    g.fillStyle = hotAcceso ? "#fff1a8" : "#4a3a10"; g.fillText("HOT", x0 + w1, cy);
    g.shadowBlur = 0;
    g.font = `700 ${s * 0.3}px Rajdhani, sans-serif`; g.textAlign = "center";
    g.fillStyle = "rgba(53,232,255,.85)"; g.fillText("✦  C L U B  ✦", cx, cy + s * 0.78);
    g.restore();
  }

  function pianoforte(cx, base, s) {
    // gran coda di profilo, coperchio aperto, e il pianista che suona
    g.save();
    g.translate(cx, base);
    g.fillStyle = "#040308"; g.strokeStyle = "rgba(255,213,74,.55)"; g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(-s * 1.05, -s * 0.5); g.lineTo(s * 0.35, -s * 0.5);
    g.bezierCurveTo(s * 0.9, -s * 0.5, s * 1.25, -s * 0.42, s * 1.25, -s * 0.28);
    g.lineTo(s * 1.25, -s * 0.18); g.lineTo(-s * 1.05, -s * 0.18); g.closePath(); g.fill(); g.stroke();
    // coperchio
    g.beginPath(); g.moveTo(-s * 0.5, -s * 0.5); g.lineTo(s * 0.95, -s * 1.12); g.lineTo(s * 1.02, -s * 1.06); g.lineTo(-s * 0.35, -s * 0.5); g.closePath(); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(s * 0.25, -s * 0.5); g.lineTo(s * 0.55, -s * 0.86); g.stroke();
    // gambe
    g.fillRect(-s * 0.95, -s * 0.18, s * 0.07, s * 0.36); g.fillRect(s * 1.05, -s * 0.18, s * 0.07, s * 0.36);
    // tastiera
    g.fillStyle = "#f3ecdc"; g.fillRect(-s * 1.12, -s * 0.52, s * 0.3, s * 0.05);
    // riflesso
    g.fillStyle = `rgba(255,61,242,${0.12 + pulsazione * 0.2})`; g.fillRect(-s * 1.0, -s * 0.47, s * 2.1, s * 0.03);
    // il pianista (seduto a sinistra, guarda la tastiera)
    const bob = Math.sin(pulsazione * Math.PI) * s * 0.02;
    const px = -s * 1.42, py = -s * 0.2;
    g.fillStyle = "#040308"; g.strokeStyle = "rgba(53,232,255,.5)";
    g.fillRect(px - s * 0.18, py, s * 0.38, s * 0.07);                       // panchetta
    g.beginPath(); g.moveTo(px - s * 0.12, py); g.lineTo(px - s * 0.06, py - s * 0.5 + bob); g.lineTo(px + s * 0.14, py - s * 0.5 + bob); g.lineTo(px + s * 0.16, py); g.closePath(); g.fill(); g.stroke();
    g.beginPath(); g.arc(px + s * 0.05, py - s * 0.64 + bob, s * 0.11, 0, Math.PI * 2); g.fill(); g.stroke();
    // braccia verso le mani, che seguono le note vere (sinistra = bassi, destra = acuti)
    g.lineWidth = s * 0.05; g.lineCap = "round"; g.strokeStyle = "#08060f";
    const spalla = { x: px + s * 0.08, y: py - s * 0.42 + bob };
    [["s", mani.s], ["d", mani.d]].forEach(([mano, pos], i) => {
      const hx = -s * 1.12 + pos * s * 0.3, hy = -s * 0.53 - (Math.random() < 0.02 ? s * 0.02 : 0);
      g.beginPath(); g.moveTo(spalla.x, spalla.y + i * s * 0.04); g.quadraticCurveTo((spalla.x + hx) / 2, spalla.y + s * 0.14, hx, hy); g.stroke();
      g.fillStyle = mano === "s" ? "rgba(53,232,255,.9)" : "rgba(255,61,242,.9)";
      g.beginPath(); g.arc(hx, hy, s * 0.03, 0, Math.PI * 2); g.fill();
    });
    g.restore();
  }

  function pista(orizzonte) {
    const righe = 6, colonne = 10;
    const b = Esecutore.battito();
    const passo = b ? Math.floor(tempo / Math.max(0.2, b.durata)) : Math.floor(tempo * 2);
    for (let r = 0; r < righe; r++) {
      const t0 = Math.pow(r / righe, 1.5), t1 = Math.pow((r + 1) / righe, 1.5);
      const y0 = orizzonte + (H - orizzonte) * t0, y1 = orizzonte + (H - orizzonte) * t1;
      const m0 = W * (0.3 + 0.25 * t0), m1 = W * (0.3 + 0.25 * t1);
      for (let c = 0; c < colonne; c++) {
        const f0 = c / colonne, f1 = (c + 1) / colonne;
        const ax = W / 2 - m0 + 2 * m0 * f0, bx = W / 2 - m0 + 2 * m0 * f1, cx2 = W / 2 - m1 + 2 * m1 * f1, dx = W / 2 - m1 + 2 * m1 * f0;
        const col = NEON[(r * 3 + c * 7 + passo) % NEON.length];
        let a = luci === "soffuse" ? 0.05 : 0.08 + 0.1 * atm;
        if (((r + c + passo) % (atm >= 2 ? 2 : 4)) === 0) a += 0.18 + pulsazione * 0.25;
        if (tempo < balloFino) a += 0.25;
        g.fillStyle = `rgba(${col},${Math.min(0.75, a)})`;
        g.beginPath(); g.moveTo(ax + 1, y0 + 1); g.lineTo(bx - 1, y0 + 1); g.lineTo(cx2 - 1, y1 - 1); g.lineTo(dx + 1, y1 - 1); g.closePath(); g.fill();
      }
    }
  }

  function gente() {
    const b = Esecutore.battito();
    const ph = b ? Math.min(1, b.da / Math.max(0.2, b.durata)) : (tempo * 1.2) % 1;
    const alza = tempo < balloFino || atm >= 2;
    pubblico.slice().sort((a, b2) => a.fila - b2.fila).forEach(p => {
      const s = Math.min(W, H * 1.6) * 0.045 * p.s;
      const x = p.x * W, base = H - (p.fila ? 0 : H * 0.14);
      const salto = (atm ? (1 - ph) * s * (0.18 + 0.12 * atm) : Math.sin(tempo * 1.5 + p.fase) * s * 0.05) * (0.7 + 0.3 * Math.sin(p.fase));
      const y = base - salto;
      g.fillStyle = p.fila ? "#030206" : "#07050d";
      g.strokeStyle = `rgba(${p.col},${0.25 + pulsazione * 0.3})`; g.lineWidth = 1.5;
      if ((alza && p.braccia) || (alza && Math.sin(p.fase + tempo) > 0.6)) {
        g.beginPath(); g.moveTo(x - s * 0.55, y - s * 1.2); g.lineTo(x - s * 0.9, y - s * 2.3 - salto * 0.5); g.moveTo(x + s * 0.55, y - s * 1.2); g.lineTo(x + s * 0.9, y - s * 2.3 - salto * 0.5);
        g.lineWidth = s * 0.22; g.lineCap = "round"; g.strokeStyle = g.fillStyle; g.stroke(); g.lineWidth = 1.5; g.strokeStyle = `rgba(${p.col},${0.25 + pulsazione * 0.3})`;
      }
      g.beginPath(); g.ellipse(x, y - s * 0.55, s * 0.72, s * 0.75, 0, Math.PI, 0); g.lineTo(x + s * 0.72, y + s); g.lineTo(x - s * 0.72, y + s); g.closePath(); g.fill(); g.stroke();
      g.beginPath(); g.arc(x, y - s * 1.45, s * 0.42, 0, Math.PI * 2); g.fill(); g.stroke();
    });
  }

  function pallaEspecchi(cx, cy, r, rot) {
    g.strokeStyle = "rgba(255,255,255,.25)"; g.lineWidth = 1;
    g.beginPath(); g.moveTo(cx, 0); g.lineTo(cx, cy - r); g.stroke();
    g.save(); g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.clip();
    g.fillStyle = "#3a3448"; g.fillRect(cx - r, cy - r, r * 2, r * 2);
    const n = 9;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const v = (Math.sin(i * 12.9898 + j * 78.233 + Math.floor(rot * 6)) * 43758.5453) % 1;
      const l = 120 + Math.abs(v) * 135;
      g.fillStyle = `rgb(${l},${l},${Math.min(255, l + 20)})`;
      g.fillRect(cx - r + (i * 2 * r) / n + 0.6, cy - r + (j * 2 * r) / n + 0.6, (2 * r) / n - 1.2, (2 * r) / n - 1.2);
    }
    const lu = g.createRadialGradient(cx - r * 0.4, cy - r * 0.4, 1, cx, cy, r);
    lu.addColorStop(0, "rgba(255,255,255,.5)"); lu.addColorStop(1, "rgba(0,0,0,.45)");
    g.fillStyle = lu; g.fillRect(cx - r, cy - r, r * 2, r * 2);
    g.restore();
  }

  function frame(ts) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (ts - (frame.ult || ts)) / 1000); frame.ult = ts;
    const lento = riduciMovimento() ? 0.25 : 1;
    tempo += dt * lento;
    aggiornaStato(dt);
    const b = Esecutore.battito();
    const colpo = b ? Math.exp(-b.da * 7) : 0;
    pulsazione += ((musica ? Math.max(colpo, Piano.energia() * 0.8) : 0) - pulsazione) * 0.35;
    // le mani del pianista seguono le note che suonano adesso
    const now = Piano.ora(), att = { s: [], d: [] };
    for (const e of Esecutore.eventi()) if (e.midi && e.t <= now && e.t + e.dur > now && att[e.mano]) att[e.mano].push(e.midi);
    ["s", "d"].forEach(m => { if (att[m].length) { const med = att[m].reduce((a, x) => a + x, 0) / att[m].length; mani[m] += (clamp((med - 28) / 72, 0, 1) - mani[m]) * 0.25; } });

    g.save();
    if (scossa > 0) { g.translate(casuale(-scossa, scossa), casuale(-scossa, scossa)); scossa *= 0.9; if (scossa < 0.3) scossa = 0; }
    const orizzonte = H * 0.62;
    parete(orizzonte);
    // pavimento
    const pv = g.createLinearGradient(0, orizzonte, 0, H);
    pv.addColorStop(0, "#120a1a"); pv.addColorStop(1, "#050308");
    g.fillStyle = pv; g.fillRect(0, orizzonte, W, H - orizzonte);
    g.globalCompositeOperation = "lighter";
    pista(orizzonte);
    g.globalCompositeOperation = "source-over";
    insegna(W / 2, H * 0.24, clamp(W * 0.07, 26, 64));
    pianoforte(W * 0.54, orizzonte + H * 0.1, clamp(Math.min(W, H * 1.4) * 0.15, 50, 150));

    // luci
    g.globalCompositeOperation = "lighter";
    const v = (0.4 + atm * 0.45) * lento;
    if (luci !== "soffuse") {
      const sorgenti = [0.08, 0.32, 0.68, 0.92];
      sorgenti.forEach((sx, i) => {
        const ang = Math.PI / 2 + Math.sin(tempo * v * (0.7 + i * 0.13) + i * 1.7) * 0.55;
        const col = NEON[(i + Math.floor(tempo * 0.25 * (1 + atm))) % NEON.length];
        fascio(W * sx, 0, ang, H * 1.25, 0.09 + 0.02 * atm, col, 0.16 + 0.1 * atm + pulsazione * 0.18);
        const fy = H * 0.9, fx = W * sx + (Math.cos(ang) * fy) / Math.max(0.3, Math.sin(ang));   // dove il fascio tocca la pista
        const pool = g.createRadialGradient(fx, fy, 1, fx, fy, W * 0.08);
        pool.addColorStop(0, `rgba(${col},${0.22 + pulsazione * 0.2})`); pool.addColorStop(1, `rgba(${col},0)`);
        g.fillStyle = pool; g.beginPath(); g.ellipse(fx, fy, W * 0.08, W * 0.03, 0, 0, Math.PI * 2); g.fill();
      });
    }
    // il faro caldo sul pianoforte
    fascio(W * 0.54, 0, Math.PI / 2, orizzonte + H * 0.12, luci === "soffuse" ? 0.2 : 0.12, "255,200,120", luci === "soffuse" ? 0.3 : 0.14);
    if (luci === "disco" || tempo < balloFino) {
      const rot = tempo * 0.35 * (1 + atm * 0.6) * lento;
      for (let i = 0; i < 46; i++) {
        const a = i * 2.39996 + rot, e = ((i * 37) % 100) / 100;
        const x = W / 2 + Math.cos(a) * W * (0.2 + e * 0.5), y = H * (0.1 + e * 0.8) + Math.sin(a * 1.3) * H * 0.05;
        if (Math.sin(a) < -0.2) continue;
        const col = i % 5 === 0 ? NEON[i % NEON.length] : "255,255,255";
        g.fillStyle = `rgba(${col},${(0.18 + pulsazione * 0.25) * (0.6 + 0.4 * Math.sin(a))})`;
        g.beginPath(); g.ellipse(x, y, 3 + e * 3, 2 + e * 2, 0, 0, Math.PI * 2); g.fill();
      }
    }
    if (luci === "laser") {
      const ox = W / 2, oy = H * 0.1;
      for (let i = 0; i < 9; i++) {
        const ang = Math.PI * 0.5 + (i - 4) * 0.16 + Math.sin(tempo * (0.8 + atm * 0.5) * lento + i * 0.4) * 0.35;
        const col = i % 3 === 0 ? "93,255,180" : i % 3 === 1 ? "255,61,242" : "53,232,255";
        g.strokeStyle = `rgba(${col},${0.18 + pulsazione * 0.3})`; g.lineWidth = 5;
        g.beginPath(); g.moveTo(ox, oy); g.lineTo(ox + Math.cos(ang) * H * 1.4, oy + Math.sin(ang) * H * 1.4); g.stroke();
        g.strokeStyle = `rgba(${col},.85)`; g.lineWidth = 1.2; g.stroke();
      }
    }
    // fumo
    fumo.forEach(f => {
      f.x += f.v * dt * lento; if (f.x < -0.3) f.x = 1.3; if (f.x > 1.3) f.x = -0.3;
      const gr = g.createRadialGradient(f.x * W, f.y * H, 1, f.x * W, f.y * H, f.r * W);
      gr.addColorStop(0, `rgba(200,170,255,${f.a * (0.6 + atm * 0.3)})`); gr.addColorStop(1, "rgba(200,170,255,0)");
      g.fillStyle = gr; g.fillRect(f.x * W - f.r * W, f.y * H - f.r * W, f.r * W * 2, f.r * W * 2);
    });
    g.globalCompositeOperation = "source-over";
    pallaEspecchi(W / 2, H * 0.08, clamp(W * 0.028, 12, 26), tempo * 0.35 * (1 + atm * 0.6));
    gente();

    // lampeggianti dei vigili (morbidi, niente stroboscopio)
    if (allarme) {
      const s = 0.5 + 0.5 * Math.sin(tempo * 7);
      g.globalCompositeOperation = "lighter";
      g.fillStyle = `rgba(255,40,60,${0.16 * s})`; g.fillRect(0, 0, W / 2, H);
      g.fillStyle = `rgba(40,90,255,${0.16 * (1 - s)})`; g.fillRect(W / 2, 0, W / 2, H);
      g.globalCompositeOperation = "source-over";
    }
    // flash dei paparazzi
    flash = flash.filter(f => tempo < f.fine);
    flash.forEach(f => {
      const a = (f.fine - tempo) / 0.25;
      const gr = g.createRadialGradient(f.x * W, f.y * H, 1, f.x * W, f.y * H, W * 0.3);
      gr.addColorStop(0, `rgba(255,255,255,${0.55 * a})`); gr.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
    });
    // coriandoli
    coriandoli = coriandoli.filter(c => c.y < H + 20);
    coriandoli.forEach(c => {
      c.x += c.vx * dt; c.y += c.vy * dt; c.vy += 30 * dt; c.r += c.vr * dt;
      g.save(); g.translate(c.x, c.y); g.rotate(c.r); g.fillStyle = c.col; g.fillRect(-4, -2, 8, 4); g.restore();
    });
    // blackout: si vede solo dove punta la torcia (il tuo dito o il mouse)
    if (tempo < blackoutFino) {
      const px = puntatore.x * W, py = puntatore.y * H;
      const gr = g.createRadialGradient(px, py, 10, px, py, Math.min(W, H) * 0.22);
      gr.addColorStop(0, "rgba(0,0,0,0)"); gr.addColorStop(1, "rgba(0,0,0,.95)");
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
    }
    g.restore();
  }

  // ------------------------------------------------------------------ stato, orologio, eventi
  function aggiornaStato(dt) {
    if (!dentro || allarme || Fuga.inCorso()) return;
    minuti += dt;                                   // 1 secondo reale = 1 minuto del locale
    const consumo = [-0.6, 0.5, 1.6][atm] + (luci === "laser" ? 0.3 : 0) + (musica ? 0 : -0.8);
    pazienza = clamp(pazienza - consumo * dt, 0, 100);
    if (performance.now() - ultimoTick > 250) { ultimoTick = performance.now(); hud(); }
    if (pazienza < 60 && !avvisi.sessanta) { avvisi.sessanta = true; evento("vicino"); }
    if (pazienza < 30 && !avvisi.trenta) { avvisi.trenta = true; annuncia("📞 Hanno chiamato i vigili!", "Abbassa un po'… o preparati a correre", "rosso"); Piano.effetto("sirena"); }
    if (pazienza > 70) avvisi.sessanta = false;
    if (pazienza > 40) avvisi.trenta = false;
    if (pazienza <= 0) { chiamaFuga("vigili"); return; }
    const ora = Math.floor(minuti / 60) % 24;
    if (ora === 0 && !mezzanotteFatta) { mezzanotteFatta = true; evento("mezzanotte"); }
    if (minuti >= 28 * 60) { chiamaFuga("chiusura"); return; }
    if (tempo > prossimoEvento) { prossimoEvento = tempo + casuale(22, 40); evento(scegli(["blackout", "brindisi", "richiesta", "paparazzi", "ballo", "vicino", "blackout", "ballo"])); }
  }

  function hud() {
    const m = Math.floor(minuti) % (24 * 60);
    $("club-ora").textContent = String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");
    const p = $("club-pazienza");
    p.style.width = pazienza.toFixed(1) + "%";
    p.className = pazienza < 30 ? "rosso" : pazienza < 60 ? "giallo" : "";
  }

  function annuncia(titolo, sotto, tipo) {
    const a = $("club-annuncio");
    a.className = "club-annuncio on " + (tipo || "");
    a.innerHTML = `<b>${escapeHtml(titolo)}</b>${sotto ? `<small>${escapeHtml(sotto)}</small>` : ""}`;
    clearTimeout(annuncia.t);
    annuncia.t = setTimeout(() => { a.className = "club-annuncio"; }, 3600);
  }

  function coriandolata(n, oro) {
    if (riduciMovimento()) n = Math.floor(n / 4);
    for (let i = 0; i < n; i++) coriandoli.push({ x: Math.random() * W, y: -10 - Math.random() * H * 0.3, vx: casuale(-30, 30), vy: casuale(40, 120), r: Math.random() * 6, vr: casuale(-6, 6), col: oro ? scegli(["#ffd54a", "#fff1a8", "#ff9d00"]) : `rgb(${scegli(NEON)})` });
  }

  const RICHIESTE = [
    ["tarantella", "Dal tavolo 7: «Suonaci una tarantella!»"],
    ["elisa", "Una signora al bancone chiede «Per Elisa»"],
    ["notturno", "«Maestro, qualcosa di napoletano…»"],
    ["gioia", "«L'Inno alla gioia, che si brinda!»"],
    ["pianobar", "«Qualcosa di jazz, per favore»"]
  ];
  function evento(tipo) {
    if (!dentro || allarme || Fuga.inCorso()) return;
    switch (tipo) {
      case "blackout":
        blackoutFino = tempo + 8;
        annuncia("⚡ BLACKOUT!", tocco() ? "Muovi il dito per fare luce" : "Muovi il mouse per fare luce", "giallo");
        setTimeout(() => { if (dentro && !allarme) toast("Torna la luce", "Il pianista non si è fermato un attimo.", "oro", "💡"); }, 8000);
        break;
      case "brindisi":
        coriandolata(90, true); Piano.effetto("brindisi"); pazienza = clamp(pazienza - 3, 0, 100);
        annuncia("🥂 Giro offerto dalla casa!", "Alla salute di Pino", "oro");
        break;
      case "richiesta": {
        const [id, testo] = scegli(RICHIESTE.filter(r => r[0] !== Esecutore.attivo()));
        annuncia("🎤 Una richiesta!", testo, "mag");
        if (musica) { inRichiesta = true; Esecutore.suona(id, { fonte: "club-richiesta", battute: 16 }); }
        break;
      }
      case "paparazzi":
        annuncia("📸 Paparazzi!", "Qualcuno di famoso è appena entrato…", "");
        [0, 0.45, 0.9].forEach(d => setTimeout(() => { flash.push({ x: Math.random(), y: casuale(0.3, 0.8), fine: tempo + 0.25 }); Piano.effetto("flash"); }, d * 1000));
        break;
      case "ballo":
        balloFino = tempo + 10; coriandolata(40);
        annuncia("🕺 Tutti in pista!", "La pista si accende", "cia");
        break;
      case "vicino":
        pazienza = clamp(pazienza - 12, 0, 100); scossa = 6; Piano.effetto("bussa");
        annuncia("🏠 Il vicino batte sul soffitto!", "Pazienza del vicinato in calo…", "rosso");
        break;
      case "mezzanotte":
        coriandolata(120); balloFino = tempo + 12;
        annuncia("🕛 È mezzanotte!", "'Round Midnight: il locale è al massimo", "mag");
        break;
      default: break;
    }
  }

  // ------------------------------------------------------------------ la fuga
  function chiamaFuga(motivo) {
    if (allarme || Fuga.inCorso()) return;
    allarme = motivo;
    const titoli = {
      vigili: ["🚨 I VIGILI!", "Vogliono chiudere il locale: SCAPPA!"],
      chiusura: ["🔒 Sono le 4: si chiude!", "Il gestore abbassa la saracinesca: SCAPPA!"],
      subito: ["🚨 Arrivano i vigili!", "Non farti beccare: SCAPPA!"]
    }[motivo] || ["🚨", "SCAPPA!"];
    annuncia(titoli[0], titoli[1], "rosso");
    Piano.effetto("sirena");
    scossa = 5;
    setTimeout(() => {
      Fuga.avvia({
        livello,
        fine: esito => {
          allarme = null;
          if (esito.scappato) { livello++; Memoria.set("fugaLivello", livello); }
          const record = Memoria.get("fugaRecord", 0);
          if (esito.scappato && livello - 1 > record) Memoria.set("fugaRecord", livello - 1);
          pazienza = 100; minuti = 22 * 60; mezzanotteFatta = false; avvisi = { sessanta: false, trenta: false };
          prossimoEvento = tempo + 25;
          hud();
          setTimeout(() => annuncia(esito.scappato ? "🌙 La sera dopo…" : "🌙 La sera dopo, col verbale in tasca…", "il Piano Hot Club riapre", "mag"), 400);
          if (musica) suonaSet();
        }
      });
    }, motivo === "subito" ? 900 : 2600);
  }

  // ------------------------------------------------------------------ comandi
  function etichetta() {
    const id = Esecutore.attivo();
    $("club-brano").textContent = !id ? "musica spenta" : id === "club" ? ["Piano bar · ballad", "Piano bar · swing", "Piano house"][atm] : REPERTORIO[id].titolo;
  }
  function suonaSet() { inRichiesta = false; Esecutore.suona("club", { fonte: "club", energia }); }

  function entra() {
    Piano.sblocca();
    $("club-avvio").hidden = true;
    dentro = true;
    prossimoEvento = tempo + 14;
    if (musica) suonaSet();
    annuncia("✦ Benvenuto al Piano Hot Club", "Stasera suona il pianoforte, fino alle 4", "mag");
    hud();
  }

  function sblocca() {
    $("age-gate").hidden = true;
    $("piano-hot-content").hidden = false;
    Classico.renderPianoHot();
    preparaScena();
    ridimensiona();
    if (!raf && visibile) raf = requestAnimationFrame(frame);
  }

  function selezione(box, attr, val) { $$("#" + box + " [data-" + attr + "]").forEach(b => b.classList.toggle("on", b.dataset[attr] === val)); }

  function avvia() {
    cv = $("club-scena"); g = cv.getContext("2d");
    $("bMaggiorenne").onclick = sblocca;
    $("club-entra").onclick = entra;
    $("club-musica").onclick = () => {
      musica = !musica;
      $("club-musica").classList.toggle("off", !musica);
      if (musica) { Piano.sblocca(); suonaSet(); } else Esecutore.ferma();
    };
    $("club-atmosfera").addEventListener("click", e => {
      const b = e.target.closest("[data-atm]"); if (!b) return;
      atm = { soft: 0, party: 1, delirio: 2 }[b.dataset.atm]; selezione("club-atmosfera", "atm", b.dataset.atm);
      if (atm === 2) annuncia("🔥 DELIRIO!", "Piano house a tutto volume… il vicinato non gradirà", "mag");
      etichetta();
      if (dentro && musica && Esecutore.attivo() !== "club" && !inRichiesta) suonaSet();
    });
    $("club-luci").addEventListener("click", e => { const b = e.target.closest("[data-luci]"); if (!b) return; luci = b.dataset.luci; selezione("club-luci", "luci", luci); });
    $("club-brindisi").onclick = () => { if (!dentro) entra(); evento("brindisi"); };
    $("club-richiesta").onclick = () => { if (!dentro) entra(); evento("richiesta"); };
    $("club-scappa").onclick = () => { if (!dentro) entra(); chiamaFuga("subito"); };
    cv.addEventListener("pointermove", e => { const r = cv.getBoundingClientRect(); puntatore = { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height }; });
    cv.addEventListener("pointerdown", e => { const r = cv.getBoundingClientRect(); puntatore = { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height }; });
    Bus.on("brano", etichetta);
    Bus.on("fineBrano", d => { if (d && d.fonte === "club-richiesta" && dentro && musica && !Fuga.inCorso()) suonaSet(); });
    Bus.on("sezione", d => {
      visibile = d.nuova === "piano-hot";
      if (visibile && !$("piano-hot-content").hidden) { ridimensiona(); if (!raf) raf = requestAnimationFrame(frame); }
      if (!visibile) {
        if (raf) { cancelAnimationFrame(raf); raf = null; }
        if (Fuga.inCorso()) Fuga.esci();
        if (dentro && ["club", "club-richiesta", "fuga"].includes(Esecutore.fonte())) Esecutore.ferma();
        dentro = false; allarme = null; $("club-avvio").hidden = false;
      }
    });
    if ("ResizeObserver" in window) new ResizeObserver(() => { if (visibile) ridimensiona(); }).observe($("club"));
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && raf) { cancelAnimationFrame(raf); raf = null; }
      else if (!document.hidden && visibile && !$("piano-hot-content").hidden && !raf) raf = requestAnimationFrame(frame);
    });
  }

  return {
    avvia, evento, chiamaFuga, entra, sblocca,
    stato: () => ({ dentro, atm, luci, pazienza, minuti, allarme, livello, musica }),
    imposta: o => { if ("pazienza" in o) pazienza = o.pazienza; if ("minuti" in o) minuti = o.minuti; hud(); }
  };
})();
