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

// Middleware
app.use(express.json());
app.use(cors({
  origin: CLIENT_URL,
  credentials: true
}));

app.use(session({
  secret: "shh-its-a-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(async (username, password, cb) => {
  try {
    const user = await getUser(username, password);
    if (!user) 
      return cb(null, false, { message: "Invalid username or password" });
    return cb(null, user);
  } catch (err) {
    return cb(err);
  }
}));

passport.serializeUser((user, cb) => {
  cb(null, user.id);
});

passport.deserializeUser(async (id, cb) => {
  try {
    const user = await getUserById(id);
    cb(null, user); 
  } catch (err) {
    cb(err);
  }
});

const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) 
    return next();
  return res.status(401).json({ error: "Not authorized" });
};

app.post("/api/sessions", passport.authenticate("local"), function(req, res) {
  return res.status(201).json(req.user);
});

app.get("/api/sessions/current", (req, res) => {
  if(req.isAuthenticated()) {
    res.json(req.user);
  } else {
    res.status(401).json({ error: "Not authenticated" });
  }
});

app.post('/api/auth/login', passport.authenticate('local'), (req, res) => {
  res.json({ success: true, user: { id: req.user.id, username: req.user.username } });
});

app.post('/api/auth/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.json({ success: true });
  });
});

app.get('/api/auth/me', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ user: { id: req.user.id, username: req.user.username } });
  } else {
    res.json({ user: null });
  }
});

app.get('/api/network', async (req, res) => {
  try {
    const [lines, stations, lineStations] = await Promise.all([
      getLines(), getStations(), getLineStations()
    ]);
    
    const linesWithStations = lines.map(line => ({
      ...line,
      stations: lineStations
        .filter(ls => ls.line_id === line.id)
        .sort((a, b) => a.position - b.position)
        .map(ls => ls.station_id)
    }));
    
    res.json({ lines: linesWithStations, stations });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/segments', async (req, res) => {
  try {
    const segments = await getSegments();
    res.json(segments.map((s, i) => ({ ...s, id: i + 1 })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: GAME
app.post('/api/game/start', isLoggedIn, async (req, res) => {
  try {
    const allStations = await getStations();
    
    let startStation, endStation;
    for (let attempts = 0; attempts < 100; attempts++) {
      startStation = allStations[Math.floor(Math.random() * allStations.length)];
      endStation = allStations[Math.floor(Math.random() * allStations.length)];
      if (startStation.id !== endStation.id) {
        const dist = await getDistance(startStation.id, endStation.id);
        if (dist >= 3 && dist !== Infinity) break;
      }
    }
    
    if (!endStation || startStation.id === endStation.id) {
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
    
    if (!game) return res.status(400).json({ error: 'Nessuna partita attiva' });
    
    const isValid = validateRoute(route, game.startStation.id, game.endStation.id);
    
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
    
    for (const segment of route) {
      const event = await getRandomEvent();
      coins += event.effect;
      steps.push({
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

function validateRoute(route, startId, endId) {
  if (!route || route.length === 0) return false;
  
  const first = route[0];
  if (Number(first.stationA) !== Number(startId) && Number(first.stationB) !== Number(startId)) return false;
  
  const last = route[route.length - 1];
  if (Number(last.stationA) !== Number(endId) && Number(last.stationB) !== Number(endId)) return false;
  
  let currentStation = Number(first.stationA) === Number(startId) ? Number(first.stationB) : Number(first.stationA);
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

app.post('/api/game/finish', isLoggedIn, async (req, res) => {
  try {
    req.session.game = null; 
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/user/profile', isLoggedIn, async (req, res) => {
  try {
    const history = await getUserGameHistory(req.user.id);
    
    const userRow = await getUserById(req.user.id);
    const record=history.reduce((max, game) => game.score > max ? game.score : max, 0);
    
    if (!userRow) {
      return res.status(404).json({ error: "User didn't find in DB." });
    }
    
    res.json({
      username: userRow.username,
      totalCredits: userRow.best_score || 0, 
      bestScore: record,
      gamesPlayed: history.length,
      history: history
    });
  } catch (err) {
    console.error("Errore nel caricamento profilo:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/game/result', isLoggedIn, (req, res) => {
  const game = req.session.game;
  res.json({ score: game?.finalCoins ?? 0 });
});

app.get('/api/leaderboard', async (req, res) => {
  try {
    const leaderboard = await getLeaderboard(10); 
    res.json(leaderboard);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const start = async () => {
  await initDatabase();
  app.listen(PORT, () => {
    console.log(`Server Last Race attivo su http://localhost:${PORT}`);
  });
};

start();