-- Exchange Rates table to cache daily rates and avoid API rate limits
CREATE TABLE exchange_rates (
  date DATE PRIMARY KEY,
  base_currency TEXT NOT NULL DEFAULT 'USD',
  rates JSONB NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;
