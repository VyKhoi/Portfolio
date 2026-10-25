-- Database portfolio_db is created automatically by POSTGRES_DB
SELECT 'CREATE DATABASE portfolio_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'portfolio_db')\gexec
