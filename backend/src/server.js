require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { initializeDatabase } = require("./db");
const createAuthRouter = require("./routes/auth");
const createHabitsRouter = require("./routes/habits");

const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || "development-secret";

async function startServer() {
  process.env.JWT_SECRET = JWT_SECRET;

  const db = await initializeDatabase();
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/auth", createAuthRouter(db));
  app.use("/api/habits", createHabitsRouter(db));

  app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Falha ao iniciar o servidor:", error);
  process.exit(1);
});
