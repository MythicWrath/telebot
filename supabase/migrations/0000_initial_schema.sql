-- Users table
CREATE TABLE users (
  telegram_id BIGINT PRIMARY KEY,
  first_name TEXT,
  username TEXT,
  language_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Groups table
CREATE TABLE groups (
  chat_id BIGINT PRIMARY KEY,
  title TEXT,
  settings JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Group Members (Junction table)
CREATE TABLE group_members (
  group_id BIGINT REFERENCES groups(chat_id) ON DELETE CASCADE,
  user_id BIGINT REFERENCES users(telegram_id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);

-- Expenses table
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id BIGINT REFERENCES groups(chat_id) ON DELETE CASCADE,
  paid_by BIGINT REFERENCES users(telegram_id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  currency TEXT NOT NULL,
  description TEXT,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Expense splits (Who owes how much for a given expense)
CREATE TABLE expense_splits (
  expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE,
  user_id BIGINT REFERENCES users(telegram_id) ON DELETE CASCADE,
  amount_owed DECIMAL(12, 2) NOT NULL,
  PRIMARY KEY (expense_id, user_id)
);

-- Settlements (When a user pays back another user)
CREATE TABLE settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id BIGINT REFERENCES groups(chat_id) ON DELETE CASCADE,
  paid_by BIGINT REFERENCES users(telegram_id) ON DELETE CASCADE,
  paid_to BIGINT REFERENCES users(telegram_id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  currency TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;
