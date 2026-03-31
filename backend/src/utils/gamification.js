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

module.exports = {
  getLevel,
  getMotivationalMessage,
};
