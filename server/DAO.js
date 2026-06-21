import sqlite from 'sqlite3';
import crypto from 'crypto';

const db = new sqlite.Database('database.sqlite', (err) => {
  if (err) throw err;
});


/*si occupa dell'autenticazione dell'utente riceve un username e una password inseriti dall'utente*/
export const getUser = (username, password) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT id, username, password_hash, salt FROM users WHERE username = ?';//esegue una query sulla tabella users 
    db.get(sql, [username], (err, row) => {
      if (err) 
        return reject(err);
      if (!row)              //se non esiste termina e restituisce false
        return resolve(false);
      
      try {
        const salt = row.salt || 'staticsalt';// prende la stringa casuale salt associata a questo utente e se per qualche motivo è assente utilizza quella di default
        
        crypto.scrypt(password, salt, 64, (err, hashedPassword) => {//Prende la password digitata dall'utente in questo momento e la mescola con il salt recuperato dal DB
          if (err) 
            return reject(err);
          const savedHashBuffer = Buffer.from(row.password_hash, 'hex');
          if (crypto.timingSafeEqual(savedHashBuffer, hashedPassword)) { //utilizza timingSafeEqual per confrontare in modo sicuro l'hash della password inserita con quello salvato nel database, evitando attacchi di tipo timing attack,impiega sempre lo stesso identico tempo per fare il controllo, indipendentemente da dove si trova l'errore, neutralizzando questo attacco.
            resolve({ id: row.id, username: row.username }); //se la password è corretta questi dati verranno inseriti nella sessione del server e quindi l'utente sarà considerato loggato
          } else {
            resolve(false);
          }
        });
      } catch (e) {
        reject(e);
      }
    });
  });
};

//query per ottenere l'utente dal DB con id=UserID
export const getUserById = (userId) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT id, username, best_score FROM users WHERE id = ?';
    db.get(sql, [userId], (err, row) => {
      if (err) 
        return reject(err);
      resolve(row ? { id: row.id, 
        username: row.username, 
        best_score: row.best_score } : null);
    });
  });
};


//esegue una query UPDATE per aggiornare il punteggio migliore
export const updateBestScore = (userId, score) => {
  return new Promise((resolve, reject) => {
    const sql = `
      UPDATE users 
      SET best_score = MAX(best_score, ?)
      WHERE id = ?
    `; //sceglie il punteggio migliore 
    db.run(sql, [score, userId], function (err) {
      if (err) return reject(err);
      resolve(this.changes);
    });
  });
};

//prende tutte le linee dalla tabella lines
export const getLines = () => {
  return new Promise((resolve, reject) => {
    db.all('SELECT id, name, color FROM lines', [], (err, rows) => { //ci sono più di una linea per questo db.all
      if (err) 
        return reject(err);
      resolve(rows);
    });
  });
};

//prende tutte le stationi dalla tabella sattionas
export const getStations = () => {
  return new Promise((resolve, reject) => {
    db.all('SELECT id, name FROM stations', [], (err, rows) => {
      if (err) 
        return reject(err);
      resolve(rows);
    });
  });
};

//prende tutte le line_stations dalla tabella line_stations
export const getLineStations = () => {
  return new Promise((resolve, reject) => {
    db.all('SELECT line_id, station_id, position FROM line_stations ORDER BY line_id, position', [], (err, rows) => {//le ordina in base alla linea e alla posizione all'interno della linea 
      if (err) 
        return reject(err);
      resolve(rows);
    });
  });
};

//prende tutte le partite giocate dall'utente con id=userId e le ordina in base a quando è stata giocata
export const getUserGameHistory = (userId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT id, score, played_at 
      FROM games 
      WHERE user_id = ? 
      ORDER BY played_at DESC
    `;
    db.all(sql, [userId], (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
};


export const getSegments = () => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT DISTINCT 
        ls1.station_id as stationA,
        ls2.station_id as stationB,
        s1.name as stationAName,
        s2.name as stationBName
      FROM line_stations ls1 
      JOIN line_stations ls2 ON ls1.line_id = ls2.line_id 
        AND ABS(ls1.position - ls2.position) = 1
      JOIN stations s1 ON ls1.station_id = s1.id
      JOIN stations s2 ON ls2.station_id = s2.id
      WHERE ls1.position < ls2.position
    `; //Prendi una stazione (ls1) e uniscila con un'altra stazione (ls2) a patto che appartengano alla stessa linea (ls1.line_id = ls2.line_id) E che la differenza assoluta tra le loro posizioni sia esattamente uguale a 1 (ABS(...) = 1)
    // WHERE ls1.position < ls2.position senza questa riga il database ti restituirebbe due volte lo stesso 
    // collegamento, una volta come Stazione A ↔ Stazione B e una volta come Stazione B ↔ Stazione A.
    //  Imponendo che la posizione della prima sia minore della seconda, si forza un unico ordine di estrazione, dimezzando le righe inutili.
    db.all(sql, [], (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
};



export const getConnectionGraph = () => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT DISTINCT ls1.station_id as a, ls2.station_id as b
      FROM line_stations ls1
      JOIN line_stations ls2 ON ls1.line_id = ls2.line_id 
        AND ABS(ls1.position - ls2.position) = 1
    `;//qui non è presente la clausola WHERE ls1.position < ls2.position il database restituirà già i collegamenti in entrambe le direzioni (sia coppia A → B che coppia B → A)
    db.all(sql, [], (err, rows) => {
      if (err) 
        return reject(err);
      
      const adj = {};
      //viene chiamata la funzione getStations per ottenere tutte le stazioni,
      //per chiascuna ztazione viene creata una chiave nell'oggetto adj con un array vuoto come valore
      getStations().then(stations => {
        for (const s of stations) 
          adj[s.id] = [];
        //cicla su tutte le stazioni adiacenti 
        for (const c of rows) {
          //Per ogni riga che dice la stazione a è vicina di b
          //Prende l'array dei vicini di a e ci inserisce dentro b (se non era già presente).
          //Prende l'array dei vicini di b e ci inserisce dentro a (se non era già presente).
          if (adj[c.a] && !adj[c.a].includes(c.b)) 
            adj[c.a].push(c.b);
          if (adj[c.b] && !adj[c.b].includes(c.a)) 
            adj[c.b].push(c.a);
        }
        resolve(adj);
        {
        /*  "1": [2, 5],   La stazione 1 ha come vicini diretti la 2 e la 5
            "2": [1, 3],   
            "3": [2, 4],   
            "4": [3],
            "5": [1]*/
}
      }).catch(reject);
    });
  });
};

//serve per calcolare la distanza minima(numero di fermate) tra due stazioni, per farlo si serve della ricerca in ampiezza BFS
export const getDistance = async (startId, endId) => {
  //recupero della mappa 
  const adj = await getConnectionGraph();
  return new Promise((resolve) => {
    //de la stazione di partenza è la stessa di quella di arrivo la distanza è 0, altrimnti si inizia la ricerca in ampiezza
    if (Number(startId) === Number(endId)) 
      return resolve(0);

    const visited = new Set([startId]);//insieme dei visitati , memorizza le stazioni già visitate per evitare cicli
    const queue = [[startId, 0]]; //coda di esplorazione, contiene coppie [stazione, distanza] per tenere traccia della distanza attuale da startId
    
    while (queue.length > 0) {//continua finche ci sono stazioni da esplorare 
      const [curr, dist] = queue.shift();//estrae il primo elemento dalla coda
      if (Number(curr) === Number(endId)) return resolve(dist);//se la stazione curr è la destinazione finale restituisce la distanza accumulata
      //altrimenti esplora i vicini di curr
      for (const next of adj[curr] || []) {
        if (!visited.has(next)) {//per ogni vicino non ancora visitato
          visited.add(next);//lo segna come visitato
          queue.push([next, dist + 1]);//Lo inserisce nella coda con distanza incrementata di 1 rispetto a curr
        }
      }
    }
    resolve(Infinity);//Se la coda si svuota e il ciclo finisce senza aver trovato la destinazione, significa che le due stazioni non sono collegate in alcun modo.
  });
};

//ha il compito di selezionare un evento casuale dalla tabella events 
export const getRandomEvent = () => {
  return new Promise((resolve, reject) => {
    db.get('SELECT COUNT(*) as c FROM events', [], (err, row) => {//prima conta quanti eventi ci sono nella tabella events e lo sala in c
      if (err) 
        return reject(err);
      const count = row.c;
      if (count === 0) 
        return resolve({ description: 'Viaggio normale', effect: 0 });//se è vuota
      
      const offset = Math.floor(Math.random() * count);//genera un numero casuale tra 0 e count-1
      db.get('SELECT description, effect FROM events LIMIT 1 OFFSET ?', [offset], (err, event) => {//salta le prime offset tighe e prende l'unica immediatamente successiva
        if (err) 
          return reject(err);
        resolve(event ? { ...event } : { description: 'Viaggio normale', effect: 0 });
        //Lo spread operator {...event} crea un nuovo oggetto con le stesse proprietà di event, 
        // evitando di restituire direttamente l'oggetto ottenuto dal database, che potrebbe essere 
        // modificato altrove nel codice. Gli oggetti vengono restituiti per riferimento e non per valore 
        // quindi se si restituisse direttamente event, eventuali modifiche a quell'oggetto altrove nel 
        // codice potrebbero influenzare anche l'oggetto restituito da questa funzione.
        ////Usando lo spread operator inoltre estrae solo le proprietà reali ripulendo l'oggetto da tutto
        // il resto perima di inviarlo al frontend
      });
    });
  });
};

//registra una nuova partita nel DB 
export const saveGameResult = (userId, score) => {
  return new Promise((resolve, reject) => {
    db.run('INSERT INTO games (user_id, score) VALUES (?, ?)', [userId, score], function(err) {
      if (err) 
        return reject(err);
      resolve(this.lastID);//se va bene restituisce l'id della nuova partita appena inserita
    });
  });
};


//reestituisce la classifica globale dei giocatori 
export const getLeaderboard = (limit = 10) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT username, best_score as score 
      FROM users 
      WHERE best_score > 0
      ORDER BY best_score DESC 
      LIMIT ?
    `;
    db.all(sql, [limit], (err, rows) => {
      if (err) {
        return reject(err);
      }
      resolve(rows.map((r, i) => ({ ...r, rank: i + 1 })));//Usa lo spread operator per copiare i dati dell'utente e aggiunge la rank calcolata in base alla posizione nell'array ordinato, partendo da 1
    /*[
        { username: "marco", score: 34, rank: 1 },
        { username: "lucia", score: 28, rank: 2 }
      ] */
    
    });
  });
};


//crea le tabelle del database se non esistono e popola il database con dati di esempio se è vuoto
//execSQL e seedIfEmpty sono definite in seguito
export const initDatabase = async () => {
  await execSQL(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      best_score INTEGER DEFAULT 0
    )
  `);

  await execSQL(`
    CREATE TABLE IF NOT EXISTS lines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      color TEXT NOT NULL
    )
  `);

  await execSQL(`
    CREATE TABLE IF NOT EXISTS stations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    )
  `);

  await execSQL(`
    CREATE TABLE IF NOT EXISTS line_stations (
      line_id INTEGER,
      station_id INTEGER,
      position INTEGER,
      PRIMARY KEY (line_id, station_id)
    )
  `);

  await execSQL(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      description TEXT NOT NULL,
      effect INTEGER NOT NULL
    )
  `);

  await execSQL(`
    CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      score INTEGER NOT NULL,
      played_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await seedIfEmpty();
};

const execSQL = (sql) => {
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => err ? reject(err) : resolve());
  });
};

const hashPasswordCrypto = (password, salt) => {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {//la lunghezza di 64 byte definisce la lunghezza dell'hash 
      if (err) 
        reject(err);
      resolve(derivedKey.toString('hex'));
    })
  });
};

const seedIfEmpty = async () => {
  const row = await new Promise((resolve) => db.get('SELECT COUNT(*) as c FROM users', [], (err, r) => resolve(r)));
  if (row && row.c > 0) 
    return;

  const usersToSeed = [
    { username: 'Marco', password: 'pass123', best_score: 0 },
    { username: 'Lucia', password: 'pass456', best_score: 0 },
    { username: 'Giulia', password: 'pass789', best_score: 0 }
  ];
  
  for (const u of usersToSeed) {
    const salt = crypto.randomBytes(16).toString('hex');// 16byte è la lunghezza del salt, è una stringa casuale 
                                                        // che viene generata per ogni utente e memorizzata nel 
                                                        // database insieme all'hash della password, serve a 
                                                        // rendere più sicura la memorizzazione delle password, 
                                                        // rendendo più difficile per gli attaccanti utilizzare 
                                                        // tabelle precompilate (rainbow tables) per indovinare le password.
    const hash = await hashPasswordCrypto(u.password, salt);
    await new Promise((resolve) => {
      db.run('INSERT INTO users (username, password_hash, salt, best_score) VALUES (?, ?, ?, ?)',
        [u.username, hash, salt, u.best_score], () => resolve());
    });
  }

  const lines = [
    { name: 'Red Line', color: '#ef4444' },
    { name: 'Blue Line', color: '#3b82f6' },
    { name: 'Green Line', color: '#22c55e' },
    { name: 'Yellow Line', color: '#eab308' }
  ];
  for (const l of lines) {
    await new Promise((resolve) => db.run('INSERT INTO lines (name, color) VALUES (?, ?)', [l.name, l.color], () => resolve()));
  }

  const stations = [
    'Centrale', 'Porta Velaria', 'Crocevia del Falco', 'Piazza delle Lanterne',
    'Fontana Oscura', 'Borgo Sereno', 'Viale dei Mosaici', 'Torre Cinerea',
    'Campo dell\'Eco', 'Stazione Aurora', 'Giardino Nascosto', 'Ponte Antico'
  ];
  for (const s of stations) {
    await new Promise((resolve) => db.run('INSERT INTO stations (name) VALUES (?)', [s], () => resolve()));
  }

  const connections = [
    { line: 1, stations: [1, 2, 3, 4] },   
    { line: 2, stations: [1, 5, 6, 7, 8] },   
    { line: 3, stations: [2, 5, 9, 10] },  
    { line: 4, stations: [4, 9, 8, 11, 12] }  
  ];
  for (const conn of connections) {
    for (let i = 0; i < conn.stations.length; i++) {
      await new Promise((resolve) => {
        db.run('INSERT INTO line_stations (line_id, station_id, position) VALUES (?, ?, ?)',
          [conn.line, conn.stations[i], i], () => resolve());
      });
    }
  }

  const events = [
    { desc: 'Smooth journey', effect: 0 },
    { desc: 'Wrong platform', effect: -2 },
    { desc: 'Kind passenger', effect: 1 },
    { desc: 'Unexpected delay', effect: -3 },
    { desc: 'Complimentary ticket', effect: 2 },
    { desc: 'Quick check', effect: 0 },
    { desc: 'Track maintenance', effect: -4 },
    { desc: 'Pleasant surprise', effect: 4 }
  ];
  for (const e of events) {
    await new Promise((resolve) => db.run('INSERT INTO events (description, effect) VALUES (?, ?)', [e.desc, e.effect], () => resolve()));
  }
};