import express from 'express';
import passport from 'passport';
import LocalStrategy from 'passport-local';
import session from 'express-session';
import cors from 'cors';
import {
  getUser, getUserById, updateBestScore,
  getLines, getStations, getLineStations, getSegments, getDistance,
  getRandomEvent,
  saveGameResult, getLeaderboard,
  initDatabase, getUserGameHistory
} from './dao.js';

const app = express();
const PORT = 3001;
const CLIENT_URL = 'http://localhost:5173'; 


app.use(express.json());
app.use(cors({ 
  origin: CLIENT_URL,
  credentials: true //permette al browser di inviare cookie e credenziali con le richieste cross-origin altrimenti il server non ricorderebbe mai chi è l'utente 
}));

app.use(session({
  secret: "shh-its-a-secret", 
  resave: false,            //impedisce al server di creare sessioni 
  saveUninitialized: false, //vuote o di riscreverle se non sono cambiate, ottimizzando
  cookie: {
    secure: false,//Il browser invierà il cookie su qualsiasi tipo di connessione, sia HTTP che HTTPS.
    httpOnly: true,  //impedisce al client di accedere ai cookie tramite JavaScript, riducendo il rischio di attacchi XSS (cross-site scripting)
    maxAge: 24 * 60 * 60 * 1000 //imposta la durata del login a 24 ore
  }
}));

app.use(passport.initialize()); // middelware che gestisce le strategie di login 
app.use(passport.session()); ////collega passport alla sessione, quando arriva una richiesta, passport controlla se c'è un utente loggato nella sessione e lo aggiunge a req.user, altrimenti req.user sarà undefined

passport.use(new LocalStrategy(async (username, password, cb) => {
  try {
    const user = await getUser(username, password); //cerca l'utente nel database e verifica la password
    if (!user) //se non trova l'utente o la password 
      return cb(null, false, { message: "Invalid username or password" });//L'autenticazione è fallita. Il primo parametro null indica che non ci sono stati errori tecnici, false indica che l'utente non è valido e l'oggetto messaggio spiega perché.
    return cb(null, user);//L'autenticazione è avvenuta con successo. Il server ora "conosce" l'utente.
  } catch (err) {
    return cb(err);
  }
}));

//Serve a serializzare l'utente nella sessione, riducendo l'oggetto utente completo a un identificativo univoco
passport.serializeUser((user, cb) => {
  cb(null, user.id);  //Salva l'ID dell'utente nella sessione, in modo che possa essere recuperato in seguito
});

//Serve a deserializzare l'utente dalla sessione, recuperando l'oggetto utente completo dal database usando l'ID salvato nella sessione
//Quando un utente, dopo essersi loggato, naviga in una pagina protetta
//Passport legge l'ID contenuto nel cookie.
//Passport chiama automaticamente deserializeUser(id, cb).
//l risultato viene assegnato a req.user, rendendo i dati dell'utente disponibili in tutte le tue rotte API.
passport.deserializeUser(async (id, cb) => {
  try {
    const user = await getUserById(id);
    cb(null, user); 
  } catch (err) {
    cb(err);
  }
});

//controlla se l'utente ha il permesso 
const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) //È una funzione che Passport.js aggiunge automaticamente all'oggetto req. Verifica se esiste una sessione valida e se l'utente è stato correttamente deserializzato.
    return next();
  return res.status(401).json({ error: "Not authorized" });
};

//Rotte per la gestione delle sessioni e dell'autenticazione 
app.post("/api/sessions", passport.authenticate("local")//quando arriv ala richiesta post /api/sessions, passport esegue la strategia di autenticazione locale definita in precedenza, che verifica username e password. Se l'autenticazione ha successo, internamente invoca re.login() la funzione callback viene eseguita, altrimenti viene restituito un errore 401 Unauthorized
  , function(req, res) {
  return res.status(201).json(req.user);
});

// senza questa rotta, il client non saprebbe se l'utente è loggato o meno, perché la sessione è gestita tramite cookie e non viene inviato alcun dato al client
//ricaricamento della pagina, protezione delle rotte
app.get("/api/sessions/current", (req, res) => {
  if(req.isAuthenticated()) {
    res.json(req.user);
  } else {
    res.status(401).json({ error: "Not authenticated" });
  }
});

//
app.post('/api/auth/login', passport.authenticate('local'), (req, res) => {
  res.json({ success: true, user: { id: req.user.id, username: req.user.username } });
});

/*
app.post('/api/auth/logout', (req, res, next) => {
  req.logout((err) => {//rimuove l'utente req.uesr, cancella la sessione e rimuove il cookie di sessione dal browser
    if (err) 
      return next(err);
    res.json({ success: true });
  });
});*/

app.delete("/api/sessions/current", (req, res) => {
  req.logout((err) => {//rimuove l'utente req.uesr, cancella la sessione e rimuove il cookie di sessione dal browser
    if(err)
        return next(err);
    res.end();
  });
});

//questa rotta serve al client per sapere se l'utente è loggato o meno
//quando il client fa una richiesta GET a /api/auth/me, il server controlla 
// se l'utente è autenticato tramite req.isAuthenticated() e restituisce le 
// informazioni dell'utente loggato o null se non è loggato quindi restituisce sempre un 
//oggetto JSON valido
app.get('/api/auth/me', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ user: { id: req.user.id, username: req.user.username } });
  } else {
    res.json({ user: null });
  }
});


app.get('/api/network', async (req, res) => {
  try {
    const [lines, stations, lineStations] = await Promise.all([//invece di aspettare una alla volta, Promise.all permette di eseguire più operazioni asincrone in parallelo e attendere che tutte siano completate
      getLines(), getStations(), getLineStations()
    ]);
    
    const linesWithStations = lines.map(line => ({//itera su ogni linea 
      ...line,
      stations: lineStations //"Oltre ai dati che hai appena copiato con i tre puntini, aggiungi una nuova voce che si chiama stations, e il suo valore sarà il risultato di quel filtraggio e ordinamento".
        .filter(ls => ls.line_id === line.id)//isola le stazioni che appartengono a quella linea
        .sort((a, b) => a.position - b.position)//ordine giusto
        .map(ls => ls.station_id) //pulla solo gli id delle stazioni
    })); 
    /*const lineWithStations = {
        ...line,                             // 1. Copia i dati vecchi
        stations: [ "Stazione A", "Stazione B" ] // 2. Aggiunge i dati nuovi
      };
      {
        id: 1,
        name: "Linea Rossa",
        stations: [ "Stazione A", "Stazione B" ] // <-- Creata e aggiunta sul momento!
      }
      */
    
    res.json({ lines: linesWithStations, stations });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/segments', async (req, res) => {
  try {
    const segments = await getSegments();//interroga il DB per ottenere la lista di tutti i segmenti
    res.json(segments.map((s, i) => ({ ...s, id: i + 1 }))); // copia i dati del segmento e aggiunge un id progressivo partendo da 1
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/game/start', isLoggedIn/*solo utenti autenticati*/, async (req, res) => {
  try {
    const allStations = await getStations();
    
    let startStation, endStation;
    for (let attempts = 0; attempts < 100; attempts++) {
      startStation = allStations[Math.floor(Math.random() * allStations.length)]; //sceglie una stazione a caso di partenza
      endStation = allStations[Math.floor(Math.random() * allStations.length)];//sceglie una stazione a caso di arrivo
      if (startStation.id !== endStation.id) {
        const dist = await getDistance(startStation.id, endStation.id); //Calcola la distanza tra le due stazioni
        if (dist >= 3 && dist !== Infinity) //impone la ditanza minima di 3
          break;
      }
    }
    
    if (!endStation || startStation.id === endStation.id) { // Se dopo 100 tentativi non è riuscito a trovare due stazioni valide, prende la prima e l'ultima stazione della lista
      startStation = allStations[0];
      endStation = allStations[allStations.length - 1];
    }
    
    req.session.game = {
      startStation,
      endStation,
      coins: 20,
      startTime: Date.now()
    };
    
    res.json({ 
      success: true, 
      startStation, 
      endStation,
      message: 'Game started!'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.post('/api/game/submit', isLoggedIn, async (req, res) => {
  try {
    const { route } = req.body;
    const game = req.session.game;
    
    if (!game) //verifica della sessione se l'utente ha iniziato una partita, se non c'è partita (non ha premuto su /api/game/start) attiva restituisce un errore 400
      return res.status(400).json({ error: 'Nessuna partita attiva' });
    
    
    const isValid = validateRoute(route, game.startStation.id, game.endStation.id); //controlla se il percorso che l'array route inviato dal client sia un percorso continuo, valido e che colleghi effettivamente le due stazioni
    
    if (!isValid || !route || route.length === 0) {
      // Se il percorso è invalido, salviamo subito 0 punti sul DB per l'utente loggato
      if (req.user) {
        await saveGameResult(req.user.id, 0);
        await updateBestScore(req.user.id, 0);
      }
      req.session.game = null;
      return res.json({ success: false, invalid: true, steps: [] });
    }
    
    const steps = [];
    let coins = game.coins;
    //simula il viaggio segmento per segmento 
    for (const segment of route) {
      const event = await getRandomEvent();
      coins += event.effect;
      steps.push({//accumula la cronologia del viaggio fermata per fermata registrando cos'è successo
        from: segment.stationAName,
        to: segment.stationBName,
        event: event.description,
        effect: event.effect,
        coins: Math.max(0, coins)
      });
    }
    
    const finalScore = Math.max(0, coins);
    req.session.game.steps = steps;
    req.session.game.finalCoins = finalScore;
    
    if (req.user) {
      console.log(`[SUBMIT] Salvataggio preventivo per ${req.user.username}: ${finalScore} monete`);
      await saveGameResult(req.user.id, finalScore);
      await updateBestScore(req.user.id, finalScore);
    }
    
    res.json({ success: true, steps, invalid: false });
  } catch (err) {
    console.error("Error during /api/game/submit:", err.message);
    res.status(500).json({ error: err.message });
  }
});

//verifica che il percorso inviato dal client sia continuo e colleghi effettivamente la stazione di partenza a quella di arrivo, senza interruzioni.
function validateRoute(route, startId, endId) {
  if (!route || route.length === 0) 
    return false;
  
  const first = route[0]; //Controlla che una delle sue estremità corrisponda alla stazione di partenza
  if (Number(first.stationA) !== Number(startId) && Number(first.stationB) !== Number(startId)) 
    return false;
  
  const last = route[route.length - 1];
  if (Number(last.stationA) !== Number(endId) && Number(last.stationB) !== Number(endId)) 
    return false;
  //si deve capire in che direzione si sta muovendo, Se il primo binario va da A a B, e la partenza era A, la prossima stazione in cui il treno si troverà sarà B.
  let currentStation = Number(first.stationA) === Number(startId) ? Number(first.stationB) : Number(first.stationA);
  //analizza tutti i segmenti successivi (dall'indice 1 alla fine) per verificare che siano tutti agganciati l'uno all'altro:
  for (let i = 1; i < route.length; i++) {
    const seg = route[i];
    const sA = Number(seg.stationA);
    const sB = Number(seg.stationB);
    if (sA !== currentStation && sB !== currentStation) {
      return false;
    }
    currentStation = sA === currentStation ? sB : sA;
  }
  
  return currentStation === Number(endId);
}

//Gestisce l'abbandono o la pulizia espicita della parita, cancellare la partita in corso dalla sessione
app.post('/api/game/finish', isLoggedIn, async (req, res) => {
  try {
    req.session.game = null; //rimuove l'oggetto temporaneo della partita dalla sessione, assicurando che non ci siano dati residui per la prossima partita, impedisce che vengano effettuare chiamate submit fantasma su una partita che l'utente ha esplicitamente deciso di chiudere
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.get('/api/user/profile', isLoggedIn, async (req, res) => {
  try {
    //recupero della storia delle partite 
    const history = await getUserGameHistory(req.user.id);
    //dati dell'utente
    const userRow = await getUserById(req.user.id);
    //somma di tutti i punteggi ottenuti dall'utente
    const sumScore = history.reduce((sum, game) => sum + game.score, 0);//sum parte da 0
    
    //se non esiste 
    if (!userRow) {
      return res.status(404).json({ error: "User didn't find." });
    }
    
    res.json({
      username: userRow.username,
      totalCredits: sumScore, 
      bestScore: userRow.best_score || 0,
      gamesPlayed: history.length,
      history: history
    });

    //esempio struttura risposta:
    /* 
    {
      "username": "Mario",
      "totalCredits": 350,
      "bestScore": 45,
      "gamesPlayed": 12,
      "history": [
        { "id": 1, "score": 20, "date": "2026-06-15" },
        { "id": 2, "score": 25, "date": "2026-06-16" }
      ]
    }*/
  } catch (err) {
    console.error("Errore nel caricamento profilo:", err);
    res.status(500).json({ error: err.message });
  }
});

//serve a recuperare il risultato finale della partita appena conclusa, direttamente dai dati temporanei salvati nella sessione utente
app.get('/api/game/result', isLoggedIn, (req, res) => {
  const game = req.session.game;
  res.json({ score: game?.finalCoins ?? 0 , message: game?.message ?? "Game completed"});
  //game?.finalCoins : Il punto di domanda dice: 
  // Se l'oggetto game esiste, prendi la proprietà finalCoins. Se game è null o undefined, 
  // fermati subito e restituisci undefined invece di andare in crash.
  //?? 0 se il pezzo a sinistra è undefined o null impostano un valore di default
  // se game non esisere 0, se dame.message non esisre diventa "Game completed"
});


app.get('/api/leaderboard',async (req, res) => {
  try {
    const leaderboard = await getLeaderboard(10); //prende i primi 10
    res.json(leaderboard);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//avvio del server, dove si coordina l'inizializzazione dei servizi prima di iniziare ad accettare le richieste
const start = async () => {
  await initDatabase();//con await si blocca l'esecuzione della funzione fino a quando la configurazione delle tabelle e la connessione al DB non è terminata 
  app.listen(PORT, () => {
    console.log(`Server Last Race attivo su http://localhost:${PORT}`);
  });
};

start();