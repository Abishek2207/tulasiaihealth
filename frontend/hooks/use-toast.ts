import { useState, useCallback } from 'react'

interface Toast {
  id: string
  title: string
  description?: string
  variant?: 'default' | 'destructive'
}

interface ToastState {
  toasts: Toast[]
}

export function useToast() {
  const [state, setState] = useState<ToastState>({ toasts: [] })

  const toast = useCallback(({ title, description, variant = 'default' }: Omit<Toast, 'id'>) => {
    const newId = Math.random().toString(36).substr(2, 9)
    const newToast: Toast = { id: newId, title, description, variant }

    setState((prevState) => ({
      toasts: [...prevState.toasts, newToast],
    }))

    // Auto remove after 5 seconds
    setTimeout(() => {
      setState((prevState) => ({
        toasts: prevState.toasts.filter((t) => t.id !== newId),
      }))
    }, 5000)

    return newId
  }, [])

  const dismiss = useCallback((id: string) => {
    setState((prevState) => ({
      toasts: prevState.toasts.filter((t) => t.id !== id),
    }))
  }, [])

  return {
    toast,
    dismiss,
    toasts: state.toasts,
  }
}
