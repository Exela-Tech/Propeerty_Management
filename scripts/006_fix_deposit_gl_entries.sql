-- 006_fix_deposit_gl_entries.sql
-- Fix missing GL entries for existing deposits
-- This script creates GL entries for deposits that were recorded but didn't create GL entries

-- 1) Ensure 'deposit' is allowed as a reference_type
ALTER TABLE general_ledger
DROP CONSTRAINT IF EXISTS general_ledger_reference_type_check;

ALTER TABLE general_ledger
ADD CONSTRAINT general_ledger_reference_type_check
CHECK (
  reference_type IN (
    'tenant_payment',
    'landlord_payment',
    'maintenance',
    'expense',
    'journal_entry',
    'deposit'
  )
);

-- 2) Create GL entries for deposits that do not have them
DO $$
DECLARE
  deposit_record RECORD;
  undeposited_funds_account_id UUID;
BEGIN
  -- Get the Undeposited Funds account
  SELECT id INTO undeposited_funds_account_id
  FROM chart_of_accounts
  WHERE account_code = '1015'
  LIMIT 1;

  IF undeposited_funds_account_id IS NULL THEN
    RAISE EXCEPTION 'Undeposited Funds account (1015) not found in chart_of_accounts';
  END IF;

  -- Loop through all deposits that don't have GL entries
  FOR deposit_record IN
    SELECT
      pd.id as deposit_id,
      pd.bank_account_id,
      pd.deposit_date,
      pd.deposit_reference,
      pd.total_amount,
      ba.gl_account_id as bank_gl_account_id,
      ba.account_name as bank_name
    FROM payment_deposits pd
    JOIN bank_accounts ba ON pd.bank_account_id = ba.id
    WHERE NOT EXISTS (
      SELECT 1 FROM general_ledger gl
      WHERE gl.reference_type = 'deposit'
      AND gl.reference_id = pd.id
    )
    ORDER BY pd.deposit_date
  LOOP

    IF deposit_record.bank_gl_account_id IS NULL THEN
      RAISE NOTICE 'Skipping deposit % because bank account has no gl_account_id',
        deposit_record.deposit_reference;
      CONTINUE;
    END IF;

    RAISE NOTICE 'Creating GL entries for deposit % to % (Amount: %)',
      deposit_record.deposit_reference,
      deposit_record.bank_name,
      deposit_record.total_amount;

    -- Debit the bank account (increase bank balance)
    INSERT INTO general_ledger (
      account_id,
      transaction_date,
      description,
      debit,
      credit,
      reference_type,
      reference_id
    ) VALUES (
      deposit_record.bank_gl_account_id,
      deposit_record.deposit_date,
      'Deposit: ' || COALESCE(deposit_record.deposit_reference, ''),
      deposit_record.total_amount,
      0,
      'deposit',
      deposit_record.deposit_id
    );

    -- Credit Undeposited Funds (decrease undeposited funds)
    INSERT INTO general_ledger (
      account_id,
      transaction_date,
      description,
      debit,
      credit,
      reference_type,
      reference_id
    ) VALUES (
      undeposited_funds_account_id,
      deposit_record.deposit_date,
      'Deposit: ' || COALESCE(deposit_record.deposit_reference, ''),
      0,
      deposit_record.total_amount,
      'deposit',
      deposit_record.deposit_id
    );

    RAISE NOTICE 'Created GL entries for deposit %', deposit_record.deposit_reference;
  END LOOP;

  RAISE NOTICE 'Deposit GL migration completed successfully';
END $$;
