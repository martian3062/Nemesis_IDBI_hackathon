import { useState } from 'react'
import App from './App'
import { LandingPage } from './site/LandingPage'

export default function Root() {
  const [view, setView] = useState<'landing' | 'console'>('landing')

  if (view === 'console') {
    return <App onHome={() => setView('landing')} />
  }

  return <LandingPage onLaunch={() => setView('console')} />
}
