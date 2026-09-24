# Changelog · Pino Soprano

Tutte le versioni notevoli del sito. Le date sono in formato AAAA-MM-GG.
Il sito va online su [GitHub Pages](https://cammo22.github.io/PinoSoprano/) subito dopo il push su `main`.

**Come si pubblica una versione (metodo DaProd):** si alza `const VERSIONE` in `index.html`, si aggiunge qui
sotto la sezione `## [X.Y.Z]` e si unisce su `main`. La versione finisce in coda a tutti i CSS e JS (`?v=X.Y.Z`),
così nessuno resta con file vecchi in cache; chi ha il sito aperto vede comparire «È online la vX.Y.Z — Aggiorna ora».

**La regola dei colori:** tutto ciò che è **originale** di Pino resta in **oro** (serif Playfair / Source Serif);
tutto ciò che è stato **aggiunto** da DaProd è in **neon** ciano, magenta e menta (Orbitron / Rajdhani).

## [2.0.0] — 2026-09-24 · Il revamp DaProd: un ricordo riacceso ✦

Il sito di Pino Soprano rinasce in stile DaProd: notte, vetro scuro e neon. I suoi contenuti (97 articoli,
77 ricette, 19 gallerie, le 99 opere di Piano Hot, il «Chi sono») sono intatti e restano in oro; ogni novità è in neon.

### 🧭 Visite guidate (nuovo)
- **Quattro percorsi, 41 tappe**: *Una vita tra note e pensieri* (dal «Classe 1965» all'ultimo articolo del
  25 agosto 2013), *Il pianista e le sue serate* (le 19 gallerie una per una), *La cucina della gentilezza*
  (vegetarianesimo, animali, ricette) e *Le voci che amava* (poeti, filosofi e amici pubblicati sul blog).
- Ogni tappa ha tre livelli ben distinti: il **racconto della guida** (neon), il **contesto storico** dell'epoca
  con date verificabili (menta) e le **parole testuali** di Pino o delle sue pagine (oro), con la fonte e
  l'indicazione di chi le ha scritte: «Parole di Pino» oppure «Dalle sue pagine».
- **Racconta a voce** (sintesi vocale italiana), **pianoforte in sottofondo**, modalità **automatica**,
  linea del tempo cliccabile, swipe sul telefono, frecce e Esc sul computer. Il progresso si ricorda.
- Le prove automatiche controllano che **ogni citazione compaia parola per parola** nell'articolo da cui è presa.

### 🎹 Sala Pianoforte (nuovo)
- **Pianoforti dal vivo**: un pianoforte sintetizzato con la Web Audio API (nessun file audio): corde doppie
  leggermente scordate, martelletto, armoniche che si spengono come quelle vere, pedale di risonanza, riverbero.
  Tre strumenti: **gran coda**, **verticale da osteria** e **piano elettrico**.
- **Improvvisazioni che non si ripetono mai**: *Piano bar dal vivo* (ballad jazz con voicing alla Bill Evans,
  il jazz della sua playlist), *Notturno napoletano* (in minore, con la sesta napoletana) e *Tarantella*.
- **Classici di pubblico dominio**: *Inno alla gioia* (dalla Nona di Beethoven, che lo commuoveva),
  *Preludio in Do* di Bach, *Per Elisa*, *Gymnopédie n. 1* di Satie.
- **Vederlo suonare**: la cascata di note cade sulla tastiera (sinistra ciano, destra magenta), i tasti si
  abbassano, l'accordo in corso si legge in alto; la tastiera segue da sola le note del brano.
- **Suonarlo**: mouse (anche trascinando), più dita sul telefono, tastiera del computer su due ottave,
  barra spaziatrice = pedale, ottave e tastiera intera, **registra e riascolta** (le tue note salgono in verde).
- **🎹 live** nella testata: la radio del pianoforte in sottofondo mentre giri per il sito, per sempre.

### 🔊 Articoli da ascoltare e ∞ Scorri all'infinito (nuovo)
- Ogni articolo si può **ascoltare**: voce italiana, pausa, velocità, pianoforte sotto; il paragrafo letto si
  illumina e resta al centro. **♡ Mi piace**, articolo precedente/successivo, «un altro a caso», badge «letto».
- **📻 Radio articoli**: la voce legge un articolo dopo l'altro, scelti tra quelli che non hai ancora sentito.
- **Scorri all'infinito**: un flusso che non finisce mai di articoli, **pillole** (un paragrafo scelto da un
  articolo), poesie, ricette, foto delle serate e «lo sapevi?» delle visite. Prima gli articoli non letti,
  più spazio alle categorie che ti piacciono; il DOM resta leggero anche dopo centinaia di schede.

### 🪩 Piano Hot Club (nuovo)
- Dopo l'ingresso +18 la sezione Piano Hot diventa un **night club disegnato dal vivo**: fari mobili,
  palla da discoteca, laser, pista che si accende a tempo, fumo, pubblico che balla, un pianista su un gran coda
  che muove le mani sulle note vere, e le opere di Piano Hot appese alle pareti in cornici d'oro.
- **Atmosfera** Soft (ballad), Party (swing con contrabbasso e batteria) e **Delirio** (piano house);
  **luci** Disco, Laser o Soffuse. Niente stroboscopio; con «riduci movimento» rallenta tutto.
- **L'orologio del locale** corre (1 secondo = 1 minuto) dalle 22:00 alle 4:00, con **eventi a sorpresa**:
  blackout (fai luce col dito o col mouse), giro offerto, richieste dal pubblico, paparazzi, tutti in pista,
  mezzanotte, il vicino che batte sul soffitto.
- **La pazienza del vicinato** scende se esageri: quando finisce (o alle 4, o quando premi *Scappa!*)
  **arrivano i vigili a chiudere il locale** e parte la **fuga**.

### 🏃 Fuga dal Piano Hot Club (nuovo minigioco)
- La pianta del locale dall'alto, **al buio**: bar, pista, privé, cucina, magazzino, bagni. Trova l'**uscita di
  sicurezza verde** prima che scenda la saracinesca, fuori dalle **torce dei vigili** (se ti inquadrano fischiano
  e ti inseguono), mentre il gestore spegne le luci una a una.
- **Salva le opere di Piano Hot** sparse nel locale (+3 secondi ciascuna), tre tentativi, stelle, livelli
  sempre più difficili; sul telefono un joystick col dito e la telecamera che ti segue.
- Colonna sonora: la *tarantella della fuga* con la batteria; sirena bitonale, fischietto e saracinesca sintetizzati.

### Il sito originale, rinfrescato
- **Restyle DaProd**: notte, vetro, oro per l'originale e neon per le novità, legenda dei colori in home e nel
  piè di pagina, marchio DaProd. Home con la scena del piano bar e una tastiera che si accende col pianoforte live.
- **Link diretti** alle sezioni (`#visite`, `#sala`, `#flusso`…), didascalie e swipe nel lightbox, menu da telefono.
- **Struttura DaProd**: i contenuti originali sono in `js/dati/contenuti.js` (identici a prima), la logica è
  divisa in moduli, `VERSIONE` con cache-busting e avviso di aggiornamento, prove automatiche con Playwright
  su computer e telefono (`test/prove.mjs`) e workflow GitHub Actions che le esegue su ogni PR.
