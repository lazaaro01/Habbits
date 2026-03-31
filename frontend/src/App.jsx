import { useEffect, useState } from "react";
import { api } from "./api";

const initialForm = {
  email: "",
  password: "",
};

const initialHabitForm = {
  name: "",
  description: "",
  frequency: "daily",
};

function formatDate(dateString) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(`${dateString}T00:00:00`));
}

function App() {
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState(initialForm);
  const [habitForm, setHabitForm] = useState(initialHabitForm);
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("habit-quest-user");
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [dashboard, setDashboard] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [celebratingHabitId, setCelebratingHabitId] = useState(null);

  async function loadAppData() {
    setLoading(true);
    try {
      const [dashboardData, historyData] = await Promise.all([
        api.getDashboard(),
        api.getHistory(),
      ]);

      setDashboard(dashboardData);
      setHistory(historyData);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const token = localStorage.getItem("habit-quest-token");
    if (token && user) {
      loadAppData();
    }
  }, [user]);

  async function handleAuthSubmit(event) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const action = authMode === "login" ? api.login : api.register;
      const data = await action(authForm);

      localStorage.setItem("habit-quest-token", data.token);
      localStorage.setItem("habit-quest-user", JSON.stringify(data.user));
      setUser(data.user);
      setAuthForm(initialForm);
      setMessage(authMode === "login" ? "Login realizado com sucesso." : "Conta criada com sucesso.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateHabit(event) {
    event.preventDefault();
    setMessage("");

    try {
      await api.createHabit(habitForm);
      setHabitForm(initialHabitForm);
      setMessage("Habito criado com sucesso.");
      await loadAppData();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function handleCompleteHabit(habitId) {
    setMessage("");

    try {
      await api.completeHabit(habitId);
      setCelebratingHabitId(habitId);
      setTimeout(() => setCelebratingHabitId(null), 900);
      setMessage("Boa. Pontos adicionados ao seu placar.");
      await loadAppData();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function handleDeleteHabit(habitId) {
    setMessage("");

    try {
      await api.deleteHabit(habitId);
      setMessage("Habito removido.");
      await loadAppData();
    } catch (error) {
      setMessage(error.message);
    }
  }

  function handleLogout() {
    localStorage.removeItem("habit-quest-token");
    localStorage.removeItem("habit-quest-user");
    setUser(null);
    setDashboard(null);
    setHistory([]);
    setMessage("Sessao encerrada.");
  }

  if (!user) {
    return (
      <div className="auth-shell">
        <section className="auth-card">
          <div className="hero-badge">Habit Quest</div>
          <h1>Controle seus habitos com pontos, niveis e progresso diario.</h1>
          <p>
            Crie sua conta, registre pequenos avancos e acompanhe sua evolucao em um
            painel simples e motivador.
          </p>

          <div className="tabs">
            <button
              className={authMode === "login" ? "active" : ""}
              onClick={() => setAuthMode("login")}
              type="button"
            >
              Entrar
            </button>
            <button
              className={authMode === "register" ? "active" : ""}
              onClick={() => setAuthMode("register")}
              type="button"
            >
              Criar conta
            </button>
          </div>

          <form className="auth-form" onSubmit={handleAuthSubmit}>
            <label>
              Email
              <input
                type="email"
                placeholder="voce@exemplo.com"
                value={authForm.email}
                onChange={(event) =>
                  setAuthForm((current) => ({ ...current, email: event.target.value }))
                }
                required
              />
            </label>

            <label>
              Senha
              <input
                type="password"
                placeholder="Minimo de 6 caracteres"
                value={authForm.password}
                onChange={(event) =>
                  setAuthForm((current) => ({ ...current, password: event.target.value }))
                }
                required
              />
            </label>

            <button className="primary-button" type="submit" disabled={loading}>
              {loading ? "Carregando..." : authMode === "login" ? "Entrar" : "Criar conta"}
            </button>
          </form>

          {message ? <p className="feedback">{message}</p> : null}
        </section>
      </div>
    );
  }

  const stats = dashboard?.stats;
  const habits = dashboard?.habits || [];

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Dashboard de hoje</p>
          <h1>Bem-vindo, {user.email}</h1>
        </div>
        <button className="ghost-button" type="button" onClick={handleLogout}>
          Sair
        </button>
      </header>

      {message ? <p className="feedback floating">{message}</p> : null}

      <main className="dashboard-grid">
        <section className="panel hero-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Pontuacao total</p>
              <h2>{stats?.totalPoints || 0} pts</h2>
            </div>
            <div className="level-pill">{stats?.level || "Iniciante"}</div>
          </div>

          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${stats?.progressPercentage || 0}%` }}
            />
          </div>

          <div className="hero-metrics">
            <div>
              <strong>{stats?.completedToday || 0}</strong>
              <span>habitos concluidos hoje</span>
            </div>
            <div>
              <strong>{stats?.progressPercentage || 0}%</strong>
              <span>do progresso diario</span>
            </div>
            <div>
              <strong>{stats?.nextLevelAt ? `${stats.nextLevelAt} pts` : "Max"}</strong>
              <span>proximo marco</span>
            </div>
          </div>

          <p className="motivation">{stats?.motivationalMessage}</p>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Novo habito</p>
              <h2>Adicionar ao plano</h2>
            </div>
          </div>

          <form className="habit-form" onSubmit={handleCreateHabit}>
            <input
              type="text"
              placeholder="Nome do habito"
              value={habitForm.name}
              onChange={(event) =>
                setHabitForm((current) => ({ ...current, name: event.target.value }))
              }
              required
            />
            <textarea
              placeholder="Descricao curta"
              rows="3"
              value={habitForm.description}
              onChange={(event) =>
                setHabitForm((current) => ({ ...current, description: event.target.value }))
              }
            />
            <select
              value={habitForm.frequency}
              onChange={(event) =>
                setHabitForm((current) => ({ ...current, frequency: event.target.value }))
              }
            >
              <option value="daily">Diario</option>
              <option value="weekly">Semanal</option>
            </select>
            <button className="primary-button" type="submit">
              Salvar habito
            </button>
          </form>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Seus habitos</p>
              <h2>Lista do dia</h2>
            </div>
          </div>

          {loading ? <p>Carregando habitos...</p> : null}

          <div className="habit-list">
            {habits.length === 0 ? (
              <div className="empty-state">
                <p>Nenhum habito criado ainda. Comece com um objetivo simples.</p>
              </div>
            ) : (
              habits.map((habit) => (
                <article
                  className={`habit-card ${
                    habit.completedToday ? "done" : ""
                  } ${celebratingHabitId === habit.id ? "celebrate" : ""}`}
                  key={habit.id}
                >
                  <div>
                    <div className="habit-title-row">
                      <h3>{habit.name}</h3>
                      <span>{habit.frequency === "daily" ? "Diario" : "Semanal"}</span>
                    </div>
                    <p>{habit.description || "Sem descricao."}</p>
                  </div>

                  <div className="habit-actions">
                    <button
                      className="primary-button"
                      type="button"
                      onClick={() => handleCompleteHabit(habit.id)}
                      disabled={Boolean(habit.completedToday)}
                    >
                      {habit.completedToday ? "Concluido hoje" : "Marcar feito"}
                    </button>
                    <button
                      className="ghost-button danger"
                      type="button"
                      onClick={() => handleDeleteHabit(habit.id)}
                    >
                      Excluir
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Ultimos 7 dias</p>
              <h2>Historico rapido</h2>
            </div>
          </div>

          <div className="history-chart">
            {(dashboard?.history || []).map((item) => (
              <div className="history-bar-group" key={item.date}>
                <div
                  className="history-bar"
                  style={{
                    height: `${Math.max(18, item.completedCount * 20)}px`,
                  }}
                >
                  <span>{item.completedCount}</span>
                </div>
                <small>{formatDate(item.date)}</small>
              </div>
            ))}
          </div>

          <div className="history-list">
            {history.slice(0, 6).map((item, index) => (
              <div className="history-item" key={`${item.completed_on}-${index}`}>
                <div>
                  <strong>{item.name}</strong>
                  <p>{formatDate(item.completed_on)}</p>
                </div>
                <span>+{item.points_earned} pts</span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
