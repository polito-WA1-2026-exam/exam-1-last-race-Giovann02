import { useState, useEffect } from "react"
import { Container, Row, Col, Card, Button, ListGroup, Badge, Alert } from "react-bootstrap"
import { useNavigate } from "react-router-dom" 
import { submitRoute, startGame } from "../api/api"
import NetworkMap from "./NetworkMap"

function GamePlanning({ network, segments }) {
  const navigate = useNavigate()
  const [gameData, setGameData] = useState(null)
  const [selected, setSelected] = useState([])
  const [timeLeft, setTimeLeft] = useState(90)
  const [error, setError] = useState('')

  useEffect(() => {
    if (segments && segments.length > 0) { //se ci sono segmenti 
      localStorage.setItem('last_race_segments', JSON.stringify(segments)); //li scrive nella memoria locale
    }
  }, [segments]);//ogni volta che la lista dei segmenti cambia il codice si attiva immediatamente perchè [segments] crea una dipendenza con l'array

  useEffect(() => {
    startGame()//ritorna la risposta 
      .then(res => setGameData({ start: res.startStation, end: res.endStation }))
      .catch(() => navigate('/error'))
  }, [navigate])

  useEffect(() => {
    if (timeLeft <= 0) 
      return handleSubmit()//se il tempo è scaduto invia il form
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000)
    return () => clearInterval(timer)
  }, [timeLeft])

  const addSegment = (seg) => {
    setError('')
    if (selected.length === 0) {
      if (seg.stationA !== gameData.start.id && seg.stationB !== gameData.start.id)//se nessuna delle due stazioni è la stazione di partenza 
        return setError('You must start from the rigth departure station!')
    } else {
      //aggiunge i segmenti successivi
      let tip = gameData.start.id
      for (let s of selected) {
        tip = (s.stationA === tip) ? s.stationB : s.stationA
      }
      //controlla se si connette all'ultima stazione
      if (seg.stationA !== tip && seg.stationB !== tip)
        return setError('Connect the segment to the last selected!')
    }
    setSelected([...selected, seg])
  }

  const removeSegment = (idx) => setSelected(selected.filter((_, i) => i !== idx))

  const handleSubmit = () => {
    if (selected.length === 0 || selected.length<3) {
      navigate('/result', { state: { score: 0, invalid: true, message:"Too few segments" } });
      return;
    }

    submitRoute(selected)//invia il percorso selezionato
      .then(res => {
        if (res.invalid) {
          navigate('/result', { state: { score: 0, invalid: true } });//invalido
        } else {
          navigate('/game/execute', { state: { steps: res.steps, invalid: false } });
        }
      })
      .catch(() => setError('Errore nell\'invio del percorso'));
  }

  if (!gameData || !network) 
    return <div className="text-center py-5">Match preparation...</div>

  return (
    <Container className="py-4">
      <Row className="mb-3 align-items-center">
        <Col><h3>⏱️ Planning</h3></Col>
        <Col xs="auto"><Badge bg={timeLeft < 30 ? "danger" : "primary"} className="fs-5 px-3 py-2">{timeLeft}s</Badge></Col>
      </Row>
      
      <Row className="mb-3">
        <Col md={6}><Card className="bg-success bg-opacity-10 p-2 text-center">Departure: <strong>{gameData.start.name}</strong></Card></Col>
        <Col md={6}><Card className="bg-danger bg-opacity-10 p-2 text-center">Arrive: <strong>{gameData.end.name}</strong></Card></Col>
      </Row>

      <Row className="g-4">
        <Col md={4}>
          <Card className="h-100 shadow-sm">
            <Card.Header>📍 Selected Path</Card.Header>
            <Card.Body>
              <ListGroup className="mb-3">
                {selected.length === 0 ? (
                  <ListGroup.Item className="text-muted">Select the segments...</ListGroup.Item>
                ) : (
                  (() => {
          
                    let currentTip = gameData.start.id;//la prima stazione è quella di partenza

                    return selected.map((s, i) => {
                      // Se la stazioneA del segmento NON corrisponde a dove si trova il treno, 
                      // significa che il segmento è al contrario rispetto viaggio.
                      const isReversed = Number(s.stationA) !== Number(currentTip);

                      // Se è invertito prima la B e poi la A altrimenti l'ordine standard A -> B
                      const correctStart = isReversed ? s.stationBName : s.stationAName;
                      const correctEnd = isReversed ? s.stationAName : s.stationBName;

                      //stazione ultima in base se è revesed o no
                      currentTip = isReversed ? s.stationA : s.stationB;

                      return (
                        <ListGroup.Item key={i} className="d-flex justify-content-between align-items-center">
                          <span className="small fw-medium">
                            {correctStart} <span className="text-success">➔</span> {correctEnd}
                          </span>
                          <Button variant="outline-danger" size="sm" className="py-0 px-2" onClick={() => removeSegment(i)}>×</Button>
                        </ListGroup.Item>
                      );
                    });
                  })()
                )}
              </ListGroup>
              {error && <Alert variant="danger" className="small p-2">{error}</Alert>}
              <Button variant="success" className="w-100" onClick={handleSubmit}>Confirm & Go</Button>
            </Card.Body>
          </Card>
        </Col>
        <Col md={8}>
          <NetworkMap 
            lines={network.lines} 
            stations={network.stations} 
            highlightPath={selected.flatMap(s => [s.stationA, s.stationB])} 
            invisibleLines={true}
          />
          
          <Card className="mt-3 shadow-sm">
            <Card.Header>🛤️ Segments Available</Card.Header>
            <Card.Body className="d-flex flex-wrap gap-2" style={{ maxHeight: '180px', overflowY: 'auto' }}>
              {segments.map(seg => {
                const isUsed = selected.find(s => s.id === seg.id)
                return (
                  <Button 
                    key={seg.id} 
                    variant={isUsed ? "primary" : "outline-secondary"} 
                    size="sm" 
                    onClick={() => !isUsed && addSegment(seg)} 
                    disabled={isUsed}
                  >
                    {seg.stationAName} ↔ {seg.stationBName}
                  </Button>
                )
              })}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}
export default GamePlanning