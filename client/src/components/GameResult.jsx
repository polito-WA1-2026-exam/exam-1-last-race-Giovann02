import { useEffect, useState } from "react"
import { Container, Card, Button, Spinner } from "react-bootstrap"
import { Link, useNavigate, useLocation } from "react-router-dom" 
import { finishGame } from "../api/api"

function GameResult() {
  const navigate = useNavigate()
  const location = useLocation()
  const { score = 0, invalid = false, message = "" } = location.state || {};  
  const [saving, setSaving] = useState(true)
  localStorage.removeItem('last_race_segments');
  localStorage.removeItem('last_race_network');
  useEffect(() => {
    finishGame(score)
      .then(() => {
        console.log("Partita salvata con successo a database!")
      })
      .catch((err) => {
        console.error("Errore durante il salvataggio del punteggio:", err)
      })
      .finally(() => {
        setSaving(false) 
      })
  }, [score])

  return (
    <Container className="py-5 text-center">
      <Card className="mx-auto p-5 shadow" style={{ maxWidth: '450px' }}>
        {saving ? (
          <div className="py-4">
            <Spinner animation="border" variant="primary" className="mb-3" />
            <p className="text-muted">Saving the score in progress...</p>
          </div>
        ) : (
          <>
            <div className="display-1 mb-3">{score > 0 ? '🏆' : '💀'}</div>
            <h2 className="mb-2">Final Result</h2>
            <div className="display-3 fw-bold text-success mb-2">{score} 🪙</div>
            {invalid && <p className="text-danger fw-bold">{message || "Invalid route or time expired!"}</p>}
            <div className="d-grid gap-2 mt-4">
              <Button variant="primary" onClick={() => navigate('/game/plan')}>🔄 Play Again</Button>
              <Button variant="outline-secondary" as={Link} to="/leaderboard">🎖️ Ranking</Button>
              <Button variant="secondary" as={Link} to="/play">🏠 Home</Button>
            </div>
          </>
        )}
      </Card>
    </Container>
  )
}

export default GameResult