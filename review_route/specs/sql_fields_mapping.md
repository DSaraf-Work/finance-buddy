# Field → UI mapping & validation

## Primary fields (show in list)
- **txn_time** → Date/Time (required) • datetime picker; timezone-aware; format `dd MMM yyyy, HH:mm`.
- **merchant_normalized** (fallback to **merchant_name**) → Merchant title; secondary line shows `reference_id • location`.
- **category** → Chip; searchable combo box with create-new option.
- **account_hint + account_type** → Account line: `HDFC ****1234 • Savings`.
- **confidence** → Badge `#F4FBEB`; show to 2 decimals.
- **amount + currency + direction** → Right-aligned; red for debit, green for credit; include +/- prefix.

## Secondary (in row hover/expand or in modal)
- **user_notes** (editable textarea), **ai_notes** (read-only), **reference_id**, **location**.

## Read-only in modal
- **id**, **email_row_id** (link to email), **google_user_id**, **connection_id**, **extraction_version**, **created_at**, **updated_at**.

## Hidden by default (advanced)
- **transaction_type** (redundant with direction), **currency** unless not INR.

### Validation
- `direction` ∈ {'debit','credit'}, enforced by segmented control.
- `transaction_type` ∈ {'Dr','Cr'}; auto-sync with `direction` on save.
- `amount` ≥ 0; numeric(18,2).
- `confidence` in [0,1]; step 0.01; allow null.
- `category`, `merchant_*` length ≤ 200 chars typical.