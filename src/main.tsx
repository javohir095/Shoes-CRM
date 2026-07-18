import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import App from './App'
import { ErrorBoundary } from './components/common/ErrorBoundary'
import { isConfigured } from './lib/supabase'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

// If Supabase is not configured, show a setup screen instead of crashing
function ConfigWarning() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-4xl">⚙️</div>
      <div>
        <h1 className="text-xl font-bold text-foreground">Sozlash kerak</h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Supabase ulanmagan. Iltimos quyidagi qadamlarni bajaring:
        </p>
      </div>
      <div className="w-full max-w-lg rounded-2xl border bg-card p-5 text-left font-mono text-xs">
        <p className="mb-3 font-sans text-sm font-semibold text-foreground">1. Loyiha papkasida <code className="rounded bg-muted px-1">.env</code> fayl yarating:</p>
        <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-muted-foreground">{`VITE_SUPABASE_URL=https://xxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...`}</pre>
        <p className="mt-4 font-sans text-sm font-semibold text-foreground">2. Dev serverni qayta ishga tushiring:</p>
        <pre className="mt-1 overflow-x-auto rounded-lg bg-muted p-3 text-muted-foreground">{`npm run dev`}</pre>
        <p className="mt-4 font-sans text-xs text-muted-foreground">
          Kalitlarni <span className="text-primary">Supabase Dashboard → Settings → API</span> dan oling.
        </p>
      </div>
    </div>
  )
}

const rootElement = document.getElementById('root')!

if (!isConfigured) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <div className="min-h-screen bg-[hsl(36,33%,97%)] dark:bg-[hsl(222,22%,7%)]">
        <ConfigWarning />
      </div>
    </React.StrictMode>
  )
} else {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <App />
            <Toaster richColors position="top-right" closeButton theme="system" />
          </BrowserRouter>
        </QueryClientProvider>
      </ErrorBoundary>
    </React.StrictMode>
  )
}
