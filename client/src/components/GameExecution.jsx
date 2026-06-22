import { useState, useEffect } from "react"
import { Container, Card, Button, ProgressBar } from "react-bootstrap"
import { useNavigate, useLocation } from "react-router-dom"

function GameExecution() {
  const navigate = useNavigate()
  const location = useLocation()
  
  const { steps = [], invalid = false } = location.state || {} //legge le informazioni passare da GamePlanning con navigate

  const [currentStep, setCurrentStep] = useState(0)
  const [coins, setCoins] = useState(20)
  const [finished, setFinished] = useState(false)

  useEffect(() => {
    if (invalid || !steps || steps.length === 0) { 
      setCoins(0)
      setFinished(true)
      return 
    }
    
    let idx = 0
    let c = 20 //coins iniziali del giocatore
    
    const next = () => {
      if (idx >= steps.length) { 
        setFinished(true) //Fine del viaggio
        return 
      }
      c = Math.max(0, c + steps[idx].effect)//nuovo saldo delle monete, sono la risposta del server 
      //RICORDO DI UN ESEMPIO DI RISPOSTA
      /**
       * {
          "from": "Centrale",
          "to": "Loreto",
          "event": "Trovato portafoglio smarrito!",
          "effect": 5
        }
       */
      setCoins(c)
      setCurrentStep(idx + 1)
      idx++
      setTimeout(next, 1200)
    }
    
    const initialTimeout = setTimeout(next, 600)//600ms esegue next()
    return () => clearTimeout(initialTimeout) 
  }, [steps, invalid])

  return (
    <Container className="py-5 text-center">
      <h2 className="mb-4">🚇 In the Race...</h2>
      <Card className="mx-auto p-4 shadow" style={{ maxWidth: '600px' }}>
        {invalid ? (//se invalida
          <div className="text-danger fs-4">❌ Invalid path! Coins: 0</div>
        ) : !finished ? (
          <>
            <ProgressBar now={(currentStep / (steps.length || 1)) * 100} className="mb-3" />
            {steps.slice(0, currentStep).map((s, i) => (
              <div key={i} className={`alert ${i === currentStep - 1 ? 'alert-info' : 'alert-light'} mb-2 step-alert`}>
                <strong>{s.from} → {s.to}</strong> | {s.event} | <span className={s.effect >= 0 ? 'text-success' : 'text-danger'}>{s.effect >= 0 ? '+' : ''}{s.effect} 🪙</span>
              </div>
            ))}
            <div className="fs-2 fw-bold mt-3">Coins: {coins}</div>
          </>
        ) : (
          <>
            <div className="display-1 mb-3">🏁</div>
            <div className="fs-2 fw-bold text-success">Race over!</div>
            <div className="display-4 mb-4">{coins} coins</div>
            <Button variant="primary" onClick={() => navigate('/result', { state: { score: coins } })}>
              See Result
            </Button>
          </>
        )}
      </Card>
    </Container>
  )
}

export default GameExecution