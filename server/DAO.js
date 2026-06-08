import sqlite from 'sqlite3';
import crypto from 'crypto';

const db = new sqlite.Database('database.sqlite', (err) => {
  if (err) throw err;
});

export const getUser = (username, password) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT id, username, password_hash, salt FROM users WHERE username = ?';
    db.get(sql, [username], (err, row) => {
      if (err) 
        return reject(err);
      if (!row) 
        return resolve(false);
      
      try {
        const salt = row.salt || 'staticsalt';
        
        crypto.scrypt(password, salt, 64, (err, hashedPassword) => {
          if (err) 
            return reject(err);
          const savedHashBuffer = Buffer.from(row.password_hash, 'hex');
          if (crypto.timingSafeEqual(savedHashBuffer, hashedPassword)) {
            resolve({ id: row.id, username: row.username });
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

export const getUserById = (userId) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT id, username, best_score FROM users WHERE id = ?';
    db.get(sql, [userId], (err, row) => {
      if (err) return reject(err);
      resolve(row ? { id: row.id, username: row.username, best_score: row.best_score } : null);
    });
  });
};



export const updateBestScore = (userId, score) => {
  return new Promise((resolve, reject) => {
    const sql = `
      UPDATE users 
      SET best_score = MAX(best_score, ?)
      WHERE id = ?
    `;
    db.run(sql, [score, userId], function (err) {
      if (err) return reject(err);
      resolve(this.changes);
    });
  });
};

export const getLines = () => {
  return new Promise((resolve, reject) => {
    db.all('SELECT id, name, color FROM lines', [], (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
};

export const getStations = () => {
  return new Promise((resolve, reject) => {
    db.all('SELECT id, name FROM stations', [], (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
};

export const getLineStations = () => {
  return new Promise((resolve, reject) => {
    db.all('SELECT line_id, station_id, position FROM line_stations ORDER BY line_id, position', [], (err, rows) => {
      if (err) 
        return reject(err);
      resolve(rows);
    });
  });
};

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
    `;
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
    `;
    db.all(sql, [], (err, rows) => {
      if (err) 
        return reject(err);
      
      const adj = {};
      getStations().then(stations => {
        for (const s of stations) adj[s.id] = [];
        for (const c of rows) {
          if (adj[c.a] && !adj[c.a].includes(c.b)) adj[c.a].push(c.b);
          if (adj[c.b] && !adj[c.b].includes(c.a)) adj[c.b].push(c.a);
        }
        resolve(adj);
      }).catch(reject);
    });
  });
};

export const getDistance = async (startId, endId) => {
  const adj = await getConnectionGraph();
  return new Promise((resolve) => {
    if (Number(startId) === Number(endId)) return resolve(0);
    const visited = new Set([startId]);
    const queue = [[startId, 0]];
    
    while (queue.length > 0) {
      const [curr, dist] = queue.shift();
      if (Number(curr) === Number(endId)) return resolve(dist);
      
      for (const next of adj[curr] || []) {
        if (!visited.has(next)) {
          visited.add(next);
          queue.push([next, dist + 1]);
        }
      }
    }
    resolve(Infinity);
  });
};


export const getRandomEvent = () => {
  return new Promise((resolve, reject) => {
    db.get('SELECT COUNT(*) as c FROM events', [], (err, row) => {
      if (err) return reject(err);
      const count = row.c;
      if (count === 0) return resolve({ description: 'Viaggio normale', effect: 0 });
      
      const offset = Math.floor(Math.random() * count);
      db.get('SELECT description, effect FROM events LIMIT 1 OFFSET ?', [offset], (err, event) => {
        if (err) return reject(err);
        resolve(event ? { ...event } : { description: 'Viaggio normale', effect: 0 });
      });
    });
  });
};

export const saveGameResult = (userId, score) => {
  return new Promise((resolve, reject) => {
    db.run('INSERT INTO games (user_id, score) VALUES (?, ?)', [userId, score], function(err) {
      if (err) return reject(err);
      resolve(this.lastID);
    });
  });
};

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
      resolve(rows.map((r, i) => ({ ...r, rank: i + 1 })));
    });
  });
};

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
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(derivedKey.toString('hex'));
    });
  });
};

const seedIfEmpty = async () => {
  const row = await new Promise((resolve) => db.get('SELECT COUNT(*) as c FROM users', [], (err, r) => resolve(r)));
  if (row && row.c > 0) return;

  const usersToSeed = [
    { username: 'Marco', password: 'pass123', best_score: 0 },
    { username: 'Lucia', password: 'pass456', best_score: 0 },
    { username: 'Giulia', password: 'pass789', best_score: 0 }
  ];
  
  for (const u of usersToSeed) {
    const salt = crypto.randomBytes(16).toString('hex');
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