
import { useEffect, useState } from "react";
import axios from "axios";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";

import "./App.css";
import Login from "./Login";
import Register from "./Register";
import ProtectedRoute from "./ProtectedRoute";

const taskApi = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/tasks`,
});

taskApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

function TaskManager() {
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchTasks() {
    try {
      setError("");
      const response = await taskApi.get("/");
      setTasks(response.data);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login", { replace: true });
        return;
      }

      setError("Could not load tasks. Check that your backend is running.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTasks();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!title.trim()) return;

    try {
      setError("");

      if (editingId) {
        await taskApi.put(`/${editingId}`, {
          title: title.trim(),
          description,
        });
      } else {
        await taskApi.post("/", {
          title: title.trim(),
          description,
          completed: false,
        });
      }

      setTitle("");
      setDescription("");
      setEditingId(null);
      await fetchTasks();
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login", { replace: true });
        return;
      }

      setError("Could not save the task. Please try again.");
    }
  }

  async function toggleTask(task) {
    try {
      await taskApi.put(`/${task._id}`, {
        completed: !task.completed,
      });

      await fetchTasks();
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login", { replace: true });
        return;
      }

      setError("Could not update the task.");
    }
  }

  function editTask(task) {
    setEditingId(task._id);
    setTitle(task.title);
    setDescription(task.description || "");
  }

  async function deleteTask(id) {
    if (!window.confirm("Delete this task?")) return;

    try {
      await taskApi.delete(`/${id}`);
      await fetchTasks();
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login", { replace: true });
        return;
      }

      setError("Could not delete the task.");
    }
  }

  function handleLogout() {
    localStorage.removeItem("token");
    navigate("/login", { replace: true });
  }

  const filteredTasks = tasks.filter((task) => {
    if (filter === "active") return !task.completed;
    if (filter === "completed") return task.completed;
    return true;
  });

  return (
    <main className="app">
      <section className="todo-container">
        <header className="header">
          <p className="eyebrow">YOUR PERSONAL WORKSPACE</p>
          <h1>Task Manager</h1>
          <p className="subtitle">
            Plan your work. Track your progress.
          </p>

          <button
            className="logout-button"
            type="button"
            onClick={handleLogout}
          >
            Log out
          </button>
        </header>

        <form className="task-form" onSubmit={handleSubmit}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What needs to get done?"
            required
          />

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a description (optional)"
            rows="2"
          />

          <button className="primary-button" type="submit">
            {editingId ? "Save Changes" : "Add Task"}
          </button>

          {editingId && (
            <button
              className="cancel-button"
              type="button"
              onClick={() => {
                setEditingId(null);
                setTitle("");
                setDescription("");
              }}
            >
              Cancel Editing
            </button>
          )}
        </form>

        {error && <p className="error">{error}</p>}

        <div className="task-summary">
          <span>
            {tasks.filter((task) => !task.completed).length} remaining
          </span>
          <span>
            {tasks.filter((task) => task.completed).length} completed
          </span>
        </div>

        <nav className="filters">
          {["all", "active", "completed"].map((item) => (
            <button
              key={item}
              type="button"
              className={
                filter === item ? "filter active-filter" : "filter"
              }
              onClick={() => setFilter(item)}
            >
              {item[0].toUpperCase() + item.slice(1)}
            </button>
          ))}
        </nav>

        <section className="task-list">
          {loading ? (
            <p className="empty-message">Loading tasks...</p>
          ) : filteredTasks.length === 0 ? (
            <p className="empty-message">No tasks here yet.</p>
          ) : (
            filteredTasks.map((task) => (
              <article className="task-card" key={task._id}>
                <input
                  className="task-checkbox"
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleTask(task)}
                  aria-label={`Mark ${task.title} as ${
                    task.completed ? "active" : "completed"
                  }`}
                />

                <div className="task-content">
                  <h3 className={task.completed ? "completed-title" : ""}>
                    {task.title}
                  </h3>

                  {task.description && <p>{task.description}</p>}
                </div>

                <div className="task-actions">
                  <button type="button" onClick={() => editTask(task)}>
                    Edit
                  </button>

                  <button
                    className="delete-button"
                    type="button"
                    onClick={() => deleteTask(task._id)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))
          )}
        </section>
      </section>
    </main>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/tasks" element={<TaskManager />} />
        </Route>

        <Route path="/" element={<Navigate to="/tasks" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
