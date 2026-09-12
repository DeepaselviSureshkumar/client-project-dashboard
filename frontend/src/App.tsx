import React from "react";
import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { api, getAccessToken, refreshAccessToken, setAccessToken } from "./api";
import { useAuth } from "./store";
import { connectSocket } from "./socket";

function Login() {
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("Password123!");
  const [error, setError] = useState("");
  const setUser = useAuth(s => s.setUser);
  const navigate = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const { data } = await api.post("/auth/login", { email, password });
      setAccessToken(data.data.accessToken);
      setUser(data.data.user);
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Login failed");
    }
  }

  return <form className="form card" onSubmit={submit}>
    <h1>Client Dashboard</h1>
    <p className="muted">Sign in to continue</p>
    <label>Email</label><input value={email} onChange={e => setEmail(e.target.value)} />
    <label>Password</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} />
    {error && <p className="error">{error}</p>}
    <button>Login</button>
  </form>;
}

function Layout({ children }: { children: React.ReactNode }) {
  const user = useAuth(s => s.user);
  const setUser = useAuth(s => s.setUser);
  const navigate = useNavigate();
  const [online, setOnline] = useState(0);

useEffect(() => {
  if (!user) return;

  let socket: ReturnType<typeof connectSocket> | null = null;

  async function initialize() {
    let token = getAccessToken();

    // Only refresh when there is no access token,
    // such as after a browser refresh.
    if (!token) {
      token = await refreshAccessToken();

      if (!token) {
        setUser(null);
        return;
      }

      setAccessToken(token);
    }

    socket = connectSocket(token);
    socket.on("presence:count", setOnline);
  }

  initialize().catch(() => {
    setUser(null);
  });

  return () => {
    socket?.disconnect();
  };
}, [user, setUser]);

  async function logout() {
    await api.post("/auth/logout");
    setUser(null);
    setAccessToken("");
    navigate("/login");
  }

  return <div className="app">
    <nav className="nav">
      <div><strong>Project Dashboard</strong></div>
      <div>
        <Link to="/">Dashboard</Link>
        <Link to="/tasks">Tasks</Link>
        <Link to="/activity">Activity</Link>
        <span className="badge">{user?.role}</span>
        <span style={{ marginLeft: 12 }}>Online: {online}</span>
        <button onClick={logout} style={{ marginLeft: 12 }}>Logout</button>
      </div>
    </nav>
    {children}
  </div>;
}

function Dashboard() {
  const user = useAuth(s => s.user);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.get("/dashboard").then(r => setData(r.data.data));
  }, []);

  if (!data) return <main className="container">Loading...</main>;

  return <main className="container">
    <h1>{user?.role === "ADMIN" ? "Admin Dashboard" : user?.role === "PROJECT_MANAGER" ? "Project Manager Dashboard" : "Developer Dashboard"}</h1>
    <div className="grid">
      <div className="card"><h3>Projects</h3><h2>{data.projects}</h2></div>
      <div className="card"><h3>Overdue</h3><h2>{data.overdue}</h2></div>
      <div className="card"><h3>Online users</h3><h2>{data.online}</h2></div>
      {data.tasksByStatus.map((x: any) => <div className="card" key={x.status}><h3>{x.status}</h3><h2>{x._count}</h2></div>)}
    </div>
  </main>;
}

function Tasks() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");

  const load = () => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (priority) params.set("priority", priority);
    history.replaceState(null, "", `/tasks${params.toString() ? `?${params}` : ""}`);
    api.get(`/tasks?${params}`).then(r => setTasks(r.data.data));
  };

  useEffect(load, [status, priority]);

  async function move(task: any, next: string) {
    await api.patch(`/tasks/${task.id}/status`, { status: next });
    load();
  }

  return <main className="container">
    <div className="row"><h1>Tasks</h1>
      <select value={status} onChange={e => setStatus(e.target.value)}>
        <option value="">All statuses</option><option value="TODO">To Do</option><option value="IN_PROGRESS">In Progress</option><option value="IN_REVIEW">In Review</option><option value="DONE">Done</option>
      </select>
      <select value={priority} onChange={e => setPriority(e.target.value)}>
        <option value="">All priorities</option><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="CRITICAL">Critical</option>
      </select>
    </div>
    <div className="card">
      <table><thead><tr><th>Task</th><th>Project</th><th>Priority</th><th>Status</th><th>Due</th><th>Action</th></tr></thead>
      <tbody>{tasks.map(t => <tr key={t.id}>
        <td>#{t.id} {t.title}</td><td>{t.project.name}</td><td>{t.priority}</td><td>{t.status}</td>
        <td>{t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "-"}</td>
        <td><select value={t.status} onChange={e => move(t, e.target.value)}>
          <option value="TODO">To Do</option><option value="IN_PROGRESS">In Progress</option><option value="IN_REVIEW">In Review</option><option value="DONE">Done</option>
        </select></td>
      </tr>)}</tbody></table>
    </div>
  </main>;
}

function Activity() {
  const [events, setEvents] = useState<any[]>([]);
  useEffect(() => {
    api.get("/activity").then(r => setEvents(r.data.data));
  }, []);

  const format = (e: any) => `${e.user.name} moved Task #${e.task.id} from ${e.oldValue} → ${e.newValue}`;

  return <main className="container"><h1>Live Activity</h1>
    {events.map(e => <div className="activity" key={e.id}><strong>{format(e)}</strong><div className="muted">{new Date(e.createdAt).toLocaleString()} · {e.project.name}</div></div>)}
  </main>;
}

function Protected() {
  const user = useAuth(s => s.user);
  if (!user) return <Navigate to="/login" replace />;
  return <Layout><Routes>
    <Route path="/" element={<Dashboard />} />
    <Route path="/tasks" element={<Tasks />} />
    <Route path="/activity" element={<Activity />} />
  </Routes></Layout>;
}

export default function App() {
  const user = useAuth(s => s.user);
  return <Routes>
    <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
    <Route path="/*" element={<Protected />} />
  </Routes>;
}
