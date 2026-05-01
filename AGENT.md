# AI Agent Instructions for Tele Split Money

## Project Overview
- **Description:** A Telegram bot and mini app for splitting money, simplifying debts, and managing expenses among users in a group chat.
- **Structure:** This is an NPM workspace project containing two main packages:
  - `bot/`: The Telegram bot backend (TypeScript, Express, Telegraf, Supabase).
  - `webapp/`: The Telegram mini app frontend (React, Vite, Tailwind CSS, Supabase, Telegram Web App SDK).

## Build & Run Commands
Run these commands from the project root (`c:\Users\jinxi\Desktop\hackweek\Tele split money`):
- **Bot Dev Server:** `npm run dev:bot`
- **Webapp Dev Server:** `npm run dev:webapp`
- **Build Bot:** `npm run build:bot`
- **Build Webapp:** `npm run build:webapp`

*Note: For the webapp, you can also run `npm run lint` to check for frontend issues.*

## Architecture & Tech Stack
- **Database:** Supabase (PostgreSQL). The bot and webapp share the Supabase backend for data persistence.
- **Frontend Framework:** React 19 with Vite, Tailwind CSS for styling, and React Router for navigation.
- **Bot Framework:** Telegraf for handling Telegram updates, Express for serving webhooks or API endpoints.
- **Language:** TypeScript across the entire stack.

## Development Guidelines
- **Environment:** The primary development environment is Windows. Ensure any scripts or commands provided are compatible with Windows (e.g., PowerShell).
- **Dependencies:** When installing new packages, ensure you specify the workspace (e.g., `npm install <pkg> --workspace=bot`) or navigate into the respective directory first.
- **Testing Logic:** When modifying core business logic like the debt simplification algorithm (e.g., `bot/src/debtAlgorithm.ts`), run `ts-node bot/src/testAlgorithm.ts` to verify the logic against the predefined test cases.
- **Secrets:** Use environment variables to manage Supabase credentials and Telegram Bot Tokens. Do not hardcode secrets. Refer to `.env.example` for required variables.
- **UI Guidelines:** Since this is a Telegram mini app, keep the UI responsive, mobile-first, and aligned with Telegram's design aesthetics using Tailwind CSS.
