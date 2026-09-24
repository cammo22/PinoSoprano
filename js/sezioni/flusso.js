/**
 * PINO SOPRANO — Scorri all'infinito (NOVITÀ DaProd)
 *
 * Un flusso che non finisce mai: articoli interi, "pillole" (un paragrafo scelto da un articolo),
 * poesie, ricette e foto delle serate. I consigli pesano quello che hai già letto (meno),
 * quello che non hai letto (di più) e le categorie degli articoli che ti sono piaciuti (♥).
 * Quando le schede nuove finiscono si ricomincia con altri paragrafi: c'è sempre qualcosa da scoprire.
 */
"use strict";

const Flusso = (() => {
  let filtro = "tutto", mostrati = 0, osservatore = null, paragrafi = null, usatiP = new Set(), usatiA = new Set(), ultimoCat = null;
  const PAGINA = 6;

  // tutti i paragrafi "da pillola" di tutti gli articoli (calcolati una volta sola, al primo uso)
  function preparaParagrafi() {
    if (paragrafi) return paragrafi;
    paragrafi = [];
    ARTICLES.forEach((a, i) => {
      testoSemplice(a.content).split(/\n+/).map(t => t.trim()).forEach((t, k) => {
        if (t.length < 110 || t.length > 520) return;
        if (/https?:|www\.|©|fonte:|link:|tratto da|traduzione/i.test(t)) return;
        if ((t.match(/[A-ZÀ-Ý]/g) || []).length > t.length * 0.4) return;     // niente paragrafi tutti in maiuscolo
        paragrafi.push({ i, k, t });
      });
    });
    return paragrafi;
  }

  function pesoArticolo(a, letti, catAmate) {
    let w = 1;
    if (!letti.has(a.slug)) w *= 3.2; else w *= 0.35;
    if (catAmate[a.category]) w *= 1 + Math.min(2.5, catAmate[a.category] * 0.8);
    if (a.category === ultimoCat) w *= 0.45;                                   // varietà
    if ((a.content || "").length < 60) w *= 0.15;
    return w;
  }
  function categorieAmate() {
    const p = new Set(Memoria.get("piaciuti", [])), c = {};
    ARTICLES.forEach(a => { if (p.has(a.slug)) c[a.category] = (c[a.category] || 0) + 1; });
    return c;
  }
  function estrai(lista, peso) {
    const tot = lista.reduce((s, x) => s + peso(x), 0);
    let r = Math.random() * tot;
    for (const x of lista) { r -= peso(x); if (r <= 0) return x; }
    return lista[lista.length - 1];
  }

  // ordine consigliato di articoli (per la radio): non letti prima, categorie amate avanti
  function consigliati(n) {
    const letti = new Set(Memoria.get("letti", [])), amate = categorieAmate();
    const pool = ARTICLES.map((a, i) => ({ a, i })).filter(x => testoSemplice(x.a.content).length > 400);
    const out = [];
    while (out.length < n && pool.length) {
      const x = estrai(pool, y => pesoArticolo(y.a, letti, amate));
      out.push(x.i); pool.splice(pool.indexOf(x), 1); ultimoCat = x.a.category;
    }
    return out;
  }

  function prossimoArticolo(soloPoesia) {
    const letti = new Set(Memoria.get("letti", [])), amate = categorieAmate();
    let pool = ARTICLES.map((a, i) => ({ a, i })).filter(x => !usatiA.has(x.i) && (!soloPoesia || x.a.category === "poesia"));
    if (!pool.length) { if (soloPoesia) ARTICLES.forEach((a, i) => { if (a.category === "poesia") usatiA.delete(i); }); else usatiA.clear(); pool = ARTICLES.map((a, i) => ({ a, i })).filter(x => !soloPoesia || x.a.category === "poesia"); }
    const x = estrai(pool, y => pesoArticolo(y.a, letti, amate));
    usatiA.add(x.i); ultimoCat = x.a.category;
    return x.i;
  }
  function prossimaPillola() {
    const P = preparaParagrafi();
    const amate = categorieAmate();
    let pool = P.filter((p, j) => !usatiP.has(j));
    if (!pool.length) { usatiP.clear(); pool = P; }
    const p = estrai(pool, x => (amate[ARTICLES[x.i].category] ? 2.2 : 1) * (ARTICLES[x.i].category === ultimoCat ? 0.5 : 1));
    usatiP.add(P.indexOf(p)); ultimoCat = ARTICLES[p.i].category;
    return p;
  }

  // ------------------------------------------------------------------ schede
  function schedaArticolo(i) {
    const a = ARTICLES[i];
    const letti = new Set(Memoria.get("letti", []));
    const thumb = Classico.getArticleThumb(a);
    const testo = testoSemplice(a.content);
    const minuti = Math.max(1, Math.round(testo.split(/\s+/).length / 200));
    const col = CAT_COLORS[a.category] || "#8b5e3c";
    return `<article class="fl-card fl-articolo fade-in" data-articolo="${i}">
      ${thumb ? `<img class="fl-img" src="${escapeHtml(thumb)}" alt="" loading="lazy" onerror="this.remove()">` : ""}
      <div class="fl-corpo">
        <div class="fl-meta"><span class="cat-badge" style="background:${col}">${escapeHtml(CAT_DISPLAY[a.category] || a.category)}</span>
          <span>${formatDate(a.date)} · ${minuti} min</span>${letti.has(a.slug) ? '<span class="fl-letto">già letto</span>' : '<span class="fl-nuovo">✦ nuovo per te</span>'}</div>
        <h3>${escapeHtml(titoloPulito(a.title))}</h3>
        <p>${escapeHtml(testo.slice(0, 260))}${testo.length > 260 ? "…" : ""}</p>
        <div class="fl-azioni"><span class="fl-leggi">Leggi o ascolta →</span></div>
      </div></article>`;
  }
  function schedaPillola(p) {
    const a = ARTICLES[p.i];
    return `<article class="fl-card fl-pillola fade-in" data-articolo="${p.i}">
      <div class="fl-virg">❝</div>
      <blockquote>${escapeHtml(p.t)}</blockquote>
      <div class="fl-fonte">da <b>${escapeHtml(titoloPulito(a.title))}</b> · ${formatDate(a.date)}</div>
      <div class="fl-azioni"><span class="fl-tag">✦ pillola</span><span class="fl-leggi">Leggi tutto →</span></div></article>`;
  }
  function schedaFoto() {
    if (Math.random() < 0.55) {
      const r = scegli(RECIPES.filter(x => x.thumb));
      return `<article class="fl-card fl-foto fade-in" data-ricetta="${RECIPES.indexOf(r)}">
        <img src="${escapeHtml(r.thumb)}" alt="${escapeHtml(r.name)}" loading="lazy" onerror="this.closest('.fl-card').remove()">
        <div class="fl-foto-txt"><small>Dalla sua cucina</small><b>${escapeHtml(r.name)}</b><span>${r.images.length} foto →</span></div></article>`;
    }
    const g = scegli(GALLERIES.filter(x => x.thumb));
    return `<article class="fl-card fl-foto fade-in" data-galleria="${GALLERIES.indexOf(g)}">
      <img src="${escapeHtml(g.thumb)}" alt="${escapeHtml(g.name)}" loading="lazy" onerror="this.closest('.fl-card').remove()">
      <div class="fl-foto-txt"><small>Le serate al pianoforte</small><b>${escapeHtml(g.name)}</b><span>apri la galleria →</span></div></article>`;
  }
  function schedaTappa() {
    const v = scegli(VISITE);
    const t = scegli(v.tappe.filter(x => x.contesto));
    return `<article class="fl-card fl-tappa fade-in" data-visita="${v.id}" data-tappa="${v.tappe.indexOf(t)}">
      <div class="fl-meta"><span class="fl-tag">✦ lo sapevi?</span><span>${escapeHtml(t.anno)}</span></div>
      <h3>${escapeHtml(t.titolo)}</h3><p>${escapeHtml(t.contesto)}</p>
      <div class="fl-azioni"><span class="fl-leggi">Continua la visita «${escapeHtml(v.titolo)}» →</span></div></article>`;
  }

  function prossimaScheda(n) {
    if (filtro === "articoli") return schedaArticolo(prossimoArticolo());
    if (filtro === "pillole") return schedaPillola(prossimaPillola());
    if (filtro === "poesia") return schedaArticolo(prossimoArticolo(true));
    const r = n % 7;
    if (r === 0 || r === 3 || r === 5) return schedaArticolo(prossimoArticolo());
    if (r === 1 || r === 4) return schedaPillola(prossimaPillola());
    if (r === 2) return schedaFoto();
    return schedaTappa();
  }

  function carica() {
    const box = $("flusso");
    let html = "";
    for (let k = 0; k < PAGINA; k++) html += prossimaScheda(mostrati++);
    box.insertAdjacentHTML("beforeend", html);
    // non lasciamo crescere il DOM all'infinito: le schede molto sopra si tolgono (e la pagina non salta)
    let tolto = 0;
    const gap = parseFloat(getComputedStyle(box).rowGap) || 0;
    while (box.children.length > 90) { const el = box.firstElementChild; tolto += el.getBoundingClientRect().height + gap; el.remove(); }
    if (tolto) window.scrollBy(0, -tolto);
    const letti = Memoria.get("letti", []).length;
    $("flusso-stato").textContent = `${mostrati} schede · ${letti}/${ARTICLES.length} articoli letti`;
    // su schermi alti la sentinella può restare visibile: l'osservatore non riscatta, quindi si riempie da qui
    if (carica.giri > 0) { carica.giri--; requestAnimationFrame(riempi); }
  }
  carica.giri = 0;
  function riempi() {
    if (Classico.sezione() !== "flusso") return;
    if ($("flusso-sentinella").getBoundingClientRect().top < window.innerHeight + 900) carica();
    else carica.giri = 0;
  }
  function caricaEAccoda() { carica.giri = 4; carica(); }

  function ricomincia() {
    $("flusso").innerHTML = "";
    mostrati = 0; usatiA.clear();
    caricaEAccoda();
  }

  function avvia() {
    $("flusso-filtri").addEventListener("click", e => {
      const b = e.target.closest("[data-filtro]");
      if (!b) return;
      filtro = b.dataset.filtro;
      $$("#flusso-filtri .chip").forEach(x => x.classList.toggle("on", x === b));
      ricomincia();
    });
    $("bRadioFlusso").onclick = () => Ascolta.avviaRadio();
    Bus.on("sezione", d => { if (d.nuova === "flusso" && !$("flusso").children.length) caricaEAccoda(); });
    if ("IntersectionObserver" in window) {
      osservatore = new IntersectionObserver(voci => { if (voci.some(v => v.isIntersecting) && Classico.sezione() === "flusso") caricaEAccoda(); }, { rootMargin: "900px 0px" });
      osservatore.observe($("flusso-sentinella"));
    } else {
      window.addEventListener("scroll", () => {
        if (Classico.sezione() !== "flusso") return;
        if ($("flusso-sentinella").getBoundingClientRect().top < innerHeight + 900) carica();
      }, { passive: true });
    }
  }

  return { avvia, carica, consigliati, schede: () => mostrati };
})();
