-- Initial database setup script
-- This runs when the PostgreSQL container is first created

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create schema (optional, using default 'public')
-- CREATE SCHEMA IF NOT EXISTS hit;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE hit_db TO hit_user;

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'HIT Database initialized successfully!';
END $$;
