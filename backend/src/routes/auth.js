const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

function createAuthRouter(db) {
  const router = express.Router();

  router.post("/register", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email e senha sao obrigatorios." });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "A senha deve ter pelo menos 6 caracteres." });
    }

    try {
      const existingUser = await db.get("SELECT id FROM users WHERE email = ?", email);

      if (existingUser) {
        return res.status(409).json({ message: "Ja existe um usuario com esse email." });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const result = await db.run(
        "INSERT INTO users (email, password_hash) VALUES (?, ?)",
        email,
        passwordHash
      );

      const token = jwt.sign(
        { id: result.lastID, email },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      return res.status(201).json({
        token,
        user: {
          id: result.lastID,
          email,
        },
      });
    } catch (error) {
      return res.status(500).json({ message: "Erro ao criar usuario." });
    }
  });

  router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email e senha sao obrigatorios." });
    }

    try {
      const user = await db.get("SELECT * FROM users WHERE email = ?", email);

      if (!user) {
        return res.status(401).json({ message: "Credenciais invalidas." });
      }

      const isValidPassword = await bcrypt.compare(password, user.password_hash);

      if (!isValidPassword) {
        return res.status(401).json({ message: "Credenciais invalidas." });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      return res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
        },
      });
    } catch (error) {
      return res.status(500).json({ message: "Erro ao fazer login." });
    }
  });

  return router;
}

module.exports = createAuthRouter;
