# Finance Tracker App - Project Overview

## What This App Does

The Finance Tracker App is a full-stack solution for managing, analyzing, and gaining insights into your business finances. It enables users to:

- **Track all types of financial transactions**: Add, edit, and view employee expenses, vendor payments, salary expenses, and income entries.
- **Get instant financial summaries**: The dashboard provides real-time totals for income, expenses, and net profit, updating automatically as new data is added.
- **Leverage AI for financial insights**: An integrated AI assistant (powered by OpenAI GPT-4) can answer questions, summarize trends, and provide actionable advice based on your actual financial data.
- **Categorize and forecast expenses**: (Planned) Use AI and smart algorithms to categorize expenses and forecast future spending.
- **Generate and download reports**: Access detailed reports and breakdowns for different financial categories and timeframes.
- **Secure user management**: Register, log in, and manage your profile securely.
- **Modern, responsive UI**: Enjoy a clean, user-friendly interface with dark mode and mobile support.

## Table of Contents
- [Project Structure](#project-structure)
- [Features](#features)
- [Backend Overview](#backend-overview)
- [Frontend Overview](#frontend-overview)
- [AI Assistant Integration](#ai-assistant-integration)
- [API Endpoints](#api-endpoints)
- [How Data Flows](#how-data-flows)
- [Setup & Running](#setup--running)
- [Customization & Extensibility](#customization--extensibility)
- [Troubleshooting](#troubleshooting)

---

## Project Structure

```
backend/
  src/
    controllers/
    models/
    routes/
    services/
    middleware/
    utils/
frontend/
  src/
    components/
    pages/
    api/
    context/
    routes/
    styles/
```

---

## Features
- **Dashboard**: Real-time financial overview (income, expenses, profit)
- **Expense/Income Management**: Add, edit, and categorize expenses/income
- **AI Assistant**: Chatbot for financial insights, summaries, and forecasting (OpenAI GPT-4)
- **Expense Categorization**: Quick-select and AI-powered suggestions
- **Expense Forecasting**: Predict future expenses (planned)
- **Reports**: Downloadable and visual financial reports
- **Authentication**: User login, registration, and profile management

---

## Backend Overview
- **Node.js + Express** server
- **MongoDB** for data storage (Mongoose models for EmployeeExpense, SalaryExpense, VendorPayment, Income, User)
- **Controllers**: Handle business logic (e.g., `aiController.js` for AI, `authController.js` for auth)
- **Routes**: RESTful API endpoints (e.g., `/api/ai/ask`, `/api/employee-expense`)
- **Services**: Business logic (e.g., expense categorization, forecasting)
- **AI Integration**: Uses OpenAI SDK v4+ for chat and streaming

---

## Frontend Overview
- **React + Vite** for fast SPA development
- **Tailwind CSS** for styling
- **Component-based**: Dashboard, forms, tables, AI bot widget, etc.
- **API Layer**: `apiService.js` for all backend communication
- **Context Providers**: Auth, Theme, Snackbar, etc.
- **Modern UI**: Responsive, dark mode, and interactive widgets

---

## AI Assistant Integration
- **Widget**: Floating chat UI (`AIBotWidget.jsx`)
- **Streaming**: Uses EventSource for real-time AI responses
- **Contextual**: AI receives up-to-date financial summary and recent transactions
- **Quick-selects**: Buttons for common queries (e.g., "Show me all my expenses for this month")
- **Backend**: `/api/ai/ask` endpoint supports both streaming (GET) and non-streaming (POST)

---

## API Endpoints (Key)
- `POST /api/ai/ask` — Ask AI assistant (non-streaming)
- `GET /api/ai/ask?stream=true` — Streaming AI chat
- `GET/POST/PUT /api/ai/categorization` — Expense categorization (planned)
- `GET /api/ai/forecast` — Expense forecasting (planned)
- `POST /api/employee-expense` — Add employee expense
- `POST /api/income` — Add income
- `GET /api/reports/*` — Financial reports

---

## How Data Flows
1. **User adds/edits expense/income** via frontend forms
2. **Dashboard** auto-refreshes using event dispatch and API calls
3. **AI Bot**: User asks a question → frontend sends to `/api/ai/ask` → backend fetches latest summary, builds context, queries OpenAI, streams or returns answer
4. **Reports**: User requests/downloads reports via API endpoints

---

## Setup & Running
### Backend
- Install dependencies: `npm install`
- Set up `.env` with MongoDB URI and OpenAI API key
- Start server: `npm start`

### Frontend
- Install dependencies: `npm install`
- Set up `.env` with `VITE_API_URL` if needed
- Start dev server: `npm run dev`

---

## Customization & Extensibility
- **Add new models**: Create new Mongoose models in `backend/src/models/`
- **Add new endpoints**: Add routes/controllers in `backend/src/routes/` and `backend/src/controllers/`
- **AI prompt tuning**: Edit the `systemPrompt` in `aiController.js` for different AI behavior
- **UI**: Add new React components/pages in `frontend/src/components/` and `frontend/src/pages/`

---

## Troubleshooting
- **500 errors on /api/ai/ask**: Check backend logs for OpenAI or MongoDB issues
- **Streaming not working**: Ensure EventSource is used for GET requests with `stream=true`
- **Data not updating**: Check event dispatch and API calls in dashboard/components
- **Authentication issues**: Check token storage and backend auth routes

---

## Authors & Credits
- Project by your team
- AI integration powered by OpenAI
- Built with React, Vite, Node.js, Express, MongoDB, Tailwind CSS

---

## License
MIT (or your chosen license)
