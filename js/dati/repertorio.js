/**
 * PINO SOPRANO — il repertorio della Sala Pianoforte (NOVITÀ DaProd)
 *
 * Due tipi di brani:
 *  - "classici": spartiti di pubblico dominio scritti qui sotto nota per nota
 *    (Beethoven, Bach, Satie). Nel suo «Chi sono» Pino scrive che si commuoveva alla Nona di Beethoven.
 *  - "dal vivo": generatori che improvvisano battuta per battuta e non suonano mai due volte uguale
 *    (piano bar jazz come nella sua playlist, notturno napoletano con la sesta napoletana, tarantella,
 *    e il set del Piano Hot Club che cambia con l'atmosfera).
 *
 * Ogni generatore restituisce una battuta alla volta: { beats, bpm, ev:[{b,d,midi,vel,mano}], dr:[{b,tipo,vel}], accordo }
 * dove b e d sono in movimenti (beats) dall'inizio della battuta. null = brano finito.
 */
"use strict";

// ------------------------------------------------------------------ teoria
const NOMI_NOTE = ["Do", "Do#", "Re", "Mi♭", "Mi", "Fa", "Fa#", "Sol", "La♭", "La", "Si♭", "Si"];
const NOMI_ACCORDO = ["C", "D♭", "D", "E♭", "E", "F", "G♭", "G", "A♭", "A", "B♭", "B"];
const PC_NOTA = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function nm(s) {
  const m = /^([A-G])([#b]?)(-?\d)$/.exec(s);
  if (!m) throw new Error("nota? " + s);
  return 12 * (+m[3] + 1) + PC_NOTA[m[1]] + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0);
}
const pcDi = m => ((m % 12) + 12) % 12;
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];

const SCALE = {
  maj7: [0, 2, 4, 5, 7, 9, 11], m7: [0, 2, 3, 5, 7, 9, 10], dom7: [0, 2, 4, 5, 7, 9, 10], m7b5: [0, 1, 3, 5, 6, 8, 10],
  m6: [0, 2, 3, 5, 7, 9, 11], alt: [0, 1, 3, 4, 6, 8, 10], M: [0, 2, 4, 5, 7, 9, 11], m: [0, 2, 3, 5, 7, 8, 11]
};
const TONI = { maj7: [0, 4, 7, 11], m7: [0, 3, 7, 10], dom7: [0, 4, 7, 10], m7b5: [0, 3, 6, 10], m6: [0, 3, 7, 9], alt: [0, 4, 10], M: [0, 4, 7], m: [0, 3, 7] };
const TENSIONI = { maj7: [2], m7: [2], dom7: [2, 9], m6: [2], M: [], m: [], m7b5: [], alt: [1, 8] };
// voicing senza fondamentale (in stile Bill Evans): forma A e forma B
const VOICING = {
  maj7: [[4, 7, 11, 14], [11, 14, 16, 19]], m7: [[3, 7, 10, 14], [10, 14, 15, 19]], dom7: [[4, 9, 10, 14], [10, 14, 16, 21]],
  m7b5: [[3, 6, 10, 12], [10, 12, 15, 18]], m6: [[3, 7, 9, 14], [9, 14, 15, 19]], alt: [[4, 10, 13, 15], [10, 13, 16, 20]],
  M: [[4, 7, 12], [7, 12, 16]], m: [[3, 7, 12], [7, 12, 15]]
};
const SUFFISSO = { maj7: "maj7", m7: "m7", dom7: "7", m7b5: "m7♭5", m6: "m6", alt: "7alt", M: "", m: "m" };
const nomeAccordo = a => NOMI_ACCORDO[a.root] + SUFFISSO[a.q];

function vicino(target, pcs) {
  let best = target, bd = 99;
  for (let m = target - 7; m <= target + 7; m++) if (pcs.includes(pcDi(m))) { const d = Math.abs(m - target) + Math.random() * 0.3; if (d < bd) { bd = d; best = m; } }
  return best;
}
function passo(n, dir, scala) {
  let m = n + dir;
  for (let k = 0; k < 3 && !scala.includes(pcDi(m)); k++) m += dir;
  return m;
}
function voicing(acc, prev, lo, hi) {
  lo = lo || 48; hi = hi || 72;
  let best = null, bd = 1e9;
  for (const f of VOICING[acc.q]) for (let base = 24; base <= 72; base += 12) {
    const n = f.map(x => base + acc.root + x);
    if (Math.min(...n) < lo || Math.max(...n) > hi) continue;
    const c = n.reduce((s, x) => s + x, 0) / n.length, d = Math.abs(c - prev);
    if (d < bd) { bd = d; best = n; }
  }
  return best || VOICING[acc.q][0].map(x => lo + acc.root + x);
}
const basso = (root, lo) => { lo = lo || 36; let m = lo + root; while (m < lo) m += 12; while (m >= lo + 12) m -= 12; return m; };

// ------------------------------------------------------------------ spartiti scritti
// "E5:1 D#5:.5 r:1 C4+E4+G4:2 A2:.5/1.5"  →  nota:avanza[/suona]
function spartito(testo, mano, vel) {
  const ev = []; let b = 0;
  for (const tok of testo.trim().split(/\s+/)) {
    if (!tok || tok === "|") continue;
    const [n, d] = tok.split(":");
    const [adv, suono] = d.split("/").map(Number);
    if (n !== "r") n.split("+").forEach((x, i) => ev.push({ b: b + i * 0.012, d: suono || adv, midi: nm(x), vel: vel * (i ? 0.92 : 1), mano }));
    b += adv;
  }
  return { ev, beats: b };
}
// un brano fisso diventa una sequenza di battute (così la velocità si può cambiare mentre suona)
function fisso(voci, battuta, bpm, opz) {
  opz = opz || {};
  const tutti = []; let fine = 0;
  for (const v of voci) { const s = spartito(v.testo, v.mano, v.vel); tutti.push(...s.ev.map(e => ({ ...e, midi: e.midi + (v.trasponi || 0) }))); fine = Math.max(fine, s.beats); }
  tutti.sort((a, b) => a.b - b.b);
  const nBattute = Math.ceil(fine / battuta);
  return () => {
    let k = 0;
    return {
      next() {
        if (k >= nBattute) return null;
        const da = k * battuta, a = da + battuta; k++;
        const ev = tutti.filter(e => e.b >= da - 1e-6 && e.b < a - 1e-6).map(e => ({ ...e, b: e.b - da, vel: clamp(e.vel * rnd(0.94, 1.06), 0.05, 1) }));
        const rit = opz.rallenta && k >= nBattute - 1 ? 0.82 : 1;
        return { beats: battuta, bpm: bpm * rit, ev };
      }
    };
  };
}

// Inno alla gioia (Beethoven, Nona Sinfonia, 1824) — melodia e accompagnamento semplice
const GIOIA = (() => {
  const C = "C3:1 G3+C4+E4:1 G2:1 G3+C4+E4:1", G = "G2:1 G3+B3+D4:1 D3:1 G3+B3+D4:1",
    GC = "G2:1 G3+B3+D4:1 C3:1 G3+C4+E4:1", CG = "C3:1 G3+C4+E4:1 G2:1 G3+B3+D4:1";
  const lh = [C, G, C, G, C, G, C, GC, G, GC, G, CG, C, G, C, GC, "C2+C3+G3+E4:4"].join(" ");
  const rh = "E5:1 E5:1 F5:1 G5:1 G5:1 F5:1 E5:1 D5:1 C5:1 C5:1 D5:1 E5:1 E5:1.5 D5:.5 D5:2 " +
    "E5:1 E5:1 F5:1 G5:1 G5:1 F5:1 E5:1 D5:1 C5:1 C5:1 D5:1 E5:1 D5:1.5 C5:.5 C5:2 " +
    "D5:1 D5:1 E5:1 C5:1 D5:1 E5:.5 F5:.5 E5:1 C5:1 D5:1 E5:.5 F5:.5 E5:1 D5:1 C5:1 D5:1 G4:2 " +
    "E5:1 E5:1 F5:1 G5:1 G5:1 F5:1 E5:1 D5:1 C5:1 C5:1 D5:1 E5:1 D5:1.5 C5:.5 C5:2 C5+E5+G5+C6:4";
  return fisso([{ testo: rh, mano: "d", vel: 0.72 }, { testo: lh, mano: "s", vel: 0.42 }], 4, 104, { rallenta: true });
})();

// Preludio in Do maggiore BWV 846 (Bach, Clavicembalo ben temperato, 1722): gli accordi delle prime battute
const BACH = (() => {
  const accordi = [
    "C4 E4 G4 C5 E5", "C4 D4 A4 D5 F5", "B3 D4 G4 D5 F5", "C4 E4 G4 C5 E5", "C4 E4 A4 E5 A5", "C4 D4 F#4 A4 D5", "B3 D4 G4 D5 G5",
    "B3 C4 E4 G4 C5", "A3 C4 E4 G4 C5", "D3 A3 D4 F#4 C5", "G3 B3 D4 G4 B4", "G3 Bb3 E4 G4 C#5", "F3 A3 D4 A4 D5", "F3 Ab3 D4 F4 B4",
    "E3 G3 C4 G4 C5", "E3 F3 A3 C4 F4", "D3 F3 A3 C4 F4", "G2 D3 G3 B3 F4", "C3 E3 G3 C4 E4", "C3 G3 Bb3 C4 E4", "F2 F3 A3 C4 E4",
    "F#2 C3 A3 C4 Eb4", "Ab2 F3 B3 C4 D4", "G2 F3 G3 B3 D4", "G2 E3 G3 C4 E4", "G2 D3 G3 C4 F4", "G2 D3 G3 B3 F4", "G2 Eb3 A3 C4 F#4",
    "G2 E3 G3 C4 G4", "G2 D3 G3 C4 F4", "G2 D3 G3 B3 F4", "C2 C3 G3 Bb3 E4"
  ];
  const lh = [], rh = [];
  for (const a of accordi) {
    const n = a.split(" ");
    for (let h = 0; h < 2; h++) {
      lh.push(`${n[0]}:.25/2`, `${n[1]}:1.75/1.75`);
      rh.push("r:.5", `${n[2]}:.25/.5`, `${n[3]}:.25/.5`, `${n[4]}:.25/.5`, `${n[2]}:.25/.5`, `${n[3]}:.25/.5`, `${n[4]}:.25/.5`);
    }
  }
  lh.push("C2+C3:4");
  rh.push("E4:.12/4 G4:.12/4 C5:.12/4 E5:3.64/4");
  return fisso([{ testo: rh.join(" "), mano: "d", vel: 0.55 }, { testo: lh.join(" "), mano: "s", vel: 0.5 }], 4, 66, { rallenta: true });
})();

// Per Elisa (Beethoven, 1810): la prima parte due volte. Un movimento = una croma.
const ELISA = (() => {
  const a = "E5:.5 D#5:.5 E5:.5 B4:.5 D5:.5 C5:.5 A4:1 r:.5 C4:.5 E4:.5 A4:.5 B4:1 r:.5 E4:.5 G#4:.5 B4:.5 C5:1 r:.5 E4:.5 E5:.5 D#5:.5 " +
    "E5:.5 D#5:.5 E5:.5 B4:.5 D5:.5 C5:.5 A4:1 r:.5 C4:.5 E4:.5 A4:.5 B4:1 r:.5 E4:.5 C5:.5 B4:.5";
  const rh = "r:2 E5:.5 D#5:.5 " + a + " A4:1 r:1 E5:.5 D#5:.5 " + a + " A4:3";
  const l = "r:3 A2:.5/1.5 E3:.5/1 A3:.5/.5 r:1.5 E2:.5/1.5 E3:.5/1 G#3:.5/.5 r:1.5 A2:.5/1.5 E3:.5/1 A3:.5/.5 r:1.5 " +
    "r:3 A2:.5/1.5 E3:.5/1 A3:.5/.5 r:1.5 E2:.5/1.5 E3:.5/1 G#3:.5/.5 r:1.5 A2:.5/1.5 E3:.5/1 A3:.5/.5 r:1.5";
  const lh = "r:1 " + l + " " + l + " A2+A3:3";
  return fisso([{ testo: rh, mano: "d", vel: 0.6 }, { testo: lh, mano: "s", vel: 0.42 }], 3, 150, { rallenta: true });
})();

// Gymnopédie n. 1 (Erik Satie, 1888): la prima frase, due volte
const GYMNO = (() => {
  const G = "G2:1/3 B3+D4+F#4:2/2", D = "D2:1/3 A3+C#4+F#4:2/2";
  const lh = [];
  for (let i = 0; i < 20; i++) lh.push(i % 2 ? D : G);
  lh.push("D2+A3+C#4+F#4:6");
  const frase = "r:1 F#5:1 A5:1 G5:1 F#5:1 C#5:1 B4:1 C#5:1 D5:1 A4:3 F#4:12";
  const rh = "r:12 " + frase + " " + frase + " D5:6";
  return fisso([{ testo: rh, mano: "d", vel: 0.52 }, { testo: lh.join(" "), mano: "s", vel: 0.36 }], 3, 72, { rallenta: true });
})();

// ------------------------------------------------------------------ improvvisatori
const GIRI_JAZZ = [
  [[0, "maj7"], [9, "m7"], [2, "m7"], [7, "dom7"]],
  [[0, "maj7"], [4, "m7"], [9, "dom7"], [2, "m7"]],
  [[0, "maj7"], [5, "dom7"], [4, "m7"], [9, "alt"]],
  [[2, "m7"], [7, "dom7"], [0, "maj7"], [0, "maj7"]],
  [[4, "m7"], [9, "dom7"], [2, "m7"], [7, "dom7"]],
  [[5, "maj7"], [5, "m6"], [0, "maj7"], [9, "dom7"]],
  [[9, "m7"], [2, "dom7"], [7, "maj7"], [0, "maj7"], [6, "m7b5"], [11, "alt"], [4, "m7"], [4, "m7"]]
];
const RITMI_BALLAD = [
  [0, 1, 1.67, 2.67, 3], [0.67, 1, 1.67, 2, 3], [0, 1.5, 2, 3], [0, 0.67, 1, 1.67, 2, 2.67, 3], [0, 2], [1, 1.67, 2, 2.67],
  [0, 0.67, 1.33, 2, 3], [0, 1, 2, 3], [2, 2.67, 3, 3.67], [0, 3], [0, 0.33, 0.67, 1, 2]
];

// la mano destra che improvvisa: toni dell'accordo sui tempi forti, scala e cromatismi su quelli deboli
function creaSolista(centro, lo, hi) {
  const s = { last: centro, dir: 1, frase: 0, lunghezza: 2, silenzio: 0, motivo: null };
  s.suona = (ev, acc, ritmi, beats, velBase, prossimo) => {
    if (s.silenzio > 0) { s.silenzio--; return; }
    const ritmo = s.motivo && Math.random() < 0.35 ? s.motivo : pick(ritmi);
    const toni = TONI[acc.q].concat(TENSIONI[acc.q] || []).map(x => (acc.root + x) % 12);
    const scala = SCALE[acc.q].map(x => (acc.root + x) % 12);
    ritmo.forEach((b, i) => {
      if (b >= beats) return;
      const forte = Math.abs(b - Math.round(b)) < 0.02 && Math.round(b) % 2 === 0;
      const ultima = i === ritmo.length - 1;
      let m;
      if (forte || ultima) m = vicino(s.last + s.dir * (1 + Math.floor(Math.random() * 3)), toni);
      else if (Math.random() < 0.14 && prossimo) m = vicino(s.last + s.dir * 2, toni) - 1;          // nota di avvicinamento
      else if (Math.random() < 0.12) m = vicino(s.last + s.dir * (4 + Math.floor(Math.random() * 4)), toni); // salto
      else m = passo(s.last, s.dir, scala);
      if (m > hi) { m -= 12; s.dir = -1; }
      if (m < lo) { m += 12; s.dir = 1; }
      if (m > hi - 5) s.dir = -1; else if (m < lo + 5) s.dir = 1; else if (Math.random() < 0.2) s.dir = -s.dir;
      const prox = ultima ? beats : ritmo[i + 1];
      const d = ultima ? Math.max(beats - b, 1.2) : (prox - b) * (forte ? 0.95 : 0.82);
      const vel = velBase + (forte ? 0.1 : 0) + Math.random() * 0.08;
      ev.push({ b, d, midi: m, vel, mano: "d" });
      if (ultima && Math.random() < 0.3) ev.push({ b: b + 0.01, d, midi: vicino(m - 4, toni.filter(p => p !== pcDi(m))), vel: vel * 0.8, mano: "d" });
      s.last = m;
    });
    s.motivo = ritmo;
    s.frase++;
    if (s.frase >= s.lunghezza) { s.frase = 0; s.lunghezza = 1 + Math.floor(Math.random() * 3); s.silenzio = Math.random() < 0.45 ? 1 : 0; }
  };
  return s;
}

function creaGiro(tonalita) {
  const g = { chiave: tonalita == null ? pick([0, 5, 10, 3, 7, 2, 8]) : tonalita, coda: [] };
  g.riempi = () => {
    const iniziali = GIRI_JAZZ.filter(x => x[0][0] === 0 && x[0][1] === "maj7");
    let giro = pick(iniziali).concat(pick(GIRI_JAZZ.filter(x => x.length === 4)));
    if (Math.random() < 0.35) giro = GIRI_JAZZ[6].slice();
    const prossima = Math.random() < 0.3 ? (g.chiave + pick([5, 7, 2, 10, 3, 8])) % 12 : g.chiave;
    giro = giro.slice(0, 6);
    giro.forEach(([deg, q]) => g.coda.push({ root: (g.chiave + deg) % 12, q }));
    g.coda.push({ root: (prossima + 2) % 12, q: "m7" }, { root: (prossima + 7) % 12, q: "dom7" });
    g.chiave = prossima;
  };
  g.prendi = () => { if (g.coda.length < 2) g.riempi(); return g.coda.shift(); };
  g.guarda = () => { if (!g.coda.length) g.riempi(); return g.coda[0]; };
  return g;
}

function manoSinistraBallad(ev, acc, stato, beats) {
  const v = voicing(acc, stato.prevVoc); stato.prevVoc = v.reduce((s, x) => s + x, 0) / v.length;
  const b0 = basso(acc.root, 36), vel = 0.4 + Math.random() * 0.08;
  const stile = pick(["lungo", "due", "charleston", "arpeggio", "lungo"]);
  ev.push({ b: 0, d: stile === "due" ? 1.9 : beats - 0.1, midi: b0, vel: vel + 0.06, mano: "s" });
  if (stile === "lungo") v.forEach((m, i) => ev.push({ b: 0.03 + i * 0.03, d: beats - 0.2, midi: m, vel, mano: "s" }));
  else if (stile === "due") {
    v.forEach(m => ev.push({ b: 0.02, d: 1.9, midi: m, vel, mano: "s" }));
    ev.push({ b: 2, d: 1.9, midi: b0 + 7 > 50 ? b0 - 5 : b0 + 7, vel, mano: "s" });
    v.forEach(m => ev.push({ b: 2.02, d: 1.9, midi: m, vel: vel * 0.9, mano: "s" }));
  } else if (stile === "charleston") {
    v.forEach(m => ev.push({ b: 0.02, d: 0.8, midi: m, vel, mano: "s" }));
    v.forEach(m => ev.push({ b: 1.67, d: 2.1, midi: m, vel: vel * 0.92, mano: "s" }));
  } else v.forEach((m, i) => ev.push({ b: i * 0.67, d: beats - i * 0.67 - 0.1, midi: m, vel: vel * 0.95, mano: "s" }));
}

function finale(acc, centro) {
  const ev = [];
  const b0 = basso(acc.root, 36);
  ev.push({ b: 0, d: 7, midi: b0 - 12 >= 28 ? b0 - 12 : b0, vel: 0.5, mano: "s" }, { b: 0.02, d: 7, midi: b0 + 7, vel: 0.42, mano: "s" });
  voicing({ root: acc.root, q: "maj7" }, 58).forEach((m, i) => ev.push({ b: 0.1 + i * 0.09, d: 7, midi: m, vel: 0.42, mano: "s" }));
  const top = vicino(centro || 76, [(acc.root + 2) % 12, (acc.root + 7) % 12]);
  [top - 12, top - 5, top].forEach((m, i) => ev.push({ b: 0.5 + i * 0.12, d: 6.5, midi: m, vel: 0.5, mano: "d" }));
  return { beats: 8, bpm: 60, ev };
}

// Piano bar: ballad jazz rubato-swing, ogni ritornello in una tonalità che può cambiare
function genPianobar(o) {
  o = o || {};
  const giro = creaGiro(), sol = creaSolista(74, 64, 88), stato = { prevVoc: 58 };
  let n = 0; const max = o.battute || Infinity; let chiuso = false;
  const bpm = o.bpm || pick([72, 76, 80]);
  return {
    next() {
      if (chiuso) return null;
      if (n >= max) { chiuso = true; return finale({ root: giro.chiave }, 76); }
      const acc = giro.prendi(); n++;
      const ev = [];
      manoSinistraBallad(ev, acc, stato, 4);
      sol.suona(ev, acc, RITMI_BALLAD, 4, 0.5, giro.guarda());
      return { beats: 4, bpm, ev, accordo: nomeAccordo(acc) };
    }
  };
}

// Notturno napoletano: minore, arpeggi, la sesta napoletana (♭II6) prima della dominante, sospiri.
// Ogni tanto il ritornello passa al relativo maggiore e poi torna in minore.
function genNotturno(o) {
  o = o || {};
  const tonica = pick([9, 2, 4, 7]);           // La, Re, Mi, Sol minore
  const GIRI_MIN = [
    [[0, "m"], [5, "m"], [1, "M", 1], [7, "dom7"]],
    [[0, "m"], [8, "M"], [5, "m"], [7, "dom7"]],
    [[0, "m"], [3, "M"], [8, "M"], [7, "dom7"]],
    [[5, "m"], [1, "M", 1], [7, "dom7"], [0, "m"]],
    [[0, "m"], [10, "M"], [3, "M"], [7, "dom7"]]
  ];
  const GIRI_MAG = [
    [[0, "M"], [5, "M"], [7, "dom7"], [0, "M"]],
    [[0, "M"], [9, "m"], [5, "M"], [7, "dom7"]],
    [[0, "M"], [4, "m"], [5, "M"], [7, "dom7"]],
    [[5, "M"], [1, "M", 1], [7, "dom7"], [0, "M"]]
  ];
  let coda = [], n = 0, last = 69 + (tonica % 12 > 4 ? tonica - 12 : tonica), chiuso = false, maggiore = false, centro = tonica;
  const max = o.battute || Infinity;
  const bpm = o.bpm || 64;
  function accordo() {
    if (!coda.length) {
      maggiore = !maggiore && Math.random() < 0.3;
      centro = maggiore ? (tonica + 3) % 12 : tonica;
      const giri = maggiore ? GIRI_MAG : GIRI_MIN;
      const g = pick(giri).concat(pick(giri));
      g.push([maggiore ? 9 : 0, "m"]);        // si torna sempre a casa, in minore
      g.forEach(([d, q, nap]) => coda.push({ root: (centro + d) % 12, q, nap: !!nap, centro, maggiore }));
    }
    return coda.shift();
  }
  return {
    next() {
      if (chiuso) return null;
      if (n >= max) {
        chiuso = true;
        const ev = [], b0 = basso(tonica, 33);
        [b0, b0 + 7, b0 + 12, b0 + 15, b0 + 19].forEach((m, i) => ev.push({ b: i * 0.25, d: 6, midi: m, vel: 0.4, mano: i < 2 ? "s" : "d" }));
        ev.push({ b: 1.4, d: 5, midi: vicino(last, [tonica]), vel: 0.45, mano: "d" });
        return { beats: 6, bpm: 54, ev };
      }
      const acc = accordo(); n++;
      const ev = [];
      const pcs = TONI[acc.q].map(x => (acc.root + x) % 12);
      // sesta napoletana: accordo maggiore sul secondo grado abbassato, col basso sulla terza
      const bassoNota = basso((acc.root + (acc.nap ? 4 : 0)) % 12, 38);
      const terza = acc.q === "m" ? 15 : 16;
      const arp = acc.nap ? [0, 5, 8, 12, 8, 5] : [0, 7, 12, terza, 12, 7];
      arp.forEach((x, i) => ev.push({ b: i * 0.5, d: 3 - i * 0.5, midi: bassoNota + x, vel: i ? 0.3 + Math.random() * 0.06 : 0.44, mano: "s" }));
      // melodia: note lunghe e sospiri (appoggiature che scendono)
      const chiave = acc.maggiore ? [0, 2, 4, 5, 7, 9, 11] : [0, 2, 3, 5, 7, 8, 11];
      const scala = acc.nap ? SCALE.M.map(x => (acc.root + x) % 12) : chiave.map(x => (acc.centro + x) % 12);
      const r = Math.random();
      if (r < 0.35) {
        const t1 = vicino(last + pick([-2, -1, 1, 2, 3]), pcs);
        const app = passo(t1, 1, scala);
        ev.push({ b: 0, d: 1, midi: app, vel: 0.58, mano: "d" }, { b: 1, d: 2, midi: t1, vel: 0.48, mano: "d" });
        last = t1;
      } else if (r < 0.62) {
        const t1 = vicino(last + pick([-3, -1, 2, 4]), pcs);
        ev.push({ b: 0, d: 2.5, midi: t1, vel: 0.56, mano: "d" });
        const m = passo(t1, -1, scala);
        ev.push({ b: 2.5, d: 0.5, midi: m, vel: 0.44, mano: "d" });
        last = m;
      } else if (r < 0.82) {
        let m = vicino(last, pcs);
        [0, 0.5, 1, 1.5].forEach((b, i) => { ev.push({ b, d: 0.45, midi: m, vel: 0.5 - i * 0.02, mano: "d" }); m = passo(m, i < 2 ? 1 : -1, scala); });
        const fine = vicino(m, pcs); ev.push({ b: 2, d: 1, midi: fine, vel: 0.5, mano: "d" }); last = fine;
      } else {
        const t1 = vicino(last + pick([-4, 3, 5]), pcs);
        ev.push({ b: 0, d: 3, midi: t1, vel: 0.52, mano: "d" }, { b: 0.02, d: 3, midi: vicino(t1 - 4, pcs.filter(p => p !== pcDi(t1))), vel: 0.38, mano: "d" });
        last = t1;
      }
      if (last > 84) last -= 12;
      if (last < 62) last += 12;
      return { beats: 3, bpm, ev, accordo: nomeAccordo(acc) + (acc.nap ? " (♭II6)" : "") };
    }
  };
}

// Tarantella: 6/8 veloce, motivi di terzine che si ripetono e seguono l'armonia
function genTarantella(o) {
  o = o || {};
  const tonica = pick([9, 2, 4]);
  const FORMA = [[0, "m"], [0, "m"], [7, "dom7"], [7, "dom7"], [7, "dom7"], [7, "dom7"], [0, "m"], [0, "m"],
                 [5, "iv"], [5, "iv"], [0, "m"], [0, "m"], [7, "dom7"], [7, "dom7"], [0, "m"], [0, "m"]];
  const INTERVALLI = { m: [0, 2, 3, 5, 7, 8, 11], iv: [0, 2, 3, 5, 7, 9, 10], dom7: [0, 1, 4, 5, 7, 8, 10] };
  const MOTIVI = [[4, 3, 2, 3, 4, 7], [0, 2, 4, 7, 4, 2], [7, 6, 4, 2, 4, 7], [4, 4, 4, 2, 3, 4], [7, 4, 2, 0, 2, 4], [2, 3, 4, 7, 9, 7], [9, 7, 4, 7, 4, 2]];
  let k = 0, n = 0, motivo = pick(MOTIVI), chiuso = false;
  const max = o.battute || Infinity;
  const bpm = o.bpm || 330;
  return {
    next() {
      if (chiuso) return null;
      if (n >= max) {
        chiuso = true;
        const b0 = basso(tonica, 36);
        let t = 60 + tonica; if (t < 64) t += 12;
        const ev = [{ b: 0, d: 5, midi: b0, vel: 0.7, mano: "s" }, { b: 0, d: 5, midi: b0 + 12, vel: 0.6, mano: "s" }];
        [0, 3, 7, 12].forEach((x, i) => ev.push({ b: 0.01 * i, d: 5, midi: t + x, vel: 0.7, mano: "d" }));
        return { beats: 6, bpm, ev, dr: o.batteria ? [{ b: 0, tipo: "cassa", vel: 1 }, { b: 0, tipo: "schiocco", vel: 0.8 }] : [] };
      }
      const [deg, q] = FORMA[k % FORMA.length];
      const acc = { root: (tonica + deg) % 12, q: q === "iv" ? "m" : q };
      k++; n++;
      if (k % 2 === 1 && Math.random() < 0.5) motivo = pick(MOTIVI);
      const ev = [], dr = [];
      const b0 = basso(acc.root, 36);
      ev.push({ b: 0, d: 1.2, midi: b0, vel: 0.62, mano: "s" }, { b: 3, d: 1.2, midi: k % 2 ? b0 + 7 : b0 + 12, vel: 0.56, mano: "s" });
      voicing({ root: acc.root, q: acc.q === "dom7" ? "dom7" : "m" }, 57, 50, 68).forEach(m => { ev.push({ b: 1.5, d: 0.5, midi: m, vel: 0.36, mano: "s" }, { b: 4.5, d: 0.5, midi: m, vel: 0.34, mano: "s" }); });
      const iv = INTERVALLI[q];
      let radice = 60 + acc.root; if (radice < 64) radice += 12;
      const ritmoLungo = Math.random() < 0.25;
      motivo.forEach((g, i) => {
        if (ritmoLungo && (i === 1 || i === 4)) return;
        const m = radice + iv[g % 7] + 12 * Math.floor(g / 7);
        const d = ritmoLungo && (i === 0 || i === 3) ? 1.8 : 0.85;
        ev.push({ b: i, d, midi: m, vel: (i % 3 === 0 ? 0.74 : 0.6) + Math.random() * 0.06, mano: "d" });
      });
      if (o.batteria) {
        dr.push({ b: 0, tipo: "cassa", vel: 0.9 }, { b: 3, tipo: "cassa", vel: 0.8 });
        [1, 2, 4, 5].forEach(b => dr.push({ b, tipo: "hh", vel: 0.5 }));
        dr.push({ b: 3, tipo: "schiocco", vel: 0.45 });
      }
      return { beats: 6, bpm, ev, dr, accordo: nomeAccordo(acc) };
    }
  };
}

// Il set del Piano Hot Club: cambia con l'atmosfera (0 soft ballad, 1 lounge swing con contrabbasso, 2 piano house)
function genClub(o) {
  o = o || {};
  const energia = typeof o.energia === "function" ? o.energia : () => 1;
  const giro = creaGiro(), sol = creaSolista(76, 66, 90), stato = { prevVoc: 60 };
  const HOUSE = [[[9, "m7"], [5, "maj7"], [7, "dom7"], [4, "m7"]], [[2, "m7"], [7, "dom7"], [0, "maj7"], [9, "m7"]], [[9, "m7"], [2, "m7"], [7, "dom7"], [0, "maj7"]]];
  let house = [], bassoUltimo = 40;
  const RITMI_SWING = [[0, 0.67, 1, 1.67, 2, 2.67, 3, 3.67], [0.67, 1, 1.67, 2.67, 3], [0, 1, 1.67, 2.67, 3, 3.67], [2, 2.67, 3, 3.67], [0, 0.67, 1.33, 2, 2.67, 3.33]];
  return {
    next() {
      const e = energia();
      const ev = [], dr = [];
      if (e >= 2) {
        if (!house.length) { const tk = giro.chiave; pick(HOUSE).forEach(([d, q]) => house.push({ root: (tk + d) % 12, q })); }
        const acc = house.shift();
        const v = voicing(acc, 66, 58, 80);
        [0, 0.75, 1.5, 2.5, 3.25].forEach((b, i) => v.forEach(m => ev.push({ b, d: 0.3, midi: m, vel: i === 0 ? 0.62 : 0.52, mano: "d" })));
        const b0 = basso(acc.root, 33);
        [0.5, 1.5, 2.5, 3.5].forEach((b, i) => ev.push({ b, d: 0.35, midi: i % 2 ? b0 + 12 : b0, vel: 0.62, mano: "s" }));
        for (let b = 0; b < 4; b++) { dr.push({ b, tipo: "cassa", vel: 0.95 }, { b: b + 0.5, tipo: "hho", vel: 0.55 }); dr.push({ b: b + 0.25, tipo: "hh", vel: 0.3 }, { b: b + 0.75, tipo: "hh", vel: 0.3 }); }
        dr.push({ b: 1, tipo: "schiocco", vel: 0.6 }, { b: 3, tipo: "schiocco", vel: 0.6 });
        return { beats: 4, bpm: 124, ev, dr, accordo: nomeAccordo(acc) };
      }
      const acc = giro.prendi(), prox = giro.guarda();
      if (e <= 0) {
        manoSinistraBallad(ev, acc, stato, 4);
        sol.suona(ev, acc, RITMI_BALLAD, 4, 0.48, prox);
        return { beats: 4, bpm: 76, ev, accordo: nomeAccordo(acc) };
      }
      // walking bass: fondamentale, due note di passaggio, avvicinamento cromatico alla prossima
      const r0 = vicino(bassoUltimo, [acc.root]);
      const tgt = vicino(r0 + pick([-5, 7, 5, -7, 2]), [prox.root]);
      const scala = SCALE[acc.q].map(x => (acc.root + x) % 12);
      let m = r0;
      const passi = [r0];
      const dir = tgt >= r0 ? 1 : -1;
      m = vicino(m + dir * 3, TONI[acc.q].map(x => (acc.root + x) % 12)); passi.push(m);
      m = passo(m, dir, scala); passi.push(m);
      passi.push(tgt + (Math.random() < 0.5 ? 1 : -1));
      passi.forEach((x, i) => { let y = x; while (y < 28) y += 12; while (y > 52) y -= 12; ev.push({ b: i, d: 0.92, midi: y, vel: i ? 0.55 : 0.62, mano: "s" }); });
      bassoUltimo = clamp(tgt, 31, 50);
      const v = voicing(acc, stato.prevVoc, 52, 74); stato.prevVoc = v.reduce((s, x) => s + x, 0) / v.length;
      const comp = pick([[1.67, 3], [0.67, 2.67], [1, 2.67], [1.67, 2.67, 3.67]]);
      comp.forEach(b => v.forEach(x => ev.push({ b, d: 0.42, midi: x, vel: 0.36, mano: "s" })));
      sol.suona(ev, acc, RITMI_SWING, 4, 0.55, prox);
      [0, 1, 2, 3].forEach(b => dr.push({ b, tipo: "ride", vel: 0.55 }));
      [1.67, 3.67].forEach(b => dr.push({ b, tipo: "ride", vel: 0.35 }));
      [1, 3].forEach(b => dr.push({ b, tipo: "hh", vel: 0.4 }, { b, tipo: "spazzola", vel: 0.5 }));
      [0, 2].forEach(b => dr.push({ b, tipo: "cassa", vel: 0.3 }));
      return { beats: 4, bpm: 116, ev, dr, accordo: nomeAccordo(acc) };
    }
  };
}

// ------------------------------------------------------------------ il programma
const REPERTORIO = {
  pianobar:   { titolo: "Piano bar dal vivo", sotto: "improvvisazione jazz, sempre diversa", tipo: "live", icona: "🍸", crea: genPianobar },
  notturno:   { titolo: "Notturno napoletano", sotto: "improvvisato in minore, con la sesta napoletana", tipo: "live", icona: "🌙", crea: genNotturno },
  tarantella: { titolo: "Tarantella", sotto: "improvvisata in 6/8, veloce", tipo: "live", icona: "💃", crea: genTarantella },
  gioia:      { titolo: "Inno alla gioia", sotto: "Beethoven, dalla Nona Sinfonia (1824)", tipo: "classico", icona: "🎼", crea: GIOIA },
  bach:       { titolo: "Preludio in Do maggiore", sotto: "J. S. Bach, BWV 846 (1722)", tipo: "classico", icona: "🎼", crea: BACH },
  elisa:      { titolo: "Per Elisa", sotto: "Beethoven, WoO 59 (1810)", tipo: "classico", icona: "🎼", crea: ELISA },
  gymnopedie: { titolo: "Gymnopédie n. 1", sotto: "Erik Satie (1888)", tipo: "classico", icona: "🎼", crea: GYMNO },
  club:       { titolo: "Il set del club", sotto: "cambia con l'atmosfera del locale", tipo: "club", icona: "🪩", crea: genClub, nascosto: true },
  fuga:       { titolo: "Tarantella della fuga", sotto: "scappa!", tipo: "club", icona: "🏃", crea: o => genTarantella({ ...o, bpm: 400, batteria: true }), nascosto: true }
};
// la "radio" del pulsante live: si alterna tra improvvisazioni e classici, per sempre
const SCALETTA_LIVE = ["pianobar", "notturno", "gioia", "pianobar", "gymnopedie", "tarantella", "pianobar", "bach", "notturno", "elisa"];
