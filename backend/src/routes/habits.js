const express = require("express");
const authMiddleware = require("../middleware/auth");
const { getLevel, getMotivationalMessage } = require("../utils/gamification");

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function getLastDays(count) {
  const days = [];
  const now = new Date();

  for (let index = 0; index < count; index += 1) {
    const date = new Date(now);
    date.setDate(now.getDate() - index);
    days.push(date.toISOString().slice(0, 10));
  }

  return days;
}

function createHabitsRouter(db) {
  const router = express.Router();

  router.use(authMiddleware);

  router.get("/", async (req, res) => {
    try {
      const habits = await db.all(
        `
          SELECT
            h.id,
            h.name,
            h.description,
            h.frequency,
            h.created_at,
            CASE WHEN e.id IS NOT NULL THEN 1 ELSE 0 END AS completedToday
          FROM habits h
          LEFT JOIN habit_entries e
            ON e.habit_id = h.id
            AND e.completed_on = ?
          WHERE h.user_id = ?
          ORDER BY h.created_at DESC
        `,
        todayISO(),
        req.user.id
      );

      return res.json(habits);
    } catch (error) {
      return res.status(500).json({ message: "Erro ao buscar habitos." });
    }
  });

  router.post("/", async (req, res) => {
    const { name, description, frequency } = req.body;

    if (!name || !frequency) {
      return res.status(400).json({ message: "Nome e frequencia sao obrigatorios." });
    }

    if (!["daily", "weekly"].includes(frequency)) {
      return res.status(400).json({ message: "Frequencia invalida." });
    }

    try {
      const result = await db.run(
        `
          INSERT INTO habits (user_id, name, description, frequency)
          VALUES (?, ?, ?, ?)
        `,
        req.user.id,
        name,
        description || "",
        frequency
      );

      const habit = await db.get("SELECT * FROM habits WHERE id = ?", result.lastID);
      return res.status(201).json(habit);
    } catch (error) {
      return res.status(500).json({ message: "Erro ao criar habito." });
    }
  });

  router.delete("/:id", async (req, res) => {
    try {
      const result = await db.run(
        "DELETE FROM habits WHERE id = ? AND user_id = ?",
        req.params.id,
        req.user.id
      );

      if (!result.changes) {
        return res.status(404).json({ message: "Habito nao encontrado." });
      }

      return res.json({ message: "Habito removido com sucesso." });
    } catch (error) {
      return res.status(500).json({ message: "Erro ao remover habito." });
    }
  });

  router.post("/:id/complete", async (req, res) => {
    const date = req.body.date || todayISO();

    try {
      const habit = await db.get(
        "SELECT * FROM habits WHERE id = ? AND user_id = ?",
        req.params.id,
        req.user.id
      );

      if (!habit) {
        return res.status(404).json({ message: "Habito nao encontrado." });
      }

      await db.run(
        `
          INSERT OR IGNORE INTO habit_entries (user_id, habit_id, completed_on, points_earned)
          VALUES (?, ?, ?, ?)
        `,
        req.user.id,
        habit.id,
        date,
        habit.frequency === "weekly" ? 20 : 10
      );

      return res.json({ message: "Habito concluido com sucesso." });
    } catch (error) {
      return res.status(500).json({ message: "Erro ao marcar habito." });
    }
  });

  router.get("/history", async (req, res) => {
    try {
      const history = await db.all(
        `
          SELECT
            e.completed_on,
            h.name,
            h.frequency,
            e.points_earned
          FROM habit_entries e
          INNER JOIN habits h ON h.id = e.habit_id
          WHERE e.user_id = ?
          ORDER BY e.completed_on DESC, e.created_at DESC
          LIMIT 30
        `,
        req.user.id
      );

      return res.json(history);
    } catch (error) {
      return res.status(500).json({ message: "Erro ao buscar historico." });
    }
  });

  router.get("/summary/dashboard", async (req, res) => {
    const lastDays = getLastDays(7);

    try {
      const habits = await db.all(
        `
          SELECT
            h.id,
            h.name,
            h.description,
            h.frequency,
            CASE WHEN e.id IS NOT NULL THEN 1 ELSE 0 END AS completedToday
          FROM habits h
          LEFT JOIN habit_entries e
            ON e.habit_id = h.id
            AND e.completed_on = ?
          WHERE h.user_id = ?
          ORDER BY h.created_at DESC
        `,
        todayISO(),
        req.user.id
      );

      const pointsRow = await db.get(
        "SELECT COALESCE(SUM(points_earned), 0) AS totalPoints FROM habit_entries WHERE user_id = ?",
        req.user.id
      );

      const historyRows = await db.all(
        `
          SELECT completed_on, COUNT(*) AS completedCount
          FROM habit_entries
          WHERE user_id = ? AND completed_on IN (${lastDays.map(() => "?").join(",")})
          GROUP BY completed_on
          ORDER BY completed_on DESC
        `,
        req.user.id,
        ...lastDays
      );

      const totalHabits = habits.length;
      const completedToday = habits.filter((habit) => habit.completedToday).length;
      const progressPercentage = totalHabits === 0 ? 0 : Math.round((completedToday / totalHabits) * 100);
      const level = getLevel(pointsRow.totalPoints);

      return res.json({
        habits,
        stats: {
          totalHabits,
          completedToday,
          progressPercentage,
          totalPoints: pointsRow.totalPoints,
          level: level.name,
          nextLevelAt: level.nextLevelAt,
          motivationalMessage: getMotivationalMessage(progressPercentage),
        },
        history: lastDays.map((date) => {
          const row = historyRows.find((item) => item.completed_on === date);
          return {
            date,
            completedCount: row ? row.completedCount : 0,
          };
        }),
      });
    } catch (error) {
      return res.status(500).json({ message: "Erro ao buscar dashboard." });
    }
  });

  return router;
}

module.exports = createHabitsRouter;
