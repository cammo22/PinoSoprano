/**
 * PINO SOPRANO — Fuga dal Piano Hot Club (NOVITÀ DaProd): il minigioco
 *
 * I vigili stanno chiudendo il locale. La pianta è vista dall'alto e al buio: si vede intorno a te,
 * le luci del locale che il gestore spegne una a una, l'insegna verde dell'uscita di sicurezza aperta
 * e le torce dei vigili. Se una torcia ti inquadra, il vigile fischia e ti insegue.
 * Raccogli le opere di Piano Hot sparse nel locale (+3 secondi ciascuna) e scappa prima della saracinesca.
 * Frecce/WASD sul computer, joystick col dito sul telefono.
 */
"use strict";

const Fuga = (() => {
  const MAPPA = [
    "##############################",
    "#....T.....#.BBBBBB.#........#",
    "#.o.....o..#......o.#.KK..o..U",
    "#....T.....#........#.KK.....#",
    "#..........#...............KK#",
    "##.####.####........#.....o..#",
    "#.....#.....DDDDDD..###.######",
    "#..o..#.....DDDDDD..#........#",
    "#.....#..o..DDDDDD..#..T..T..#",
    "#.SSS.......DDDDDD.....o.....#",
    "#.....#.....DDDDDD..#..T..T..#",
    "#.o...#.....................o#",
    "###.###....PPP......#........#",
    "#.......T..PPP.A.T..###.######",
    "#..o....................o....#",
    "#.T..T..###.###.....#........#",
    "U.......#..o..#..o..#..o.W...U",
    "#.T..T..#.....#.....#....W.W.#",
    "###########M######U###########"
  ];
  const C = MAPPA[0].length, R = MAPPA.length;
  const SOLIDI = new Set(["#", "B", "P", "T", "S", "K", "W"]);
  const MURI_VISTA = new Set(["#", "B", "K", "W", "P"]);          // tavoli e divani non coprono la vista
  const cella = (x, y) => (x < 0 || y < 0 || x >= C || y >= R ? "#" : MAPPA[y][x]);
  const libero = (x, y) => !SOLIDI.has(cella(x, y));
  const LAMPADE = [[16, 1], [5, 3], [14, 8], [15, 10], [25, 8], [3, 9], [24, 14], [12, 16], [4, 15], [25, 3], [17, 16], [8, 11]];

  let cv, g, statico, luce, W = 0, H = 0, ts = 20, ox = 0, oy = 0, dpr = 1;
  let gioco = null, raf = null, onFine = null, tasti = new Set(), joy = null, immagini = [];

  // ------------------------------------------------------------------ percorsi (BFS sulla griglia)
  function percorso(da, a) {
    const k = (x, y) => y * C + x;
    const prev = new Int32Array(C * R).fill(-1), vis = new Uint8Array(C * R);
    const q = [k(da[0], da[1])]; vis[q[0]] = 1;
    const fine = k(a[0], a[1]);
    for (let i = 0; i < q.length; i++) {
      const cur = q[i];
      if (cur === fine) break;
      const x = cur % C, y = (cur / C) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy, nk = k(nx, ny);
        if (!libero(nx, ny) || vis[nk]) continue;
        vis[nk] = 1; prev[nk] = cur; q.push(nk);
      }
    }
    if (!vis[fine]) return [];
    const out = [];
    for (let c = fine; c !== -1 && c !== k(da[0], da[1]); c = prev[c]) out.push([c % C, (c / C) | 0]);
    return out.reverse();
  }
  function vede(ax, ay, bx, by) {
    const d = Math.hypot(bx - ax, by - ay), n = Math.ceil(d / 0.2);
    for (let i = 1; i < n; i++) {
      const x = ax + ((bx - ax) * i) / n, y = ay + ((by - ay) * i) / n;
      if (MURI_VISTA.has(cella(Math.floor(x), Math.floor(y)))) return false;
    }
    return true;
  }
  function raggio(x, y, ang, max) {
    const dx = Math.cos(ang), dy = Math.sin(ang);
    for (let d = 0.1; d < max; d += 0.12) if (MURI_VISTA.has(cella(Math.floor(x + dx * d), Math.floor(y + dy * d)))) return d;
    return max;
  }

  // ------------------------------------------------------------------ livello
  function nuovoLivello(livello) {
    const trova = ch => { const out = []; MAPPA.forEach((r, y) => [...r].forEach((c, x) => { if (c === ch) out.push([x, y]); })); return out; };
    const start = trova("A")[0], porta = trova("M")[0];
    const uscite = trova("U"), aperta = scegli(uscite);
    const spot = shuffleArray(trova("o")).slice(0, 5);
    const liberi = []; MAPPA.forEach((r, y) => [...r].forEach((c, x) => { if (libero(x, y) && c !== "U") liberi.push([x, y]); }));
    const nVigili = Math.min(5, 1 + livello);
    const vigili = [];
    for (let i = 0; i < nVigili; i++) {
      let p = i === 0 ? porta : scegli(liberi.filter(c => Math.hypot(c[0] - start[0], c[1] - start[1]) > 9));
      vigili.push({ x: p[0] + 0.5, y: p[1] + 0.5, ang: -Math.PI / 2, stato: "giro", strada: [], persoDa: 0, fischiato: false, guarda: Math.random() * 6 });
    }
    const durata = Math.max(36, 64 - (livello - 1) * 4);
    return {
      livello, start, aperta, uscite, vigili, liberi,
      p: { x: start[0] + 0.5, y: start[1] + 0.5, ang: 0, invul: 1.2 },
      foto: spot.map((s, i) => ({ x: s[0] + 0.5, y: s[1] + 0.5, preso: false, img: i })),
      prese: 0, vite: 3, durata, resta: durata, finito: false, t: 0, sirena: 0,
      velP: 4.3, velV: 2.3 + livello * 0.12, velInseg: 3.3 + livello * 0.1, vista: Math.min(7.5, 5.2 + livello * 0.3)
    };
  }

  // ------------------------------------------------------------------ disegno statico (una volta per livello)
  function disegnaStatico() {
    statico.width = Math.floor(C * ts * dpr); statico.height = Math.floor(R * ts * dpr);
    const s = statico.getContext("2d");
    s.setTransform(dpr, 0, 0, dpr, 0, 0);
    s.fillStyle = "#050308"; s.fillRect(0, 0, C * ts, R * ts);
    for (let y = 0; y < R; y++) for (let x = 0; x < C; x++) {
      const c = cella(x, y), X = x * ts, Y = y * ts;
      if (c === "#") {
        s.fillStyle = "#1a0f2a"; s.fillRect(X, Y, ts, ts);
        s.strokeStyle = "rgba(176,123,255,.35)"; s.lineWidth = 1;
        if (!SOLIDI.has(cella(x, y + 1)) || cella(x, y + 1) === "U") { s.beginPath(); s.moveTo(X, Y + ts - 0.5); s.lineTo(X + ts, Y + ts - 0.5); s.stroke(); }
        continue;
      }
      // pavimento in legno
      s.fillStyle = (x + y) % 2 ? "#23160f" : "#1f130d"; s.fillRect(X, Y, ts, ts);
      s.fillStyle = "rgba(0,0,0,.25)"; s.fillRect(X, Y + ts * 0.5, ts, 1);
      if (c === "D") { s.fillStyle = ["#3a1240", "#12303a", "#3a3212", "#1d1240"][(x + y) % 4]; s.fillRect(X + 1, Y + 1, ts - 2, ts - 2); }
      else if (c === "B") { s.fillStyle = "#4a1c0c"; s.fillRect(X, Y + ts * 0.2, ts, ts * 0.6); s.fillStyle = "#c9962c"; s.fillRect(X, Y + ts * 0.2, ts, 2); }
      else if (c === "P") { s.fillStyle = "#050407"; s.fillRect(X, Y, ts, ts); s.fillStyle = "rgba(255,255,255,.08)"; s.fillRect(X + 2, Y + 2, ts - 4, 2); if (x === 11) { s.fillStyle = "#e8e0cc"; s.fillRect(X, Y, 4, ts); } }
      else if (c === "T") { s.fillStyle = "#3b2414"; s.beginPath(); s.arc(X + ts / 2, Y + ts / 2, ts * 0.38, 0, 6.3); s.fill(); s.fillStyle = "#ffd54a"; s.beginPath(); s.arc(X + ts / 2, Y + ts / 2, ts * 0.07, 0, 6.3); s.fill(); }
      else if (c === "S") { s.fillStyle = "#6a0f25"; s.fillRect(X + 1, Y + ts * 0.15, ts - 2, ts * 0.7); }
      else if (c === "K") { s.fillStyle = "#3b3f48"; s.fillRect(X + 1, Y + 1, ts - 2, ts - 2); s.strokeStyle = "#6b707a"; s.strokeRect(X + 3, Y + 3, ts - 6, ts - 6); }
      else if (c === "W") { s.fillStyle = "#2f3a44"; s.fillRect(X + 1, Y + 1, ts - 2, ts - 2); }
    }
    s.font = `700 ${Math.max(8, ts * 0.42)}px Rajdhani, sans-serif`; s.fillStyle = "rgba(255,255,255,.18)"; s.textAlign = "center";
    [["BAR", 16, 2.1], ["PISTA", 15, 7.6], ["CUCINA", 25, 1.1], ["PRIVÉ", 4, 6.4], ["SALA", 25, 7.2], ["MAGAZZINO", 11.5, 16.9], ["BAGNI", 26.5, 15.1], ["INGRESSO", 11.5, 17.9]].forEach(([t, x, y]) => s.fillText(t, x * ts, y * ts));
  }

  function ridimensiona() {
    const r = cv.parentElement.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = Math.floor(r.width); H = Math.floor(r.height);
    cv.width = Math.floor(W * dpr); cv.height = Math.floor(H * dpr);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    // sui telefoni la pianta non entra: tasselli più grandi e una telecamera che ti segue
    const minimo = W < 700 || tocco() ? 30 : 16;
    ts = Math.max(minimo, Math.floor(Math.min(W / C, (H - 44) / R)));
    telecamera();
    luce.width = cv.width; luce.height = cv.height;
    if (gioco) disegnaStatico();
  }

  function telecamera() {
    const mw = C * ts, mh = R * ts;
    const px = gioco ? gioco.p.x * ts : mw / 2, py = gioco ? gioco.p.y * ts : mh / 2;
    ox = mw <= W ? Math.floor((W - mw) / 2) : Math.round(clamp(W / 2 - px, W - mw, 0));
    oy = mh <= H - 44 ? Math.floor((H - mh) / 2) + 16 : Math.round(clamp(H / 2 - py, H - mh, 40));
  }

  // ------------------------------------------------------------------ fisica
  function muovi(o, dx, dy, r) {
    const prova = (nx, ny) => {
      for (let y = Math.floor(ny - r); y <= Math.floor(ny + r); y++) for (let x = Math.floor(nx - r); x <= Math.floor(nx + r); x++) {
        if (libero(x, y)) continue;
        const cx = clamp(nx, x, x + 1), cy = clamp(ny, y, y + 1);
        if ((nx - cx) ** 2 + (ny - cy) ** 2 < r * r) return false;
      }
      return true;
    };
    if (prova(o.x + dx, o.y)) o.x += dx;
    if (prova(o.x, o.y + dy)) o.y += dy;
  }

  function aggiorna(dt) {
    const G = gioco;
    if (!G || G.finito) return;
    G.t += dt; G.resta -= dt;
    // giocatore
    let vx = 0, vy = 0;
    if (tasti.has("ArrowLeft") || tasti.has("KeyA")) vx -= 1;
    if (tasti.has("ArrowRight") || tasti.has("KeyD")) vx += 1;
    if (tasti.has("ArrowUp") || tasti.has("KeyW")) vy -= 1;
    if (tasti.has("ArrowDown") || tasti.has("KeyS")) vy += 1;
    if (joy && joy.attivo) { vx = joy.dx; vy = joy.dy; }
    const m = Math.hypot(vx, vy);
    if (m > 0.05) {
      const f = Math.min(1, m);
      vx = (vx / m) * f; vy = (vy / m) * f;
      G.p.ang = Math.atan2(vy, vx);
      muovi(G.p, vx * G.velP * dt, vy * G.velP * dt, 0.3);
      G.passi = (G.passi || 0) + dt;
      if (G.passi > 0.32) { G.passi = 0; Piano.effetto("passo"); }
    }
    G.p.invul = Math.max(0, G.p.invul - dt);
    // opere
    for (const f of G.foto) if (!f.preso && Math.hypot(f.x - G.p.x, f.y - G.p.y) < 0.6) {
      f.preso = true; G.prese++; G.resta += 3; Piano.effetto("ding");
      mostraMsg(`🖼 Opera salvata! +3 s  (${G.prese}/${G.foto.length})`);
    }
    // uscita
    const [ex, ey] = G.aperta;
    if (Math.hypot(ex + 0.5 - G.p.x, ey + 0.5 - G.p.y) < 0.8) return termina(true, "uscita");
    // vigili
    for (const v of G.vigili) {
      const d = Math.hypot(G.p.x - v.x, G.p.y - v.y);
      let diff = Math.atan2(G.p.y - v.y, G.p.x - v.x) - v.ang;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      const visto = G.p.invul <= 0 && d < G.vista && Math.abs(diff) < 0.6 && vede(v.x, v.y, G.p.x, G.p.y);
      if (visto) {
        if (v.stato !== "insegue" && !v.fischiato) { Piano.effetto("fischietto"); v.fischiato = true; mostraMsg("😱 Ti hanno visto! Corri!"); }
        v.stato = "insegue"; v.persoDa = 0; v.ultimo = [Math.floor(G.p.x), Math.floor(G.p.y)];
      } else if (v.stato === "insegue") { v.persoDa += dt; if (v.persoDa > 3) { v.stato = "giro"; v.strada = []; v.fischiato = false; } }
      v.ricalcola = (v.ricalcola || 0) - dt;
      if (v.stato === "insegue" && v.ricalcola <= 0) { v.ricalcola = 0.35; v.strada = percorso([Math.floor(v.x), Math.floor(v.y)], v.ultimo); }
      if (v.stato === "giro" && !v.strada.length) v.strada = percorso([Math.floor(v.x), Math.floor(v.y)], scegli(G.liberi)).slice(0, 26);
      if (v.strada.length) {
        const [tx, ty] = v.strada[0];
        const dx = tx + 0.5 - v.x, dy = ty + 0.5 - v.y, dd = Math.hypot(dx, dy);
        const vel = (v.stato === "insegue" ? G.velInseg : G.velV) * dt;
        if (dd <= vel) { v.x = tx + 0.5; v.y = ty + 0.5; v.strada.shift(); }
        else {
          v.x += (dx / dd) * vel; v.y += (dy / dd) * vel;
          const target = Math.atan2(dy, dx);
          let da = Math.atan2(Math.sin(target - v.ang), Math.cos(target - v.ang));
          v.ang += clamp(da, -6 * dt, 6 * dt);
        }
      }
      v.guarda += dt;
      if (v.stato === "giro") v.ang += Math.sin(v.guarda * 1.7) * 0.9 * dt;       // si guarda intorno
      if (G.p.invul <= 0 && d < 0.62) { beccato(); break; }
    }
    G.sirena -= dt;
    if (G.sirena <= 0) { G.sirena = 9; Piano.effetto("sirena"); }
    if (G.resta <= 0) termina(false, "tempo");
    hud();
  }

  function beccato() {
    const G = gioco;
    G.vite--;
    Piano.effetto("beccato");
    if (G.vite <= 0) return termina(false, "preso");
    mostraMsg(`🚔 Beccato! Ti restano ${G.vite} ${G.vite === 1 ? "tentativo" : "tentativi"}`);
    G.p.x = G.start[0] + 0.5; G.p.y = G.start[1] + 0.5; G.p.invul = 2;
    G.resta = Math.max(5, G.resta - 5);
    G.vigili.forEach(v => { v.stato = "giro"; v.strada = []; v.fischiato = false; });
  }

  // ------------------------------------------------------------------ disegno dinamico
  function frame(ts0) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (ts0 - (frame.ult || ts0)) / 1000); frame.ult = ts0;
    if (gioco && !gioco.pausa) aggiorna(dt);
    if (!gioco) return;
    const G = gioco, T = G.t;
    telecamera();
    const P = (x, y) => [ox + x * ts, oy + y * ts];
    g.fillStyle = "#020104"; g.fillRect(0, 0, W, H);
    g.drawImage(statico, ox, oy, C * ts, R * ts);
    // uscite
    for (const u of G.uscite) {
      const [X, Y] = P(u[0], u[1]), ok = u === G.aperta;
      g.fillStyle = ok ? "#12ff7a" : "#5a0d18"; g.fillRect(X + 2, Y + 2, ts - 4, ts - 4);
      g.font = `900 ${Math.max(8, ts * 0.5)}px Orbitron, sans-serif`; g.textAlign = "center"; g.textBaseline = "middle";
      g.fillStyle = ok ? "#002a10" : "#ff9fb0"; g.fillText(ok ? "⇦" : "✕", X + ts / 2, Y + ts / 2 + 1);
    }
    // opere
    G.foto.forEach(f => {
      if (f.preso) return;
      const [X, Y] = P(f.x, f.y), s = ts * 0.34, b = 1 + Math.sin(T * 5 + f.img) * 0.08;
      g.fillStyle = "#ffd54a"; g.fillRect(X - s * b, Y - s * b * 1.2, s * 2 * b, s * 2.4 * b);
      const im = immagini[f.img];
      if (im && im.complete && im.naturalWidth) g.drawImage(im, X - s * b + 2, Y - s * b * 1.2 + 2, s * 2 * b - 4, s * 2.4 * b - 4);
      else { g.fillStyle = "#2a1a30"; g.fillRect(X - s * b + 2, Y - s * b * 1.2 + 2, s * 2 * b - 4, s * 2.4 * b - 4); }
    });
    // vigili
    G.vigili.forEach(v => {
      const [X, Y] = P(v.x, v.y);
      g.fillStyle = "#1b2a52"; g.beginPath(); g.arc(X, Y, ts * 0.34, 0, 6.3); g.fill();
      g.fillStyle = "#f4f4f4"; g.beginPath(); g.arc(X, Y, ts * 0.2, 0, 6.3); g.fill();          // il casco bianco
      g.fillStyle = "#1b2a52"; g.fillRect(X - ts * 0.04, Y - ts * 0.04, ts * 0.08, ts * 0.08);
      g.strokeStyle = "#ffd54a"; g.lineWidth = 2; g.beginPath(); g.moveTo(X, Y); g.lineTo(X + Math.cos(v.ang) * ts * 0.45, Y + Math.sin(v.ang) * ts * 0.45); g.stroke();
      if (v.stato === "insegue") { g.font = `900 ${ts * 0.7}px Orbitron, sans-serif`; g.fillStyle = "#ff3b5c"; g.textAlign = "center"; g.fillText("!", X, Y - ts * 0.6); }
    });
    // tu
    const [px, py] = P(G.p.x, G.p.y);
    if (!(G.p.invul > 0 && Math.floor(T * 10) % 2)) {
      g.fillStyle = "#5dffb4"; g.shadowColor = "#5dffb4"; g.shadowBlur = 12;
      g.beginPath(); g.arc(px, py, ts * 0.3, 0, 6.3); g.fill(); g.shadowBlur = 0;
      g.fillStyle = "#04140c"; g.beginPath(); g.arc(px + Math.cos(G.p.ang) * ts * 0.14, py + Math.sin(G.p.ang) * ts * 0.14, ts * 0.08, 0, 6.3); g.fill();
    }
    // il buio: una maschera con dei buchi di luce
    const l = luce.getContext("2d");
    l.setTransform(dpr, 0, 0, dpr, 0, 0);
    l.globalCompositeOperation = "source-over";
    l.clearRect(0, 0, W, H);
    const quota = clamp(G.resta / G.durata, 0, 1);
    l.fillStyle = `rgba(2,1,6,${0.9 + (1 - quota) * 0.06})`; l.fillRect(0, 0, W, H);
    l.globalCompositeOperation = "destination-out";
    const buco = (x, y, r, a) => { const gr = l.createRadialGradient(x, y, 1, x, y, r); gr.addColorStop(0, `rgba(0,0,0,${a})`); gr.addColorStop(1, "rgba(0,0,0,0)"); l.fillStyle = gr; l.fillRect(x - r, y - r, r * 2, r * 2); };
    buco(px, py, ts * (2.9 + Math.sin(T * 17) * 0.08), 1);
    const accese = Math.ceil(LAMPADE.length * quota);
    LAMPADE.slice(0, accese).forEach(([x, y], i) => buco(ox + (x + 0.5) * ts, oy + (y + 0.5) * ts, ts * (2.2 + Math.sin(T * 2 + i) * 0.3), 0.75));
    const [ex, ey] = P(G.aperta[0] + 0.5, G.aperta[1] + 0.5);
    buco(ex, ey, ts * 3.2, 0.95);
    G.vigili.forEach(v => {
      const [X, Y] = P(v.x, v.y);
      l.beginPath(); l.moveTo(X, Y);
      for (let k = 0; k <= 16; k++) { const a = v.ang - 0.6 + (1.2 * k) / 16, d = raggio(v.x, v.y, a, G.vista); l.lineTo(X + Math.cos(a) * d * ts, Y + Math.sin(a) * d * ts); }
      l.closePath();
      const gr = l.createRadialGradient(X, Y, 1, X, Y, G.vista * ts);
      gr.addColorStop(0, "rgba(0,0,0,.95)"); gr.addColorStop(1, "rgba(0,0,0,.15)");
      l.fillStyle = gr; l.fill();
      buco(X, Y, ts * 0.9, 0.8);
    });
    G.foto.forEach(f => { if (!f.preso) buco(ox + f.x * ts, oy + f.y * ts, ts * (0.8 + Math.sin(T * 5 + f.img) * 0.2), 0.7); });
    g.drawImage(luce, 0, 0, W, H);
    // colori delle luci sopra il buio
    g.globalCompositeOperation = "lighter";
    G.vigili.forEach(v => {
      const [X, Y] = P(v.x, v.y);
      g.beginPath(); g.moveTo(X, Y);
      for (let k = 0; k <= 12; k++) { const a = v.ang - 0.6 + (1.2 * k) / 12, d = raggio(v.x, v.y, a, G.vista); g.lineTo(X + Math.cos(a) * d * ts, Y + Math.sin(a) * d * ts); }
      g.closePath();
      g.fillStyle = v.stato === "insegue" ? "rgba(255,60,80,.16)" : "rgba(255,230,150,.12)"; g.fill();
    });
    const eg = g.createRadialGradient(ex, ey, 1, ex, ey, ts * 2.4);
    eg.addColorStop(0, "rgba(18,255,122,.45)"); eg.addColorStop(1, "rgba(18,255,122,0)");
    g.fillStyle = eg; g.fillRect(ex - ts * 2.4, ey - ts * 2.4, ts * 4.8, ts * 4.8);
    if (G.resta < 10) { g.fillStyle = `rgba(255,40,60,${0.08 + 0.08 * Math.sin(T * 8)})`; g.fillRect(0, 0, W, H); }
    g.globalCompositeOperation = "source-over";
    // freccia verso l'uscita (se è lontana e fuori dalla luce)
    const dxu = G.aperta[0] + 0.5 - G.p.x, dyu = G.aperta[1] + 0.5 - G.p.y;
    if (Math.hypot(dxu, dyu) > 4) {
      const a = Math.atan2(dyu, dxu);
      g.save(); g.translate(px + Math.cos(a) * ts * 1.1, py + Math.sin(a) * ts * 1.1); g.rotate(a);
      g.fillStyle = "rgba(18,255,122,.75)"; g.beginPath(); g.moveTo(ts * 0.35, 0); g.lineTo(-ts * 0.15, -ts * 0.2); g.lineTo(-ts * 0.15, ts * 0.2); g.closePath(); g.fill();
      g.restore();
    }
  }

  // ------------------------------------------------------------------ interfaccia
  function hud() {
    const G = gioco;
    $("fuga-livello").textContent = "LIVELLO " + G.livello;
    const t = $("fuga-tempo");
    t.textContent = Math.max(0, Math.ceil(G.resta)) + " s";
    t.classList.toggle("urgente", G.resta < 10);
    $("fuga-vite").textContent = "❤".repeat(Math.max(0, G.vite)) + "♡".repeat(Math.max(0, 3 - G.vite));
    $("fuga-foto").textContent = `🖼 ${G.prese}/${G.foto.length}`;
  }
  function mostraMsg(testo) {
    const s = $("fuga-schermo");
    if (s.classList.contains("pieno")) return;
    s.className = "fuga-schermo msg on";
    s.innerHTML = `<b>${escapeHtml(testo)}</b>`;
    clearTimeout(mostraMsg.t);
    mostraMsg.t = setTimeout(() => { if (!s.classList.contains("pieno")) s.className = "fuga-schermo"; }, 1600);
  }
  function schermo(html) {
    const s = $("fuga-schermo");
    s.className = "fuga-schermo pieno on";
    s.innerHTML = html;
  }

  function termina(scappato, motivo) {
    const G = gioco;
    if (!G || G.finito) return;
    G.finito = true;
    Esecutore.ferma(true);
    Piano.effetto(scappato ? "fanfara" : motivo === "tempo" ? "saracinesca" : "beccato");
    const stelle = scappato ? 1 + (G.prese >= 3 ? 1 : 0) + (G.prese === G.foto.length ? 1 : 0) : 0;
    const salvate = G.foto.filter(f => f.preso).map(f => `<img src="${escapeHtml(PIANO_HOT[G.idx[f.img]])}" alt="">`).join("");
    const titolo = scappato ? "🎉 Sei scappato!" : motivo === "tempo" ? "🔒 Chiuso dentro!" : "🚔 Beccato!";
    const sotto = scappato ? "Fuori dall'uscita di sicurezza, un attimo prima della saracinesca." : motivo === "tempo" ? "La saracinesca è giù: passi la notte al club, col pianoforte." : "Multa, verbale e una ramanzina sul volume della musica.";
    schermo(`<div class="fs-box ${scappato ? "vinto" : "perso"}">
      <div class="fs-titolo">${titolo}</div>
      <p>${sotto}</p>
      ${scappato ? `<div class="fs-stelle">${"★".repeat(stelle)}${"☆".repeat(3 - stelle)}</div>` : ""}
      <p class="fs-dati">Opere salvate: <b>${G.prese}/${G.foto.length}</b>${scappato ? ` · tempo avanzato: <b>${Math.ceil(G.resta)} s</b>` : ""}</p>
      ${salvate ? `<div class="fs-opere">${salvate}</div>` : ""}
      <div class="bottoni"><button class="btn neon grande" id="fuga-torna">🪩 Torna al club</button></div>
    </div>`);
    $("fuga-torna").onclick = () => chiudi({ scappato, prese: G.prese, livello: G.livello });
    Bus.emit("fuga", { scappato, motivo, prese: G.prese });
  }

  function chiudi(esito) {
    if (raf) cancelAnimationFrame(raf);
    raf = null;
    gioco = null;
    $("fuga").hidden = true;
    tasti.clear();
    const f = onFine; onFine = null;
    if (f) f(esito || { scappato: false, prese: 0 });
  }

  function avvia(opz) {
    opz = opz || {};
    onFine = opz.fine;
    const livello = opz.livello || 1;
    $("fuga").hidden = false;
    ridimensiona();
    gioco = nuovoLivello(livello);
    gioco.pausa = true;
    gioco.idx = shuffleArray(PIANO_HOT.map((_, i) => i)).slice(0, 5);
    immagini = gioco.idx.map(i => { const im = new Image(); im.src = PIANO_HOT[i]; return im; });
    disegnaStatico();
    hud();
    schermo(`<div class="fs-box">
      <div class="fs-titolo">🚨 Fuga dal Piano Hot Club</div>
      <p>I vigili stanno chiudendo il locale. Trova l'<b class="verde">uscita di sicurezza verde</b> prima che scenda la saracinesca.</p>
      <ul><li>🔦 Stai fuori dalle torce: se ti inquadrano, fischiano e ti inseguono.</li>
      <li>🖼 Salva le opere di Piano Hot sparse nel locale: +3 secondi ciascuna.</li>
      <li>💡 Il gestore spegne le luci una alla volta.</li>
      <li>${tocco() ? "🕹 Trascina il dito sullo schermo per muoverti." : "⌨ Frecce o WASD per muoverti."}</li></ul>
      <p class="fs-dati">Livello <b>${livello}</b> · ${gioco.vigili.length} vigili · ${gioco.durata} secondi</p>
      <div class="bottoni"><button class="btn neon grande" id="fuga-via">🏃 SCAPPA!</button></div>
    </div>`);
    $("fuga-via").onclick = () => {
      $("fuga-schermo").className = "fuga-schermo";
      gioco.pausa = false;
      Esecutore.suona("fuga", { fonte: "fuga" });
      cv.focus && cv.focus();
    };
    if (!raf) raf = requestAnimationFrame(frame);
  }

  function avviaSubito() { if (gioco && gioco.pausa) $("fuga-via").click(); }

  function collega() {
    cv = $("fuga-canvas"); g = cv.getContext("2d");
    statico = document.createElement("canvas"); luce = document.createElement("canvas");
    const giochiamo = () => gioco && !gioco.pausa && !gioco.finito;
    document.addEventListener("keydown", e => {
      if (!gioco || $("fuga").hidden) return;
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "KeyW", "KeyA", "KeyS", "KeyD"].includes(e.code)) { e.preventDefault(); tasti.add(e.code); }
      if ((e.code === "Enter" || e.code === "Space") && gioco.pausa) { e.preventDefault(); avviaSubito(); }
    });
    document.addEventListener("keyup", e => tasti.delete(e.code));
    // joystick: dove appoggi il dito nasce il centro, trascinando ti muovi
    const pad = $("fuga-joy");
    cv.addEventListener("pointerdown", e => {
      if (!giochiamo()) return;
      e.preventDefault();
      try { cv.setPointerCapture(e.pointerId); } catch (err) { /* niente */ }
      const r = cv.getBoundingClientRect();
      joy = { id: e.pointerId, x0: e.clientX, y0: e.clientY, dx: 0, dy: 0, attivo: true };
      pad.style.left = e.clientX - r.left + "px"; pad.style.top = e.clientY - r.top + "px"; pad.classList.add("on");
    });
    cv.addEventListener("pointermove", e => {
      if (!joy || joy.id !== e.pointerId) return;
      const dx = e.clientX - joy.x0, dy = e.clientY - joy.y0, m = Math.hypot(dx, dy), max = 46;
      const k = m > max ? max / m : 1;
      joy.dx = (dx * k) / max; joy.dy = (dy * k) / max;
      pad.firstElementChild.style.transform = `translate(${dx * k}px, ${dy * k}px)`;
    });
    const via = e => { if (joy && joy.id === e.pointerId) { joy = null; pad.classList.remove("on"); pad.firstElementChild.style.transform = ""; } };
    cv.addEventListener("pointerup", via); cv.addEventListener("pointercancel", via);
    $("fuga-esci").onclick = () => { Esecutore.ferma(true); chiudi({ scappato: false, prese: gioco ? gioco.prese : 0 }); };
    window.addEventListener("resize", () => { if (gioco) ridimensiona(); });
  }

  return {
    avvia, avviaSubito, collega,
    esci: () => { if (gioco) chiudi({ scappato: false, prese: 0 }); },
    inCorso: () => !!gioco,
    stato: () => (gioco ? { livello: gioco.livello, resta: gioco.resta, vite: gioco.vite, prese: gioco.prese, p: { ...gioco.p }, aperta: gioco.aperta, pausa: !!gioco.pausa, finito: gioco.finito, vigili: gioco.vigili.length } : null),
    // per le prove automatiche
    _teletrasporta: (x, y) => { if (gioco) { gioco.p.x = x; gioco.p.y = y; } },
    _mappa: () => MAPPA, _percorso: percorso
  };
})();
