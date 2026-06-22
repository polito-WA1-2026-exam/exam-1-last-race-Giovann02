async function getNetwork() {
  const res = await fetch('http://localhost:3001/api/network');
  if (res.ok) 
    return await res.json();
  throw new Error('Network error');
}

async function getSegments() {
  const res = await fetch('http://localhost:3001/api/segments');
  if (res.ok) 
    return await res.json();
  throw new Error('Network error');
}

async function startGame() {
  const res = await fetch('http://localhost:3001/api/game/start', { 
    method: 'POST', 
    credentials: 'include' 
  });
  if (res.ok) 
    return await res.json();
  throw new Error('Game start failed');
}

async function submitRoute(route) {
  const res = await fetch('http://localhost:3001/api/game/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ route }),
    credentials: 'include'
  });
  if (res.ok) 
    return await res.json();
  throw new Error('Route submit failed');
}

async function finishGame(score) {
  const res = await fetch('http://localhost:3001/api/game/finish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ score }),
    credentials: 'include'
  });
  if (res.ok) 
    return await res.json();
  throw new Error('Game finish failed');
}

async function getLeaderboard() {
  const res = await fetch('http://localhost:3001/api/leaderboard');
  if (res.ok) 
    return await res.json();
  throw new Error('Leaderboard error');
}

async function getUserProfile() {
  const res = await fetch('http://localhost:3001/api/user/profile', {
    method: 'GET',
    credentials: 'include' 
  });
  if (res.ok) 
    return await res.json();
  throw new Error('Impossible to upload user profile');
}

export { getNetwork, getSegments, startGame, submitRoute, finishGame, getLeaderboard, getUserProfile };
