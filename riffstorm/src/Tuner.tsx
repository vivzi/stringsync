import './App.css'
import { useState, useCallback } from 'react'
import { frequencyToTuner } from './usePitchDetector'
import { usePitchDetector } from './usePitchDetector'

type TunerProps = {
  onBack: () => void
}

function Tuner({ onBack }: TunerProps) {
  const [tunerData, setTunerData] = useState<{ note: string, cents: number } | null>(null)
  
  const handleNote = useCallback((note: string, freq: number, clarity: number) => {
    setTunerData(frequencyToTuner(freq))
  }, [])

  const { start, stop } = usePitchDetector(handleNote)

  return (
    <main className="app">
      <section className="hero">
        <h1>RiffStorm Tuner</h1>

        <div className="panel">
          <h2>Current Note</h2>
          <div className="note">{tunerData?.note ?? 'idk'}</div>
          <p className="status">{tunerData ? `${tunerData.cents > 0 ? '+' : ''}${tunerData.cents} cents`: '+0 cents'}</p>
        </div>

        <div className="actions">
          <button className="secondary" onClick={start}>Start Tuner</button>
          <button className="secondary" onClick={stop}>Stop Tuner</button>
          <button className="primary" onClick={onBack}> Go Back Home </button>
        </div>
      </section>
    </main>
  )
}

export default Tuner