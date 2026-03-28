# Pino Soprano – Struttura del Progetto

Questo file descrive l'intera struttura del progetto per consentire a una AI di capire rapidamente come navigare e modificare il codice.

---

## Panoramica

Sito memorial/nostalgia per **Pino Soprano** (1965–2013): filosofo, pianista, cuoco naturale.
Contenuto scaricato da due siti originali:
- `pinosoprano.wordpress.com` — blog con 97 articoli
- `pinosoprano.it` — sito statico con ricette, gallerie, pagine personali, sezione Piano Hot +18

Il risultato è una **Single Page Application** completamente standalone in `website/index.html`.

---

## Struttura Cartelle

```
C:\Users\cammo\Desktop\Pino\
│
├── website/                        ← CARTELLA DA DISTRIBUIRE (self-contained)
│   ├── index.html                  ← L'UNICO FILE DA MODIFICARE (vedi sotto)
│   ├── css/
│   │   └── style.css               ← Tutti gli stili CSS
│   └── assets/
│       ├── ricette/{slug}/         ← Foto ricette (404 immagini)
│       ├── gallerie/{slug}/        ← Foto gallerie pianista (44 immagini)
│       ├── piano-hot/              ← Piano1.jpg … Piano99.jpg + Anatroccolo.jpg
│       └── blog/{slug}/            ← Immagini articoli blog (135 immagini)
│
├── blog/                           ← Contenuto grezzo WordPress
│   ├── articoli/{categoria}/*.md   ← 97 articoli in markdown con frontmatter YAML
│   ├── pagine/*.md                 ← Pagine statiche (su-di-me, ecc.)
│   ├── immagini/{slug}/            ← Immagini originali scaricate
│   └── indice_blog.json            ← Indice completo di tutti i post
│
├── sito/                           ← Contenuto grezzo pinosoprano.it
│   ├── chef/ricette/{slug}/        ← HTML ricette + immagini originali
│   ├── pianista/{galleria}/        ← HTML gallerie + immagini originali
│   ├── piano-hot/                  ← HTML + Piano1.jpg … Piano99.jpg
│   └── indice_sito.json            ← Indice completo del sito statico
│
└── scripts/
    ├── download_blog.py            ← Scarica WordPress via RSS + scraping
    ├── download_sito.py            ← Scarica pinosoprano.it via scraping
    ├── clean_articles.py           ← Pulisce boilerplate WordPress dai .md
    └── build_site.py               ← (OBSOLETO) generava index.html — NON usare più
```

---

## Il File Principale: `website/index.html`

**Tutto il sito è in questo singolo file.** Non usare `build_site.py`.

### Struttura interna di `index.html`

```
<head>
  link → css/style.css
  (nessuna altra dipendenza esterna obbligatoria; Google Fonts con fallback)

<body>
  <header>           ← Navbar: logo, back-button desktop, hamburger, nav links
  <section.hero>     ← Hero con titolo, citazione rotante, anni

  <!-- SEZIONI (una visibile alla volta via JS) -->
  #section-home      ← Home: 3 card + carosello random
  #section-blog      ← Articoli: filtri categoria, ricerca, griglia card
  #section-ricette   ← Ricette: ricerca, griglia con foto
  #section-pianista  ← Gallerie foto + video YouTube embedded
  #section-chi-sono  ← Biografia
  #section-piano-hot ← Età gate +18, poi griglia 99 foto

  <div#article-overlay>   ← Modale articolo (sopra tutto)
  <div#lightbox>          ← Lightbox immagini (sopra tutto)
  <button#nav-back-mobile> ← Pulsante indietro fisso su mobile
  <footer>

  <script>
    /* === DATI EMBEDDED (JSON inline) === */
    const ARTICLES = [...];   ← 97 articoli (title, date, slug, category, content HTML, link)
    const RECIPES  = [...];   ← ~77 ricette (name, thumb, images[], slug)
    const GALLERIES = [...];  ← 19 gallerie (name, thumb, images[], slug)
    const PIANO_HOT = [...];  ← 99 foto (src, index)
    const ABOUT_HTML = `...`; ← HTML biografia Chi Sono

    /* === LOGICA === */
    // Navigazione
    navigateTo(section)       ← cambia sezione visibile, aggiorna navbar, gestisce history
    goBack()                  ← torna alla sezione precedente

    // Citazioni hero
    rotateQuote()             ← cicla HERO_QUOTES ogni 15s con fade

    // Carosello
    buildCarouselPool()       ← costruisce array di item (articoli+ricette+gallerie)
    cycleCarousel()           ← rimpiazza gli 8 item con nuovi random + avvia timer
    startCarouselTimer()      ← anima la barra di progressione via requestAnimationFrame

    // Articoli
    renderCategoryTabs()      ← crea bottoni filtro categoria con colori
    setCategory(cat)          ← filtra articoli per categoria
    renderArticles()          ← renderizza griglia articoli (con thumbnail, badge colorato)
    openArticle(index)        ← apre modale articolo, converte immagini markdown
    fixMarkdownImages(html)   ← converte ![alt](url) → <img> nell'HTML articolo

    // Ricette / Gallerie / Piano Hot
    renderRecipes()           ← griglia ricette con foto
    renderGalleries()         ← griglia gallerie
    renderPianoHot()          ← griglia 99 foto con età gate
    openGallery(imgs, title)  ← apre lightbox su array di immagini
</script>
```

### Categorie Articoli e Colori

| Chiave interna         | Display              | Colore CSS |
|------------------------|----------------------|------------|
| `filosofia-religione`  | Filosofia & Religione| `#7b68ae`  |
| `informazione`         | Informazione         | `#3a8fb7`  |
| `alimentazione`        | Alimentazione        | `#5a9e6f`  |
| `amore-sensibilita`    | Amore & Sensibilità  | `#c75b7a`  |
| `palestina-israele`    | Palestina-Israele    | `#b8860b`  |
| `poesia`               | Poesia               | `#c49a6c`  |
| `ambiente-animali`     | Ambiente & Animali   | `#2e8b57`  |
| `musica`               | Musica               | `#cd5c5c`  |

---

## CSS: `website/css/style.css`

Design retro-nostalgico con variabili CSS. Variabili principali:

```css
--bg-main: #f5f0e8        ← sfondo carta
--bg-card: #faf7f2        ← card bianche calde
--bg-dark: #2a2018        ← header e hero scuri
--accent: #8b5e3c         ← marrone principale
--accent-warm: #c49a6c    ← oro caldo (logo, link hover)
--font-display: 'Playfair Display', Georgia, serif
--font-body: 'Source Serif 4', Georgia, serif
--font-mono: 'JetBrains Mono', 'Courier New', monospace
```

Sezioni CSS (in ordine nel file):
1. Reset + variabili
2. Layout base (container, header, hero)
3. Sezioni pagina, section-header
4. Schede home (about-content)
5. Carosello (carousel-section, carousel-track, carousel-item, timer-bar)
6. Articoli (articles-grid, article-card, cat-tab, category-tabs)
7. Ricette (recipe-grid, recipe-card)
8. Gallerie (gallery-grid, gallery-card)
9. Piano Hot (piano-grid, piano-item, age-gate)
10. Chi Sono (about-hero, about-tags, about-quote)
11. Modale articolo (article-overlay, article-detail)
12. Lightbox
13. Footer
14. Animazioni (fade-in, cardPop)
15. Responsive (@media max-width: 768px, 480px)

---

## Percorsi Immagini (IMPORTANTI)

Tutti i percorsi sono **relativi alla cartella `website/`**:

| Tipo          | Percorso                              | Esempio                                  |
|---------------|---------------------------------------|------------------------------------------|
| Ricette       | `assets/ricette/{slug}/{file}`        | `assets/ricette/spaghetti/foto.jpg`      |
| Gallerie      | `assets/gallerie/{slug}/{file}`       | `assets/gallerie/gigi-proietti/1.jpg`    |
| Piano Hot     | `assets/piano-hot/{file}`            | `assets/piano-hot/Piano1.jpg`            |
| Blog          | `assets/blog/{slug}/{file}`           | `assets/blog/la-mamma/rosa.jpg`          |
| Chi Sono      | `assets/blog/pagine_su-di-me/{file}`  | `assets/blog/pagine_su-di-me/anatroccolo1.jpg` |

**Attenzione:** Le ricette NON hanno sottocartella `immagini/` — i file sono direttamente in `assets/ricette/{slug}/`.

---

## Dipendenze Esterne

| Dipendenza       | Tipo         | Note                                          |
|------------------|--------------|-----------------------------------------------|
| Google Fonts     | CSS @import  | Playfair Display, Source Serif 4, JetBrains Mono — fallback: Georgia |
| YouTube          | iframe embed | 3 video nella sezione Pianista                |
| Link footer      | `<a target=_blank>` | Link al blog e sito originali — non funzionali |

Il sito **funziona offline** con font di sistema grazie ai fallback.

---

## Come Aggiungere / Modificare Contenuti

### Aggiungere un articolo manualmente
Trovare `const ARTICLES = [` in `index.html` e aggiungere un oggetto:
```js
{
  "title": "Titolo Articolo",
  "date": "2012-05-01",
  "slug": "titolo-articolo",
  "category": "filosofia-religione",   // usa chiave interna dalla tabella sopra
  "categories": ["Filosofia"],
  "link": "https://pinosoprano.wordpress.com/...",
  "content": "<p>Testo HTML...</p>"
}
```

### Modificare la biografia (Chi Sono)
Trovare `const ABOUT_HTML = \`` in `index.html` e modificare il testo tra i backtick.

### Aggiungere citazioni hero
Trovare `const HERO_QUOTES = [` e aggiungere stringhe all'array.

### Modificare colori categoria
In `style.css` cercare `.cat-tab[data-cat="..."]` e cambiare il valore del colore.
In `index.html` cercare `const CAT_COLORS = {` per i badge nelle card.

---

## Script di Download (solo per riscaricare i contenuti originali)

```bash
cd C:\Users\cammo\Desktop\Pino
pip install requests beautifulsoup4 html2text lxml

# Scarica blog WordPress
python scripts/download_blog.py

# Pulisce boilerplate dagli articoli
python scripts/clean_articles.py

# Scarica sito statico
python scripts/download_sito.py
```

Dopo il download, i contenuti grezzi sono in `blog/` e `sito/`.
Per rigenerare `index.html` da zero, usare `scripts/build_site.py` (ma poi modificare sempre index.html direttamente).

---

## Note Tecniche

- **Nessun framework**: vanilla JS + CSS custom, nessun build step
- **Dati embedded**: i JSON sono inline in `<script>` — no fetch, funziona offline
- **Navigazione**: sezioni mostrate/nascosta via `display` e classe `.active`, senza routing
- **Age gate Piano Hot**: variabile `ageVerified` in memoria — si resetta al refresh
- **Carosello**: pool di tutti gli item (articoli+ricette+gallerie), cicla ogni 15s senza ripetizioni, timer barra visibile
- **Articoli**: il contenuto è HTML già convertito da Markdown; le immagini residue in formato `![alt](url)` vengono convertite al volo da `fixMarkdownImages()` in apertura
