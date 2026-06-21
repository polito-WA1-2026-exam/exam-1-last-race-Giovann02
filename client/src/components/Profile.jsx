import { useState, useEffect } from "react"
import { Container, Row, Col, Card, Table, Spinner, Alert, Button } from "react-bootstrap"
import { useNavigate } from "react-router-dom"
import { getUserProfile } from "../api/api"

function Profile() {
  const [profileData, setProfileData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const navigate = useNavigate()

  useEffect(() => {
    getUserProfile()//metodo api se non trova il profilo in sessione restituisce il messaggio di errore
      .then(data => setProfileData(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2 text-muted">Loading profile...</p>
      </Container>
    )
  }

  if (error) { //se error non è vuoto
    return (
      <Container className="py-4">
        <Alert variant="danger">⚠️ {error}</Alert>
      </Container>
    )
  }

  return (
    <Container className="py-4">
      <Row className="mb-4">
        <Col>
          <h2 className="fw-bold">👤 Player Profile</h2>
          <p className="text-muted">Welcome to your control board, {profileData.username}!</p>
        </Col>
      </Row>

      <Row className="g-3 mb-4">
        <Col md={4}>
          <Card className="text-center bg-primary text-white border-0 shadow-sm p-3">
            <Card.Body>
              <div className="fs-3 mb-1">🪙</div>
              <Card.Title className="small text-uppercase opacity-75">Total Credits</Card.Title>
              <Card.Text className="display-5 fw-bold">{profileData.totalCredits}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center bg-success text-white border-0 shadow-sm p-3">
            <Card.Body>
              <div className="fs-3 mb-1">🏆</div>
              <Card.Title className="small text-uppercase opacity-75">Personal Record</Card.Title>
              <Card.Text className="display-5 fw-bold">{profileData.bestScore} 🪙</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center bg-dark text-white border-0 shadow-sm p-3">
            <Card.Body>
              <div className="fs-3 mb-1">🚇</div>
              <Card.Title className="small text-uppercase opacity-75">Games played</Card.Title>
              <Card.Text className="display-5 fw-bold">{profileData.gamesPlayed}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col>
          <Card className="border-0 shadow-sm p-3">
            <Card.Header className="bg-white fw-bold fs-5 border-bottom mb-2">
              📜 Timeline Races and Trips
            </Card.Header>
            <Card.Body>
              {profileData.history.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  <p>You haven't done any subway rides yet.</p>
                  <Button variant="primary" onClick={() => navigate('/play')}>Start your first race!</Button>
                </div>
              ) : (
                <Table striped hover responsive className="align-middle">
                  <thead>
                    <tr>
                      <th>ID Game</th>
                      <th>Date and Time Travel</th>
                      <th>Coins Brought to the Finish Line</th>
                      <th>Race Outcome</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profileData.history.map((game, index) => {
                      const dateFormatted = new Date(game.played_at).toLocaleString('it-IT', { //prende la data salvata sul DB e la trasforma in una stringa leggibile
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      });

                      return (
                        <tr key={game.id}>
                          <td className="text-muted small">#{game.id}</td>
                          <td>{dateFormatted}</td>
                          <td className="fw-bold text-success">{game.score} 🪙</td>
                          <td>
                            {game.score > 0 ? (
                              <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 rounded">Completed</span>
                            ) : (
                              <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1 rounded">Defeat / Invalid</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default Profile