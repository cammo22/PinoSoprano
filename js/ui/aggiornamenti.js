/**
 * PINO SOPRANO — aggiornamenti (metodo DaProd)
 * Sul web (GitHub Pages) rilegge index.html senza cache: se la costante VERSIONE pubblicata è più
 * nuova di quella in esecuzione, propone di ricaricare. Da file:// non fa niente.
 */
"use strict";

const Aggiornamenti = (() => {
  let trovata = null, ultimoControllo = 0;

  // "v2.1.0" > "v2.0.9" ?
  function piuNuova(a, b) {
    const pa = String(a).replace(/^v/, "").split(".").map(Number), pb = String(b).replace(/^v/, "").split(".").map(Number);
    for (let i = 0; i < 3; i++) if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) > (pb[i] || 0);
    return false;
  }

  async function controlla(aMano) {
    if (!location.protocol.startsWith("http")) return;
    if (!aMano && Date.now() - ultimoControllo < 10 * 60 * 1000) return;
    ultimoControllo = Date.now();
    try {
      const r = await fetch("index.html?controllo=" + Date.now(), { cache: "no-store" });
      if (!r.ok) return;
      const m = (await r.text()).match(/const VERSIONE = '(v\d+\.\d+\.\d+)'/);
      if (m && piuNuova(m[1], VERSIONE)) { trovata = m[1]; mostra(); }
    } catch (e) { /* offline: pazienza */ }
  }

  function mostra() {
    const b = $("aggiorna");
    if (!trovata) { b.hidden = true; return; }
    b.hidden = false;
    b.innerHTML = `🆕 È online la <b>${trovata}</b> del sito! <button class="btn oro piccolo" id="aggVai">🔄 Aggiorna ora</button> <button class="chip" id="aggNo">più tardi</button>`;
    $("aggVai").onclick = () => location.replace(location.pathname + "?v=" + trovata.replace(/^v/, "") + location.hash);
    $("aggNo").onclick = () => { b.hidden = true; };
  }

  function avvia() {
    setTimeout(() => controlla(false), 8000);
    setInterval(() => controlla(false), 15 * 60 * 1000);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) controlla(false); });
  }

  return { avvia, controlla, piuNuova };
})();
