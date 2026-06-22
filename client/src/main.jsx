import { StrictMode } from 'react' //serve per trovare potenziali bug 
import { createRoot } from 'react-dom/client' //serve per inizializzare il VDOM
import { BrowserRouter } from 'react-router-dom' //abilita il routing, cambiare indirizzo URL sena mai ricaricare interamente la pagina 
import App from './App.jsx' //radice
import './custom.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
)
