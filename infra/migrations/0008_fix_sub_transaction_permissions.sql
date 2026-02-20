-- Migration: 0008_fix_sub_transaction_permissions.sql
-- Purpose: Grant missing object-level privileges on fb_sub_transactions
--          and add SECURITY DEFINER to delete/validate helper functions.
--
-- Background: Migration 0006 created fb_sub_transactions with RLS policies but
-- no explicit GRANT statements. PostgreSQL requires both object-level GRANTs
-- AND row-level policies. The service_role has BYPASSRLS but still needs
-- GRANT at the table level to interact with the table via PostgREST.
--
-- Author: Claude Code
-- Date: 2026-02-20
-- IDEMPOTENT: Yes - safe to re-run

-- ============================================================================
-- GRANT TABLE PRIVILEGES
-- ============================================================================

-- Grant full access to all roles used by Supabase/PostgREST
GRANT ALL ON TABLE fb_sub_transactions TO service_role;
GRANT ALL ON TABLE fb_sub_transactions TO authenticated;
GRANT ALL ON TABLE fb_sub_transactions TO anon;
GRANT ALL ON TABLE fb_sub_transactions TO postgres;

-- ============================================================================
-- RECREATE delete_all_sub_transactions WITH SECURITY DEFINER
-- The original function in 0006 lacked SECURITY DEFINER, causing permission
-- denied errors when called via PostgREST with authenticated/anon roles.
-- ============================================================================

CREATE OR REPLACE FUNCTION delete_all_sub_transactions(
  p_parent_id UUID,
  p_user_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM fb_sub_transactions
  WHERE parent_transaction_id = p_parent_id
  AND user_id = p_user_id;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- ============================================================================
-- RECREATE validate_sub_transaction_sum WITH SECURITY DEFINER
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_sub_transaction_sum(p_parent_id UUID)
RETURNS TABLE (
  is_valid BOOLEAN,
  parent_amount NUMERIC(18,2),
  sub_total NUMERIC(18,2),
  difference NUMERIC(18,2),
  sub_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  p_amount NUMERIC(18,2);
  s_total NUMERIC(18,2);
  s_count INTEGER;
BEGIN
  SELECT amount INTO p_amount
  FROM fb_emails_processed
  WHERE id = p_parent_id;

  SELECT COALESCE(SUM(amount), 0), COUNT(*) INTO s_total, s_count
  FROM fb_sub_transactions
  WHERE parent_transaction_id = p_parent_id;

  RETURN QUERY
  SELECT
    ABS(COALESCE(p_amount, 0) - s_total) < 0.01 AS is_valid,
    p_amount AS parent_amount,
    s_total AS sub_total,
    COALESCE(p_amount, 0) - s_total AS difference,
    s_count AS sub_count;
END;
$$;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION delete_all_sub_transactions IS 'Delete all sub-transactions for a parent. SECURITY DEFINER to bypass object-level privilege gap.';
COMMENT ON FUNCTION validate_sub_transaction_sum IS 'Check if sum of sub-transactions matches parent amount (within 0.01 tolerance). SECURITY DEFINER to bypass object-level privilege gap.';
