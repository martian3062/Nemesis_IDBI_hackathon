import { Component, lazy, Suspense, type ReactNode } from 'react'

const NeuralField = lazy(() => import('./NeuralField'))

// three.js can fail on constrained GPUs; never let the AI hero break the app.
class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    if (this.state.failed) return <div className="neural-field neural-fallback" aria-hidden="true" />
    return this.props.children
  }
}

export function LazyNeuralField() {
  return (
    <Boundary>
      <Suspense fallback={<div className="neural-field neural-fallback" aria-hidden="true" />}>
        <NeuralField />
      </Suspense>
    </Boundary>
  )
}
