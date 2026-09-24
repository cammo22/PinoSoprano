// Controlli automatici del sito di Pino Soprano (revamp DaProd).
//
//   npm i --no-save playwright && npx playwright install chromium && node test/prove.mjs
//
// Apre il sito in un browser vero (Chromium headless) su computer e telefono e verifica:
// avvio senza errori, contenuti originali intatti, navigazione e link diretti, articoli e ascolto,
// visite guidate (ogni citazione deve comparire TESTUALMENTE negli articoli, ogni immagine deve esistere),
// flusso infinito, pianoforte (tutti i brani suonano davvero), Sala, Piano Hot Club, eventi e fuga,
// impaginazione da telefono senza scorrimento orizzontale. Salva le foto in test/.out/.
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { avviaServer } from './servi.mjs';

const OUT = new URL('./.out/', import.meta.url).pathname;
await mkdir(OUT, { recursive: true });
const { server, url } = await avviaServer(Number(process.env.PORT) || undefined);
let ok = 0, ko = 0;
const T = (nome, cond, extra = '') => {
  if (cond) { ok++; console.log('  ✔', nome, extra); }
  else { ko++; console.log('  ✘', nome, extra); }
};
const browser = await chromium.launch({ args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });

async function nuovaPagina(opz = {}, percorso = '') {
  const ctx = await browser.newContext(opz);
  await ctx.route(/fonts\.(googleapis|gstatic)\.com|youtube\.com|ytimg\.com/, r => r.abort());
  const page = await ctx.newPage();
  const errori = [];
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errori.push(m.text()); });
  page.on('pageerror', e => errori.push(String(e)));
  await page.goto(url + percorso);
  await page.waitForFunction(() => window.PS && PS.pronto, null, { timeout: 30000, polling: 100 });
  return { ctx, page, errori };
}
const ev = (page, f, a) => page.evaluate(f, a);
const aspetta = ms => new Promise(r => setTimeout(r, ms));

// ============================================================ COMPUTER
console.log('\n== COMPUTER ==');
{
  const { ctx, page, errori } = await nuovaPagina({ viewport: { width: 1366, height: 860 } });
  const VER = await ev(page, () => PS.VERSIONE);
  T('versione nella testata', (await page.locator('.logo-sotto .versione').textContent()) === VER, VER);
  T('marchio DaProd nel piè di pagina', await page.locator('footer svg.logoDP').count() === 1);
  T('legenda oro/neon in home', await page.locator('#section-home .legenda .leg.oro').isVisible() && await page.locator('#section-home .legenda .leg.neon').isVisible());

  // --- contenuti originali intatti ---
  const conti = await ev(page, () => ({ a: ARTICLES.length, r: RECIPES.length, g: GALLERIES.length, p: PIANO_HOT.length, about: ABOUT_HTML.includes('Classe 1965') }));
  T('contenuti originali: 97 articoli, 77 ricette, 19 gallerie, 99 foto', conti.a === 97 && conti.r === 77 && conti.g === 19 && conti.p === 99 && conti.about, JSON.stringify(conti));
  T('carosello con 8 elementi', await page.locator('#carousel-track > *').count() === 8);
  await page.screenshot({ path: OUT + 'computer-home.png' });

  // --- articoli ---
  await page.click('.main-nav a[data-section="blog"]');
  T('griglia con tutti gli articoli', await page.locator('#articles-grid .article-card').count() === 97);
  await page.click('.cat-tab[data-cat="poesia"]');
  T('filtro categoria Poesia', await page.locator('#articles-grid .article-card').count() === 9);
  await page.click('.cat-tab[data-cat="all"]');
  await page.fill('#article-search', 'mozzarella');
  T('ricerca negli articoli', await page.locator('#articles-grid .article-card').count() === 1);
  await page.fill('#article-search', '');
  await page.locator('#articles-grid .article-card').first().click();
  T('articolo aperto in finestra', await page.locator('#article-overlay.open').count() === 1);
  T('barra Ascolta (novità) presente', await page.locator('#ascolta-barra #asc-play').isVisible());
  const voce = await ev(page, () => PS.Voce.disponibile());
  T('pulsante Ascolta coerente con la sintesi vocale', (await page.locator('#asc-play').isDisabled()) === !voce, 'voce: ' + voce);
  T('frasi spezzate per la voce', await ev(page, () => PS.Voce.frasi('Uno. Due, tre! ' + 'parola '.repeat(80)).every(f => f.length <= 235)));
  T('articolo segnato come letto', await ev(page, () => PS.Memoria.get('letti', []).length) === 1);
  await page.click('#asc-cuore');
  T('♡ mi piace salvato', await ev(page, () => PS.Memoria.get('piaciuti', []).length) === 1);
  await page.click('#articolo-piede [data-articolo]');
  T('articolo successivo dal piè di pagina', await ev(page, () => PS.Memoria.get('letti', []).length) === 2);
  await page.keyboard.press('Escape');
  T('Esc chiude l\'articolo', await page.locator('#article-overlay.open').count() === 0);
  T('badge "letto" sulle schede', await page.locator('#articles-grid .article-card .letto').count() >= 1);

  // --- ricette, gallerie, lightbox ---
  await page.click('.main-nav a[data-section="ricette"]');
  T('77 ricette', await page.locator('#recipe-grid .recipe-card').count() === 77);
  await page.locator('#recipe-grid .recipe-card').first().click();
  T('lightbox aperto con didascalia', await page.locator('#lightbox.open').count() === 1 && (await page.locator('#lb-didascalia').textContent()).length > 0);
  await page.keyboard.press('Escape');
  await page.click('.main-nav a[data-section="pianista"]');
  T('19 gallerie e 3 video', await page.locator('#gallery-grid .gallery-card').count() === 19 && await page.locator('#section-pianista iframe').count() === 3);

  // --- visite guidate: accuratezza ---
  const verifica = await ev(page, () => {
    const norm = t => testoSemplice(String(t)).replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim();
    const motto = norm(document.querySelector('.about-quote').textContent);
    const problemi = [];
    let citazioni = 0, azioni = 0, immagini = [];
    for (const v of VISITE) for (const t of v.tappe) {
      if (!t.titolo || !t.testo || !t.anno) problemi.push('tappa incompleta: ' + v.id);
      if (t.img) immagini.push(t.img);
      if (t.citazione) {
        citazioni++;
        const c = t.citazione, testo = norm(c.testo);
        let fonte = c.slug === 'about' ? norm(ABOUT_HTML) : c.slug === 'motto' ? motto : (ARTICLES.find(a => a.slug === c.slug) ? norm(ARTICLES.find(a => a.slug === c.slug).content) : null);
        if (fonte == null) problemi.push('articolo mancante ' + c.slug);
        else if (!fonte.includes(testo)) problemi.push('citazione non testuale in ' + c.slug + ': ' + testo.slice(0, 60));
        if (!['pino', 'altri', 'blog'].includes(c.di)) problemi.push('autore? ' + c.slug);
      }
      for (const a of t.azioni || []) {
        azioni++;
        if (a.tipo === 'articolo' && !ARTICLES.some(x => x.slug === a.slug)) problemi.push('azione articolo ' + a.slug);
        if (a.tipo === 'galleria' && a.slug !== 'ricetta-caso' && !GALLERIES.some(x => x.slug === a.slug)) problemi.push('azione galleria ' + a.slug);
        if (a.tipo === 'sezione' && !document.getElementById('section-' + a.id)) problemi.push('azione sezione ' + a.id);
        if (a.tipo === 'brano' && !REPERTORIO[a.id]) problemi.push('azione brano ' + a.id);
        if (a.tipo === 'visita' && !VISITE.some(x => x.id === a.id)) problemi.push('azione visita ' + a.id);
      }
    }
    return { problemi, citazioni, azioni, immagini, tappe: VISITE.reduce((s, v) => s + v.tappe.length, 0) };
  });
  T('visite: ogni citazione è testuale e ogni azione porta da qualche parte', verifica.problemi.length === 0, `${verifica.tappe} tappe, ${verifica.citazioni} citazioni, ${verifica.azioni} azioni ${verifica.problemi.join(' | ')}`);
  const mancanti = [];
  for (const img of verifica.immagini) { const r = await page.request.get(url + img); if (!r.ok()) mancanti.push(img); }
  T('visite: tutte le immagini esistono', mancanti.length === 0, mancanti.join(', '));

  await page.click('.main-nav a[data-section="visite"]');
  T('4 visite guidate', await page.locator('#visite-griglia .vs-card').count() === 4);
  await page.click('.vs-card[data-visita="vita"]');
  T('la visita si apre alla prima tappa', !(await page.locator('#visita').isHidden()) && (await page.locator('#vt-contatore').textContent()).includes('1 di'));
  T('citazione in oro nella prima tappa', await page.locator('#vt-corpo .vt-citazione').isVisible());
  const nTappe = await ev(page, () => VISITE[0].tappe.length);
  for (let i = 1; i < nTappe; i++) await page.click('#vt-succ');
  T('si arriva all\'ultima tappa', (await page.locator('#vt-contatore').textContent()).includes(`${nTappe} di ${nTappe}`));
  await page.screenshot({ path: OUT + 'computer-visita.png' });
  await page.click('#vt-succ');
  T('fine visita: si chiude e salva il progresso', await page.locator('#visita').isHidden() && await ev(page, () => PS.Memoria.get('visite', {}).vita) === await ev(page, () => VISITE[0].tappe.length));
  await page.click('.vs-card[data-visita="pianista"]');
  await page.click('#vt-corpo [data-azione="0"]');
  T('azione di una tappa (apri gallerie) chiude la visita e naviga', await ev(page, () => PS.Classico.sezione()) === 'pianista');

  // --- flusso infinito ---
  await page.click('.main-nav a[data-section="flusso"]');
  await page.waitForTimeout(300);
  const primo = await page.locator('#flusso .fl-card').count();
  T('il flusso parte con delle schede', primo >= 6, String(primo));
  for (let i = 0; i < 6; i++) { await page.mouse.wheel(0, 4000); await page.waitForTimeout(250); }
  const dopo = await page.locator('#flusso .fl-card').count();
  T('scorrendo arrivano altre schede', dopo > primo, `${primo} → ${dopo}`);
  T('nel flusso ci sono articoli e pillole', await page.locator('#flusso .fl-articolo').count() > 0 && await page.locator('#flusso .fl-pillola').count() > 0);
  await page.click('#flusso-filtri [data-filtro="pillole"]');
  await page.waitForTimeout(300);
  const pill = await ev(page, () => [document.querySelectorAll('#flusso .fl-card').length, document.querySelectorAll('#flusso .fl-pillola').length]);
  T('filtro Pillole', pill[0] > 0 && pill[0] === pill[1], pill.join('/'));
  const infinito = await ev(page, () => { for (let i = 0; i < 40; i++) PS.Flusso.carica(); return { n: PS.Flusso.schede(), dom: document.querySelectorAll('#flusso .fl-card').length }; });
  T('il flusso non finisce mai (e il DOM resta leggero)', infinito.n > 200 && infinito.dom <= 90, JSON.stringify(infinito));
  T('consigli: prima gli articoli non letti', await ev(page, () => { const letti = new Set(PS.Memoria.get('letti', [])); const c = PS.Flusso.consigliati(10); return c.filter(i => !letti.has(ARTICLES[i].slug)).length >= 8; }));

  // --- pianoforte ---
  await page.click('.main-nav a[data-section="sala"]');
  await page.waitForTimeout(300);
  T('Sala: invito ad accendere il pianoforte', await page.locator('#sala-avvio').isVisible());
  await page.click('#sala-accendi');
  await page.waitForTimeout(2500);
  const stato = await ev(page, () => ({ att: PS.Esecutore.attivo(), ev: PS.Esecutore.eventi().length, voci: PS.Piano.voci(), ctx: PS.Piano.contesto().state, e: PS.Piano.energia() }));
  T('il piano bar dal vivo suona', stato.att === 'pianobar' && stato.ev > 10 && stato.voci > 0 && stato.ctx === 'running', JSON.stringify(stato));
  T('esce suono (analizzatore)', await ev(page, async () => { let m = 0; for (let i = 0; i < 20; i++) { m = Math.max(m, PS.Piano.energia()); await new Promise(r => setTimeout(r, 50)); } return m; }) > 0.005);
  const pixel = await ev(page, () => {
    const c = document.getElementById('sala-canvas'), g = c.getContext('2d'), geo = PS.Sala.geometria();
    let chiari = 0;
    for (let i = 1; i < 20; i++) { const d = g.getImageData(Math.floor((c.width * i) / 20), Math.floor((geo.top + geo.altezzaTasti * 0.8) * (c.height / c.clientHeight)), 1, 1).data; if (d[0] + d[1] + d[2] > 400) chiari++; }
    return chiari;
  });
  T('la tastiera è disegnata (tasti bianchi)', pixel >= 10, pixel + '/19 punti chiari');
  const brani = await ev(page, () => Object.keys(PS.REPERTORIO));
  for (const id of brani) {
    const r = await ev(page, async id => {
      const opz = id === 'club' ? { energia: () => 2 } : {};
      PS.Esecutore.suona(id, opz);
      await new Promise(r => setTimeout(r, 900));
      const e = PS.Esecutore.eventi().filter(x => x.midi);
      return { att: PS.Esecutore.attivo(), n: e.length, ok: e.every(x => x.midi >= 21 && x.midi <= 108 && x.dur > 0 && x.vel > 0 && x.vel <= 1.2) };
    }, id);
    T(`brano «${id}» suona`, r.att === id && r.n > 3 && r.ok, JSON.stringify(r));
  }
  const g = await ev(page, () => { const gen = PS.REPERTORIO.gioia.crea(); let b = 0; while (gen.next()) b++; return b; });
  T('i brani scritti finiscono', g === 17, String(g));
  const nv = await ev(page, async () => { PS.Esecutore.ferma(); await new Promise(r => setTimeout(r, 600)); const a = PS.Piano.voci(); return a; });
  T('Ferma zittisce il pianoforte', !(await ev(page, () => PS.Esecutore.attivo())), 'voci residue ' + nv);
  // suonare a mano
  await ev(page, () => { window.__tasti = []; PS.Bus.on('tasto', t => { if (t.giu) window.__tasti.push(t.midi); }); });
  await page.keyboard.down('KeyZ'); await page.keyboard.down('KeyC'); await page.keyboard.down('KeyB');
  await page.waitForTimeout(100);
  const accordo = await ev(page, () => window.__tasti.slice());
  T('la tastiera del computer suona (accordo Do-Mi-Sol)', accordo.join() === '48,52,55', accordo.join());
  await page.keyboard.up('KeyZ'); await page.keyboard.up('KeyC'); await page.keyboard.up('KeyB');
  const box = await page.locator('#sala-canvas').boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height - 20);
  await page.mouse.down();
  for (let i = 1; i <= 6; i++) await page.mouse.move(box.x + box.width / 2 + i * 30, box.y + box.height - 20);
  await page.mouse.up();
  T('glissando col mouse', await ev(page, () => PS.Piano.voci()) > 3);
  await page.click('#sala-rec');
  for (const k of ['KeyQ', 'KeyW', 'KeyE']) { await page.keyboard.down(k); await page.waitForTimeout(120); await page.keyboard.up(k); }
  await page.click('#sala-rec');
  T('registrazione pronta da riascoltare', !(await page.locator('#sala-riascolta').isDisabled()));
  await page.click('#sala-pedale');
  T('pedale di risonanza', await ev(page, () => PS.Piano.pedaleGiu()));
  await page.click('#sala-pedale');
  await page.selectOption('#sala-timbro', 'elettrico');
  T('cambio di pianoforte', await ev(page, () => PS.Piano.timbro()) === 'elettrico');
  await page.selectOption('#sala-timbro', 'coda');
  await page.click('[data-brano="bach"]');
  await page.waitForTimeout(2600);
  await page.locator('#sala-palco').scrollIntoViewIfNeeded();
  await page.screenshot({ path: OUT + 'computer-sala.png' });
  // 🎹 live nella testata
  await page.click('#bPianoLive');
  T('🎹 live ferma quello che suona', !(await ev(page, () => PS.Esecutore.attivo())));
  await page.click('#bPianoLive');
  T('🎹 live accende la radio del pianoforte', await ev(page, () => PS.Esecutore.inRadio() && !!PS.Esecutore.attivo()) && await page.locator('#bPianoLive.on').count() === 1);
  await page.click('#bPianoLive');

  // --- Piano Hot Club ---
  await page.click('.main-nav a[data-section="piano-hot"]');
  T('ingresso +18 (porta del club)', await page.locator('#age-gate').isVisible() && await page.locator('#piano-hot-content').isHidden());
  await page.click('#bMaggiorenne');
  T('dopo il +18: club e 99 opere', await page.locator('#club').isVisible() && await page.locator('#piano-hot-grid .gallery-card').count() === 99);
  await page.click('#club-entra');
  await page.waitForTimeout(1500);
  let cs = await ev(page, () => ({ ...PS.Club.stato(), att: PS.Esecutore.attivo() }));
  T('dentro al club suona il set del club', cs.dentro && cs.att === 'club', JSON.stringify(cs));
  const px2 = await ev(page, () => { const c = document.getElementById('club-scena'); const d = c.getContext('2d').getImageData(Math.floor(c.width / 2), Math.floor(c.height * 0.24), 1, 1).data; return d[0] + d[1] + d[2]; });
  T('la scena del club è disegnata (insegna accesa)', px2 > 150, String(px2));
  await page.click('[data-atm="delirio"]');
  await page.click('[data-luci="laser"]');
  await page.waitForTimeout(3500);
  T('atmosfera Delirio → piano house', (await page.locator('#club-brano').textContent()).includes('house'));
  for (const e of ['blackout', 'brindisi', 'paparazzi', 'ballo', 'vicino', 'mezzanotte', 'richiesta']) await ev(page, e => PS.Club.evento(e), e);
  await page.waitForTimeout(600);
  T('gli eventi del club partono senza errori', errori.length === 0, errori.join(' | '));
  T('il vicino fa calare la pazienza', await ev(page, () => PS.Club.stato().pazienza) < 90);
  await page.screenshot({ path: OUT + 'computer-club.png' });
  await ev(page, () => PS.Club.imposta({ pazienza: 0.2 }));
  await page.waitForTimeout(3600);
  let fs = await ev(page, () => PS.Fuga.stato());
  T('pazienza finita: arrivano i vigili e parte la fuga', !!fs && fs.pausa && await page.locator('#fuga').isVisible(), JSON.stringify(fs));
  await page.click('#fuga-via');
  await page.keyboard.down('ArrowLeft'); await page.waitForTimeout(500); await page.keyboard.up('ArrowLeft');
  fs = await ev(page, () => PS.Fuga.stato());
  T('ci si muove con le frecce', fs.p.x < 15.3 && !fs.pausa, JSON.stringify(fs.p));
  T('nella fuga suona la tarantella', await ev(page, () => PS.Esecutore.attivo()) === 'fuga');
  T('la pianta del locale è tutta raggiungibile', await ev(page, () => {
    const M = PS.Fuga._mappa(); let start; const uscite = [];
    M.forEach((r, y) => [...r].forEach((c, x) => { if (c === 'A') start = [x, y]; if (c === 'U' || c === 'o') uscite.push([x, y]); }));
    return uscite.every(u => PS.Fuga._percorso(start, u).length > 0);
  }));
  await page.screenshot({ path: OUT + 'computer-fuga.png' });
  const ap = fs.aperta;
  await ev(page, a => PS.Fuga._teletrasporta(a[0] + 0.5, a[1] + 0.5), ap);
  await page.waitForTimeout(400);
  T('raggiunta l\'uscita verde: sei scappato', (await page.locator('#fuga-schermo').textContent()).includes('scappato'));
  await page.click('#fuga-torna');
  await page.waitForTimeout(500);
  cs = await ev(page, () => PS.Club.stato());
  T('dopo la fuga il club riapre, livello su', !(await ev(page, () => PS.Fuga.inCorso())) && cs.pazienza > 95 && cs.livello === 2 && cs.minuti < 22 * 60 + 5, JSON.stringify(cs));
  await page.click('#club-scappa');
  await page.waitForTimeout(1300);
  await page.click('#fuga-via');
  await page.click('#fuga-esci');
  T('Esci dalla fuga torna al club', !(await ev(page, () => PS.Fuga.inCorso())) && await page.locator('#fuga').isHidden());
  await page.click('.main-nav a[data-section="home"]');
  await page.waitForTimeout(400);
  T('uscendo dal club la musica del club si ferma', !['club', 'fuga', 'club-richiesta'].includes(await ev(page, () => PS.Esecutore.fonte())));

  // --- link diretto ---
  const d = await nuovaPagina({ viewport: { width: 1280, height: 800 } }, '#visite');
  T('link diretto #visite', await ev(d.page, () => PS.Classico.sezione()) === 'visite' && await d.page.locator('#section-visite').isVisible());
  const d2 = await nuovaPagina({ viewport: { width: 1280, height: 800 } }, '#sala');
  await d2.page.waitForTimeout(400);
  const px3 = await ev(d2.page, () => { const c = document.getElementById('sala-canvas'); return c.width > 100 && c.height > 100; });
  T('link diretto #sala: la tastiera è pronta', px3);
  T('nessun errore nelle pagine con link diretto', d.errori.length === 0 && d2.errori.length === 0, d.errori.concat(d2.errori).join(' | '));
  await d.ctx.close(); await d2.ctx.close();

  T('nessun errore in console (computer)', errori.length === 0, errori.join(' | '));
  await ctx.close();
}

// ============================================================ TELEFONO
console.log('\n== TELEFONO ==');
{
  const { ctx, page, errori } = await nuovaPagina({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const larghezza = async () => ev(page, () => document.documentElement.scrollWidth <= window.innerWidth + 1);
  T('home senza scorrimento orizzontale', await larghezza());
  await page.screenshot({ path: OUT + 'telefono-home.png' });
  await page.tap('#nav-toggle');
  T('menu ad hamburger', await page.locator('#main-nav.open').count() === 1);
  await page.tap('.main-nav a[data-section="visite"]');
  T('il menu porta alle Visite e si chiude', await page.locator('#main-nav.open').count() === 0 && await ev(page, () => PS.Classico.sezione()) === 'visite');
  for (const s of ['blog', 'flusso', 'visite', 'sala', 'ricette', 'pianista', 'chi-sono', 'piano-hot']) {
    await ev(page, s => PS.Classico.navigateTo(s), s);
    await page.waitForTimeout(250);
    T(`«${s}» senza scorrimento orizzontale`, await larghezza());
  }
  await ev(page, () => PS.Classico.navigateTo('visite'));
  await page.tap('.vs-card[data-visita="cucina"]');
  await page.waitForTimeout(300);
  T('visita a tutto schermo sul telefono', await page.locator('#visita').isVisible());
  await page.screenshot({ path: OUT + 'telefono-visita.png' });
  await page.tap('#vt-chiudi');
  await ev(page, () => PS.Classico.navigateTo('sala'));
  await page.tap('#sala-accendi');
  await page.waitForTimeout(1200);
  const vista = await ev(page, () => PS.Sala.vista());
  T('Sala: tastiera ingrandita per le dita', vista.hi - vista.lo <= 36, JSON.stringify(vista));
  const box = await page.locator('#sala-canvas').boundingBox();
  await ev(page, () => { window.__tasti = []; PS.Bus.on('tasto', t => { if (t.giu) window.__tasti.push(t.midi); }); });
  await page.touchscreen.tap(box.x + box.width * 0.3, box.y + box.height - 30);
  await page.waitForTimeout(80);
  T('toccare un tasto suona', await ev(page, () => window.__tasti.length) === 1);
  await page.screenshot({ path: OUT + 'telefono-sala.png' });
  await ev(page, () => PS.Classico.navigateTo('piano-hot'));
  await page.tap('#bMaggiorenne');
  await page.tap('#club-entra');
  await page.waitForTimeout(1500);
  await page.locator('#club').scrollIntoViewIfNeeded();
  await page.screenshot({ path: OUT + 'telefono-club.png' });
  await page.tap('#club-scappa');
  await page.waitForTimeout(1300);
  await page.tap('#fuga-via');
  const c = await page.locator('#fuga-canvas').boundingBox();
  await page.mouse.move(c.x + c.width / 2, c.y + c.height / 2);
  await ev(page, () => {
    const cv = document.getElementById('fuga-canvas'), r = cv.getBoundingClientRect();
    const opz = (x, y) => ({ pointerId: 7, pointerType: 'touch', clientX: x, clientY: y, bubbles: true, isPrimary: true });
    cv.dispatchEvent(new PointerEvent('pointerdown', opz(r.left + r.width / 2, r.top + r.height / 2)));
    cv.dispatchEvent(new PointerEvent('pointermove', opz(r.left + r.width / 2 - 60, r.top + r.height / 2)));
  });
  const x0 = await ev(page, () => PS.Fuga.stato().p.x);
  await page.waitForTimeout(500);
  const x1 = await ev(page, () => PS.Fuga.stato().p.x);
  await ev(page, () => document.getElementById('fuga-canvas').dispatchEvent(new PointerEvent('pointerup', { pointerId: 7, pointerType: 'touch', bubbles: true })));
  T('joystick col dito', x1 < x0, `${x0.toFixed(2)} → ${x1.toFixed(2)}`);
  await page.screenshot({ path: OUT + 'telefono-fuga.png' });
  T('nessun errore in console (telefono)', errori.length === 0, errori.join(' | '));
  await ctx.close();
}

await browser.close();
server.close();
console.log(`\n${ok} ok, ${ko} falliti`);
process.exit(ko ? 1 : 0);
