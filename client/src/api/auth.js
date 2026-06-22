/**
 * Login utente
 * @param {string} username 
 * @param {string} password 
 * @returns {Promise<Object>} - {id, username}
 */
async function doLogin(username, password) {
  const response = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include'
  });
  if (response.ok) {
    const data = await response.json();
    return data.user;
  } else {
    const err = await response.json();
    throw new Error(err.message || "Login failed");
  }
}

async function doLogout() {
  const response = await fetch('http://localhost:3001/api/sessions/current', {
    method: 'DELETE',
    credentials: 'include'
  });
  if (!response.ok) 
    throw new Error("Logout failed");
  return true;
}

async function checkSession() {
  try {
    const response = await fetch('http://localhost:3001/api/auth/me', { 
      credentials: "include" 
    });
    if (response.ok) {
      const data = await response.json();
      return data.user;
    }
    return null;
  } catch {
    return null;
  }
}

export { doLogin, doLogout, checkSession };