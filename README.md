# Habit Quest

Aplicacao web de controle de habitos com gamificacao, usando React no frontend, Node.js com Express no backend e SQLite para persistencia.

## Estrutura

```text
backend/   API Express + SQLite + autenticacao
frontend/  Interface React com dashboard responsivo
```

## Funcionalidades

- Cadastro e login com email e senha
- Criacao e exclusao de habitos diarios ou semanais
- Marcacao de habitos concluidos no dia
- Dashboard com progresso diario, pontuacao total e nivel
- Historico dos ultimos 7 dias e lista recente de conclusoes
- Mensagens motivacionais e animacao simples ao concluir um habito

## Como rodar

### 1. Instalar dependencias

Na raiz do projeto:

```bash
npm run install:all
```

Ou, se preferir, instale separado em cada pasta:

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 2. Configurar o backend

No Windows PowerShell:

```powershell
cd backend
Copy-Item .env.example .env
```

Se quiser, altere o valor de `JWT_SECRET` no arquivo `.env`.

### 3. Rodar a aplicacao

Em um terminal:

```bash
npm run dev:backend
```

Em outro terminal:

```bash
npm run dev:frontend
```

Backend: [http://localhost:4000](http://localhost:4000)  
Frontend: [http://localhost:5173](http://localhost:5173)

## Regras de gamificacao

- Habito diario concluido: `10 pontos`
- Habito semanal concluido: `20 pontos`
- Niveis:
  - `Iniciante`: 0 a 119 pontos
  - `Intermediario`: 120 a 299 pontos
  - `Avancado`: 300+ pontos

## Observacoes

- O banco SQLite e criado automaticamente em `backend/data/habits.db`
- O token de autenticacao fica salvo no `localStorage`
- Para trocar a URL da API no frontend, defina `VITE_API_URL`
