"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"
import { logger } from "@/lib/logger"

const log = logger.child("error-boundary")

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<ErrorFallbackProps>
}

interface ErrorFallbackProps {
  error: Error
  resetErrorBoundary: () => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error with proper context
    log.error("ErrorBoundary caught an error", error, {
      componentStack: errorInfo.componentStack,
    })
  }

  resetErrorBoundary = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      return (
        <FallbackComponent error={this.state.error} resetErrorBoundary={this.resetErrorBoundary} />
      )
    }

    return this.props.children
  }
}

function DefaultErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <CardTitle>Something went wrong</CardTitle>
          </div>
          <CardDescription>
            An unexpected error occurred. Please try again or contact support if the problem persists.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {process.env.NODE_ENV === "development" && (
            <div className="rounded-md bg-muted p-3">
              <p className="text-xs font-mono text-muted-foreground break-all">{error.message}</p>
            </div>
          )}
          <div className="flex gap-2">
            <Button onClick={resetErrorBoundary} variant="default">
              Try again
            </Button>
            <Button
              onClick={() => {
                window.location.href = "/"
              }}
              variant="outline"
            >
              Go home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export { ErrorBoundary, type ErrorFallbackProps }
