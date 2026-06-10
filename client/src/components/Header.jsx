import { useContext } from "react";
import { Button, Container, Navbar, Nav } from "react-bootstrap";
import { Link, useNavigate } from 'react-router-dom';
import UserContext from "../contexts/UserContext";

function Header({ onLogout }) {
  const user = useContext(UserContext);
  const navigate = useNavigate();

  return (
    <Navbar bg="dark" variant="dark" expand="lg">
      <Container>
        <Navbar.Brand as={Link} to="/">🚈 Last Race</Navbar.Brand>
        <Nav className="me-auto">
          {user?.id && <Nav.Link as={Link} to="/play">Play</Nav.Link>}
          <Nav.Link as={Link} to="/instructions">Instructions</Nav.Link>
          {user?.id && <Nav.Link as={Link} to="/leaderboard">Ranking</Nav.Link>}
        </Nav>
        {/*to complete */}
      </Container>
    </Navbar>
  );
}
export default Header;