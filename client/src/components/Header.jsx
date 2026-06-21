import { useContext } from "react";
import { Button, Container, Navbar, Nav } from "react-bootstrap";
import { Link, useNavigate } from 'react-router-dom';//cambiare pagina istantaneametne senza refresh totale 
import UserContext from "../contexts/UserContext";//informazioni globali dell'utente

function Header({ onLogout }) { //riceve una prop che verrà premuta dal figlio per dire al prade che l'utente vuole logout
  const user = useContext(UserContext);
  const navigate = useNavigate();

  return (
    <Navbar bg="dark" variant="dark" expand="lg">
      <Container>
        <Navbar.Brand as={Link} to="/">🚈 Last Race</Navbar.Brand>
        <Nav className="me-auto">
          {user?.id && <Nav.Link as={Link} to="/play">Play</Nav.Link>} {/*solo se l'utente è loggato quindi user.id esiste */}
          <Nav.Link as={Link} to="/instructions">Instructions</Nav.Link>{/*chi è loggato o non vede le istruzioni */}
          {user?.id && <Nav.Link as={Link} to="/leaderboard">Ranking</Nav.Link>}
        </Nav>
        <div>
          {/*solo se l'utente esiste */}
          {user?.id ? (
            <div className="d-flex align-items-center gap-3 text-white">
              {/** d-flec attiva il flexbox, align-items-center allinea verticalmente, gap-3 crea spazio tra i tr3 elementi */}
              <Link 
                to="/profile" 
                className="text-decoration-none text-white fw-bold d-flex align-items-center gap-1"
                title="Vai al profilo"
              >
                👤 {user.username ? user.username.charAt(0).toUpperCase() + user.username.slice(1) : "Profile"}
                                    {/**  isola la prima lettera e poi fa slice dalla seconda se esiste altrimenti mostra Profile*/}
              </Link>
              <Button variant="outline-light" size="sm" onClick={onLogout}>Logout</Button>
            </div>
          ) : (
            <Button variant="primary" size="sm" onClick={() => navigate('/login')}>Login</Button>
          )}{/** se non è loggato mostra login */}
        </div>
      </Container>
    </Navbar>
  );
}
export default Header;