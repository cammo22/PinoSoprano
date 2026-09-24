/**
 * PINO SOPRANO — l'esecutore (NOVITÀ DaProd): il "pianista invisibile" che legge il repertorio.
 *
 * Genera le battute qualche secondo in anticipo (così la Sala può far cadere le note prima che suonino),
 * le programma sull'orologio audio con precisione e tiene la lista degli eventi per chi li disegna:
 * la cascata di note della Sala, i tasti dell'intestazione, il pianista del club.
 * Un solo brano alla volta per tutto il sito: il pulsante 🎹 live, la Sala, le visite e il club lo condividono.
 */
"use strict";

const Esecutore = (() => {
  const ANTICIPO = 3.4;
  // con la scheda nascosta i timer rallentano a 1 s: si programma più avanti per non avere buchi
  const programma = () => (document.hidden ? 1.6 : 0.18);
  let brano = null;           // { id, def, gen, opz }
  let eventi = [], batt = [], battiti = [];
  let tempoGen = 0, fineGen = null, timer = null, velocita = 1, accordo = "";
  let scaletta = null, posScaletta = 0;

  function suona(id, opz) {
    opz = opz || {};
    const def = REPERTORIO[id];
    if (!def || !Piano.sblocca()) return false;
    ferma(true);
    brano = { id, def, gen: def.crea(opz), opz };
    if (!opz.scaletta) scaletta = null;
    eventi = []; batt = []; battiti = []; fineGen = null; accordo = "";
    tempoGen = Piano.ora() + 0.12;
    timer = setInterval(tick, 40);
    tick();
    Bus.emit("brano", { id, titolo: def.titolo, sotto: def.sotto, fonte: opz.fonte || "" });
    return true;
  }

  // la radio infinita del pulsante live
  function radio(fonte) {
    scaletta = SCALETTA_LIVE.slice(); posScaletta = Math.floor(Math.random() * 3);
    return prossimaScaletta(fonte || "live");
  }
  function prossimaScaletta(fonte) {
    const id = scaletta[posScaletta % scaletta.length]; posScaletta++;
    const battute = REPERTORIO[id].tipo === "live" ? 24 + Math.floor(Math.random() * 12) : undefined;
    return suona(id, { scaletta: true, fonte, battute });
  }

  function tick() {
    if (!brano) return;
    const now = Piano.ora(), PROGRAMMA = programma();
    let giri = 0;
    while (fineGen == null && tempoGen < now + ANTICIPO && giri++ < 16) {
      const b = brano.gen.next();
      if (!b) { fineGen = tempoGen; break; }
      const spb = 60 / (b.bpm * velocita);
      for (const e of b.ev) eventi.push({ midi: e.midi, t: tempoGen + e.b * spb, dur: Math.max(0.06, e.d * spb), vel: e.vel, mano: e.mano, fatto: false });
      if (b.dr) for (const d of b.dr) batt.push({ t: tempoGen + d.b * spb, tipo: d.tipo, vel: d.vel, fatto: false });
      if (b.accordo) eventi.push({ accordo: b.accordo, t: tempoGen, fatto: false });
      const passoBattito = b.beats === 6 ? 3 : 1;
      for (let k = 0; k < b.beats; k += passoBattito) battiti.push(tempoGen + k * spb);
      if (battiti.length > 48) battiti.splice(0, battiti.length - 48);
      tempoGen += b.beats * spb;
    }
    for (const e of eventi) {
      if (e.fatto || e.t > now + PROGRAMMA) continue;
      e.fatto = true;
      if (e.accordo) { const a = e.accordo; setTimeout(() => { accordo = a; Bus.emit("accordo", a); }, Math.max(0, (e.t - now) * 1000)); continue; }
      if (e.t < now - 0.25) continue;          // meglio saltare che fare una valanga di note in ritardo
      Piano.suona(e.midi, e.vel, e.t, e.dur, { mano: e.mano });
    }
    for (const d of batt) {
      if (d.fatto || d.t > now + PROGRAMMA) continue;
      d.fatto = true;
      if (d.t >= now - 0.1) Piano.batteria(d.tipo, d.t, d.vel);
    }
    if (eventi.length > 600) eventi = eventi.filter(e => !e.fatto || e.t + (e.dur || 0) > now - 2);
    if (batt.length > 300) batt = batt.filter(d => !d.fatto);
    if (fineGen != null && now > fineGen + 1.2) {
      const fonte = brano.opz.fonte;
      if (scaletta) prossimaScaletta(fonte);
      else { ferma(); Bus.emit("fineBrano", { fonte }); }
    }
  }

  function ferma(silenzioso) {
    if (timer) clearInterval(timer);
    timer = null;
    const c = Piano.contesto();
    if (brano && c) {
      // lascia finire morbido le note già partite, cancella quelle future
      eventi = eventi.filter(e => e.t <= c.currentTime);
    }
    const eraAttivo = !!brano;
    brano = null; batt = []; fineGen = null; accordo = "";
    if (!silenzioso) { scaletta = null; Piano.zittisci(); }
    if (eraAttivo && !silenzioso) Bus.emit("brano", null);
  }

  return {
    suona, radio, ferma,
    attivo: () => (brano ? brano.id : null),
    titolo: () => (brano ? brano.def.titolo : ""),
    fonte: () => (brano ? brano.opz.fonte || "" : ""),
    inRadio: () => !!scaletta,
    eventi: () => eventi,
    // tempo dall'ultimo battito (in secondi) e durata del battito: per far ballare luci e pubblico
    battito: () => {
      const now = Piano.ora();
      let ultimo = null, prossimo = null;
      for (const t of battiti) { if (t <= now) ultimo = t; else if (prossimo == null) prossimo = t; }
      return ultimo == null ? null : { da: now - ultimo, durata: prossimo != null ? prossimo - ultimo : 0.5 };
    },
    accordo: () => accordo,
    velocita: v => { if (v) velocita = clamp(v, 0.5, 1.6); return velocita; }
  };
})();
