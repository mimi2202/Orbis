import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit'
import { bsc } from 'wagmi/chains'

import '@rainbow-me/rainbowkit/styles.css'

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'YOUR_WALLETCONNECT_PROJECT_ID'

// Create config using getDefaultConfig
const config = getDefaultConfig({
  appName: 'Syntra',
  projectId: projectId,
  chains: [bsc],
  transports: {
    [bsc.id]: http('https://bsc-dataseed.binance.org/'),
  },
})

const queryClient = new QueryClient()

export function RainbowKitProviderComponent({ children }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
