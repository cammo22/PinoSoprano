/**
 * PINO SOPRANO — ascoltare gli articoli (NOVITÀ DaProd)
 *  - nella finestra dell'articolo: 🔊 Ascolta, pausa, stop, velocità, pianoforte di sottofondo, ♡ mi piace
 *    (il paragrafo che la voce sta leggendo si illumina e resta al centro dello schermo)
 *  - Radio articoli: la voce legge un articolo dopo l'altro, scelti come nel flusso infinito
 */
"use strict";

const Ascolta = (() => {
  let indice = null, conPiano = Memoria.get("ascoltaPiano", false), pianoMio = false, evidenziato = null;
  let radio = null;           // { ordine: [indici], pos }

  const ARTICOLO_BLOCCHI = "p, h1, h2, h3, h4, h5, li, blockquote, pre, td, figcaption";

  function blocchi() {
    const c = $("article-content");
    const tutti = $$(ARTICOLO_BLOCCHI, c).filter(el => !el.parentElement.closest(ARTICOLO_BLOCCHI));
    const parti = tutti.map(el => ({ testo: testoSemplice(el.innerHTML), el })).filter(p => p.testo.length > 1);
    if (!parti.length) parti.push({ testo: testoSemplice(c.innerHTML), el: c });
    return parti;
  }

  function intestazione(a) {
    return `${titoloPulito(a.title).toLowerCase().replace(/(^|[.!?]\s+)(\p{L})/gu, (m, p, l) => p + l.toUpperCase())}. Pubblicato il ${dataLunga(a.date)}.`;
  }

  function stato(t) { $("asc-stato").textContent = t || ""; }
  function pulsanti(parla) {
    $("asc-play").innerHTML = parla ? "🔊 In ascolto…" : "🔊 Ascolta";
    $("asc-play").disabled = !!parla;
    $("asc-pausa").disabled = !parla;
    $("asc-stop").disabled = !parla;
    $("asc-pausa").innerHTML = Voce.stato() === "pausa" ? "▶ Riprendi" : "❚❚ Pausa";
  }

  function evidenzia(el) {
    if (evidenziato && evidenziato !== el) evidenziato.classList.remove("leggendo");
    evidenziato = el;
    if (!el || !el.classList) return;
    el.classList.add("leggendo");
    if ($("article-overlay").classList.contains("open") && el.id !== "article-content") el.scrollIntoView({ behavior: riduciMovimento() ? "auto" : "smooth", block: "center" });
  }
  function pulisci() { if (evidenziato) evidenziato.classList.remove("leggendo"); evidenziato = null; }

  function pianoSotto(on) {
    if (on) {
      if (!Esecutore.attivo()) { Esecutore.suona(Math.random() < 0.6 ? "notturno" : "pianobar", { fonte: "voce" }); pianoMio = true; }
      Piano.attenua(true);
    } else {
      Piano.attenua(false);
      if (pianoMio && Esecutore.fonte() === "voce") Esecutore.ferma();
      pianoMio = false;
    }
  }

  // ------------------------------------------------------------------ l'articolo aperto
  function leggiAperto() {
    if (indice == null || !Voce.disponibile()) return;
    fermaRadio(true);
    const a = ARTICLES[indice];
    const parti = [{ testo: intestazione(a), el: $("article-title") }].concat(blocchi());
    const ok = Voce.leggi(parti, {
      vel: parseFloat($("asc-vel").value) || 1,
      onFrase: (c, i, n) => { evidenzia(c.el); stato(`${Math.round(((i + 1) / n) * 100)}%`); },
      onFine: () => { fine(); stato("Fine. Grazie per aver ascoltato."); },
      onStop: fine
    });
    if (!ok) { stato("Niente da leggere qui."); return; }
    if (conPiano) pianoSotto(true);
    pulsanti(true);
    stato(Voce.nomeVoce() ? "voce: " + Voce.nomeVoce() : "in ascolto");
  }
  function fine() { pulisci(); pulsanti(false); if (!radio) pianoSotto(false); }

  function preparaArticolo(index) {
    if (!radio) { Voce.ferma(true); fine(); }
    indice = index;
    const a = ARTICLES[index];
    const piaciuti = Memoria.get("piaciuti", []);
    const ok = Voce.disponibile();
    $("asc-play").disabled = !ok;
    $("asc-piano").setAttribute("aria-pressed", String(conPiano));
    $("asc-cuore").setAttribute("aria-pressed", String(piaciuti.includes(a.slug)));
    $("asc-cuore").innerHTML = piaciuti.includes(a.slug) ? "♥ Ti piace" : "♡ Mi piace";
    pulsanti(false);
    stato(ok ? (radio ? "📻 radio articoli in corso" : "") : "La lettura a voce non è disponibile su questo browser.");
  }

  // ------------------------------------------------------------------ radio articoli
  function avviaRadio(ordine) {
    if (!Voce.disponibile()) { toast("Radio articoli", "La lettura a voce non è disponibile su questo browser.", "rosso", "📻"); return; }
    radio = { ordine: ordine && ordine.length ? ordine : Flusso.consigliati(30), pos: 0 };
    $("radio").hidden = false;
    pianoSotto(true);
    leggiRadio();
    toast("Radio articoli accesa", "Un articolo dopo l'altro, col pianoforte sotto.", "", "📻");
  }
  function leggiRadio() {
    if (!radio) return;
    if (radio.pos >= radio.ordine.length) radio.ordine = radio.ordine.concat(Flusso.consigliati(30));
    const i = radio.ordine[radio.pos];
    const a = ARTICLES[i];
    $("radio-titolo").textContent = titoloPulito(a.title);
    const corpo = testoSemplice(fixImmaginiVia(a.content || "")).split(/\n+/).map(t => ({ testo: t }));
    const annuncio = radio.pos === 0 ? "Radio articoli. " : "Articolo successivo. ";
    Voce.leggi([{ testo: annuncio + intestazione(a) }].concat(corpo), {
      vel: parseFloat($("asc-vel").value) || 1,
      onFine: () => { if (!radio) return; segnaLetto(a.slug); radio.pos++; setTimeout(leggiRadio, 900); },
      onStop: () => {}
    });
  }
  const fixImmaginiVia = html => html.replace(/<img[^>]*>/gi, " ");
  function segnaLetto(slug) { const l = Memoria.get("letti", []); if (!l.includes(slug)) { l.push(slug); Memoria.set("letti", l); } }
  function saltaRadio() { if (!radio) return; Voce.ferma(true); radio.pos++; leggiRadio(); }
  function fermaRadio(silenzioso) {
    if (!radio) return;
    radio = null;
    $("radio").hidden = true;
    if (!silenzioso) { Voce.ferma(true); pianoSotto(false); }
  }
  function apriRadio() { if (radio) Classico.openArticle(radio.ordine[radio.pos]); }

  // ------------------------------------------------------------------ collegamenti
  function avvia() {
    Bus.on("articolo", d => preparaArticolo(d.index));
    Bus.on("articoloChiuso", () => { if (!radio) { Voce.ferma(true); fine(); } });
    $("asc-play").onclick = () => { Piano.sblocca(); leggiAperto(); };
    $("asc-pausa").onclick = () => { if (Voce.stato() === "pausa") Voce.riprendi(); else Voce.pausa(); pulsanti(true); };
    $("asc-stop").onclick = () => { Voce.ferma(); fine(); stato(""); };
    $("asc-vel").onchange = () => { if (Voce.stato() !== "fermo" && !radio) leggiAperto(); };
    $("asc-piano").onclick = () => {
      conPiano = !conPiano; Memoria.set("ascoltaPiano", conPiano);
      $("asc-piano").setAttribute("aria-pressed", String(conPiano));
      if (Voce.stato() !== "fermo") pianoSotto(conPiano);
    };
    $("asc-cuore").onclick = () => {
      if (indice == null) return;
      const a = ARTICLES[indice], p = Memoria.get("piaciuti", []);
      const k = p.indexOf(a.slug);
      if (k >= 0) p.splice(k, 1); else p.push(a.slug);
      Memoria.set("piaciuti", p);
      preparaArticolo(indice);
      if (k < 0) toast("Ti piace!", "Il flusso infinito ti proporrà più pensieri come questo.", "mag", "♥");
    };
    $("bRadioBlog").onclick = () => avviaRadio();
    $("radio-salta").onclick = saltaRadio;
    $("radio-stop").onclick = () => fermaRadio(false);
    $("radio-apri").onclick = apriRadio;
  }

  return { avvia, avviaRadio, fermaRadio, inRadio: () => !!radio };
})();
