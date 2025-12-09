-- Update debt_status enum to include new statuses
-- First, create a new enum type with all values
CREATE TYPE debt_status_new AS ENUM ('pendiente', 'deuda', 'pagado', 'cancelado');

-- Update the debts table to use text temporarily
ALTER TABLE debts ALTER COLUMN status DROP DEFAULT;
ALTER TABLE debts ALTER COLUMN status TYPE text USING status::text;

-- Drop the old enum
DROP TYPE debt_status;

-- Rename new enum to original name
ALTER TYPE debt_status_new RENAME TO debt_status;

-- Convert back to enum
ALTER TABLE debts ALTER COLUMN status TYPE debt_status USING status::debt_status;
ALTER TABLE debts ALTER COLUMN status SET DEFAULT 'pendiente'::debt_status;