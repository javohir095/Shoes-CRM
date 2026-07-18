import React from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('Uncaught error:', error, info)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-6">
          <div className="glass-panel max-w-md rounded-2xl p-8 text-center shadow-glass">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
              <AlertTriangle className="h-7 w-7 text-destructive" />
            </div>
            <h1 className="text-lg font-semibold">Nimadir xato ketdi</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Kutilmagan xatolik yuz berdi. Sahifani qayta yuklab ko'ring. Agar muammo davom etsa,
              administrator bilan bog'laning.
            </p>
            <Button onClick={this.handleReset} className="mt-6 w-full">
              <RotateCcw className="h-4 w-4" />
              Sahifani qayta yuklash
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
