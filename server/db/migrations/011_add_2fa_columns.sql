-- v3.14.0: 2FA Persistence
ALTER TABLE users ADD COLUMN twoFactorSecret TEXT;
ALTER TABLE users ADD COLUMN twoFactorEnabled INTEGER DEFAULT 0;
