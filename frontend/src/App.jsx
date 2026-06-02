import { useState, useEffect, useCallback } from "react";

const API = "http://localhost:5000/api/v1";

// ─── Token helpers ────────────────────────────────────────────
const getToken = () => localStorage.getItem("accessToken");
const setTokens = (a, r) => { localStorage.setItem("accessToken", a); localStorage.setItem("refreshToken", r); };
const clearTokens = () => { localStorage.removeItem("accessToken"); localStorage.removeItem("refreshToken"); };

async function apiFetch(path, opts = {}) {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}`, ...opts.headers },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

// ─── Components ───────────────────────────────────────────────

function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{
      position: "fixed", top: 24, right: 24, zIndex: 9999,
      background: type === "error" ? "#ff4757" : "#2ed573",
      color: "#fff", padding: "12px 20px", borderRadius: 10,
      fontWeight: 600, fontSize: 14, boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
      animation: "slideIn .3s ease",
    }}>
      {msg}
    </div>
  );
}

function AuthPage({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError(""); setLoading(true);
    try {
      const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
      const body = mode === "login" ? { email: form.email, password: form.password } : form;
      const data = await apiFetch(endpoint, { method: "POST", body: JSON.stringify(body) });
      setTokens(data.accessToken, data.refreshToken);
      onAuth(data.user);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@700&display=swap');
        @keyframes slideIn { from { transform: translateX(40px); opacity:0 } to { transform: translateX(0); opacity:1 } }
        @keyframes fadeUp { from { transform: translateY(20px); opacity:0 } to { transform: translateY(0); opacity:1 } }
        * { box-sizing: border-box; margin:0; padding:0; }
        input { outline: none; }
        input:focus { border-color: #7c5cfc !important; }
        button { cursor: pointer; }
      `}</style>

      <div style={{ width: 420, animation: "fadeUp .5s ease" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#7c5cfc,#3ecfff)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>✓</div>
            <span style={{ fontSize: 22, fontWeight: 700, color: "#fff", fontFamily: "'Space Grotesk', sans-serif" }}>TaskFlow</span>
          </div>
          <p style={{ color: "#666", marginTop: 8, fontSize: 14 }}>Scalable Task Management API</p>
        </div>

        {/* Card */}
        <div style={{ background: "#13131a", border: "1px solid #222", borderRadius: 20, padding: 36 }}>
          {/* Tab */}
          <div style={{ display: "flex", background: "#0a0a0f", borderRadius: 10, padding: 4, marginBottom: 28 }}>
            {["login", "register"].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(""); }} style={{
                flex: 1, padding: "10px 0", border: "none", borderRadius: 8,
                background: mode === m ? "#7c5cfc" : "transparent",
                color: mode === m ? "#fff" : "#666", fontWeight: 600, fontSize: 14,
                transition: "all .2s",
              }}>{m === "login" ? "Sign In" : "Register"}</button>
            ))}
          </div>

          {/* Fields */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {mode === "register" && (
              <input placeholder="Full Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                style={{ background: "#0a0a0f", border: "1px solid #2a2a3a", borderRadius: 10, padding: "13px 16px", color: "#fff", fontSize: 14, transition: "border .2s" }} />
            )}
            <input placeholder="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
              style={{ background: "#0a0a0f", border: "1px solid #2a2a3a", borderRadius: 10, padding: "13px 16px", color: "#fff", fontSize: 14, transition: "border .2s" }} />
            <input placeholder="Password" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              style={{ background: "#0a0a0f", border: "1px solid #2a2a3a", borderRadius: 10, padding: "13px 16px", color: "#fff", fontSize: 14, transition: "border .2s" }} />

            {error && <p style={{ color: "#ff4757", fontSize: 13, textAlign: "center" }}>{error}</p>}

            <button onClick={handleSubmit} disabled={loading} style={{
              background: "linear-gradient(135deg,#7c5cfc,#3ecfff)", border: "none", borderRadius: 10,
              padding: "14px", color: "#fff", fontWeight: 700, fontSize: 15, marginTop: 4,
              opacity: loading ? 0.7 : 1, transition: "opacity .2s",
            }}>{loading ? "Please wait..." : (mode === "login" ? "Sign In" : "Create Account")}</button>
          </div>

          {mode === "register" && (
            <p style={{ color: "#555", fontSize: 12, textAlign: "center", marginTop: 16 }}>
              Password: min 8 chars, uppercase, lowercase & number
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function TaskModal({ task, onSave, onClose }) {
  const [form, setForm] = useState(task || { title: "", description: "", status: "pending", priority: "medium", dueDate: "", tags: "" });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const body = { ...form, tags: form.tags ? form.tags.split(",").map(t => t.trim()) : [] };
      if (!body.dueDate) delete body.dueDate;
      await onSave(body);
      onClose();
    } catch (e) { alert(e.message); }
    setLoading(false);
  };

  const inp = (placeholder, key, type = "text", extra = {}) => (
    <input placeholder={placeholder} type={type} value={form[key] || ""} onChange={e => setForm({ ...form, [key]: e.target.value })} {...extra}
      style={{ background: "#0a0a0f", border: "1px solid #2a2a3a", borderRadius: 8, padding: "11px 14px", color: "#fff", fontSize: 14, width: "100%" }} />
  );

  const sel = (key, opts) => (
    <select value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
      style={{ background: "#0a0a0f", border: "1px solid #2a2a3a", borderRadius: 8, padding: "11px 14px", color: "#fff", fontSize: 14, width: "100%" }}>
      {opts.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}>
      <div style={{ background: "#13131a", border: "1px solid #2a2a3a", borderRadius: 20, padding: 28, width: 460, animation: "fadeUp .3s ease" }}>
        <h3 style={{ color: "#fff", marginBottom: 20, fontFamily: "'Space Grotesk',sans-serif" }}>{task ? "Edit Task" : "New Task"}</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {inp("Task title *", "title")}
          <textarea placeholder="Description (optional)" value={form.description || ""} onChange={e => setForm({ ...form, description: e.target.value })}
            style={{ background: "#0a0a0f", border: "1px solid #2a2a3a", borderRadius: 8, padding: "11px 14px", color: "#fff", fontSize: 14, resize: "vertical", minHeight: 80 }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {sel("status", ["pending", "in-progress", "completed"])}
            {sel("priority", ["low", "medium", "high"])}
          </div>
          {inp("Due date (optional)", "dueDate", "date")}
          {inp("Tags (comma-separated)", "tags")}
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ background: "#1e1e2e", border: "1px solid #2a2a3a", borderRadius: 8, padding: "10px 20px", color: "#aaa", fontSize: 14 }}>Cancel</button>
          <button onClick={handleSave} disabled={loading} style={{ background: "linear-gradient(135deg,#7c5cfc,#3ecfff)", border: "none", borderRadius: 8, padding: "10px 24px", color: "#fff", fontWeight: 700, fontSize: 14, opacity: loading ? 0.7 : 1 }}>
            {loading ? "Saving..." : "Save Task"}
          </button>
        </div>
      </div>
    </div>
  );
}

const STATUS_COLOR = { pending: "#f0a500", "in-progress": "#3ecfff", completed: "#2ed573" };
const PRIORITY_COLOR = { low: "#57606f", medium: "#ffa502", high: "#ff4757" };

function TaskCard({ task, onEdit, onDelete, onStatusChange }) {
  return (
    <div style={{ background: "#13131a", border: "1px solid #1e1e2e", borderRadius: 14, padding: 18, display: "flex", flexDirection: "column", gap: 10, transition: "border-color .2s" }}
      onMouseEnter={e => e.currentTarget.style.borderColor = "#7c5cfc"}
      onMouseLeave={e => e.currentTarget.style.borderColor = "#1e1e2e"}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <h4 style={{ color: "#fff", fontSize: 15, fontWeight: 600, flex: 1, marginRight: 10 }}>{task.title}</h4>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => onEdit(task)} style={{ background: "#1e1e2e", border: "none", borderRadius: 6, padding: "4px 10px", color: "#aaa", fontSize: 12 }}>Edit</button>
          <button onClick={() => onDelete(task._id)} style={{ background: "#2a0a0f", border: "none", borderRadius: 6, padding: "4px 10px", color: "#ff4757", fontSize: 12 }}>Del</button>
        </div>
      </div>

      {task.description && <p style={{ color: "#666", fontSize: 13 }}>{task.description}</p>}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <select value={task.status} onChange={e => onStatusChange(task._id, e.target.value)}
          style={{ background: STATUS_COLOR[task.status] + "20", border: `1px solid ${STATUS_COLOR[task.status]}50`, borderRadius: 6, padding: "3px 8px", color: STATUS_COLOR[task.status], fontSize: 12, cursor: "pointer" }}>
          {["pending", "in-progress", "completed"].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <span style={{ background: PRIORITY_COLOR[task.priority] + "20", border: `1px solid ${PRIORITY_COLOR[task.priority]}40`, borderRadius: 6, padding: "3px 10px", color: PRIORITY_COLOR[task.priority], fontSize: 12 }}>
          {task.priority}
        </span>
        {task.tags?.map(t => (
          <span key={t} style={{ background: "#1e1e2e", borderRadius: 6, padding: "3px 8px", color: "#888", fontSize: 12 }}>#{t}</span>
        ))}
      </div>

      {task.dueDate && (
        <p style={{ color: "#555", fontSize: 12 }}>📅 Due: {new Date(task.dueDate).toLocaleDateString()}</p>
      )}
    </div>
  );
}

function Dashboard({ user, onLogout }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'new' | task object
  const [filter, setFilter] = useState({ status: "", priority: "" });
  const [toast, setToast] = useState(null);
  const [stats, setStats] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  const notify = (msg, type = "success") => setToast({ msg, type });

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 9, ...filter }).toString();
      const data = await apiFetch(`/tasks?${params}`);
      setTasks(data.tasks);
      setPagination(data.pagination);
    } catch (e) { notify(e.message, "error"); }
    setLoading(false);
  }, [filter, page]);

  const fetchStats = useCallback(async () => {
    if (user.role !== "admin") return;
    try {
      const data = await apiFetch("/admin/stats");
      setStats(data.stats);
    } catch { }
  }, [user.role]);

  useEffect(() => { fetchTasks(); fetchStats(); }, [fetchTasks, fetchStats]);

  const handleCreate = async (body) => {
    await apiFetch("/tasks", { method: "POST", body: JSON.stringify(body) });
    notify("Task created!"); fetchTasks();
  };

  const handleUpdate = async (body) => {
    await apiFetch(`/tasks/${modal._id}`, { method: "PUT", body: JSON.stringify(body) });
    notify("Task updated!"); fetchTasks();
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this task?")) return;
    await apiFetch(`/tasks/${id}`, { method: "DELETE" });
    notify("Task deleted!"); fetchTasks();
  };

  const handleStatusChange = async (id, status) => {
    await apiFetch(`/tasks/${id}`, { method: "PUT", body: JSON.stringify({ status }) });
    fetchTasks();
  };

  const handleLogout = async () => {
    try { await apiFetch("/auth/logout", { method: "POST" }); } catch { }
    clearTokens(); onLogout();
  };

  const counts = { total: tasks.length, completed: tasks.filter(t => t.status === "completed").length, pending: tasks.filter(t => t.status === "pending").length };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", fontFamily: "'DM Sans', sans-serif" }}>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      {(modal === "new" || (modal && modal._id)) && (
        <TaskModal task={modal === "new" ? null : modal} onSave={modal === "new" ? handleCreate : handleUpdate} onClose={() => setModal(null)} />
      )}

      {/* Navbar */}
      <nav style={{ background: "#13131a", borderBottom: "1px solid #1e1e2e", padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg,#7c5cfc,#3ecfff)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>✓</div>
          <span style={{ fontSize: 18, fontWeight: 700, color: "#fff", fontFamily: "'Space Grotesk',sans-serif" }}>TaskFlow</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ textAlign: "right" }}>
            <p style={{ color: "#fff", fontSize: 14, fontWeight: 600 }}>{user.name}</p>
            <p style={{ color: "#7c5cfc", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>{user.role}</p>
          </div>
          <button onClick={handleLogout} style={{ background: "#1e1e2e", border: "1px solid #2a2a3a", borderRadius: 8, padding: "8px 16px", color: "#aaa", fontSize: 14 }}>Logout</button>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
        {/* Stats row */}
        {user.role === "admin" && stats && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
            {[
              { label: "Total Users", value: stats.totalUsers, color: "#7c5cfc" },
              { label: "Total Tasks", value: stats.totalTasks, color: "#3ecfff" },
              { label: "Completed", value: stats.tasksByStatus.find(s => s._id === "completed")?.count || 0, color: "#2ed573" },
              { label: "In Progress", value: stats.tasksByStatus.find(s => s._id === "in-progress")?.count || 0, color: "#f0a500" },
            ].map(s => (
              <div key={s.label} style={{ background: "#13131a", border: "1px solid #1e1e2e", borderRadius: 14, padding: 20 }}>
                <p style={{ color: "#666", fontSize: 13, marginBottom: 8 }}>{s.label}</p>
                <p style={{ color: s.color, fontSize: 28, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif" }}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Toolbar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif" }}>
            {user.role === "admin" ? "All Tasks" : "My Tasks"}
            {pagination.total !== undefined && <span style={{ color: "#555", fontSize: 14, marginLeft: 10 }}>({pagination.total} total)</span>}
          </h2>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {["", "pending", "in-progress", "completed"].map(s => (
              <button key={s} onClick={() => { setFilter(f => ({ ...f, status: s })); setPage(1); }} style={{
                background: filter.status === s ? "#7c5cfc" : "#1e1e2e",
                border: "1px solid " + (filter.status === s ? "#7c5cfc" : "#2a2a3a"),
                borderRadius: 8, padding: "7px 14px", color: filter.status === s ? "#fff" : "#888", fontSize: 13,
              }}>{s || "All"}</button>
            ))}
            <button onClick={() => setModal("new")} style={{
              background: "linear-gradient(135deg,#7c5cfc,#3ecfff)", border: "none", borderRadius: 8,
              padding: "8px 18px", color: "#fff", fontWeight: 700, fontSize: 14,
            }}>+ New Task</button>
          </div>
        </div>

        {/* Task grid */}
        {loading ? (
          <div style={{ textAlign: "center", color: "#555", padding: 60, fontSize: 16 }}>Loading tasks...</div>
        ) : tasks.length === 0 ? (
          <div style={{ textAlign: "center", color: "#555", padding: 80 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
            <p style={{ fontSize: 16 }}>No tasks yet. Create your first one!</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {tasks.map(t => (
              <TaskCard key={t._id} task={t} onEdit={setModal} onDelete={handleDelete} onStatusChange={handleStatusChange} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 32 }}>
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)} style={{
                background: p === page ? "#7c5cfc" : "#1e1e2e",
                border: "1px solid " + (p === page ? "#7c5cfc" : "#2a2a3a"),
                borderRadius: 8, padding: "8px 14px", color: p === page ? "#fff" : "#888", fontSize: 14,
              }}>{p}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── App root ─────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const restore = async () => {
      if (!getToken()) { setChecking(false); return; }
      try {
        const data = await apiFetch("/auth/me");
        setUser(data.user);
      } catch {
        clearTokens();
      }
      setChecking(false);
    };
    restore();
  }, []);

  if (checking) return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", color: "#555", fontFamily: "sans-serif" }}>
      Loading...
    </div>
  );

  return user
    ? <Dashboard user={user} onLogout={() => setUser(null)} />
    : <AuthPage onAuth={setUser} />;
}
