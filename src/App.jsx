import React from 'react'
import { AppProvider } from './context/AppContext'
import { RainbowKitProviderComponent } from './components/RainbowKitProvider'
import Dashboard from './components/Dashboard'
import ErrorBoundary from './components/ErrorBoundary'
import '@rainbow-me/rainbowkit/styles.css'

function App() {
  return (
    <RainbowKitProviderComponent>
      <ErrorBoundary>
        <AppProvider>
          <Dashboard />
        </AppProvider>
      </ErrorBoundary>
    </RainbowKitProviderComponent>
  )
}

export default App
