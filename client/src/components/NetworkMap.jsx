import { Card } from "react-bootstrap"
import { useState, useEffect } from "react"

function NetworkMap({ lines, stations, highlightPath = [], invisibleLines = false }) {
  const [segments, setSegments] = useState([])

  useEffect(() => {
    if (invisibleLines) { //prende i segmenti dal server solo se invisibleLines è true
      fetch('http://localhost:3001/api/segments')
        .then(res => res.json())
        .then(data => setSegments(data))
        .catch(err => console.error("Errore segmenti:", err))
    }
  }, [invisibleLines])

  if (!stations) 
    return <div className="text-center py-3">Loading map...</div>

  if (invisibleLines) {
    if (segments.length === 0) 
      return <div className="text-center py-3">Loandig of graph segments...</div>
    return (
      <Card className="mb-3 border-0 shadow-sm">
        <Card.Header className="bg-white fw-bold border-bottom">
          🗺️ Segments
        </Card.Header>
        <Card.Body className="p-3" style={{ maxHeight: '350px', overflowY: 'auto' }}>
          <p className="text-muted small mb-3">
            💡 The commercial lines are hidden! Select segments based on your memory.
          </p>
          <div className="d-flex flex-column gap-2">
            {segments.map((seg) => { //highlightPath contiene gli ID delle stazioni che l'utente ha scelto
              const isA_Highlighted = highlightPath.includes(Number(seg.stationA))
              const isB_Highlighted = highlightPath.includes(Number(seg.stationB))
              const isSegmentHighlighted = isA_Highlighted && isB_Highlighted   //se sono state selezionate le stazioni di quel rettangolo quello cambia colore

              return (
                <div 
                  key={seg.id} 
                  className={`d-flex align-items-center p-2 rounded border ${
                    isSegmentHighlighted ? 'border-danger bg-danger-subtle' : 'bg-light'
                  }`}
                  style={{ width: 'fit-content', minWidth: '300px' }}
                >
                  <span className={`badge rounded-pill px-3 py-2 ${isA_Highlighted ? 'bg-danger text-white' : 'bg-white text-dark border'}`}>
                    {seg.stationAName}
                  </span>
                  <span className={`mx-3 fw-bold ${isSegmentHighlighted ? 'text-danger' : 'text-muted'}`}>═══ 🔒 ═══</span>
                  <span className={`badge rounded-pill px-3 py-2 ${isB_Highlighted ? 'bg-danger text-white' : 'bg-white text-dark border'}`}>
                    {seg.stationBName}
                  </span>
                </div>
              )
            })}
          </div>
        </Card.Body>
      </Card>
    )
  }

  if (!lines) 
    return <div className="text-center py-3">Loading commercial lines...</div>
  return (
    <Card className="mb-3 border-0 shadow-sm">
      <Card.Header className="bg-white fw-bold border-bottom">🛤️ Map Metropolitan Network</Card.Header>
      <Card.Body className="p-4" style={{ maxHeight: '500px', overflowY: 'auto', overflowX: 'auto' }}>
        
        {lines.map(line => (//cicla su ogni linea
          <div key={line.id} className="mb-5" style={{ minWidth: '600px' }}>
            <h5 className="mb-4 text-uppercase tracking-wider" style={{ color: line.color, fontWeight: '900' }}>
              {line.name}
            </h5>
            <div className="position-relative d-flex justify-content-between align-items-start px-4">
              <div 
                className="position-absolute" 
                style={{ 
                  top: '12px',      
                  left: '50px',     
                  right: '50px',    
                  height: '8px', 
                  backgroundColor: line.color, 
                  zIndex: 0,
                  borderRadius: '4px'
                }}
              ></div>

              {line.stations.map((sid) => {
                const station = stations.find(s => Number(s.id) === Number(sid)) // cerca dentro a stations le stazioni interessate

                return (
                  <div key={sid} className="d-flex flex-column align-items-center position-relative" style={{ zIndex: 1, width: '100px' }}>
                    
                    <div 
                      className="rounded-circle border border-4"
                      style={{ 
                        width: '32px', 
                        height: '32px', 
                        backgroundColor: '#ffffff', 
                        borderColor:  line.color, 
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        transition: 'all 0.3s ease'
                      }}
                    ></div>
                    
                    <div 
                      className="text-center mt-2 text-dark fw-medium"
                      style={{ fontSize: '0.85rem', lineHeight: '1.2' }}
                    >
                      {station?.name}
                    </div>
                  </div>
                )
              })}
            </div>
            
          </div>
        ))}

      </Card.Body>
    </Card>
  )
}

export default NetworkMap