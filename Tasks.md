# Task List: Telegram Expense Splitter Bot

## Foundation & Setup
- [x] Initialize monorepo structure (root [package.json](file:///c:/Users/jinxi/OneDrive/Desktop/hackweek/Tele%20split%20money/package.json), `/bot`, `/webapp`)
- [x] Set up Supabase account, create project, and acquire connection strings
- [x] Create Database Tables (`users`, `groups`, `expenses`, `expense_splits`, `settlements`)
- [x] Setup GitHub Actions for CI/CD

## Bot Core (Backend)
- [x] Register bot with `@BotFather` and obtain Bot Token
- [x] Set up `telegraf` Node.js bot instance
- [x] Implement `start` and `help` commands
- [x] Implement group connection middleware (record group ID in DB)
- [x] Implement admin whitelisting middleware
- [x] Deploy Bot backend to Vercel
  - [x] Refactor: switch from long-polling (`bot.launch()`) to webhook mode
  - [x] Add `vercel.json` to configure the bot as a serverless function
  - [x] Push to GitHub and deploy on Vercel (set env vars: `TELEGRAM_BOT_TOKEN`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NODE_ENV=production`)
  - [x] Register the webhook URL with Telegram (`setWebhook` API call)

## Mini App (Frontend)
- [x] Bootstrap React + Vite App
- [x] Install and configure `@twa-dev/sdk`
- [x] Implement authenticating Web App Init Data
- [x] Build UI: Add Expense Form (Amount, Currency, Description, Paid By, Split With)
- [x] Build UI: Group Balances View (Who owes whom)
- [x] Deploy Mini App to Vercel

## Core Logic & Polish
- [x] Implement Debt Simplification Algorithm
- [x] Integrate Currency Exchange Rate API
- [x] Implement Daily Exchange Rate Caching logic
- [x] End-to-End Testing (Add expense -> calculate split -> simplify debt -> settle up)

## Production Readiness
- [x] Backend: Validate `initData` hash using `TELEGRAM_BOT_TOKEN` for secure API requests.
- [x] Backend: Extract accurate User ID and Group ID off the validated `initData` payload instead of mocked IDs.
- [x] Backend: Set up robust error handling for missing group access.

## Future Features
- [ ] Smart currency defaulting (Guess currency based on user timezone/location).
- [ ] Unequal splitting of expenses (e.g., exact amounts or percentages).
- [ ] Code Refactoring: Separate business logic from platform-dependent code (e.g., Supabase) to enable easy platform switching in the future.
