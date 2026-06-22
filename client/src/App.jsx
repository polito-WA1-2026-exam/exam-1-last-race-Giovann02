import 'bootstrap/dist/css/bootstrap.min.css';
import { useContext, useState, useEffect } from 'react';
import { Container } from 'react-bootstrap';
import { Navigate, Outlet, Route, Routes, useNavigate } from 'react-router-dom';

import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import LoginForm from './components/LoginForm.jsx';
import Instructions from './components/Instructions.jsx';
import Leaderboard from './components/Leaderboard.jsx';
import GamePlanning from './components/GamePlanning.jsx';
import GameExecution from './components/GameExecution.jsx';
import GameResult from './components/GameResult.jsx';
import NetworkMap from './components/NetworkMap.jsx';
import Profile from './components/Profile.jsx'; 


import UserContext from './contexts/UserContext.js';
import { checkSession,doLogout } from './api/auth.js';
import { getNetwork, getSegments, startGame } from './api/api.js';
import './custom.css';

function PlayView({ setAppNetwork, setAppSegments }) {
  const navigate = useNavigate();
  const [network, setNetwork] = useState(null);
  
  useEffect(() => {
    getNetwork()
      .then(net => {
        setNetwork(net);
        setAppNetwork(net); // Sincronizza lo stato globale in App
        localStorage.setItem('last_race_network', JSON.stringify(net)); // Salva per il refresh
      })
      .catch(() => navigate('/error'));

    getSegments()
      .then(segs => {
        setAppSegments(segs); // Sincronizza lo stato globale in App
        localStorage.setItem('last_race_segments', JSON.stringify(segs)); // Salva per il refresh
      })
      .catch(() => navigate('/error'));
  }, [navigate, setAppNetwork, setAppSegments]);

  const startNewGame = async () => {
    try {
      await startGame();
      navigate('/game/plan');
    } catch (e) {
      alert("Errore avvio partita");
    }
  };

  if (!network) 
    return <div className="text-center py-5">Loading Map...</div>;

  return (
    <Container className="py-4">
      <h1 className="text-center mb-4">Memorize this map 🧠</h1>
      <NetworkMap lines={network.lines} stations={network.stations} />
      <div className="text-center mt-4">
        <p className="lead">Study the map: {network.lines.length} lines, {network.stations.length} stations</p>
        <button className="btn btn-primary btn-lg mt-3" onClick={startNewGame}>
          🎮 Start Planning
        </button>
      </div>
    </Container>
  );
}

function App() {
  const navigate = useNavigate();
  const [user, setUser] = useState({ id: undefined, username: undefined });
  /*const [network, setNetwork] = useState(null);
  const [segments, setSegments] = useState([]);*/
  const [network, setNetwork] = useState(() => {
    const saved = localStorage.getItem('last_race_network');
    return saved ? JSON.parse(saved) : null;
  });

  const [segments, setSegments] = useState(() => {
    const saved = localStorage.getItem('last_race_segments');
    return saved ? JSON.parse(saved) : [];
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSession()//controlla la sessione
      .then(res => {
        if (res) {
          setUser({ id: res.id, username: res.username });
        }
        setLoading(false);
      })
      .catch(() => {
        setUser({ id: undefined, username: undefined });
        setLoading(false); 
      });
  }, []);//chiamato all'avvio

  useEffect(() => {
    if (user.id) {
      Promise.all([getNetwork(), getSegments()])
        .then(([net, segs]) => {
          setNetwork(net);
          setSegments(segs);
          localStorage.setItem('last_race_network', JSON.stringify(net));
          localStorage.setItem('last_race_segments', JSON.stringify(segs));
        })
        .catch(() => navigate('/error'));
    }
  }, [user.id, navigate]);

  const handleLoginSuccess = (u) => {
    setUser({ id: u.id, username: u.username });
    navigate('/play');
  };

  const handleLogout = async () => {
    try {
      await doLogout();
    } catch (err) {
      console.error("Errore durante il logout sul server:", err);
    }
    
    // Reset completo dello stato utente
    setUser({ id: undefined, username: undefined });
    
    // Pulizia totale della memoria del gioco
    localStorage.removeItem('last_race_network');
    localStorage.removeItem('last_race_segments');
    localStorage.removeItem('last_race_game_data');
    setNetwork(null);
    setSegments([]);
    
    navigate('/');
  };

  if (loading) {
    return (
      <Container className="py-5 text-center" style={{ marginTop: '10%' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 lead text-muted">Verification of the current session...</p>
      </Container>
    );
  }

  return (
    <UserContext.Provider value={user}>
      <Routes>
        <Route path="/" element={
          <>
            <Header onLogout={handleLogout} />
            <Container fluid className="flex-grow-1 d-flex flex-column" style={{ minHeight: '80vh' }}>
              <Outlet />
            </Container>
            <Footer />
          </>
        }>
          <Route index element={
            user.id ? <Navigate to="/play" /> :
            <Container className="py-5 text-center">
              <h1 className="display-4 mb-4">🚇 Last Race</h1>
              <p className="lead">Plan your route, face the unexpected, and arrive rich at your destination!</p>
              <button className="btn btn-primary btn-lg mt-3" onClick={() => navigate('/login')}>🔑 Login to play</button>
            </Container>
          } />
          
          <Route path="login" element={<LoginForm onLoginSuccess={handleLoginSuccess} />} />
          <Route path="instructions" element={<Instructions />} />
          
          
          {/* Rotte Protette */}
          <Route element={user.id ? <Outlet /> : <Navigate to="/login" />}>
           {/* Cambia la rotta di PlayView passando i setter */}
            <Route path="play" element={<PlayView setAppNetwork={setNetwork} setAppSegments={setSegments} />} />
            <Route path="game/plan" element={
              network && segments.length > 0 ? 
                <GamePlanning network={network} segments={segments} /> : 
                <Navigate to="/play" />
            } />
            <Route path="leaderboard" element={<Leaderboard />} />
            <Route path="game/execute" element={<GameExecution />} />
            <Route path="result" element={<GameResult />} />
            <Route path="profile" element={<Profile />} /> 
          </Route>

          <Route path="logout" element={<Navigate to="/" />} />
          <Route path="error" element={
            <Container className="py-5 text-center">
              <h1 className="text-danger">⚠️ Something is gone wrong</h1>
              <button className="btn btn-secondary mt-3" onClick={() => navigate('/')}>Come back to Home</button>
            </Container>
          } />
        </Route>
      </Routes>
    </UserContext.Provider>
  );
}

export default App;