-- Scraper Sessions Table (matches your naming conventions)
CREATE TABLE IF NOT EXISTS scraper_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sessionId CHARACTER VARYING(255) UNIQUE NOT NULL,
  userId UUID NOT NULL,
  status CHARACTER VARYING(50) NOT NULL DEFAULT 'pending', -- pending, running, paused, stopped, completed, error
  towns TEXT[] NOT NULL,
  industries TEXT[] NOT NULL,
  config JSONB NOT NULL,
  progress JSONB DEFAULT '{"completedTowns": 0, "totalTowns": 0, "totalBusinesses": 0}'::jsonb,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completedAt TIMESTAMP WITH TIME ZONE,
  errorMessage TEXT,
  CONSTRAINT fk_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Scraper Businesses Table (matches your naming conventions)
CREATE TABLE IF NOT EXISTS scraper_businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sessionId CHARACTER VARYING(255) NOT NULL,
  name CHARACTER VARYING(500) NOT NULL,
  phone CHARACTER VARYING(50),
  provider CHARACTER VARYING(100),
  address TEXT,
  mapsAddress TEXT,
  typeOfBusiness CHARACTER VARYING(255) NOT NULL,
  town CHARACTER VARYING(255) NOT NULL,
  notes TEXT,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT fk_session FOREIGN KEY (sessionId) REFERENCES scraper_sessions(sessionId) ON DELETE CASCADE
);

-- Scraper Logs Table (matches your naming conventions)
CREATE TABLE IF NOT EXISTS scraper_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sessionId CHARACTER VARYING(255) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  message TEXT NOT NULL,
  level CHARACTER VARYING(20) NOT NULL, -- info, success, warning, error
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT fk_session_log FOREIGN KEY (sessionId) REFERENCES scraper_sessions(sessionId) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_scraper_sessions_sessionId ON scraper_sessions(sessionId);
CREATE INDEX IF NOT EXISTS idx_scraper_sessions_userId ON scraper_sessions(userId);
CREATE INDEX IF NOT EXISTS idx_scraper_sessions_status ON scraper_sessions(status);
CREATE INDEX IF NOT EXISTS idx_scraper_businesses_sessionId ON scraper_businesses(sessionId);
CREATE INDEX IF NOT EXISTS idx_scraper_logs_sessionId ON scraper_logs(sessionId);

-- Enable Row Level Security
ALTER TABLE scraper_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraper_businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraper_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allow all for now, refine later based on user_id)
CREATE POLICY "Allow all operations on scraper_sessions" ON scraper_sessions FOR ALL USING (true);
CREATE POLICY "Allow all operations on scraper_businesses" ON scraper_businesses FOR ALL USING (true);
CREATE POLICY "Allow all operations on scraper_logs" ON scraper_logs FOR ALL USING (true);
