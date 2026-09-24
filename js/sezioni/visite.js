/**
 * PINO SOPRANO — il lettore delle visite guidate (NOVITÀ DaProd)
 * Schede dei percorsi, poi una finestra a tutto schermo tappa per tappa: linea del tempo, racconto,
 * contesto storico, citazione testuale in oro, azioni (apri articolo, galleria, brano…).
 * Può raccontare a voce, suonare il pianoforte sotto e andare avanti da sola.
 */
"use strict";

const Visite = (() => {
  let visita = null, tappa = 0, voceOn = false, musicaOn = false, autoOn = false, timerAuto = null, pianoMio = false;

  const progressi = () => Memoria.get("visite", {});
  function salvaProgresso() {
    const p = progressi();
    p[visita.id] = Math.max(p[visita.id] || 0, tappa + 1);
    Memoria.set("visite", p);
  }

  function renderGriglia() {
    const p = progressi();
    $("visite-griglia").innerHTML = VISITE.map(v => {
      const fatte = Math.min(p[v.id] || 0, v.tappe.length);
      const anni = v.tappe.map(t => t.anno);
      return `<button class="vs-card ${v.colore}" data-visita="${v.id}">
        <span class="vs-ico">${v.icona}</span>
        <b>${escapeHtml(v.titolo)}</b>
        <small>${escapeHtml(v.sottotitolo)}</small>
        <span class="vs-linea">${anni.slice(0, 5).map(a => `<i>${escapeHtml(a)}</i>`).join("")}${anni.length > 5 ? "<i>…</i>" : ""}</span>
        <span class="vs-piede"><span>${v.tappe.length} tappe</span><span class="vs-barra"><i style="width:${Math.round((fatte / v.tappe.length) * 100)}%"></i></span><span class="vs-vai">${fatte ? (fatte >= v.tappe.length ? "Rifai ↻" : "Riprendi →") : "Inizia →"}</span></span>
      </button>`;
    }).join("");
  }

  // ------------------------------------------------------------------ la finestra
  function apri(id, da) {
    const v = VISITE.find(x => x.id === id);
    if (!v) return;
    Classico.closeArticle();
    visita = v;
    const p = progressi()[id] || 0;
    tappa = da != null ? clamp(da, 0, v.tappe.length - 1) : (p > 0 && p < v.tappe.length ? p - 1 : 0);
    const box = $("visita");
    box.hidden = false;
    box.className = "visita " + v.colore;
    document.body.classList.add("bloccato");
    $("vt-percorso").textContent = "✦ VISITA GUIDATA · " + v.titolo.toUpperCase();
    $("vt-linea").innerHTML = v.tappe.map((t, i) => `<button class="vt-punto" data-tappa-vai="${i}" title="${escapeHtml(t.titolo)}"><i></i><span>${escapeHtml(t.anno)}</span></button>`).join("");
    mostra();
    if (musicaOn) avviaMusica();
  }

  function chiudi() {
    if (!visita) return;
    fermaTutto();
    if (pianoMio && Esecutore.fonte() === "visita") Esecutore.ferma();
    pianoMio = false;
    Piano.attenua(false);
    $("visita").hidden = true;
    visita = null;
    if (!$("article-overlay").classList.contains("open")) document.body.classList.remove("bloccato");
    renderGriglia();
  }

  function fermaTutto() {
    clearTimeout(timerAuto);
    if (voceOn) Voce.ferma(true);
  }

  function citazioneHtml(c) {
    const chi = c.di === "pino" ? "Parole di Pino" : "Dalle sue pagine";
    return `<figure class="vt-citazione ${c.di === "pino" ? "sua" : ""}">
      <figcaption>❝ ${chi}</figcaption>
      <blockquote>${escapeHtml(c.testo).replace(/\n/g, "<br>")}</blockquote>
      <cite>${escapeHtml(c.fonte)}</cite></figure>`;
  }

  function mostra() {
    fermaTutto();
    const t = visita.tappe[tappa], n = visita.tappe.length;
    $("vt-contatore").textContent = `Tappa ${tappa + 1} di ${n}`;
    $$(".vt-punto").forEach((b, i) => { b.classList.toggle("on", i === tappa); b.classList.toggle("fatto", i < tappa); });
    const on = $$(".vt-punto")[tappa];
    if (on) on.scrollIntoView({ block: "nearest", inline: "center", behavior: riduciMovimento() ? "auto" : "smooth" });
    $("vt-sfondo").style.backgroundImage = t.img ? `url("${t.img.replace(/"/g, "%22")}")` : "none";
    const media = t.img
      ? `<figure class="vt-media"><img src="${escapeHtml(t.img)}" alt="${escapeHtml(t.didascalia || t.titolo)}" data-zoom><figcaption>${escapeHtml(t.didascalia || "")}</figcaption></figure>`
      : `<div class="vt-media vt-icona"><span>${t.icona || visita.icona}</span></div>`;
    const azioni = (t.azioni || []).map((a, i) => `<button class="chip ${a.tipo === "articolo" || a.tipo === "galleria" ? "oro" : "neon"}" data-azione="${i}">${iconaAzione(a)} ${escapeHtml(a.label)}</button>`).join("");
    $("vt-corpo").innerHTML = `
      <div class="vt-griglia fade-in">
        ${media}
        <div class="vt-testo">
          <div class="vt-anno">${escapeHtml(t.anno)}</div>
          <h3 class="vt-titolo" id="vt-titolo">${escapeHtml(t.titolo)}</h3>
          <p class="vt-racconto">${escapeHtml(t.testo)}</p>
          ${t.contesto ? `<div class="vt-contesto"><b>📅 Intanto, nel mondo</b><p>${escapeHtml(t.contesto)}</p></div>` : ""}
          ${t.citazione ? citazioneHtml(t.citazione) : ""}
          ${azioni ? `<div class="vt-azioni">${azioni}</div>` : ""}
        </div>
      </div>`;
    $("vt-corpo").scrollTop = 0;
    $("vt-prec").disabled = tappa === 0;
    $("vt-succ").innerHTML = tappa === n - 1 ? "Fine della visita ✓" : "Tappa successiva →";
    salvaProgresso();
    if (voceOn) racconta();
    else if (autoOn) timerAuto = setTimeout(avanti, clamp(testoTappa(t).length * 55, 9000, 30000));
  }

  const iconaAzione = a => ({ articolo: "📖", galleria: "🖼", sezione: "➜", brano: "🎹", visita: "🧭" }[a.tipo] || "✦");
  function testoTappa(t) {
    let s = `${t.anno}. ${t.titolo}. ${t.testo}`;
    if (t.contesto) s += ` Intanto, nel mondo: ${t.contesto}`;
    if (t.citazione) s += ` ${t.citazione.di === "pino" ? "Dalle sue parole" : "Dalle sue pagine"}: ${t.citazione.testo.replace(/\n/g, " ")}`;
    return s;
  }
  function racconta() {
    const t = visita.tappe[tappa];
    const ok = Voce.leggi([{ testo: testoTappa(t) }], {
      vel: 1,
      onFine: () => { if (autoOn && visita) timerAuto = setTimeout(avanti, 1600); }
    });
    if (!ok) { voceOn = false; aggiornaPulsanti(); toast("Voce non disponibile", "Il tuo browser non ha la sintesi vocale.", "rosso", "🔇"); }
    if (ok && musicaOn) Piano.attenua(true);
  }

  function avanti() {
    if (!visita) return;
    if (tappa < visita.tappe.length - 1) { tappa++; mostra(); }
    else { const fine = visita.titolo; chiudi(); toast("Visita completata", fine, "", "🧭"); }
  }
  function indietro() { if (visita && tappa > 0) { tappa--; mostra(); } }

  function avviaMusica() {
    Piano.sblocca();
    if (Esecutore.attivo()) return;
    Esecutore.suona(visita.musica || "notturno", { fonte: "visita" });
    pianoMio = true;
    if (voceOn) Piano.attenua(true);
  }

  function aggiornaPulsanti() {
    $("vt-voce").setAttribute("aria-pressed", String(voceOn));
    $("vt-musica").setAttribute("aria-pressed", String(musicaOn));
    $("vt-auto").setAttribute("aria-pressed", String(autoOn));
  }

  function eseguiAzione(a) {
    if (a.tipo === "articolo") { const i = Classico.indiceDaSlug(a.slug); if (i >= 0) { fermaTutto(); Classico.openArticle(i); } }
    else if (a.tipo === "galleria") {
      if (a.slug === "ricetta-caso") { const r = scegli(RECIPES); Classico.openGallery(r.images, r.name); return; }
      const g = GALLERIES.find(x => x.slug === a.slug);
      if (g) Classico.openGallery(g.images, g.name);
    } else if (a.tipo === "sezione") {
      chiudi(); Classico.navigateTo(a.id);
      if (a.ancora) setTimeout(() => { const el = $(a.ancora); if (el) el.scrollIntoView({ behavior: "smooth" }); }, 400);
    } else if (a.tipo === "brano") {
      Esecutore.suona(a.id, { fonte: "visita" }); pianoMio = true; musicaOn = true; aggiornaPulsanti();
      if (voceOn) Piano.attenua(true);
      toast("In sala suona: " + REPERTORIO[a.id].titolo, REPERTORIO[a.id].sotto, "mag", "🎹");
    } else if (a.tipo === "visita") apri(a.id, 0);
  }

  function avvia() {
    renderGriglia();
    document.addEventListener("click", e => {
      const b = e.target.closest("[data-visita]");
      if (b) { e.preventDefault(); apri(b.dataset.visita, b.dataset.tappa != null ? parseInt(b.dataset.tappa, 10) : null); return; }
      const p = e.target.closest("[data-tappa-vai]");
      if (p && visita) { tappa = parseInt(p.dataset.tappaVai, 10); mostra(); return; }
      const az = e.target.closest("[data-azione]");
      if (az && visita) { eseguiAzione(visita.tappe[tappa].azioni[parseInt(az.dataset.azione, 10)]); return; }
      const z = e.target.closest("[data-zoom]");
      if (z && visita) Classico.openLightbox([z.getAttribute("src")], 0, visita.tappe[tappa].didascalia || "");
    });
    $("vt-chiudi").onclick = chiudi;
    $("vt-succ").onclick = avanti;
    $("vt-prec").onclick = indietro;
    $("vt-voce").onclick = () => {
      voceOn = !voceOn; aggiornaPulsanti();
      if (voceOn) { Piano.sblocca(); racconta(); } else { Voce.ferma(true); Piano.attenua(false); }
    };
    $("vt-musica").onclick = () => {
      musicaOn = !musicaOn; aggiornaPulsanti();
      if (musicaOn) avviaMusica();
      else { if (Esecutore.fonte() === "visita" || pianoMio) Esecutore.ferma(); pianoMio = false; Piano.attenua(false); }
    };
    $("vt-auto").onclick = () => {
      autoOn = !autoOn; aggiornaPulsanti();
      clearTimeout(timerAuto);
      if (autoOn && !voceOn) timerAuto = setTimeout(avanti, 9000);
    };
    document.addEventListener("keydown", e => {
      if (!visita || $("article-overlay").classList.contains("open") || $("lightbox").classList.contains("open")) return;
      if (e.key === "Escape") chiudi();
      else if (e.key === "ArrowRight") avanti();
      else if (e.key === "ArrowLeft") indietro();
    });
    // swipe tra le tappe
    let sx = null, sy = null;
    $("vt-corpo").addEventListener("touchstart", e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    $("vt-corpo").addEventListener("touchend", e => {
      if (sx == null) return;
      const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy; sx = null;
      if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.5) { if (dx < 0) avanti(); else indietro(); }
    });
    Bus.on("sezione", d => { if (d.nuova === "visite") renderGriglia(); });
  }

  return { avvia, apri, chiudi, aperta: () => (visita ? visita.id : null), tappa: () => tappa };
})();
