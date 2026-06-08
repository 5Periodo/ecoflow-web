import { reactive } from 'vue'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: number
  message: string
  type: ToastType
  duration: number
}

const state = reactive<{ toasts: Toast[] }>({ toasts: [] })
let nextId = 0

function show(message: string, type: ToastType = 'info', duration = 3500) {
  const id = nextId++
  state.toasts.push({ id, message, type, duration })
  setTimeout(() => remove(id), duration)
}

function remove(id: number) {
  const idx = state.toasts.findIndex(t => t.id === id)
  if (idx !== -1) state.toasts.splice(idx, 1)
}

export const toast = {
  success: (msg: string, duration?: number) => show(msg, 'success', duration),
  error:   (msg: string, duration?: number) => show(msg, 'error',   duration ?? 5000),
  warning: (msg: string, duration?: number) => show(msg, 'warning', duration),
  info:    (msg: string, duration?: number) => show(msg, 'info',    duration),
  remove,
  state,
}
