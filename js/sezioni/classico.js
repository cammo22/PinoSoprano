/**
 * PINO SOPRANO — il sito originale: navigazione, citazioni, carosello, articoli, ricette, gallerie, lightbox.
 * È la stessa logica che prima stava dentro index.html, riordinata e resa più robusta
 * (niente più array di percorsi dentro gli onclick, deep link con #sezione, didascalie nel lightbox).
 */
"use strict";

// ============================================================ CITAZIONI (ogni 15 s)
const HERO_QUOTES = [
  "La neutralità aiuta sempre l'oppressore, mai la vittima. Il silenzio incoraggia sempre il torturatore, mai il torturato.",
  "Una vita senza ricerca non è degna di essere vissuta. — Platone",
  "Finché non hai amato un animale, una parte della tua anima rimarrà sempre senza luce.",
  "La grandezza di una nazione e il suo progresso morale si possono giudicare dal modo in cui tratta gli animali. — Gandhi",
  "Nulla darà la possibilità di sopravvivenza sulla Terra quanto l'evoluzione verso una dieta vegetariana. — Einstein",
  "La musica è la lingua dello spirito. La sua segreta corrente vibra tra il cuore di colui che canta e l'anima di colui che ascolta.",
  "Quando la verità viene sepolta sotto terra, cresce e si accumula, ed acquista un tale potere esplosivo che il giorno in cui scoppia, fa saltare tutto.",
  "Non ho paura della cattiveria dei malvagi, ma del silenzio degli onesti. — Martin Luther King",
  "Cucinare è un atto d'amore. Ogni piatto racconta una storia, ogni sapore è un ricordo.",
  "Il vero viaggio di scoperta non consiste nel cercare nuove terre, ma nell'avere nuovi occhi. — Marcel Proust",
  "La filosofia non è solo pensiero, è il coraggio di vivere secondo ciò che si pensa.",
  "Ogni nota al pianoforte è un respiro dell'anima, ogni melodia un frammento di eternità."
];

const CAT_COLORS = {
  "filosofia-religione": "#7b68ae", "informazione": "#3a8fb7", "alimentazione": "#5a9e6f", "amore-sensibilita": "#c75b7a",
  "palestina-israele": "#b8860b", "poesia": "#c49a6c", "ambiente-animali": "#2e8b57", "musica": "#cd5c5c", "senza-categoria": "#999"
};
const CAT_ICONS = {
  "filosofia-religione": "\u{1f4d6}", "informazione": "\u{1f4f0}", "alimentazione": "\u{1f331}", "amore-sensibilita": "\u{2764}",
  "palestina-israele": "\u{1f54a}", "poesia": "\u{270d}", "ambiente-animali": "\u{1f33f}", "musica": "\u{1f3b9}", "senza-categoria": "\u{1f4dd}"
};
const SEZIONI = ["home", "blog", "flusso", "visite", "sala", "ricette", "pianista", "chi-sono", "piano-hot"];

const Classico = (() => {
  let sezioneAttuale = "home";
  const navHistory = ["home"];
  let categoria = "all";
  let lbImmagini = [], lbIndice = 0, lbDidascalie = null;
  let quoteIdx = 0;

  // ============================================================ NAVIGAZIONE
  function navigateTo(section, skipHistory) {
    if (!SEZIONI.includes(section)) section = "home";
    const vecchia = sezioneAttuale;
    if (!skipHistory && navHistory[navHistory.length - 1] !== section) navHistory.push(section);
    $$(".page-section").forEach(s => s.classList.toggle("active", s.id === "section-" + section));
    $$(".main-nav a").forEach(a => a.classList.toggle("active", a.dataset.section === section));
    const isHome = section === "home";
    $("hero").style.display = isHome ? "" : "none";
    $("main-nav").classList.remove("open");
    $("nav-back").style.display = isHome ? "none" : "flex";
    $("nav-back-mobile").classList.toggle("show", !isHome);
    sezioneAttuale = section;
    document.body.dataset.sezione = section;
    try { history.replaceState(null, "", isHome ? location.pathname + location.search : "#" + section); } catch (e) { /* file:// */ }
    window.scrollTo({ top: 0, behavior: riduciMovimento() ? "auto" : "smooth" });
    if (vecchia !== section) Bus.emit("sezione", { nuova: section, vecchia });
  }

  function goBack() {
    if (navHistory.length > 1) { navHistory.pop(); navigateTo(navHistory[navHistory.length - 1], true); }
    else navigateTo("home", true);
  }

  // ============================================================ CITAZIONI
  function rotateQuote() {
    const el = $("hero-quote");
    if (!el) return;
    el.classList.add("fading");
    setTimeout(() => {
      quoteIdx = (quoteIdx + 1) % HERO_QUOTES.length;
      el.textContent = "“" + HERO_QUOTES[quoteIdx] + "”";
      el.classList.remove("fading");
    }, 800);
  }

  // ============================================================ CAROSELLO
  const CAROUSEL_DURATION = 15000;
  let pool = [], usati = new Set(), mostrati = [], rafId = null, t0 = 0;

  function buildCarouselPool() {
    const p = [];
    ARTICLES.forEach((a, i) => {
      const plain = testoSemplice(a.content);
      const excerpt = plain.substring(0, 150).trim();
      if (excerpt.length > 30) p.push({ type: "article", index: i, title: a.title, excerpt: excerpt + (plain.length > 150 ? "..." : ""), date: a.date, category: a.category });
    });
    RECIPES.forEach(r => { if (r.thumb) p.push({ type: "recipe", name: r.name, image: r.thumb, images: r.images }); });
    GALLERIES.forEach(g => { if (g.thumb) p.push({ type: "gallery", name: g.name, image: g.thumb, images: g.images }); });
    return p;
  }

  function getRandomItems(count) {
    if (usati.size > pool.length - count - 5) usati.clear();
    const disponibili = pool.map((item, i) => i).filter(i => !usati.has(i));
    const scelti = shuffleArray(disponibili).slice(0, count);
    scelti.forEach(i => usati.add(i));
    return scelti.map(i => pool[i]);
  }

  function renderCarouselItem(item, i) {
    if (item.type === "article") {
      const cat = CAT_DISPLAY[item.category] || item.category;
      return `<div class="carousel-item carousel-item--article" data-ci="${i}">
        <div><div class="ci-type">${escapeHtml(cat)}</div><div class="ci-title">${escapeHtml(item.title)}</div><div class="ci-excerpt">${escapeHtml(item.excerpt)}</div></div>
        <div class="ci-date">${formatDate(item.date)}</div></div>`;
    }
    const label = item.type === "recipe" ? "Ricetta" : "Galleria";
    return `<div class="carousel-item carousel-item--image" data-ci="${i}">
      <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" loading="lazy" onerror="this.parentElement.style.display='none'">
      <div class="ci-overlay"><div class="ci-label">${label}</div><div class="ci-name">${escapeHtml(item.name)}</div></div></div>`;
  }

  function cycleCarousel() {
    const track = $("carousel-track");
    if (!track) return;
    mostrati = getRandomItems(8);
    track.innerHTML = mostrati.map(renderCarouselItem).join("");
    t0 = performance.now();
    if (rafId) cancelAnimationFrame(rafId);
    const tick = now => {
      const fill = $("carousel-timer-fill");
      const pct = Math.max(0, 1 - (now - t0) / CAROUSEL_DURATION);
      if (fill) fill.style.transform = `scaleX(${pct})`;
      if (pct > 0) rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
  }

  // ============================================================ ARTICOLI
  function renderCategoryTabs() {
    const counts = {};
    ARTICLES.forEach(a => { counts[a.category] = (counts[a.category] || 0) + 1; });
    let html = `<button class="cat-tab active" data-cat="all">Tutti <span class="count">(${ARTICLES.length})</span></button>`;
    Object.entries(counts).sort((a, b) => b[1] - a[1]).forEach(([cat, n]) => {
      html += `<button class="cat-tab" data-cat="${cat}">${escapeHtml(CAT_DISPLAY[cat] || cat)} <span class="count">(${n})</span></button>`;
    });
    $("category-tabs").innerHTML = html;
  }

  function setCategory(cat) {
    categoria = cat;
    $$(".cat-tab").forEach(t => t.classList.toggle("active", t.dataset.cat === cat));
    renderArticles();
  }

  function getArticleThumb(a) {
    const c = a.content || "";
    const img = c.match(/<img[^>]+src=["']([^"']+)["']/);
    if (img) return img[1];
    const md = c.match(/!\[[^\]]*\]\(([^)]+)\)/);
    return md ? md[1] : null;
  }

  function renderArticles() {
    const search = ($("article-search").value || "").toLowerCase();
    const grid = $("articles-grid");
    const letti = new Set(Memoria.get("letti", []));
    const filtrati = ARTICLES.filter(a => {
      if (categoria !== "all" && a.category !== categoria) return false;
      if (search && !a.title.toLowerCase().includes(search) && !(a.categories || []).join(" ").toLowerCase().includes(search)) return false;
      return true;
    });
    if (!filtrati.length) { grid.innerHTML = '<div class="no-results">Nessun articolo trovato</div>'; return; }
    grid.innerHTML = filtrati.map((a, i) => {
      const thumb = getArticleThumb(a);
      const color = CAT_COLORS[a.category] || "#8b5e3c";
      const catName = (CAT_DISPLAY[a.category] || a.category).split("&")[0].trim();
      const icon = CAT_ICONS[a.category] || "";
      const idx = ARTICLES.indexOf(a);
      return `<div class="article-card fade-in" style="animation-delay:${Math.min(i * 20, 200)}ms" data-articolo="${idx}">
        ${letti.has(a.slug) ? '<span class="letto" title="Già letto">✓ LETTO</span>' : ""}
        ${thumb ? `<img class="article-thumb" src="${escapeHtml(thumb)}" alt="" loading="lazy" onerror="this.outerHTML='<div class=article-thumb-placeholder>${icon}</div>'">` : `<div class="article-thumb-placeholder">${icon}</div>`}
        <div class="article-body"><span class="cat-badge" style="background:${color}">${escapeHtml(catName)}</span>
        <span class="title">${escapeHtml(titoloPulito(a.title))}</span><span class="date">${formatDate(a.date)}</span></div></div>`;
    }).join("");
  }

  function fixMarkdownImages(html) {
    return html.replace(/!?\[!?([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (match, alt, url) => {
      if (/\.(jpe?g|png|gif|webp)$/i.test(url) || url.includes("assets/")) return `<img src="${url}" alt="${escapeHtml(alt)}" loading="lazy">`;
      if (/^https?:\/\//.test(url)) return `<a href="${url}" target="_blank" rel="noopener">${alt || url}</a>`;
      return match;
    });
  }

  function indiceDaSlug(slug) { return ARTICLES.findIndex(a => a.slug === slug); }

  function openArticle(index) {
    const a = ARTICLES[index];
    if (!a) return;
    $("article-meta").textContent = `${formatDate(a.date)} — ${(a.categories || []).join(", ")}`;
    $("article-title").textContent = a.title;
    let content = a.content || `<p style="font-style:italic">Contenuto non disponibile. <a href="${a.link}" target="_blank" rel="noopener">Leggi sul sito originale</a></p>`;
    $("article-content").innerHTML = fixMarkdownImages(content);
    const prec = index + 1 < ARTICLES.length ? index + 1 : null, succ = index > 0 ? index - 1 : null;
    $("articolo-piede").innerHTML =
      (a.link ? `<a class="btn oro piccolo" href="${a.link}" target="_blank" rel="noopener">Leggi sul blog originale ↗</a>` : "") +
      (prec != null ? `<button class="chip neon" data-articolo="${prec}">← più vecchio</button>` : "") +
      (succ != null ? `<button class="chip neon" data-articolo="${succ}">più recente →</button>` : "") +
      `<button class="chip neon" data-articolo-caso>🎲 un altro a caso</button>`;
    const ov = $("article-overlay");
    ov.classList.add("open");
    ov.scrollTop = 0;
    document.body.classList.add("bloccato");
    const letti = Memoria.get("letti", []);
    if (!letti.includes(a.slug)) { letti.push(a.slug); Memoria.set("letti", letti); }
    Bus.emit("articolo", { index, articolo: a });
  }

  function closeArticle() {
    if (!$("article-overlay").classList.contains("open")) return;
    $("article-overlay").classList.remove("open");
    if ($("visita").hidden && !$("lightbox").classList.contains("open")) document.body.classList.remove("bloccato");
    Bus.emit("articoloChiuso");
    if (sezioneAttuale === "blog") renderArticles();
  }

  // ============================================================ RICETTE / GALLERIE / PIANO HOT
  function renderRecipes() {
    $("recipe-grid").innerHTML = RECIPES.map((r, i) => `
      <div class="recipe-card" data-ricetta="${i}">
        <img class="recipe-img" src="${escapeHtml(r.thumb)}" alt="${escapeHtml(r.name)}" loading="lazy" onerror="this.style.visibility='hidden'">
        <div class="recipe-info"><div class="recipe-name">${escapeHtml(r.name)}</div><div class="recipe-sub">${r.images.length} foto</div></div>
      </div>`).join("");
  }
  function filterRecipes() {
    const s = ($("recipe-search").value || "").toLowerCase();
    $$("#recipe-grid .recipe-card").forEach(c => { c.style.display = !s || c.querySelector(".recipe-name").textContent.toLowerCase().includes(s) ? "" : "none"; });
  }
  function renderGalleries() {
    $("gallery-grid").innerHTML = GALLERIES.map((g, i) => `
      <div class="gallery-card" data-galleria="${i}">
        <img class="gallery-img" src="${escapeHtml(g.thumb)}" alt="${escapeHtml(g.name)}" loading="lazy" onerror="this.style.visibility='hidden'">
        <div class="gallery-info"><div class="gallery-name">${escapeHtml(g.name)}</div><div class="gallery-sub">${g.images.length} foto</div></div>
      </div>`).join("");
  }
  function renderPianoHot() {
    $("piano-hot-grid").innerHTML = PIANO_HOT.map((img, i) => `
      <div class="gallery-card" data-hot="${i}">
        <img class="gallery-img" src="${escapeHtml(img)}" alt="Piano ${i + 1}" loading="lazy" onerror="this.style.visibility='hidden'">
        <div class="gallery-info"><div class="gallery-name">Piano ${i + 1}</div></div>
      </div>`).join("");
  }

  // ============================================================ LIGHTBOX
  function openLightbox(images, index, didascalie) {
    lbImmagini = images; lbIndice = index || 0; lbDidascalie = didascalie || null;
    mostraLb();
    $("lightbox").classList.add("open");
    document.body.classList.add("bloccato");
  }
  function mostraLb() {
    $("lb-img").src = lbImmagini[lbIndice];
    const d = lbDidascalie ? (Array.isArray(lbDidascalie) ? lbDidascalie[lbIndice] : lbDidascalie) : "";
    $("lb-didascalia").textContent = d ? d + (lbImmagini.length > 1 ? `  ·  ${lbIndice + 1}/${lbImmagini.length}` : "") : "";
    $("lb-prec").style.display = $("lb-succ").style.display = lbImmagini.length > 1 ? "" : "none";
  }
  function closeLightbox() {
    if (!$("lightbox").classList.contains("open")) return;
    $("lightbox").classList.remove("open");
    if (!$("article-overlay").classList.contains("open") && $("visita").hidden) document.body.classList.remove("bloccato");
  }
  function navLightbox(dir) {
    lbIndice = (lbIndice + dir + lbImmagini.length) % lbImmagini.length;
    mostraLb();
  }
  function openGallery(images, title) { openLightbox(images, 0, title); }

  // ============================================================ EVENTI
  function collega() {
    // navigazione
    $$(".main-nav a, .site-logo").forEach(a => a.addEventListener("click", e => { e.preventDefault(); navigateTo(a.dataset.section); }));
    $("nav-back").onclick = goBack;
    $("nav-back-mobile").onclick = goBack;
    $("nav-toggle").onclick = () => $("main-nav").classList.toggle("open");
    document.addEventListener("click", e => {
      const vai = e.target.closest("[data-vai]");
      if (vai) {
        e.preventDefault();
        closeArticle();
        navigateTo(vai.dataset.vai);
        if (vai.dataset.ancora) setTimeout(() => { const el = $(vai.dataset.ancora); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); }, 350);
        return;
      }
      const art = e.target.closest("[data-articolo]");
      if (art) { openArticle(parseInt(art.dataset.articolo, 10)); return; }
      if (e.target.closest("[data-articolo-caso]")) { openArticle(Math.floor(Math.random() * ARTICLES.length)); return; }
      const ci = e.target.closest("[data-ci]");
      if (ci) {
        const it = mostrati[parseInt(ci.dataset.ci, 10)];
        if (!it) return;
        if (it.type === "article") openArticle(it.index); else openGallery(it.images, it.name);
        return;
      }
      const ric = e.target.closest("[data-ricetta]");
      if (ric) { const r = RECIPES[+ric.dataset.ricetta]; openGallery(r.images, r.name); return; }
      const gal = e.target.closest("[data-galleria]");
      if (gal) { const g = GALLERIES[+gal.dataset.galleria]; openGallery(g.images, g.name); return; }
      const hot = e.target.closest("[data-hot]");
      if (hot) { openLightbox(PIANO_HOT, +hot.dataset.hot, PIANO_HOT.map((_, i) => "Piano " + (i + 1))); return; }
      const tab = e.target.closest(".cat-tab");
      if (tab) setCategory(tab.dataset.cat);
    });
    $("article-search").addEventListener("input", renderArticles);
    $("recipe-search").addEventListener("input", filterRecipes);
    $("article-chiudi").onclick = closeArticle;
    $("article-overlay").addEventListener("click", e => { if (e.target === e.currentTarget) closeArticle(); });

    // lightbox (anche con lo swipe)
    $("lb-chiudi").onclick = closeLightbox;
    $("lb-prec").onclick = () => navLightbox(-1);
    $("lb-succ").onclick = () => navLightbox(1);
    $("lightbox").addEventListener("click", e => { if (e.target === e.currentTarget) closeLightbox(); });
    let sx = null;
    $("lightbox").addEventListener("touchstart", e => { sx = e.touches[0].clientX; }, { passive: true });
    $("lightbox").addEventListener("touchend", e => {
      if (sx == null) return;
      const dx = e.changedTouches[0].clientX - sx; sx = null;
      if (Math.abs(dx) > 50 && lbImmagini.length > 1) navLightbox(dx < 0 ? 1 : -1);
    });

    document.addEventListener("keydown", e => {
      if (e.key === "Escape") { closeLightbox(); closeArticle(); }
      if ($("lightbox").classList.contains("open")) {
        if (e.key === "ArrowLeft") navLightbox(-1);
        if (e.key === "ArrowRight") navLightbox(1);
      }
    });
    window.addEventListener("hashchange", () => {
      const h = location.hash.slice(1);
      if (SEZIONI.includes(h) && h !== sezioneAttuale) navigateTo(h);
    });
  }

  function avvia() {
    collega();
    renderCategoryTabs();
    renderArticles();
    renderRecipes();
    renderGalleries();
    $("about-text").innerHTML = ABOUT_HTML;
    const q = $("hero-quote");
    if (q) { q.textContent = "“" + HERO_QUOTES[0] + "”"; setInterval(rotateQuote, 15000); }
    pool = buildCarouselPool();
    cycleCarousel();
    setInterval(() => { if (sezioneAttuale === "home" && !document.hidden) cycleCarousel(); }, CAROUSEL_DURATION);
  }

  // da chiamare quando tutte le sezioni sono pronte: apre il link diretto (#sala, #visite…)
  function apriDaIndirizzo() {
    const h = location.hash.slice(1);
    if (SEZIONI.includes(h) && h !== "home") navigateTo(h, false);
    else Bus.emit("sezione", { nuova: sezioneAttuale, vecchia: null });
  }

  return {
    avvia, apriDaIndirizzo, navigateTo, goBack, openArticle, closeArticle, openGallery, openLightbox, closeLightbox, renderArticles, renderPianoHot,
    indiceDaSlug, fixMarkdownImages, getArticleThumb, sezione: () => sezioneAttuale
  };
})();
