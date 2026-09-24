/**
 * PINO SOPRANO — utilità comuni: DOM, testo, date, memoria locale, notifiche
 */
"use strict";

const $ = id => document.getElementById(id);
const $$ = (sel, radice) => Array.from((radice || document).querySelectorAll(sel));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const casuale = (a, b) => a + Math.random() * (b - a);
const intero = (a, b) => Math.floor(casuale(a, b + 1));
const scegli = arr => arr[Math.floor(Math.random() * arr.length)];
const riduciMovimento = () => window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
const tocco = () => window.matchMedia && matchMedia("(pointer: coarse)").matches;

function escapeHtml(text) {
  return String(text == null ? "" : text).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// "2011-05-01" -> "1 Mag 2011"
function formatDate(dateStr) {
  if (!dateStr || dateStr === "0000-00-00") return "";
  const mesi = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];
  const p = dateStr.split("-");
  return p.length === 3 ? `${parseInt(p[2], 10)} ${mesi[parseInt(p[1], 10) - 1]} ${p[0]}` : dateStr;
}
function dataLunga(dateStr) {
  const mesi = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
  const p = (dateStr || "").split("-");
  return p.length === 3 ? `${parseInt(p[2], 10)} ${mesi[parseInt(p[1], 10) - 1]} ${p[0]}` : dateStr;
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// HTML dell'articolo -> testo semplice (senza immagini markdown né link grezzi)
function testoSemplice(html) {
  return String(html || "")
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n").replace(/<\/(p|div|h\d|li|blockquote)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/!?\[!?([^\]]*)\]\(([^)]*)\)/g, "$1")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&#8217;/g, "’").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/[*_#>|]{1,}/g, " ")
    .replace(/[ \t]+/g, " ").replace(/\s*\n\s*/g, "\n").trim();
}

// Titolo pulito: niente "..." finali e niente maiuscolo urlato per la voce
function titoloPulito(t) { return String(t || "").replace(/\.{3,}$/, "").replace(/…$/, "").replace(/^[–-]\s*|\s*[–-]$/g, "").trim(); }

// ---------- memoria locale (mai indispensabile: se non c'è, il sito funziona uguale) ----------
const Memoria = (() => {
  const P = "pinoSoprano_";
  const cache = {};
  return {
    get(k, def) {
      if (k in cache) return cache[k];
      try { const v = localStorage.getItem(P + k); cache[k] = v == null ? def : JSON.parse(v); } catch (e) { cache[k] = def; }
      return cache[k];
    },
    set(k, v) { cache[k] = v; try { localStorage.setItem(P + k, JSON.stringify(v)); } catch (e) { /* niente */ } }
  };
})();

// ---------- notifiche ----------
function toast(titolo, testo, tipo, icona) {
  const box = $("toasts");
  if (!box) return;
  const t = document.createElement("div");
  t.className = "toast " + (tipo || "");
  t.innerHTML = `<span class="t-ico">${icona || "✦"}</span><div><b>${escapeHtml(titolo)}</b>${testo ? `<small>${escapeHtml(testo)}</small>` : ""}</div>`;
  box.appendChild(t);
  requestAnimationFrame(() => t.classList.add("on"));
  setTimeout(() => { t.classList.remove("on"); setTimeout(() => t.remove(), 400); }, 4200);
  while (box.children.length > 4) box.firstChild.remove();
}

// esegue f appena il DOM è pronto (gli script sono caricati dinamicamente)
function pronto(f) { if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", f); else f(); }

// Evento globale semplice: Bus.on("nota", f) / Bus.emit("nota", dati)
const Bus = (() => {
  const m = {};
  return {
    on(n, f) { (m[n] = m[n] || []).push(f); },
    off(n, f) { m[n] = (m[n] || []).filter(x => x !== f); },
    emit(n, d) { (m[n] || []).forEach(f => { try { f(d); } catch (e) { console.error(e); } }); }
  };
})();
