# Pino Soprano – Struttura del Progetto

Questo file descrive l'intera struttura del progetto per consentire a una AI (o a chiunque) di capire
rapidamente come navigare e modificare il codice. Versione del sito: vedi `const VERSIONE` in `index.html`.

---

## Panoramica

Sito memorial/nostalgia per **Pino Soprano** («Classe 1965»): filosofo, pianista, cuoco naturale.
Contenuto scaricato da due siti originali:
- `pinosoprano.wordpress.com` — blog con 97 articoli (27/11/2010 → 25/08/2013)
- `pinosoprano.it` — sito statico con ricette, gallerie, pagine personali, sezione Piano Hot +18

Dalla v2.0.0 il sito ha il **revamp DaProd**: stesso contenuto, più sezioni nuove.
È una **Single Page Application** senza framework e senza build: si apre `index.html` e basta.

### La regola dei colori (IMPORTANTE)
- **Oro** (`--oro`, `--crema`, font `--f-display`/`--f-body`): tutto ciò che è **originale** di Pino.
- **Neon** (`--cia`, `--mag`, `--menta`, font `--f-num`/`--f-txt`): tutto ciò che è **aggiunto** da DaProd,
  con l'etichetta `✦` / `.tag-nuovo`.
Ogni nuova funzione deve rispettarla. I testi originali non si modificano.

---

## Struttura cartelle

```
index.html            VERSIONE + caricatore (CSS/JS con ?v=) + markup di tutte le sezioni
css/
  base.css            variabili colore, testata/nav, pulsanti, chip, hero, finestra articolo, lightbox, toast, radio
  originale.css       (ORO) carte, carosello, articoli, ricette, gallerie, video, chi sono, ingresso +18
  novita.css          (NEON) blocco novità in home, visite (schede + finestra), flusso infinito
  sala.css            (NEON) Sala Pianoforte
  club.css            (NEON) Piano Hot Club e fuga
js/
  dati/contenuti.js   CONTENUTI ORIGINALI: ARTICLES, RECIPES, GALLERIES, PIANO_HOT, CAT_DISPLAY, ABOUT_HTML
  dati/visite.js      VISITE: i 4 percorsi guidati (tappe, contesto, citazioni testuali, azioni)
  dati/repertorio.js  REPERTORIO: brani scritti (pubblico dominio) e improvvisatori; SCALETTA_LIVE
  core/util.js        $, $$, escapeHtml, formatDate, testoSemplice, Memoria (localStorage), toast, Bus, pronto
  core/pianoforte.js  Piano: sintesi Web Audio (3 timbri), pedale, riverbero, batteria, effetti (sirena…)
  core/esecutore.js   Esecutore: legge un brano battuta per battuta, lo programma, espone eventi e battiti
  core/voce.js        Voce: sintesi vocale italiana a frasi brevi, con callback per evidenziare
  sezioni/classico.js il sito originale: navigazione, citazioni hero, carosello, articoli, ricette, gallerie, lightbox
  sezioni/ascolta.js  ascolto articoli (barra nella finestra) e Radio articoli
  sezioni/flusso.js   Scorri all'infinito (schede, pillole, consigli, caricamento infinito)
  sezioni/visite.js   griglia delle visite e lettore a tutto schermo
  sezioni/sala.js     Sala Pianoforte (canvas: cascata di note + tastiera suonabile, registrazione)
  sezioni/club.js     Piano Hot Club (scena canvas, orologio, pazienza, eventi, chiamata della fuga)
  sezioni/fuga.js     minigioco «Fuga dal club» (mappa, vigili, torce, opere, uscita)
  ui/aggiornamenti.js avviso «È online la vX.Y.Z»
  main.js             avvio: collega i moduli, pulsante 🎹 live, scena della home, window.PS per le prove
assets/
  ricette/{slug}/     foto ricette (senza sottocartella immagini/)
  gallerie/{slug}/    foto gallerie del pianista
  piano-hot/          Piano1.jpg … Piano99.jpg
  blog/{slug}/        immagini degli articoli
test/
  prove.mjs           prove Playwright (computer + telefono), foto in test/.out/
  servi.mjs           server statico senza dipendenze (node test/servi.mjs → :8080)
.github/workflows/prove.yml   esegue le prove su ogni PR e push su main
CHANGELOG.md          una sezione ## [X.Y.Z] per ogni VERSIONE
```

L'ordine di caricamento degli script è nell'array `js` dentro `index.html`: prima i dati, poi il core,
poi le sezioni, per ultimo `main.js`. Le costanti `const` di primo livello sono condivise tra gli script.

---

## Sezioni (id `section-*`, link diretto `#id`)

| id | Tipo | Contenuto |
| --- | --- | --- |
| `home` | originale + novità | 3 carte, blocco novità, carosello (8 elementi ogni 15 s) |
| `blog` | originale | articoli con filtri categoria e ricerca; chip neon per flusso e radio |
| `flusso` | NUOVO | Scorri all'infinito |
| `visite` | NUOVO | schede delle visite guidate (il lettore è `#visita`, sopra tutto) |
| `sala` | NUOVO | Sala Pianoforte |
| `ricette` | originale | 77 ricette |
| `pianista` | originale | 19 gallerie + 3 video (`#video-pianista`) |
| `chi-sono` | originale | biografia (`ABOUT_HTML`) e motto |
| `piano-hot` | originale + NUOVO | ingresso +18 → club (`#club`, con `#fuga`) + 99 opere |

Navigazione: `Classico.navigateTo(id)`; ogni cambio emette `Bus.emit("sezione", {nuova, vecchia})`,
così i moduli accendono/spengono le loro animazioni. Elementi con `data-vai="id"` navigano da soli;
`data-articolo="i"`, `data-galleria="i"`, `data-ricetta="i"`, `data-visita="id"` (+ `data-tappa`) aprono i contenuti.

Sovrapposizioni (z-index): visita 180 < articolo 200 < radio 250 < lightbox 300 < toast 400.

---

## Il pianoforte

- `Piano.suona(midi, vel, quando, durata, {mano, timbro})` suona una nota sull'orologio audio.
- `Piano.premi(midi)` / `Piano.lascia(midi)` per la tastiera a mano; `Piano.pedale(true|false)`.
- `Esecutore.suona(id, {fonte, battute, energia})` suona un brano del `REPERTORIO`; `Esecutore.radio()` la scaletta
  infinita del pulsante 🎹 live; `Esecutore.eventi()` note con `{midi, t, dur, vel, mano}` per disegnarle;
  `Esecutore.battito()` per sincronizzare le luci. Un solo brano alla volta per tutto il sito (`fonte` dice chi l'ha chiesto).
- Un generatore restituisce una battuta per volta: `{beats, bpm, ev:[{b,d,midi,vel,mano}], dr:[{b,tipo,vel}], accordo}`.
- Spartiti scritti con la mini-notazione di `spartito()`: `"E5:1 D#5:.5 r:1 C4+E4+G4:2 A2:.5/1.5"`
  (nota:avanza[/suona], `r` = pausa, `+` = accordo).

## Le visite guidate (regole di accuratezza)

In `js/dati/visite.js` ogni tappa ha `anno`, `titolo`, `testo` (racconto della guida), `contesto` (fatti storici
verificabili), `citazione` `{testo, fonte, di, slug}` e `azioni`. `di` è `pino` (parole sue), `altri`
(testi di altri autori pubblicati da lui, autore nella fonte) o `blog` (non firmati). `slug` è l'articolo da cui
la citazione è presa (`about` = «Chi sono», `motto` = la frase in testa al «Chi sono»):
**le prove falliscono se la citazione non compare testualmente**. Non inventare date né fatti biografici.

---

## Categorie articoli e colori

| Chiave interna         | Display              | Colore     |
|------------------------|----------------------|------------|
| `filosofia-religione`  | Filosofia & Religione| `#7b68ae`  |
| `informazione`         | Informazione         | `#3a8fb7`  |
| `alimentazione`        | Alimentazione        | `#5a9e6f`  |
| `amore-sensibilita`    | Amore & Sensibilità  | `#c75b7a`  |
| `palestina-israele`    | Palestina-Israele    | `#b8860b`  |
| `poesia`               | Poesia               | `#c49a6c`  |
| `ambiente-animali`     | Ambiente & Animali   | `#2e8b57`  |
| `musica`               | Musica               | `#cd5c5c`  |

I colori dei badge sono in `CAT_COLORS` (`js/sezioni/classico.js`), i nomi in `CAT_DISPLAY` (`js/dati/contenuti.js`).

---

## Come aggiungere / modificare contenuti

- **Articolo**: aggiungi un oggetto a `ARTICLES` in `js/dati/contenuti.js`
  (`title`, `date`, `slug`, `category`, `categories`, `link`, `content` HTML).
- **Biografia**: `ABOUT_HTML` in `js/dati/contenuti.js`.
- **Citazioni della home**: `HERO_QUOTES` in `js/sezioni/classico.js`.
- **Tappa di una visita**: `VISITE` in `js/dati/visite.js` (rispettando le regole sopra).
- **Brano**: una voce in `REPERTORIO` (`js/dati/repertorio.js`) con `crea()` che restituisce un generatore.
- **Evento del club**: `evento(tipo)` in `js/sezioni/club.js`.
- **Pubblicare**: alza `VERSIONE`, scrivi la sezione nel `CHANGELOG.md`, fai girare `node test/prove.mjs`.

## Memoria locale (chiavi `pinoSoprano_*` in localStorage)

`letti` (slug articoli letti), `piaciuti` (♡), `visite` (tappe viste per percorso), `ascoltaPiano`,
`fugaLivello`, `fugaRecord`. Tutto facoltativo: senza localStorage il sito funziona uguale.

## Percorsi immagini

Relativi alla radice del sito: `assets/ricette/{slug}/{file}`, `assets/gallerie/{slug}/{file}`,
`assets/piano-hot/PianoN.jpg`, `assets/blog/{slug}/{file}`, Chi sono: `assets/blog/pagine_su-di-me/anatroccolo1.jpg`.

## Dipendenze esterne

Solo Google Fonts (Orbitron, Rajdhani, Space Mono, Playfair Display, Source Serif 4, con fallback di sistema)
e i 3 video YouTube incorporati. Il sito funziona anche offline e da `file://`.
