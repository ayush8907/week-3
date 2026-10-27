import { useState } from 'react'
import axios from 'axios'
import './App.css'

const API_URL = 'http://localhost:5003/api'

function App() {
  const [mode, setMode] = useState('login')
  const [user, setUser] = useState(null)
  const [token, setToken] = useState('')
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' })
  const [tasks, setTasks] = useState([])
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    status: 'Pending',
    dueDate: '',
  })
  const [editingId, setEditingId] = useState(null)
  const [filter, setFilter] = useState('All')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const api = axios.create({
    baseURL: API_URL,
    headers: { Authorization: `Bearer ${token}` },
  })

  const loadTasks = async (activeToken = token, activeFilter = filter) => {
    try {
      const response = await axios.get(`${API_URL}/tasks`, {
        headers: { Authorization: `Bearer ${activeToken}` },
        params: activeFilter === 'All' ? {} : { status: activeFilter },
      })
      setTasks(response.data)
    } catch {
      setError('Could not load tasks. Please log in again.')
    }
  }

  const handleAuth = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register'
      const response = await axios.post(`${API_URL}${endpoint}`, authForm)

      if (mode === 'register') {
        setMessage('Account created! Please log in.')
        setMode('login')
        setAuthForm({ name: '', email: authForm.email, password: '' })
      } else {
        const { token: newToken, user: loggedInUser } = response.data
        setToken(newToken)
        setUser(loggedInUser)
        setMessage('Welcome back!')
        await loadTasks(newToken, 'All')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    setUser(null)
    setToken('')
    setTasks([])
    setMessage('')
    setError('')
    setEditingId(null)
  }

  const resetTaskForm = () => {
    setTaskForm({ title: '', description: '', status: 'Pending', dueDate: '' })
    setEditingId(null)
  }

  const handleTaskSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')

    try {
      const payload = {
        ...taskForm,
        dueDate: taskForm.dueDate || null,
      }

      if (editingId) {
        await api.put(`/tasks/${editingId}`, payload)
        setMessage('Task updated successfully.')
      } else {
        await api.post('/tasks', payload)
        setMessage('Task added successfully.')
      }

      resetTaskForm()
      await loadTasks()
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save the task.')
    }
  }

  const startEditing = (task) => {
    setEditingId(task._id)
    setTaskForm({
      title: task.title,
      description: task.description || '',
      status: task.status,
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const deleteTask = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return

    try {
      setError('')
      await api.delete(`/tasks/${id}`)
      setMessage('Task deleted successfully.')
      await loadTasks()
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete the task.')
    }
  }

  const changeFilter = async (nextFilter) => {
    setFilter(nextFilter)
    await loadTasks(token, nextFilter)
  }

  const completedCount = tasks.filter((task) => task.status === 'Completed').length

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="/">
          <span className="brand-icon">T</span>
          <span>TaskBloom</span>
        </a>
        {user && (
          <div className="user-area">
            <span className="user-greeting">Hi, {user.name}</span>
            <button className="button button-light button-small" onClick={handleLogout}>
              Log out
            </button>
          </div>
        )}
      </header>

      <section className="hero">
        <span className="eyebrow">YOUR SPACE TO GET THINGS DONE</span>
        <h1>Make room for <span>your goals.</span></h1>
        <p>A simple, calm space to organise your tasks and keep moving forward.</p>
      </section>

      {message && <div className="notice success-notice">{message}</div>}
      {error && <div className="notice error-notice">{error}</div>}

      {!user ? (
        <section className="auth-card">
          <div className="auth-heading">
            <h2>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
            <p>{mode === 'login' ? 'Log in to see what needs doing.' : 'Start organising your day.'}</p>
          </div>

          <form onSubmit={handleAuth} className="form-stack">
            {mode === 'register' && (
              <label>
                Full name
                <input
                  required
                  value={authForm.name}
                  onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                  placeholder="Your name"
                />
              </label>
            )}
            <label>
              Email address
              <input
                type="email"
                required
                value={authForm.email}
                onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                placeholder="you@example.com"
              />
            </label>
            <label>
              Password
              <input
                type="password"
                required
                minLength={6}
                value={authForm.password}
                onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                placeholder="At least 6 characters"
              />
            </label>
            <button className="button button-primary button-full" disabled={loading}>
              {loading ? 'Please wait...' : mode === 'login' ? 'Log in' : 'Create account'}
            </button>
          </form>

          <p className="switch-mode">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              type="button"
              className="text-button"
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login')
                setError('')
                setMessage('')
              }}
            >
              {mode === 'login' ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </section>
      ) : (
        <section className="dashboard">
          <div className="dashboard-heading">
            <div>
              <span className="eyebrow">YOUR DASHBOARD</span>
              <h2>Today's focus</h2>
            </div>
            <div className="task-summary">
              <strong>{tasks.length}</strong>
              <span>{tasks.length === 1 ? 'task shown' : 'tasks shown'}</span>
            </div>
          </div>

          <div className="dashboard-grid">
            <section className="panel task-editor">
              <h3>{editingId ? 'Edit task' : 'Add a new task'}</h3>
              <p className="panel-subtitle">
                {editingId ? 'Make changes to your task.' : 'One step at a time.'}
              </p>
              <form onSubmit={handleTaskSubmit} className="form-stack">
                <label>
                  Task title
                  <input
                    required
                    maxLength={120}
                    value={taskForm.title}
                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                    placeholder="What needs to be done?"
                  />
                </label>
                <label>
                  Description
                  <textarea
                    rows="3"
                    value={taskForm.description}
                    onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                    placeholder="Add a few details (optional)"
                  />
                </label>
                <label>
                  Status
                  <select
                    value={taskForm.status}
                    onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}
                  >
                    <option>Pending</option>
                    <option>In Progress</option>
                    <option>Completed</option>
                  </select>
                </label>
                <label>
                  Due date
                  <input
                    type="date"
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                  />
                </label>
                <button className="button button-primary button-full">
                  {editingId ? 'Save changes' : 'Add task'}
                </button>
                {editingId && (
                  <button type="button" className="button button-light button-full" onClick={resetTaskForm}>
                    Cancel editing
                  </button>
                )}
              </form>
            </section>

            <section className="task-list-section">
              <div className="filter-row">
                <h3>Your tasks</h3>
                <select value={filter} onChange={(e) => changeFilter(e.target.value)} aria-label="Filter tasks">
                  <option>All</option>
                  <option>Pending</option>
                  <option>In Progress</option>
                  <option>Completed</option>
                </select>
              </div>

              {tasks.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">✿</div>
                  <h3>Nothing here just yet</h3>
                  <p>Add a task or choose another filter to see your list.</p>
                </div>
              ) : (
                <div className="task-list">
                  {tasks.map((task) => (
                    <article className="task-card" key={task._id}>
                      <div className="task-card-top">
                        <span className={`status-pill ${task.status.toLowerCase().replace(' ', '-')}`}>
                          {task.status}
                        </span>
                        {task.dueDate && (
                          <span className="due-date">
                            Due {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <h4>{task.title}</h4>
                      {task.description && <p className="task-description">{task.description}</p>}
                      <div className="task-actions">
                        <button className="text-button" onClick={() => startEditing(task)}>Edit</button>
                        <button className="text-button delete-button" onClick={() => deleteTask(task._id)}>
                          Delete
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              <p className="completion-note">
                {completedCount} completed {completedCount === 1 ? 'task' : 'tasks'} in this view
              </p>
            </section>
          </div>
        </section>
      )}

      <footer className="footer">TaskBloom · A little progress adds up.</footer>
    </main>
  )
}

export default App