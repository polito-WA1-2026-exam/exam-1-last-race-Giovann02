import { Container, Card, Row, Col, Button } from "react-bootstrap"
import { Link } from "react-router"

function Instructions() {
  return (
    <Container className="py-4">
      <Card className="p-4 shadow-sm">
        <h2 className="mb-4 text-center">📖 How to play</h2>
        <Row className="g-4 mb-4">
          <Col md={4} className="text-center">
            <div className="fs-1 mb-2">1️⃣</div>
            <h5>Setup</h5>
            <p className="text-muted">Explore the map. Store lines and interchanges before you begin.</p>
          </Col>
          <Col md={4} className="text-center">
            <div className="fs-1 mb-2">2️⃣</div>
            <h5>Planning (90s)</h5>
            <p className="text-muted">Select segments sequentially from departure to destination.</p>
          </Col>
          <Col md={4} className="text-center">
            <div className="fs-1 mb-2">3️⃣</div>
            <h5>Execution</h5>
            <p className="text-muted">You experience random events on each route. Accumulate or lose coins!</p>
          </Col>
        </Row>
        <Card className="bg-light p-3 mb-4 border-0">
          <h5>⚠️ Rules</h5>
          <ul className="mb-0">
            <li>The route must be continuous and respect interchanges.</li>
            <li>If time runs out or the path is invalid, you lose all 20 initial coins.</li>
            <li>Random events take effect between -4 and +4 coins.</li>
          </ul>
        </Card>
        <div className="text-center">
          <Button as={Link} to="/" variant="secondary">← Come back to Home</Button>
        </div>
      </Card>
    </Container>
  )
}
export default Instructions