/**
 * PINO SOPRANO — la voce (NOVITÀ DaProd): legge ad alta voce articoli e visite guidate
 * con la sintesi vocale del dispositivo (Web Speech API), preferendo una voce italiana.
 * Il testo viene spezzato in frasi brevi (alcuni browser si interrompono sulle frasi lunghe)
 * e per ogni frase si sa quale paragrafo evidenziare.
 */
"use strict";

const Voce = (() => {
  const ss = window.speechSynthesis;
  let voce = null, coda = [], pos = 0, stato = "fermo", opzioni = {}, generazione = 0, custode = null;

  const disponibile = () => !!ss && typeof SpeechSynthesisUtterance !== "undefined";

  function scegliVoce() {
    if (!disponibile()) return null;
    const tutte = ss.getVoices() || [];
    const it = tutte.filter(v => /^it([-_]|$)/i.test(v.lang));
    const preferite = [/google/i, /alice/i, /federica/i, /elsa/i, /isabella/i, /luca/i, /paola/i, /diego/i, /natural/i];
    for (const re of preferite) { const v = it.find(x => re.test(x.name)); if (v) return v; }
    return it[0] || null;
  }
  if (disponibile()) {
    voce = scegliVoce();
    if (ss.addEventListener) ss.addEventListener("voiceschanged", () => { voce = scegliVoce(); });
  }

  // "testo lungo" -> frasi da ~200 caratteri al massimo
  function frasi(testo) {
    const t = String(testo || "").replace(/\s+/g, " ").trim();
    if (!t) return [];
    const pezzi = t.match(/[^.!?…;:]+[.!?…;:]+["”»’)]*\s*|[^.!?…;:]+$/g) || [t];
    const out = [];
    let acc = "";
    for (let p of pezzi) {
      p = p.trim();
      if (!p) continue;
      while (p.length > 230) {
        let cut = p.lastIndexOf(",", 210);
        if (cut < 80) cut = p.lastIndexOf(" ", 210);
        if (cut < 40) cut = 210;
        out.push(p.slice(0, cut + 1).trim());
        p = p.slice(cut + 1).trim();
      }
      if ((acc + " " + p).length < 200) acc = (acc ? acc + " " : "") + p;
      else { if (acc) out.push(acc); acc = p; }
    }
    if (acc) out.push(acc);
    return out.filter(x => /[\p{L}\p{N}]/u.test(x));
  }

  // parti: [{ testo, el }]  →  la voce legge in ordine ed evidenzia el
  function leggi(parti, opz) {
    if (!disponibile()) return false;
    ferma(true);
    opzioni = opz || {};
    coda = [];
    parti.forEach((p, i) => frasi(p.testo).forEach(f => coda.push({ f, el: p.el, parte: i })));
    if (!coda.length) return false;
    pos = 0; stato = "parla";
    const gen = ++generazione;
    // Chrome a volte "si addormenta" sulle letture lunghe: un colpetto ogni 10 s lo tiene sveglio
    clearInterval(custode);
    custode = setInterval(() => { if (stato === "parla" && ss.speaking && !ss.paused) { ss.pause(); ss.resume(); } }, 10000);
    prossima(gen);
    return true;
  }

  function prossima(gen) {
    if (gen !== generazione || stato === "fermo") return;
    if (pos >= coda.length) { finito(); return; }
    const c = coda[pos];
    const u = new SpeechSynthesisUtterance(c.f);
    u.lang = voce ? voce.lang : "it-IT";
    if (voce) u.voice = voce;
    u.rate = opzioni.vel || 1;
    u.pitch = opzioni.tono || 1;
    u.onstart = () => { if (gen === generazione && opzioni.onFrase) opzioni.onFrase(c, pos, coda.length); };
    u.onend = () => { if (gen !== generazione) return; pos++; prossima(gen); };
    u.onerror = e => {
      if (gen !== generazione) return;
      if (e && (e.error === "interrupted" || e.error === "canceled")) return;
      pos++; prossima(gen);
    };
    ss.speak(u);
  }

  function finito() {
    stato = "fermo";
    clearInterval(custode);
    const f = opzioni.onFine;
    opzioni = {};
    if (f) f();
  }

  function pausa() { if (stato === "parla") { ss.pause(); stato = "pausa"; } }
  function riprendi() { if (stato === "pausa") { ss.resume(); stato = "parla"; } }
  function ferma(silenzioso) {
    generazione++;
    clearInterval(custode);
    const eraAttivo = stato !== "fermo";
    stato = "fermo";
    if (disponibile()) { try { ss.cancel(); } catch (e) { /* niente */ } }
    const f = opzioni.onStop;
    opzioni = {};
    if (eraAttivo && !silenzioso && f) f();
  }
  function velocita(v) { opzioni.vel = v; }

  return { disponibile, leggi, pausa, riprendi, ferma, velocita, frasi, stato: () => stato, nomeVoce: () => (voce ? voce.name : "") };
})();
