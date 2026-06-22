import { useState } from "react"
import { doLogin } from "../api/auth"
import { useNavigate } from "react-router"
import { Form, Button, Container, Card, Alert } from "react-bootstrap"

function LoginForm({ onLoginSuccess }) {

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault() //blocca il comportamento di default del broser che esguirebbe automaticamente a seguito di un'azione
    /*L'utente clicca sul pulsante "Login".
      Il tag <Form> intercetta il click e genera un evento di tipo submit.
      React cattura questo evento e lo passa alla funzione handleSubmit sotto forma di una variabile event.
      PreventDefault dice al browser di fermarsi e non ricaricare la pagina
      Subito dopo await doLogin(username, password) esegue una chiamata asincrona verso il server in background, 
      lasciando la pagina web intatta, fluida e senza fastidiosi ricaricamenti visivi. */
    setError('') //svuota eventuali errori
    try {
      let username_noSpace=username.replace(/\s+/g, '');
      const user = await doLogin(username_noSpace, password) //funzione asincrona -> auth.js
      onLoginSuccess(user)  //callback, comunica al padre cche il login è andato a abuon fine, permettendo a App.jsx di salvare i dati dell'utente nello stato globale 
      navigate('/play')
    } catch (ex) {
      setError(ex.message || 'Not valid credentials')
    }
  }

  return (
    <Container className="py-5"> {/**py-5 padding sopra e sotto */}
      <Card className="mx-auto shadow" style={{ maxWidth: '400px' }}>{/*Disegna un rettangolo bianco con i bordi leggermente arrotondati e un'ombra sfumata sul fondo (shadow). mx-auto centra la schedina orizzontalmente, mentre maxWidth: '400px' impedisce al form di allargarsi troppo sugli schermi dei computer. */}
        <Card.Body>
          <h2 className="text-center mb-4">🔐 Login</h2>
          {error && <Alert variant="danger">{error}</Alert>} {/* se c'è qualche errore mostra questo alert con l'errore */}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">{/*È un contenitore di Bootstrap che raggruppa logicamente un'etichetta (Form.Label) e il relativo campo di input Form.Control. La classe mb-3 aggiunge un piccolo margine inferiore per distanziare il campo dello Username da quello della Password. */}
              <Form.Label>Username</Form.Label>
              <Form.Control type="text" value={username} onChange={e => setUsername(e.target.value)} required />{/*on every change set the username */}
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            </Form.Group>
            <Button type="submit" className="w-100" variant="primary">Login</Button>
          </Form>
          <div className="mt-3 text-center small text-muted">
            Examples: Marco/pass123 • Lucia/pass456 • Giulia/pass789
          </div>
        </Card.Body>
      </Card>
    </Container>
  )
}
export default LoginForm