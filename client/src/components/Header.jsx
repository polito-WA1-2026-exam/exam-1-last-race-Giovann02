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
        <div>
          {user?.id ? (
            <div className="d-flex align-items-center gap-3 text-white">
              
              <Link 
                to="/profile" 
                className="text-decoration-none text-white fw-bold d-flex align-items-center gap-1"
                title="Vai al profilo"
              >
                👤 {user.username ? user.username.charAt(0).toUpperCase() + user.username.slice(1) : "Profilo"}
              </Link>
              <Button variant="outline-light" size="sm" onClick={onLogout}>Logout</Button>
            </div>
          ) : (
            <Button variant="primary" size="sm" onClick={() => navigate('/login')}>Login</Button>
          )}
        </div>
      </Container>
    </Navbar>
  );
}
export default Header;