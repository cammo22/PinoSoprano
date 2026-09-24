/**
 * PINO SOPRANO — le visite guidate (NOVITÀ DaProd)
 *
 * Regole con cui sono scritte:
 *  - «testo»: il racconto della guida (DaProd). Dice solo cose ricavabili dai contenuti del sito.
 *  - «contesto»: fatti storici verificabili sull'epoca (date, luoghi, nomi).
 *  - «citazione»: parole TESTUALI prese dagli articoli o dal «Chi sono». Il campo «di» dice chi le ha scritte:
 *      "pino"  = scritte da Pino (firmate o nella sua pagina personale)
 *      "altri" = testi di altri autori che Pino ha pubblicato sul blog (l'autore è nella fonte)
 *      "blog"  = testi pubblicati sul blog senza firma
 *    «slug» indica l'articolo da cui è presa (le prove automatiche controllano che il testo ci sia davvero);
 *    slug "about" = la pagina «Chi sono».
 *  - «azioni»: articolo | galleria | sezione | brano | visita
 */
"use strict";

const VISITE = [
  {
    id: "vita", titolo: "Una vita tra note e pensieri", sottotitolo: "Dal 1965 all'ultimo articolo del blog, nel 2013", icona: "🕰️", colore: "cia", musica: "notturno",
    tappe: [
      {
        anno: "1965", titolo: "Classe 1965", img: "assets/blog/pagine_su-di-me/anatroccolo1.jpg", didascalia: "L'immagine della sua pagina «Chi sono»",
        testo: "Pino si presentava così, in due parole: «Classe 1965». È l'inizio della pagina «Chi sono» del suo blog, dove racconta in poche righe studi, passioni e carattere. Questa visita segue quella pagina e i suoi articoli, tappa per tappa.",
        contesto: "Nel 1965 l'Italia usciva dagli anni del «miracolo economico». La televisione aveva due soli canali RAI e la sera, prima di andare a dormire, c'era Carosello, in onda dal 1957 al 1977.",
        citazione: { testo: "Classe 1965, ho studiato Assistente Sociale, strimpello un po' il Pianoforte, non appartengo ad alcuna religione, ho fatto studi classici, ho letto molta filosofia e tuttora la seguo con molto interesse.", fonte: "Pino Soprano, «Chi sono»", di: "pino", slug: "about" },
        azioni: [{ tipo: "sezione", id: "chi-sono", label: "Apri «Chi sono»" }]
      },
      {
        anno: "Gli studi", titolo: "Studi classici, filosofia, servizio sociale", icona: "📚",
        testo: "Studi classici, tanta filosofia letta e seguita «con molto interesse», e la formazione da Assistente Sociale. La cura per gli altri, uomini e animali, è il filo che lega quasi tutto quello che ha scritto e condiviso.",
        contesto: "In Italia la professione di assistente sociale ha avuto il suo albo professionale con la legge n. 84 del 1993.",
        citazione: { testo: "Sono tendenzialmente un non-violento, caratterialmente sembro un orso ma fondamentalmente sono un agnellino, combatto la violenza gratuita, i luoghi comuni, la poca considerazione che si ha del prossimo e la scarsa importanza che si da' alla vita ed agli esseri viventi.", fonte: "Pino Soprano, «Chi sono»", di: "pino", slug: "about" },
        azioni: [{ tipo: "articolo", slug: "omosessualita-e-democrazia", label: "Leggi la sua introduzione a «Omosessualità e democrazia»" }]
      },
      {
        anno: "Il pianoforte", titolo: "«Strimpello un po' il Pianoforte»", img: "assets/gallerie/reginella/Reginella1.jpg", didascalia: "Dalla galleria «Reginella» del suo sito",
        testo: "Lui diceva di «strimpellare un po'». Le gallerie del suo sito raccontano altro: serate al pianoforte e incontri con nomi amatissimi dello spettacolo italiano, da Gigi Proietti a Roberto Murolo, da Luciano De Crescenzo a Tullio De Piscopo.",
        contesto: "Franco Franchi, che ha una galleria tutta sua, è scomparso nel dicembre 1992: alcune di queste foto, stampate su carta e poi digitalizzate, vengono da lontano.",
        azioni: [{ tipo: "visita", id: "pianista", label: "Visita: il pianista e le sue serate" }, { tipo: "galleria", slug: "reginella", label: "Apri la galleria «Reginella»" }]
      },
      {
        anno: "La musica", titolo: "Quello che lo commuoveva", icona: "🎻",
        testo: "Nel «Chi sono» c'è un elenco prezioso: le cose che lo commuovevano. Tra i bambini e gli animali ci sono Beethoven, Verdi due volte e Napoli.",
        contesto: "La Nona Sinfonia di Beethoven debuttò a Vienna il 7 maggio 1824; il Rigoletto di Verdi alla Fenice di Venezia l'11 marzo 1851; La forza del destino a San Pietroburgo il 10 novembre 1862.",
        citazione: { testo: "Mi commuovo alla sensibilita' dei bambini, agli animali innocenti, ad un tappeto di archi, alla Nona di Beethoven, al Rigoletto, alla Forza del Destino, ad alcune canzoni classiche napoletane...", fonte: "Pino Soprano, «Chi sono»", di: "pino", slug: "about" },
        azioni: [{ tipo: "brano", id: "gioia", label: "Ascolta l'Inno alla gioia (dalla Nona)" }, { tipo: "brano", id: "notturno", label: "Un notturno napoletano, improvvisato" }]
      },
      {
        anno: "4 dicembre 2010", titolo: "La sua playlist «in continuo aggiornamento»", icona: "🎷",
        testo: "Sul blog pubblica una lista di brani da ascoltare, «in continuo aggiornamento»: jazz, smooth jazz e grandi voci, da Keith Jarrett a Shirley Bassey, da Michel Camilo a un notturno di Chopin. Sembra la scaletta ideale di una serata al piano bar.",
        contesto: "Bill Evans registrò «Waltz for Debby» dal vivo al Village Vanguard di New York nel 1961, con Scott LaFaro e Paul Motian: è uno dei dischi di pianoforte jazz più amati di sempre.",
        citazione: { testo: "Bill Evans – Waltz For Debby", fonte: "dalla sua playlist «In continuo aggiornamento…», 4 dicembre 2010", di: "pino", slug: "smooth-jazz" },
        azioni: [{ tipo: "articolo", slug: "smooth-jazz", label: "Apri la playlist" }, { tipo: "brano", id: "pianobar", label: "Ascolta il piano bar dal vivo" }]
      },
      {
        anno: "pinosoprano.it", titolo: "Il suo sito: ricette, gallerie, Piano Hot", img: "assets/ricette/arancini1/1.jpg", didascalia: "Arancini, dalle sue ricette",
        testo: "Accanto al blog c'era il suo sito personale, pinosoprano.it: le ricette vegane fotografate piatto per piatto, le gallerie del pianista, la sezione di fotografia artistica «Piano Hot» e un lungo dossier sulla sorveglianza globale, «Il Grande Fratello».",
        contesto: "In questo revamp ci sono tutte: 77 ricette con le loro foto, 19 gallerie e le 99 opere di Piano Hot, oggi dentro il Piano Hot Club.",
        azioni: [{ tipo: "sezione", id: "ricette", label: "Sfoglia le ricette" }, { tipo: "articolo", slug: "il-grande-fratello", label: "Apri «Il Grande Fratello»" }]
      },
      {
        anno: "27 novembre 2010", titolo: "Nasce il blog", img: "assets/blog/lettera-di-un-deportato/dachau1.jpg", didascalia: "Dall'articolo «Lettera di un deportato»",
        testo: "Il blog pinosoprano.wordpress.com parte con quattro articoli nello stesso giorno. I temi ci sono già tutti: la lettera di un deportato di Dachau che spiega perché non mangia carne, il celebre «Odio gli indifferenti» di Antonio Gramsci, l'alimentazione, la religione.",
        contesto: "Il giorno dopo, il 28 novembre 2010, WikiLeaks comincia a pubblicare i cablogrammi della diplomazia americana. Sono gli anni in cui blog e social iniziano a fare concorrenza a giornali e televisioni.",
        citazione: { testo: "Odio gli indifferenti. Credo che “vivere vuol dire essere partigiani”.", fonte: "Antonio Gramsci, «Indifferenti» (1917), pubblicato da Pino il 27 novembre 2010", di: "altri", slug: "lindifferenza" },
        azioni: [{ tipo: "articolo", slug: "lettera-di-un-deportato", label: "Leggi «Lettera di un deportato»" }, { tipo: "articolo", slug: "lindifferenza", label: "Leggi «L'indifferenza»" }]
      },
      {
        anno: "Dicembre 2010", titolo: "Un fiume di parole", icona: "📝",
        testo: "Tra il 27 novembre e il 31 dicembre 2010 escono 61 articoli: vegetarianesimo, animali, religione, Palestina, informazione. Molti sono testi di altri autori che sceglie e rilancia; alcuni li firma lui. Come questo, sul caso «mucca pazza».",
        contesto: "L'encefalopatia spongiforme bovina, la «mucca pazza», esplose nel Regno Unito tra gli anni '80 e '90. In Italia il primo caso in un bovino nato nel Paese fu accertato all'inizio del 2001.",
        citazione: { testo: "I politici ed i Media devono sapere che è sempre maggiore il numero di coloro che tengono alle sofferenze degli animali ed al benessere dell’ambiente e che questi saranno la voce di chi non può parlare e saranno le grida di chi non può gridare.", fonte: "Pino Soprano, «Il tragico silenzio della mucca pazza», 12 dicembre 2010", di: "pino", slug: "il-tragico-silenzio-della-mucca-pazza" },
        azioni: [{ tipo: "articolo", slug: "il-tragico-silenzio-della-mucca-pazza", label: "Leggi l'articolo" }, { tipo: "sezione", id: "blog", label: "Tutti gli articoli" }]
      },
      {
        anno: "2011", titolo: "Il mondo visto dal blog", img: "assets/blog/la-gente-vuole-sognare/westminster-abbey.jpg", didascalia: "Dall'articolo «La gente vuole sognare»",
        testo: "Nel 2011 il ritmo rallenta, 21 articoli in tutto, ma il blog segue da vicino l'attualità: il matrimonio reale, la crisi economica, la beatificazione di Giovanni Paolo II, i referendum di giugno.",
        contesto: "29 aprile 2011: William e Kate si sposano nell'abbazia di Westminster. 1° maggio 2011: Giovanni Paolo II viene beatificato a Roma. 12 e 13 giugno 2011: gli italiani votano quattro referendum, su acqua, nucleare e legittimo impedimento, e il quorum viene raggiunto.",
        citazione: { testo: "ANDATE A VOTARE IL 12-13 GIUGNO", fonte: "«Passaparola», testo di Luigi Parisi rilanciato da Pino il 10 maggio 2011", di: "altri", slug: "823" },
        azioni: [{ tipo: "articolo", slug: "la-gente-vuole-sognare", label: "«La gente vuole sognare»" }, { tipo: "articolo", slug: "823", label: "«Passaparola»" }, { tipo: "articolo", slug: "wojtyla-il-papa-che-ha-fallito", label: "«Wojtyla, il papa che ha fallito»" }]
      },
      {
        anno: "2012", titolo: "Satira, danza e tenerezza", icona: "💃",
        testo: "Nel 2012 gli articoli sono 14: undici post critici sulle religioni pubblicati tutti il 18 aprile, i video dei campioni di West Coast Swing e, a giugno, una lista di piccoli gesti per rendere felice la persona amata.",
        contesto: "Il 29 novembre 2012 l'Assemblea generale dell'ONU riconosce alla Palestina lo status di Stato osservatore non membro: un tema a cui il blog aveva dedicato molti articoli fin dal 2010.",
        citazione: { testo: "parlare e ascoltare, in due, è come darsi e ricevere, le parole penetrano anche loro… è un altro modo straordinario di fare l’amore.", fonte: "«Qualche consiglio sulla sessualità», 2 giugno 2012", di: "blog", slug: "qualche-consiglio-per-la-sessualita" },
        azioni: [{ tipo: "articolo", slug: "weast-coast-swing-2", label: "«West Coast Swing»" }, { tipo: "articolo", slug: "palestina-riconoscimento-di-uno-stato", label: "«Palestina: riconoscimento di uno stato»" }]
      },
      {
        anno: "25 agosto 2013", titolo: "L'ultimo articolo", img: "assets/blog/una-fine-serena-e-possibile/1.jpg", didascalia: "Dall'articolo «Una fine serena è possibile»",
        testo: "L'ultimo articolo del blog è una lettera a cui risponde il filosofo Umberto Galimberti, sulla possibilità di una fine serena. Dentro c'è una frase di Platone che è anche una delle citazioni di questo sito.",
        contesto: "La lettera parte dalla morte dell'astrofisica Margherita Hack, il 29 giugno 2013, e ricorda Rita Levi-Montalcini, premio Nobel per la medicina, scomparsa il 30 dicembre 2012.",
        citazione: { testo: "Una vita senza ricerca non è degna di essere vissuta", fonte: "Platone, citato nella lettera a Umberto Galimberti, pubblicata il 25 agosto 2013", di: "altri", slug: "una-fine-serena-e-possibile" },
        azioni: [{ tipo: "articolo", slug: "una-fine-serena-e-possibile", label: "Leggi l'ultimo articolo" }]
      },
      {
        anno: "29 marzo 2015", titolo: "La musica continua", img: "assets/gallerie/compleanniquater1/Compleanni al Quater29 29.3.2015.jpg", didascalia: "Dalla galleria «Compleanno ai Quartieri»",
        testo: "Tra le gallerie c'è anche una festa di compleanni del 29 marzo 2015 (la data è scritta nel nome della foto): chitarre, voci, una tastiera. Musica dal vivo, tra amici.",
        azioni: [{ tipo: "galleria", slug: "compleanniquater1", label: "Apri la galleria" }]
      },
      {
        anno: "Oggi", titolo: "Per ricordarlo", icona: "✦",
        testo: "Questo revamp raccoglie quello che Pino ha scritto, condiviso, cucinato e suonato, perché non vada perso. In oro trovi le sue cose, così come le aveva pubblicate; in neon le novità aggiunte da DaProd per farle rivivere.",
        citazione: { testo: "Intimamente gioisco quando conosco persone sensibili, quando capitano belle cose alle persone che stimo e voglio bene, quando immagino un futuro senza crudelta', ...", fonte: "Pino Soprano, «Chi sono»", di: "pino", slug: "about" },
        azioni: [{ tipo: "sezione", id: "flusso", label: "Scorri i suoi pensieri" }, { tipo: "sezione", id: "sala", label: "Entra nella Sala Pianoforte" }]
      }
    ]
  },

  {
    id: "pianista", titolo: "Il pianista e le sue serate", sottotitolo: "Le 19 gallerie del suo sito, una per una", icona: "🎹", colore: "mag", musica: "pianobar",
    tappe: [
      {
        anno: "Le serate", titolo: "Una sezione intera per il pianista", img: "assets/gallerie/reginella/Reginella2.jpg", didascalia: "Dalla galleria «Reginella»",
        testo: "Il suo sito dedicava una sezione intera al pianista: 19 gallerie di foto, molte stampate su carta e poi digitalizzate, con attori, cantanti, musicisti e sportivi incontrati nelle serate.",
        azioni: [{ tipo: "sezione", id: "pianista", label: "Apri tutte le gallerie" }]
      },
      {
        anno: "Roberto Murolo", titolo: "La voce della canzone napoletana", img: "assets/gallerie/robertomurolo/SKMBT_C45109073114043.jpg", didascalia: "Dalla galleria «Roberto Murolo»",
        testo: "Nel «Chi sono» Pino scrive che si commuoveva ad alcune canzoni classiche napoletane. In una delle sue gallerie c'è Roberto Murolo, che quelle canzoni le ha custodite per tutta la vita.",
        contesto: "Roberto Murolo (Napoli, 1912–2003) ha cantato e inciso centinaia di classici napoletani, accompagnandosi con la chitarra e con un filo di voce.",
        azioni: [{ tipo: "galleria", slug: "robertomurolo", label: "Apri la foto" }, { tipo: "brano", id: "notturno", label: "Ascolta un notturno napoletano" }]
      },
      {
        anno: "Enzo Gragnaniello", titolo: "Due gallerie, una canzone", img: "assets/gallerie/enzogragnaniello/SKMBT_C45109073114030.jpg", didascalia: "Dalla galleria «Enzo Gragnaniello»",
        testo: "Cantautore napoletano, nato nel 1954. Con la galleria precedente ha in comune una canzone.",
        contesto: "Nel 1992 «Cu'mme», scritta da Enzo Gragnaniello, viene incisa da Roberto Murolo insieme a Mia Martini e allo stesso Gragnaniello.",
        azioni: [{ tipo: "galleria", slug: "enzogragnaniello", label: "Apri la foto" }]
      },
      {
        anno: "Luciano De Crescenzo", titolo: "Il filosofo napoletano", img: "assets/gallerie/lucianodecrescenzo/SKMBT_C45109073114010.jpg", didascalia: "Dalla galleria «Luciano De Crescenzo»",
        testo: "Pino amava la filosofia: nella sua galleria non poteva mancare lo scrittore che l'ha raccontata a milioni di italiani.",
        contesto: "Luciano De Crescenzo (Napoli, 1928–2019), ingegnere diventato scrittore con «Così parlò Bellavista» (1977), ha fatto amare la filosofia greca a generazioni di lettori.",
        azioni: [{ tipo: "galleria", slug: "lucianodecrescenzo", label: "Apri la foto" }]
      },
      {
        anno: "Tullio De Piscopo", titolo: "Il ritmo di Napoli", img: "assets/gallerie/tulliodepiscopo/SKMBT_C45109073114031.jpg", didascalia: "Dalla galleria «Tullio De Piscopo»",
        testo: "Due foto con uno dei batteristi più famosi d'Italia.",
        contesto: "Tullio De Piscopo, napoletano, nato nel 1946, porta al Festival di Sanremo del 1988 «Andamento lento».",
        azioni: [{ tipo: "galleria", slug: "tulliodepiscopo", label: "Apri le foto" }]
      },
      {
        anno: "Gigi Proietti", titolo: "Il mattatore", img: "assets/gallerie/gigiproietti/SKMBT_C45109073114061.jpg", didascalia: "Dalla galleria «Gigi Proietti»",
        testo: "Attore, cantante, comico: nella galleria del pianista c'è anche lui.",
        contesto: "Gigi Proietti (Roma, 1940–2020) con lo spettacolo «A me gli occhi, please» (1976) ha scritto una pagina della storia del teatro italiano.",
        azioni: [{ tipo: "galleria", slug: "gigiproietti", label: "Apri la foto" }]
      },
      {
        anno: "Franchi e Ingrassia", titolo: "Una galleria ciascuno", img: "assets/gallerie/francofranchi/SKMBT_C45109073114040.jpg", didascalia: "Dalla galleria «Franco Franchi»",
        testo: "La coppia comica più famosa del cinema popolare italiano ha, nel sito di Pino, due gallerie separate.",
        contesto: "Franco Franchi (1928–1992) e Ciccio Ingrassia (1922–2003), palermitani, hanno girato insieme più di cento film.",
        azioni: [{ tipo: "galleria", slug: "francofranchi", label: "Franco Franchi" }, { tipo: "galleria", slug: "ciccioingrassia", label: "Ciccio Ingrassia" }]
      },
      {
        anno: "Albano e Romina", titolo: "Una coppia sul palco", img: "assets/gallerie/albanoromina/al bano e romina.jpg", didascalia: "Dalla galleria «Albano e Romina»",
        testo: "Una foto con la coppia più famosa della canzone italiana degli anni Ottanta.",
        contesto: "Al Bano e Romina Power, coppia nella vita e sul palco, vincono il Festival di Sanremo del 1984 con «Ci sarà».",
        azioni: [{ tipo: "galleria", slug: "albanoromina", label: "Apri la foto" }]
      },
      {
        anno: "Spettacolo e sport", titolo: "Tutti gli altri incontri", img: "assets/gallerie/maxrosolino/S8001283.JPG", didascalia: "Dalla galleria «Max Rosolino»",
        testo: "E poi Brigitta Boccoli, Joy Salinas, Franco Oppini, il giornalista Fulvio Grimaldi, le preselezioni di Miss Italia, una festa dell'Ordine dei Giornalisti e il nuotatore Massimiliano Rosolino.",
        contesto: "Massimiliano Rosolino, napoletano, ha vinto l'oro olimpico nei 200 metri misti ai Giochi di Sydney 2000. Franco Oppini è uno dei Gatti di Vicolo Miracoli.",
        azioni: [{ tipo: "galleria", slug: "maxrosolino", label: "Max Rosolino" }, { tipo: "galleria", slug: "preselezionimissitalia", label: "Miss Italia" }, { tipo: "galleria", slug: "francooppini", label: "Franco Oppini" }]
      },
      {
        anno: "Reginella", titolo: "Un leggio pieno di spartiti", img: "assets/gallerie/reginella/Reginella1.jpg", didascalia: "Dalla galleria «Reginella»",
        testo: "Una galleria si chiama «Reginella»: un pianoforte, un leggio pieno di spartiti, un albero di Natale.",
        contesto: "«Reginella» è anche il titolo di una celebre canzone napoletana di Libero Bovio e Gaetano Lama, del 1917.",
        azioni: [{ tipo: "galleria", slug: "reginella", label: "Apri le 3 foto" }]
      },
      {
        anno: "Oggi", titolo: "Vederlo e sentirlo suonare", icona: "📺",
        testo: "I video del suo canale YouTube sono nella sezione Pianista. E nella Sala Pianoforte c'è un pianoforte che suona dal vivo, e che puoi suonare anche tu.",
        azioni: [{ tipo: "sezione", id: "pianista", ancora: "video-pianista", label: "Guarda i video" }, { tipo: "sezione", id: "sala", label: "Entra nella Sala Pianoforte" }]
      }
    ]
  },

  {
    id: "cucina", titolo: "La cucina della gentilezza", sottotitolo: "Vegetarianesimo, animali e 77 ricette", icona: "🌱", colore: "menta", musica: "gymnopedie",
    tappe: [
      {
        anno: "27 novembre 2010", titolo: "Il primo giorno del blog", icona: "🥦",
        testo: "Tra i quattro articoli del primo giorno ce n'è uno sull'alimentazione umana. Il cibo e il rispetto per gli animali torneranno in decine di articoli: sono le categorie Alimentazione e Ambiente & Animali.",
        citazione: { testo: "L’uomo è carnivoro?… Falso! L’uomo non è carnivoro.", fonte: "«Uomo ed alimentazione», 27 novembre 2010", di: "blog", slug: "uomo-ed-alimentazione" },
        azioni: [{ tipo: "articolo", slug: "uomo-ed-alimentazione", label: "Leggi l'articolo" }]
      },
      {
        anno: "Dachau, 1945", titolo: "La lettera di un deportato", img: "assets/blog/lettera-di-un-deportato/dachau2.jpg", didascalia: "Dall'articolo «Lettera di un deportato»",
        testo: "Lo stesso giorno Pino pubblica la lettera che un sopravvissuto di Dachau scrisse a un amico per spiegargli perché non mangiava carne.",
        contesto: "Edgar Kupfer-Koberwitz fu deportato nel campo di concentramento di Dachau e vi rimase fino alla liberazione, nella primavera del 1945.",
        citazione: { testo: "io rifiuto di mangiare animali perché non posso nutrirmi con la sofferenza e con la morte di altre creature.", fonte: "Edgar Kupfer-Koberwitz, pubblicato da Pino il 27 novembre 2010", di: "altri", slug: "lettera-di-un-deportato" },
        azioni: [{ tipo: "articolo", slug: "lettera-di-un-deportato", label: "Leggi la lettera" }]
      },
      {
        anno: "29 novembre 2010", titolo: "Una questione d'amore", img: "assets/blog/perche-si-e-vegetariani/cow.jpg", didascalia: "Dall'articolo «Del perché si è vegetariani»",
        testo: "Due giorni dopo arriva un lungo articolo sul vegetarianesimo, che mette al centro non la salute ma l'affetto.",
        citazione: { testo: "Non mangiare carne non è soltanto, né soprattutto, una questione di salute. Si tratta, piuttosto, di una questione d’amore: per gli animali e per la Terra, senza dubbio, ma anche per noi stessi.", fonte: "«Vegetarianesimo», 29 novembre 2010", di: "blog", slug: "vegetariani-e-vegetarianesimo" },
        azioni: [{ tipo: "articolo", slug: "vegetariani-e-vegetarianesimo", label: "Leggi «Vegetarianesimo»" }]
      },
      {
        anno: "12 dicembre 2010", titolo: "Con la sua firma", icona: "✍️",
        testo: "Sul caso «mucca pazza» scrive e firma un articolo suo. Chiude con una frase che vale per tutto il blog.",
        contesto: "In Italia il primo caso di encefalopatia spongiforme bovina in un animale nato nel Paese fu accertato all'inizio del 2001.",
        citazione: { testo: "questi saranno la voce di chi non può parlare e saranno le grida di chi non può gridare.", fonte: "Pino Soprano, «Il tragico silenzio della mucca pazza», 12 dicembre 2010", di: "pino", slug: "il-tragico-silenzio-della-mucca-pazza" },
        azioni: [{ tipo: "articolo", slug: "il-tragico-silenzio-della-mucca-pazza", label: "Leggi l'articolo" }]
      },
      {
        anno: "15 dicembre 2010", titolo: "Il retrogusto amaro", img: "assets/blog/il-retrogusto-amaro-della-mozzarella/bufalini.jpg", didascalia: "Dall'articolo «Il retrogusto amaro della mozzarella»",
        testo: "Due lettere ai giornali sui bufalini maschi, che per il mercato della mozzarella non hanno valore. Il cibo più amato del Sud, visto dalla parte degli animali.",
        citazione: { testo: "Da brava italiana dico “viva la pizza”, ma da persona civile inorridisco di fronte alla notizia del trattamento riservato ai piccoli bufalotti, vittime del mercato della mozzarella di bufala.", fonte: "Lorenza Cevoli, lettera a la Repubblica dell'11/11/2003, pubblicata da Pino", di: "altri", slug: "il-retrogusto-amaro-della-mozzarella" },
        azioni: [{ tipo: "articolo", slug: "il-retrogusto-amaro-della-mozzarella", label: "Leggi l'articolo" }]
      },
      {
        anno: "22 gennaio 2011", titolo: "La carne in provetta", img: "assets/blog/1-milione-di-dollari-per-ottenere-carne-in-vitro/849_a1958.jpg", didascalia: "Dall'articolo sulla carne in vitro",
        testo: "Un articolo su una sfida lanciata dalla PETA: un premio a chi produrrà carne senza allevamenti.",
        contesto: "Il 5 agosto 2013, a Londra, venne presentato e assaggiato il primo hamburger coltivato in laboratorio, dal gruppo del ricercatore olandese Mark Post.",
        citazione: { testo: "ha messo in palio 1 milione di dollari alla prima azienda che riuscirà a realizzare carne “cresciuta in vitro” entro il 2012.", fonte: "«1 milione di dollari per ottenere carne in vitro», 22 gennaio 2011", di: "blog", slug: "1-milione-di-dollari-per-ottenere-carne-in-vitro" },
        azioni: [{ tipo: "articolo", slug: "1-milione-di-dollari-per-ottenere-carne-in-vitro", label: "Leggi l'articolo" }]
      },
      {
        anno: "3 luglio 2011", titolo: "Una nota di Pino", icona: "🍇",
        testo: "Pubblicando un articolo di Silvio Sciurba sul fruttarianesimo, Pino aggiunge una nota per spiegare una sua modifica.",
        citazione: { testo: "Ho aggiunto il termine Vegetarismo al termine Fruttarismo, per una più facile divulgazione di un’alimentazione sana e senza crudeltà", fonte: "Nota di Pino Soprano, 3 luglio 2011", di: "pino", slug: "fruttarianesimo-la-dieta-ideale-dellumanita" },
        azioni: [{ tipo: "articolo", slug: "fruttarianesimo-la-dieta-ideale-dellumanita", label: "Leggi l'articolo" }]
      },
      {
        anno: "In cucina", titolo: "77 creazioni vegane", img: "assets/ricette/arancini1/1.jpg", didascalia: "Arancini, dalle sue ricette",
        testo: "Dalle parole ai piatti: sul suo sito le ricette erano raccontate con le foto, passo dopo passo. Semplici creazioni vegane dal sapore mediterraneo.",
        azioni: [{ tipo: "sezione", id: "ricette", label: "Sfoglia le ricette" }, { tipo: "galleria", slug: "ricetta-caso", label: "Una ricetta a caso" }]
      },
      {
        anno: "29 novembre 2010", titolo: "Fai la tua parte", icona: "🐦",
        testo: "Chiude la visita una piccola storia pubblicata nei primi giorni del blog: un colibrì che vola verso l'incendio con una goccia d'acqua nel becco.",
        citazione: { testo: "Io faccio la mia parte!", fonte: "«Fai la tua parte», 29 novembre 2010", di: "blog", slug: "fai-la-tua-parte" },
        azioni: [{ tipo: "articolo", slug: "fai-la-tua-parte", label: "Leggi la storia" }]
      }
    ]
  },

  {
    id: "voci", titolo: "Le voci che amava", sottotitolo: "Poeti, filosofi e amici pubblicati sul blog", icona: "📜", colore: "viola", musica: "gymnopedie",
    tappe: [
      {
        anno: "Maria Manzo", titolo: "La poetessa del blog", img: "assets/blog/azzuro-cammino/azzurro-cammino.jpg", didascalia: "Dalla poesia «Azzurro cammino»",
        testo: "È la voce più presente tra le poesie del blog: «Novembre» e «Azzurro cammino» il 30 dicembre 2010, una raccolta intitolata «Maria Manzo… conoscerla così…» nell'aprile 2011, «CasAmare d'Autunno» a fine maggio.",
        citazione: { testo: "Libera da inutili orpelli\nvado", fonte: "Maria Manzo, «Azzurro cammino», pubblicata da Pino il 30 dicembre 2010", di: "altri", slug: "azzuro-cammino" },
        azioni: [{ tipo: "articolo", slug: "azzuro-cammino", label: "«Azzurro cammino»" }, { tipo: "articolo", slug: "novembre", label: "«Novembre»" }, { tipo: "articolo", slug: "maria-manzo-conoscerla-cosi", label: "«Conoscerla così»" }]
      },
      {
        anno: "Antonello Greco", titolo: "La mamma, e un bicchiere d'acqua", img: "assets/blog/la-mamma/rosa.jpg", didascalia: "Dalla poesia «La mamma»",
        testo: "Due poesie di Antonello Greco: «Amando lentamente m'annegai», in napoletano, nell'agosto 2011, e «La mamma», nel dicembre 2011.",
        citazione: { testo: "Anche senza pane son sempre giorni sazi.", fonte: "Antonello Greco, «La mamma», pubblicata da Pino il 15 dicembre 2011", di: "altri", slug: "la-mamma" },
        azioni: [{ tipo: "articolo", slug: "la-mamma", label: "«La mamma»" }, { tipo: "articolo", slug: "amando-lentamente-mannegai", label: "«Amando lentamente m'annegai»" }]
      },
      {
        anno: "28 novembre 2010", titolo: "Una scatola di colori", img: "assets/blog/poesia/pace.jpg", didascalia: "Dalla poesia di Tali Sorek",
        testo: "Nei primi giorni del blog, la poesia di una ragazzina: una scatola con pochi colori, e quelli che mancano.",
        contesto: "Il blog la presenta come l'opera di Tali Sorek, tredicenne israeliana di Beersheba.",
        citazione: { testo: "Mi sono seduta e ho dipinto la Pace.", fonte: "Tali Sorek, pubblicata da Pino il 28 novembre 2010", di: "altri", slug: "poesia" },
        azioni: [{ tipo: "articolo", slug: "poesia", label: "Leggi la poesia" }]
      },
      {
        anno: "7 gennaio 2011", titolo: "'Round Midnight", img: "assets/blog/round-midnight/167009_1730144380625_1448962285_31836960_6437522_n.jpg", didascalia: "Dall'articolo «'Round Midnight»",
        testo: "Una poesia notturna, pubblicata col titolo dello standard di Thelonious Monk.",
        contesto: "«'Round Midnight» di Thelonious Monk risale agli anni Quaranta ed è una delle ballad più suonate della storia del jazz. Nella playlist di Pino c'è nella versione di Cassandra Wilson.",
        citazione: { testo: "Buio sulla pelle\nluce dietro gli occhi", fonte: "«'Round Midnight», 7 gennaio 2011", di: "blog", slug: "round-midnight" },
        azioni: [{ tipo: "articolo", slug: "round-midnight", label: "Leggi la poesia" }, { tipo: "brano", id: "pianobar", label: "Un piano bar a mezzanotte" }]
      },
      {
        anno: "15 dicembre 2010", titolo: "Pensieri", icona: "💭",
        testo: "A metà dicembre 2010 il blog pubblica una serie di «pensieri»: Voltaire, Platone, Benjamin Franklin, Leonardo da Vinci, e prima ancora Pulitzer e Nietzsche.",
        citazione: { testo: "Gli amanti che passano la vita insieme, non sanno dire che cosa vogliono l’uno dall’altro.", fonte: "Platone, Simposio 193 c-d, pubblicato da Pino il 15 dicembre 2010", di: "altri", slug: "pensiero-platone" },
        azioni: [{ tipo: "articolo", slug: "pensiero-platone", label: "Platone" }, { tipo: "articolo", slug: "pulitzer-pensiero", label: "Pulitzer" }, { tipo: "articolo", slug: "nietzsche-pensiero", label: "Nietzsche" }]
      },
      {
        anno: "30 novembre 2011", titolo: "Sull'amicizia", img: "assets/blog/sullamicizia/amicizia1.jpg", didascalia: "Dall'articolo «Sull'amicizia»",
        testo: "Un lungo brano del filosofo stoico Epitteto su cosa significa davvero essere amici.",
        contesto: "Epitteto, filosofo greco vissuto tra il I e il II secolo dopo Cristo, era nato schiavo; le sue lezioni ci sono arrivate grazie agli appunti del suo allievo Arriano.",
        citazione: { testo: "Di conseguenza, il saggio solamente può amare.", fonte: "Epitteto, «Diatribe», pubblicato da Pino il 30 novembre 2011", di: "altri", slug: "sullamicizia" },
        azioni: [{ tipo: "articolo", slug: "sullamicizia", label: "Leggi «Sull'amicizia»" }]
      },
      {
        anno: "30 novembre 2010", titolo: "Galimberti", icona: "❤️",
        testo: "Il filosofo Umberto Galimberti torna più volte nel blog: dall'introduzione di Pino a «Omosessualità e democrazia» fino all'ultimo articolo, nel 2013. Qui, due righe sull'amore.",
        citazione: { testo: "Una sorta di rottura di sé perchè l’altro lo attraversi… …questo è l’amore.", fonte: "Umberto Galimberti, «Le cose dell'amore», pubblicato da Pino il 30 novembre 2010", di: "altri", slug: "galimberti" },
        azioni: [{ tipo: "articolo", slug: "galimberti", label: "Leggi" }, { tipo: "articolo", slug: "omosessualita-e-democrazia", label: "«Omosessualità e democrazia»" }]
      },
      {
        anno: "Il motto", titolo: "La neutralità e il silenzio", icona: "🕊️",
        testo: "Nella sua pagina «Chi sono», sopra ogni altra cosa, c'è questa frase. È anche la prima citazione che vedi entrando in questo sito.",
        contesto: "La frase è di Elie Wiesel, sopravvissuto di Auschwitz, dal discorso con cui ricevette il premio Nobel per la pace, nel dicembre 1986.",
        citazione: { testo: "La neutralita aiuta sempre l'oppressore, mai la vittima. Il silenzio incoraggia sempre il torturatore, mai il torturato.", fonte: "dalla pagina «Chi sono»", di: "altri", slug: "motto" },
        azioni: [{ tipo: "sezione", id: "chi-sono", label: "Apri «Chi sono»" }, { tipo: "visita", id: "vita", label: "Visita: una vita tra note e pensieri" }]
      }
    ]
  }
];
