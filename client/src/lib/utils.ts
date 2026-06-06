import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const SAFE_MESSAGES: Record<string, string> = {
  '401': 'Session expired. Please sign in again.',
  '403': 'You do not have permission to perform this action.',
  '404': 'The requested resource was not found.',
  '409': 'A conflict occurred. Please try again.',
  '429': 'Too many requests. Please wait and try again.',
  '500': 'Something went wrong on our end. Please try again.',
}

export function sanitizeError(err: unknown, fallback = 'Something went wrong'): string {
  if (err instanceof Error) {
    const status = (err as Error & { status?: number }).status
    if (status && SAFE_MESSAGES[String(status)]) {
      return SAFE_MESSAGES[String(status)]
    }
    return err.message || fallback
  }
  if (typeof err === 'string') return err || fallback
  return fallback
}

type GraphQlError = {
  message: string
  extensions?: { code?: string }
}

export function parseGraphqlError(err: unknown): string[] {
  if (!err) return []
  const clientError = err as
    | { response?: { errors?: GraphQlError[] } }
    | undefined

  if (clientError?.response?.errors && clientError.response.errors.length > 0) {
    return clientError.response.errors.map((e) => e.message)
  }

  if (err instanceof Error) {
    return [sanitizeError(err)]
  }

  return ['Something went wrong']
}