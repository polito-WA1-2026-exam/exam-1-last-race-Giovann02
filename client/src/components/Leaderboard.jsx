import { useState, useEffect } from "react"
import { Container, Table, Card, Button } from "react-bootstrap"
import { Link } from "react-router"
import { getLeaderboard } from "../api/api"

function Leaderboard() {
  const [data, setData] = useState([]) //lista dei giocatori e i loro punteggi
  const [loading, setLoading] = useState(true) //stato caricamento

  useEffect(() => {
    getLeaderboard().then(res => setData(res)).finally(() => setLoading(false))
  }, [])//chiama getLeaderboard poi salva i dati ricevuti dal server nella lista giocatori .then(res =>setData)
        //in fine imposta il caricamento a false dicendo che può mostare la classifica 

  if (loading) //se sta caricando mostra questo 
    return <Container className="py-5 text-center">Loading Ranking...</Container>

  return (
    <Container className="py-4">
      <Card className="p-4 shadow-sm">
        <h2 className="text-center mb-4">🏆 Ranking Players</h2>
        <Table striped hover responsive> {/** colora la riga su cui passa il mouse */}
          <thead><tr><th>#</th><th>Player</th><th>Best Score</th></tr></thead>
          <tbody>
            {data.map((u, i) => (
              <tr key={u.username} className={i < 3 ? 'table-warning' : ''}> {/**ogni riga ha una chiave univoca key per facilitare il VDOM a tracciare e aggiornare */}
                <td>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</td>
                <td>{u.username}</td>
                <td className="fw-bold text-success">{u.score} 🪙</td>
              </tr>
            ))}
            {data.length === 0 && <tr><td colSpan="3" className="text-center">No scores recorded</td></tr>}
          </tbody>
        </Table>
        <div className="text-center mt-3">
          <Button as={Link} to="/" variant="secondary">← Come back to Home</Button>
        </div>
      </Card>
    </Container>
  )
}
export default Leaderboard