function getLevel(points) {
  if (points >= 300) {
    return { name: "Avancado", nextLevelAt: null };
  }

  if (points >= 120) {
    return { name: "Intermediario", nextLevelAt: 300 };
  }

  return { name: "Iniciante", nextLevelAt: 120 };
}

function getMotivationalMessage(progressPercentage) {
  if (progressPercentage === 100) {
    return "Dia completo. Voce esta voando.";
  }

  if (progressPercentage >= 60) {
    return "Muito bom. Falta pouco para fechar o dia.";
  }

  if (progressPercentage > 0) {
    return "Voce ja comecou. Continue no ritmo.";
  }

  return "Seu proximo ponto comeca com o primeiro habito de hoje.";
}

function getBadges({ totalPoints, currentStreak, completedHabits }) {
  const badges = [];

  if (completedHabits >= 1) {
    badges.push("Primeiro passo");
  }

  if (currentStreak >= 3) {
    badges.push("Ritmo de 3 dias");
  }

  if (currentStreak >= 7) {
    badges.push("Sequencia lendaria");
  }

  if (totalPoints >= 120) {
    badges.push("Nivel intermediario");
  }

  if (totalPoints >= 300) {
    badges.push("Elite de habitos");
  }

  return badges;
}

module.exports = {
  getLevel,
  getMotivationalMessage,
  getBadges,
};
