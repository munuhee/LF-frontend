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

export const api = {
  // ── Auth ────────────────────────────────────────────────────────────────────
  auth: {
    login: (email: string, password: string) =>
      apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    verifyOtp: (email: string, otp: string, clientSlug?: string) =>
      apiFetch('/api/auth/verify-otp', { method: 'POST', body: JSON.stringify({ email, otp, clientSlug }) }),
    logout: () => apiFetch('/api/auth/logout', { method: 'POST' }),
    me: () => apiFetch('/api/auth/me'),
    /** Super Admin only: impersonate a user in a specific workspace */
    impersonate: (targetUserId: string, clientSlug: string) =>
      apiFetch('/api/auth/impersonate', { method: 'POST', body: JSON.stringify({ targetUserId, clientSlug }) }),
  },

  // ── Clients (Super Admin) ───────────────────────────────────────────────────
  clients: {
    list: () => apiFetch('/api/clients'),
    get: (id: string) => apiFetch(`/api/clients/${id}`),
    create: (data: Record<string, unknown>) =>
      apiFetch('/api/clients', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Record<string, unknown>) =>
      apiFetch(`/api/clients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deactivate: (id: string) =>
      apiFetch(`/api/clients/${id}`, { method: 'DELETE' }),
    activate: (id: string) =>
      apiFetch(`/api/clients/${id}`, { method: 'PATCH', body: JSON.stringify({ action: 'activate' }) }),
  },

  // ── Projects (Client Admin) ─────────────────────────────────────────────────
  projects: {
    list: (params?: Record<string, string>) => {
      const q = params ? '?' + new URLSearchParams(params).toString() : ''
      return apiFetch(`/api/projects${q}`)
    },
    get: (id: string) => apiFetch(`/api/projects/${id}`),
    create: (data: Record<string, unknown>) =>
      apiFetch('/api/projects', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Record<string, unknown>) =>
      apiFetch(`/api/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => apiFetch(`/api/projects/${id}`, { method: 'DELETE' }),
  },

  // ── Memberships (Client Admin + Super Admin) ────────────────────────────────
  memberships: {
    list: () => apiFetch('/api/memberships'),
    /** Super Admin: list members of any client by its id */
    listForClient: (clientId: string) => apiFetch(`/api/memberships?clientId=${clientId}`),
    /** Super Admin: list members of any client by its slug */
    listForClientSlug: (clientSlug: string) => apiFetch(`/api/memberships?clientSlug=${clientSlug}`),
    add: (data: { userId?: string; email?: string; role: string }) =>
      apiFetch('/api/memberships', { method: 'POST', body: JSON.stringify(data) }),
    /** Super Admin: add a member to any client workspace by client id */
    addToClient: (clientId: string, data: { email: string; role: string }) =>
      apiFetch('/api/memberships', { method: 'POST', body: JSON.stringify({ ...data, clientId }) }),
    updateRole: (membershipId: string, role: string) =>
      apiFetch('/api/memberships', { method: 'PATCH', body: JSON.stringify({ membershipId, action: 'update-role', role }) }),
    deactivate: (membershipId: string) =>
      apiFetch('/api/memberships', { method: 'PATCH', body: JSON.stringify({ membershipId, action: 'deactivate' }) }),
    reactivate: (membershipId: string) =>
      apiFetch('/api/memberships', { method: 'PATCH', body: JSON.stringify({ membershipId, action: 'reactivate' }) }),
  },

  // ── Workflows ───────────────────────────────────────────────────────────────
  workflows: {
    /**
     * List workflows. Accepts standard filter params plus:
     * - clientSlug: filter by workspace slug (super_admin only)
     * - clientId: filter by workspace id (super_admin only)
     */
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
    assign: (id: string, userId: string) =>
      apiFetch(`/api/workflows/${id}`, { method: 'PATCH', body: JSON.stringify({ action: 'assign', userId }) }),
    unassign: (id: string, userId: string) =>
      apiFetch(`/api/workflows/${id}`, { method: 'PATCH', body: JSON.stringify({ action: 'unassign', userId }) }),
  },

  // ── Batches ─────────────────────────────────────────────────────────────────
  batches: {
    /**
     * List batches. Accepts workflowId, status, taskType, projectId plus:
     * - clientSlug: filter by workspace slug (super_admin only)
     * - clientId: filter by workspace id (super_admin only)
     */
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

  // ── Tasks ───────────────────────────────────────────────────────────────────
  tasks: {
    /**
     * List tasks. Accepts batchId, status, mine, projectId, workflow,
     * annotatorEmail, reviewerEmail, dateFrom, dateTo, dateExact plus:
     * - clientSlug: filter by workspace slug (super_admin only)
     * - clientId: filter by workspace id (super_admin only)
     */
    list: (params?: Record<string, string>) => {
      const q = params ? '?' + new URLSearchParams(params).toString() : ''
      return apiFetch(`/api/tasks${q}`)
    },
    get: (id: string) => apiFetch(`/api/tasks/${id}`),
    create: (data: Record<string, unknown>) =>
      apiFetch('/api/tasks', { method: 'POST', body: JSON.stringify(data) }),
    action: (id: string, action: string, extras?: Record<string, unknown>) =>
      apiFetch(`/api/tasks/${id}`, { method: 'PATCH', body: JSON.stringify({ action, ...extras }) }),
    signOff: (id: string, qualityScore: number, comments?: string) =>
      apiFetch(`/api/tasks/${id}`, { method: 'PATCH', body: JSON.stringify({ action: 'sign-off', qualityScore, comments }) }),
    requestRework: (id: string, comment: string) =>
      apiFetch(`/api/tasks/${id}`, { method: 'PATCH', body: JSON.stringify({ action: 'request-rework', comment }) }),
    addErrorTag: (id: string, tag: { tagId: string; severity: string; category: string; message: string; stepReference?: string; scoreDeduction: number; status: string; createdBy: string; createdByEmail: string }) =>
      apiFetch(`/api/tasks/${id}`, { method: 'PATCH', body: JSON.stringify({ action: 'add-error-tag', tag }) }),
    removeErrorTag: (id: string, tagId: string) =>
      apiFetch(`/api/tasks/${id}`, { method: 'PATCH', body: JSON.stringify({ action: 'remove-error-tag', tagId }) }),
    resolveErrorTag: (id: string, tagId: string) =>
      apiFetch(`/api/tasks/${id}`, { method: 'PATCH', body: JSON.stringify({ action: 'resolve-error-tag', tagId }) }),
    bulkImport: (batchId: string, tasks: Record<string, unknown>[], metadata?: Record<string, unknown>) =>
      apiFetch('/api/tasks/bulk', { method: 'POST', body: JSON.stringify({ batchId, tasks, metadata }) }),
    delete: (id: string) => apiFetch(`/api/tasks/${id}`, { method: 'DELETE' }),
  },

  // ── Reviews ─────────────────────────────────────────────────────────────────
  reviews: {
    /**
     * List reviews. Accepts status, mine, projectId plus:
     * - clientSlug: filter by workspace slug (super_admin only)
     * - clientId: filter by workspace id (super_admin only)
     */
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

  // ── Notifications ────────────────────────────────────────────────────────────
  notifications: {
    list: () => apiFetch('/api/notifications'),
    markRead: (id: string) => apiFetch(`/api/notifications/${id}`, { method: 'PATCH' }),
    markAllRead: () => apiFetch('/api/notifications', { method: 'PUT', body: JSON.stringify({ markAllRead: true }) }),
  },

  // ── Analytics ───────────────────────────────────────────────────────────────
  analytics: {
    /**
     * Get analytics. Accepts projectId plus:
     * - clientSlug: scope to a workspace by slug (super_admin only)
     * - clientId: scope to a workspace by id (super_admin only)
     * Returns empty analytics for super_admin with no workspace context.
     */
    get: (params?: Record<string, string>) => {
      const q = params && Object.keys(params).length ? '?' + new URLSearchParams(params).toString() : ''
      return apiFetch(`/api/analytics${q}`)
    },
  },

  // ── Users ────────────────────────────────────────────────────────────────────
  users: {
    /**
     * List users. For super_admin, accepts:
     * - clientSlug: filter to members of a specific workspace by slug
     * - clientId: filter to members of a specific workspace by id
     */
    list: (params?: Record<string, string>) => {
      const q = params && Object.keys(params).length ? '?' + new URLSearchParams(params).toString() : ''
      return apiFetch(`/api/users${q}`)
    },
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
