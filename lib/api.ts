const TIMEOUT_MS = 12000

async function apiFetch(path: string, options: RequestInit = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch(path, {
      ...options,
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...options.headers },
    })

    if (res.status === 401) {
      // Only redirect if we're inside the app, not on auth endpoints or the login page itself
      if (
        typeof window !== 'undefined' &&
        window.location.pathname !== '/' &&
        !path.startsWith('/api/auth/')
      ) {
        window.location.href = '/'
      }
      throw new Error('Session expired')
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }))
      throw new Error(err.error || 'Request failed')
    }
    return res.json()
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Request timed out — check that MongoDB is running')
    }
    throw err
  } finally {
    clearTimeout(timer)
  }
}

// Auth
export const api = {
  auth: {
    login: (email: string, password: string) =>
      apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    verifyOtp: (email: string, otp: string) =>
      apiFetch('/api/auth/verify-otp', { method: 'POST', body: JSON.stringify({ email, otp }) }),
    logout: () => apiFetch('/api/auth/logout', { method: 'POST' }),
    me: () => apiFetch('/api/auth/me'),
  },

  workflows: {
    list: (params?: Record<string, string>) => {
      const q = params ? '?' + new URLSearchParams(params).toString() : ''
      return apiFetch(`/api/workflows${q}`)
    },
    get: (id: string) => apiFetch(`/api/workflows/${id}`),
    create: (data: Record<string, unknown>) =>
      apiFetch('/api/workflows', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Record<string, unknown>) =>
      apiFetch(`/api/workflows/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => apiFetch(`/api/workflows/${id}`, { method: 'DELETE' }),
  },

  batches: {
    list: (params?: Record<string, string>) => {
      const q = params ? '?' + new URLSearchParams(params).toString() : ''
      return apiFetch(`/api/batches${q}`)
    },
    get: (id: string) => apiFetch(`/api/batches/${id}`),
    create: (data: Record<string, unknown>) =>
      apiFetch('/api/batches', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Record<string, unknown>) =>
      apiFetch(`/api/batches/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => apiFetch(`/api/batches/${id}`, { method: 'DELETE' }),
  },

  tasks: {
    list: (params?: Record<string, string>) => {
      const q = params ? '?' + new URLSearchParams(params).toString() : ''
      return apiFetch(`/api/tasks${q}`)
    },
    get: (id: string) => apiFetch(`/api/tasks/${id}`),
    create: (data: Record<string, unknown>) =>
      apiFetch('/api/tasks', { method: 'POST', body: JSON.stringify(data) }),
    action: (id: string, action: string, extras?: Record<string, unknown>) =>
      apiFetch(`/api/tasks/${id}`, { method: 'PATCH', body: JSON.stringify({ action, ...extras }) }),
    delete: (id: string) => apiFetch(`/api/tasks/${id}`, { method: 'DELETE' }),
  },

  reviews: {
    list: (params?: Record<string, string>) => {
      const q = params ? '?' + new URLSearchParams(params).toString() : ''
      return apiFetch(`/api/reviews${q}`)
    },
    get: (id: string) => apiFetch(`/api/reviews/${id}`),
    claim: (id: string) =>
      apiFetch(`/api/reviews/${id}`, { method: 'PATCH', body: JSON.stringify({ action: 'claim' }) }),
    decide: (id: string, data: Record<string, unknown>) =>
      apiFetch(`/api/reviews/${id}`, { method: 'PATCH', body: JSON.stringify({ action: 'decide', ...data }) }),
  },

  notifications: {
    list: () => apiFetch('/api/notifications'),
    markRead: (id: string) => apiFetch(`/api/notifications/${id}`, { method: 'PATCH' }),
    markAllRead: () => apiFetch('/api/notifications', { method: 'PUT', body: JSON.stringify({ markAllRead: true }) }),
  },

  analytics: {
    get: () => apiFetch('/api/analytics'),
  },

  users: {
    list: () => apiFetch('/api/users'),
    create: (data: Record<string, unknown>) =>
      apiFetch('/api/users', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Record<string, unknown>) =>
      apiFetch(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    awardBadge: (id: string, badge: Record<string, unknown>) =>
      apiFetch(`/api/users/${id}`, { method: 'PATCH', body: JSON.stringify({ action: 'award-badge', badge }) }),
    removeBadge: (id: string, badge: Record<string, unknown>) =>
      apiFetch(`/api/users/${id}`, { method: 'PATCH', body: JSON.stringify({ action: 'remove-badge', badge }) }),
  },

  seed: () => apiFetch('/api/seed', { method: 'POST' }),
}
