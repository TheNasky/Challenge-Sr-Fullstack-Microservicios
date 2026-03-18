import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

type ApiSuccess<T> = { isSuccess: true; data: T; message: string }
type ApiFailure = { isSuccess: false; message: string; errors?: string[] }
type ApiResponse<T> = ApiSuccess<T> | ApiFailure

type EventLogRow = {
  id: number
  type: string
  payload: Record<string, unknown>
  createdAt: string
}

type Toast = {
  id: number
  message: string
  type: 'success' | 'error'
}

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:3000'

async function api<T>(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, ...rest } = options
  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: {
      ...(rest.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(rest.headers ?? {}),
    },
  })

  const text = await res.text()
  const json = text ? (JSON.parse(text) as unknown) : null

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${text}`)
  }

  return json as T
}

function App() {
  const [token, setToken] = useState<string>(() => localStorage.getItem('token') ?? '')
  const [email, setEmail] = useState('admin@admin.com')
  const [password, setPassword] = useState('12345678')
  const [log, setLog] = useState<string[]>([])

  const [productId, setProductId] = useState<number | ''>('')
  const [productStock, setProductStock] = useState<number>(0)
  const [assignUserId, setAssignUserId] = useState<number | ''>('')
  const [assignRoleId, setAssignRoleId] = useState<number>(2)

  const [events, setEvents] = useState<EventLogRow[]>([])
  const lastEventIdRef = useRef<number>(0)
  const [toasts, setToasts] = useState<Toast[]>([])
  const toastIdRef = useRef<number>(0)

  const authed = Boolean(token)

  useEffect(() => {
    if (token) localStorage.setItem('token', token)
    else localStorage.removeItem('token')
  }, [token])

  const appendLog = (line: string) => setLog((prev) => [...prev.slice(-200), line])

  const showToast = (message: string, type: 'success' | 'error') => {
    const id = toastIdRef.current++
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 7500)
  }

  const authHeaderHint = useMemo(() => (authed ? 'Authenticated' : 'Not authenticated'), [authed])

  const pollEvents = async () => {
    const afterId = lastEventIdRef.current
    const res = await api<ApiResponse<{ events: EventLogRow[] }>>(`/events?afterId=${afterId}&limit=100`)
    if (res.isSuccess && res.data.events.length > 0) {
      lastEventIdRef.current = res.data.events[res.data.events.length - 1].id
      setEvents((prev) => [...res.data.events, ...prev].slice(0, 500))
    }
  }

  useEffect(() => {
    const id = window.setInterval(() => {
      pollEvents().catch(() => {})
    }, 1000)
    return () => window.clearInterval(id)
  }, [])

  const onRegister = async () => {
    try {
      const res = await api<ApiResponse<{ message: string }>>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      if (res.isSuccess) {
        showToast('User registered successfully', 'success')
        appendLog(`register: ok`)
      } else {
        showToast(res.message, 'error')
        appendLog(`register: ${res.message}`)
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Registration failed'
      showToast(message, 'error')
      appendLog(`register: ${message}`)
    }
  }

  const onLogin = async () => {
    try {
      const res = await api<ApiResponse<{ accessToken: string }>>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      if (res.isSuccess) {
        setToken(res.data.accessToken)
        showToast('Logged in successfully', 'success')
        appendLog('login: ok')
        return
      }
      showToast(res.message, 'error')
      appendLog(`login: ${res.message}`)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Login failed'
      showToast(message, 'error')
      appendLog(`login: ${message}`)
    }
  }

  const onLogout = () => {
    setToken('')
    appendLog('logout: ok')
  }

  const onGetProfile = async () => {
    try {
      const res = await api<ApiResponse<{ id: number; email: string }>>('/user/profile', {
        method: 'GET',
        token,
      })
      if (res.isSuccess) {
        showToast('Profile loaded successfully', 'success')
        appendLog(`profile: ${JSON.stringify(res.data)}`)
      } else {
        showToast(res.message, 'error')
        appendLog(`profile: ${res.message}`)
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to load profile'
      showToast(message, 'error')
      appendLog(`profile: ${message}`)
    }
  }

  const onCreateProduct = async () => {
    try {
      const res = await api<ApiResponse<{ id: number }>>('/product/create', {
        method: 'POST',
        token,
        body: JSON.stringify({ categoryId: 1 }),
      })
      if (res.isSuccess) {
        setProductId(res.data.id)
        showToast(`Product created (ID: ${res.data.id})`, 'success')
        appendLog(`product/create: ok (id=${res.data.id})`)
        return
      }
      showToast(res.message, 'error')
      appendLog(`product/create: ${res.message}`)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create product'
      showToast(message, 'error')
      appendLog(`product/create: ${message}`)
    }
  }

  const onAddProductDetails = async () => {
    if (!productId) return
    try {
      const res = await api<ApiResponse<{ id: number }>>(`/product/${productId}/details`, {
        method: 'POST',
        token,
        body: JSON.stringify({
          title: 'Laptop',
          code: `LAP-${Date.now()}`,
          variationType: 'NONE',
          details: {
            category: 'Computers',
            capacity: 512,
            capacityUnit: 'GB',
            capacityType: 'SSD',
            brand: 'Acme',
            series: 'Pro',
          },
          about: ['Fast', 'Light'],
          description: 'Test product',
        }),
      })
      if (res.isSuccess) {
        showToast('Product details added', 'success')
        appendLog(`product/${productId}/details: ok`)
      } else {
        showToast(res.message, 'error')
        appendLog(`product/${productId}/details: ${res.message}`)
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to add product details'
      showToast(message, 'error')
      appendLog(`product/${productId}/details: ${message}`)
    }
  }

  const onActivateProduct = async () => {
    if (!productId) return
    try {
      // First add details, then activate
      await onAddProductDetails()
      
      const res = await api<ApiResponse<{ id: number; isActive: boolean }>>(`/product/${productId}/activate`, {
        method: 'POST',
        token,
        body: JSON.stringify({ stock: productStock }),
      })
      if (res.isSuccess) {
        showToast(`Product activated with ${productStock} stock`, 'success')
        appendLog(`product/${productId}/activate: ok`)
      } else {
        showToast(res.message, 'error')
        appendLog(`product/${productId}/activate: ${res.message}`)
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to activate product'
      showToast(message, 'error')
      appendLog(`product/${productId}/activate: ${message}`)
    }
  }

  const onCreateTestUser = async () => {
    const randomEmail = `test${Math.floor(Math.random() * 10000)}@test.com`
    const randomPassword = Math.random().toString(36).slice(-8)
    try {
      const registerRes = await api<ApiResponse<{ message: string }>>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email: randomEmail, password: randomPassword }),
      })
      if (!registerRes.isSuccess) {
        showToast(registerRes.message, 'error')
        appendLog(`test user: ${registerRes.message}`)
        return
      }

      // Login to get token and user ID
      const loginRes = await api<ApiResponse<{ accessToken: string }>>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: randomEmail, password: randomPassword }),
      })
      if (!loginRes.isSuccess) {
        showToast(`User created but failed to login: ${loginRes.message}`, 'error')
        appendLog(`test user: created but login failed: ${loginRes.message}`)
        return
      }

      const tempToken = loginRes.data.accessToken
      
      // Get profile to get user ID
      const profileRes = await api<ApiResponse<{ id: number; email: string }>>('/user/profile', {
        method: 'GET',
        token: tempToken,
      })
      
      if (profileRes.isSuccess) {
        const userId = profileRes.data.id
        showToast(`Test user created! ID: ${userId} | Email: ${randomEmail} | Password: ${randomPassword}`, 'success')
        appendLog(`test user created: ID=${userId}, ${randomEmail} / ${randomPassword}`)
      } else {
        showToast(`User created but failed to get ID: ${profileRes.message}`, 'error')
        appendLog(`test user: created but profile failed: ${profileRes.message}`)
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create test user'
      showToast(message, 'error')
      appendLog(`test user: ${message}`)
    }
  }

  const onAssignRole = async () => {
    if (!assignUserId) return
    try {
      const res = await api<ApiResponse<unknown>>('/role/assign', {
        method: 'POST',
        token,
        body: JSON.stringify({ userId: Number(assignUserId), roleId: assignRoleId }),
      })
      if (res.isSuccess) {
        showToast('Role assigned successfully', 'success')
        appendLog(`role/assign: ok`)
      } else {
        showToast(res.message, 'error')
        appendLog(`role/assign: ${res.message}`)
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to assign role'
      showToast(message, 'error')
      appendLog(`role/assign: ${message}`)
    }
  }

  return (
    <div className="page">
      <header className="header">
        <div>
          <div className="title">Ecommerce Challenge – Frontend</div>
          <div className="subtitle">{API_BASE} • {authHeaderHint}</div>
        </div>
        <div className="row">
          <button className="btn" onClick={pollEvents}>Refresh events</button>
          <button className="btn" onClick={() => setEvents([])}>Clear events</button>
        </div>
      </header>

      <main className="grid">
        <section className="card">
          <h2>Auth</h2>
          <label className="field">
            <span>Email</span>
            <input value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="field">
            <span>Password</span>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" />
          </label>
          <div className="row">
            <button className="btn" onClick={onRegister}>Register</button>
            <button className="btn" onClick={onLogin}>Login</button>
            <button className="btn" onClick={onLogout} disabled={!authed}>Logout</button>
          </div>
          <div className="row">
            <button className="btn" onClick={onGetProfile} disabled={!authed}>Get /user/profile</button>
          </div>
          <div className="hint">Seeded admin: admin@admin.com / 12345678</div>
        </section>

        <section className="card">
          <h2>Products</h2>
          <div className="row">
            <button className="btn" onClick={onCreateProduct} disabled={!authed}>Create product (categoryId=1)</button>
          </div>
          <label className="field">
            <span>Product ID</span>
            <input
              value={productId}
              onChange={(e) => setProductId(e.target.value ? Number(e.target.value) : '')}
              inputMode="numeric"
            />
          </label>
          <label className="field">
            <span>Stock Quantity</span>
            <input
              type="number"
              min="0"
              value={productStock}
              onChange={(e) => setProductStock(Number(e.target.value) || 0)}
              inputMode="numeric"
            />
          </label>
          <div className="row">
            <button className="btn" onClick={onActivateProduct} disabled={!authed || !productId}>Activate (adds details & activates)</button>
          </div>
        </section>

        <section className="card">
          <h2>Roles</h2>
          <label className="field">
            <span>User ID</span>
            <input
              value={assignUserId}
              onChange={(e) => setAssignUserId(e.target.value ? Number(e.target.value) : '')}
              inputMode="numeric"
            />
          </label>
          <label className="field">
            <span>Role ID</span>
            <select value={assignRoleId} onChange={(e) => setAssignRoleId(Number(e.target.value))}>
              <option value={1}>1 - Customer</option>
              <option value={2}>2 - Merchant</option>
              <option value={3}>3 - Admin</option>
            </select>
          </label>
          <div className="row">
            <button className="btn" onClick={onCreateTestUser} disabled={!authed}>Create new test user</button>
            <button className="btn" onClick={onAssignRole} disabled={!authed || !assignUserId}>Assign (emits event)</button>
          </div>
          <div className="hint">Tip: Click "Create new test user" to generate a random user, then use their ID to assign roles.</div>
        </section>

        <section className="card wide">
          <h2>Event log (polling /events)</h2>
          <div className="events">
            {events.length === 0 ? (
              <div className="muted">No events yet.</div>
            ) : (
              events.map((e) => (
                <div className="event" key={e.id}>
                  <div className="eventTop">
                    <span className="badge" data-type={e.type}>{e.type}</span>
                    <span className="muted">#{e.id} • {new Date(e.createdAt).toLocaleString()}</span>
                  </div>
                  <pre className="pre">{JSON.stringify(e.payload, null, 2)}</pre>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="card wide">
          <h2>Client log</h2>
          <pre className="pre">{log.join('\n')}</pre>
        </section>
      </main>

      <div className="toastContainer">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  )
}

export default App
