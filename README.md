# Pino Soprano · un ricordo riacceso da DaProd 🎹

[![▶ APRI IL SITO](https://img.shields.io/badge/%E2%96%B6_APRI_IL_SITO-Pino_Soprano-ffd54a?style=for-the-badge&labelColor=1a1428)](https://cammo22.github.io/PinoSoprano/)

[![GitHub Pages](https://img.shields.io/badge/GitHub_Pages-attiva-success?style=flat-square)](https://cammo22.github.io/PinoSoprano/)
[![Prove](https://img.shields.io/github/actions/workflow/status/cammo22/PinoSoprano/prove.yml?style=flat-square&label=prove)](.github/workflows/prove.yml)
[![Changelog](https://img.shields.io/badge/📅_Changelog-mantenuto-ffab00?style=flat-square)](CHANGELOG.md)
[![Nessuna dipendenza](https://img.shields.io/badge/JavaScript-zero_dipendenze-f7df1e?style=flat-square&logo=javascript&logoColor=black)](js/)

> **Filosofo, pianista, cuoco naturale. «Classe 1965».**

Il sito dedicato a **Pino Soprano**: i 97 articoli del suo blog (2010–2013), le 77 ricette vegane
fotografate piatto per piatto, le 19 gallerie delle serate al pianoforte, le 99 opere di *Erotic Piano Photoart*
e il suo «Chi sono». Nel revamp DaProd tutto questo è rimasto com'era, e intorno sono nati modi nuovi per
ricordarlo: visite guidate nella sua storia, pianoforti che suonano dal vivo, articoli da ascoltare
e un night club da cui scappare.

## 🎨 La regola dei colori

| | Colore | Caratteri | Cosa |
| --- | --- | --- | --- |
| ● | **Oro** | Playfair Display · Source Serif | tutto ciò che è **originale** di Pino, com'era pubblicato |
| ✦ | **Neon** ciano, magenta, menta | Orbitron · Rajdhani | tutto ciò che è stato **aggiunto** da DaProd |

Nelle visite guidate il racconto della guida è in neon, il contesto storico in menta e le sue parole testuali in oro.

## ✦ Le novità

| | Sezione | Cosa fa |
| --- | --- | --- |
| 🧭 | **Visite guidate** | 4 percorsi e 41 tappe nella sua storia: date, contesto dell'epoca e citazioni testuali con la fonte. Si possono ascoltare a voce, col pianoforte sotto |
| 🎹 | **Sala Pianoforte** | pianoforti sintetizzati dal vivo, improvvisazioni che non si ripetono (piano bar, notturno napoletano, tarantella) e classici di pubblico dominio; la cascata di note sulla tastiera; suonabile con mouse, dita e tastiera; registra e riascolta |
| 🔊 | **Ascolta** | ogni articolo letto a voce, col paragrafo che si illumina; 📻 Radio articoli, uno dopo l'altro |
| ∞ | **Scorri all'infinito** | un flusso senza fine di articoli, pillole, poesie, ricette e ricordi; prima quelli che non hai letto |
| 🪩 | **Piano Hot Club** | la sezione Piano Hot diventa un night club con luci, musica ed eventi; quando arrivano i vigili a chiudere il locale… |
| 🏃 | **Fuga dal club** | minigioco al buio: salva le opere, evita le torce, trova l'uscita verde prima della saracinesca |

Tutto funziona **da telefono, tablet e computer**. Le luci del club sono morbide (niente stroboscopio) e con
«riduci movimento» del sistema le animazioni rallentano.

## 🔄 Come si aggiorna (il metodo DaProd)

1. Si alza la costante **`VERSIONE`** in [`index.html`](index.html) (es. `'v2.1.0'`).
2. Si aggiunge la sezione `## [2.1.0]` in cima al [CHANGELOG](CHANGELOG.md).
3. Si unisce su `main`: GitHub Pages pubblica il sito.

La versione finisce in coda a tutti i CSS e JS (`?v=2.1.0`), così nessuno si ritrova con file vecchi in cache;
chi ha il sito aperto vede comparire *«È online la v2.1.0 — Aggiorna ora»*. Su ogni PR il workflow
[`prove.yml`](.github/workflows/prove.yml) apre il sito in Chromium su computer e telefono e fa girare le prove.

```bash
npm i --no-save playwright && npx playwright install chromium
node test/prove.mjs          # le foto delle schermate finiscono in test/.out/
node test/servi.mjs          # il sito su http://127.0.0.1:8080/
```

## 🛠 Come è fatto

HTML, CSS e JavaScript puri, **nessuna dipendenza e nessuna build**: basta aprire `index.html` (o servire la
cartella). Musica ed effetti sono sintetizzati dal vivo con la Web Audio API, la voce usa la sintesi vocale
del dispositivo, le scene del club e della fuga sono disegnate su canvas.

```
index.html              VERSIONE, caricatore con cache-busting, struttura di tutte le sezioni
css/                    base (colori, testata, finestre) · originale (oro) · novita (neon) · sala · club
js/dati/                contenuti ORIGINALI (articoli, ricette, gallerie, piano hot, chi sono) · visite · repertorio
js/core/                util · pianoforte (Web Audio) · esecutore (il pianista invisibile) · voce
js/sezioni/             classico (il sito originale) · ascolta · flusso · visite · sala · club · fuga
js/ui/                  aggiornamenti
test/                   prove nel browser (Playwright) e piccolo server statico
assets/                 le foto originali: blog, ricette, gallerie, piano-hot
```

Per una mappa dettagliata del codice vedi [STRUTTURA.md](STRUTTURA.md).

## 🔗 I siti originali

- Blog: [pinosoprano.wordpress.com](https://pinosoprano.wordpress.com)
- Sito: [pinosoprano.it](https://www.pinosoprano.it)
- YouTube: [youtube.com/user/pinosoprano](https://www.youtube.com/user/pinosoprano)

---

<sub>Revamp **DaProd** · Napoli · Tecnologia · Creatività. I testi, le foto e le ricette sono di Pino Soprano
e degli autori che lui ha pubblicato sul suo blog.</sub>
