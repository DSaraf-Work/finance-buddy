# Phase 7: Receipt APIs

## Objective
Create API endpoints for receipt upload, parsing, and conversion to sub-transactions.

---

## API Endpoints

### 1. Upload Receipt
`POST /api/transactions/[id]/receipt`

### 2. Get Receipt
`GET /api/transactions/[id]/receipt`

### 3. Parse Receipt
`POST /api/receipts/[id]/parse`

### 4. Update Receipt Items
`PATCH /api/receipts/[id]/items`

### 5. Convert to Sub-Transactions
`POST /api/receipts/[id]/create-sub-transactions`

### 6. Delete Receipt
`DELETE /api/receipts/[id]`

---

## File Structure

```
src/pages/api/
├── transactions/[id]/
│   └── receipt.ts           # POST (upload), GET
└── receipts/[id]/
    ├── index.ts             # GET, DELETE
    ├── parse.ts             # POST
    ├── items.ts             # PATCH
    └── create-sub-transactions.ts  # POST
```

---

## Implementation

### `src/pages/api/transactions/[id]/receipt.ts`

```typescript
// Receipt upload and fetch for transaction

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { TABLE_EMAILS_PROCESSED } from '@/lib/constants/database';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,  // Required for file upload
  },
};

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid transaction ID' });
  }

  // Verify transaction belongs to user
  const { data: transaction, error: txnError } = await supabaseAdmin
    .from(TABLE_EMAILS_PROCESSED)
    .select('id, amount, currency')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (txnError || !transaction) {
    return res.status(404).json({ error: 'Transaction not found' });
  }

  // GET: Fetch existing receipt
  if (req.method === 'GET') {
    const { data: receipt, error: receiptError } = await supabaseAdmin
      .from('fb_receipts')
      .select(`
        *,
        items:fb_receipt_items(*)
      `)
      .eq('transaction_id', id)
      .eq('user_id', user.id)
      .single();

    if (receiptError && receiptError.code !== 'PGRST116') {
      return res.status(500).json({ error: receiptError.message });
    }

    return res.status(200).json({ receipt: receipt || null });
  }

  // POST: Upload new receipt
  if (req.method === 'POST') {
    try {
      // Check if receipt already exists
      const { data: existing } = await supabaseAdmin
        .from('fb_receipts')
        .select('id')
        .eq('transaction_id', id)
        .single();

      if (existing) {
        return res.status(400).json({
          error: 'Receipt already exists. Delete it first to upload new one.',
        });
      }

      // Parse multipart form
      const form = formidable({ maxFileSize: 20 * 1024 * 1024 });
      const [fields, files] = await form.parse(req);

      const file = Array.isArray(files.file) ? files.file[0] : files.file;
      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(file.mimetype || '')) {
        return res.status(400).json({ error: 'Invalid file type' });
      }

      // Create receipt record
      const receiptId = crypto.randomUUID();
      const filePath = `${user.id}/${receiptId}/${file.originalFilename}`;

      // Upload to storage
      const fileBuffer = fs.readFileSync(file.filepath);
      const { error: uploadError } = await supabaseAdmin.storage
        .from('receipts')
        .upload(filePath, fileBuffer, {
          contentType: file.mimetype || 'application/octet-stream',
        });

      if (uploadError) {
        return res.status(500).json({ error: `Upload failed: ${uploadError.message}` });
      }

      // Insert receipt record
      const { data: receipt, error: insertError } = await supabaseAdmin
        .from('fb_receipts')
        .insert({
          id: receiptId,
          user_id: user.id,
          transaction_id: id,
          file_path: filePath,
          file_name: file.originalFilename,
          file_type: file.mimetype,
          file_size: file.size,
          parsing_status: 'pending',
        })
        .select()
        .single();

      if (insertError) {
        // Cleanup uploaded file
        await supabaseAdmin.storage.from('receipts').remove([filePath]);
        return res.status(500).json({ error: insertError.message });
      }

      return res.status(201).json({ receipt });
    } catch (error: any) {
      console.error('Receipt upload error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
});
```

---

### `src/pages/api/receipts/[id]/parse.ts`

```typescript
// Parse receipt with AI

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { AnthropicModel } from '@/lib/ai/models/anthropic';
import { RECEIPT_PARSING_SYSTEM_PROMPT, RECEIPT_PARSING_PROMPT } from '@/lib/receipt-parsing/prompts';

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid receipt ID' });
  }

  // Fetch receipt
  const { data: receipt, error: receiptError } = await supabaseAdmin
    .from('fb_receipts')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (receiptError || !receipt) {
    return res.status(404).json({ error: 'Receipt not found' });
  }

  if (receipt.parsing_status === 'completed') {
    return res.status(400).json({ error: 'Receipt already parsed' });
  }

  try {
    // Update status to processing
    await supabaseAdmin
      .from('fb_receipts')
      .update({ parsing_status: 'processing' })
      .eq('id', id);

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from('receipts')
      .download(receipt.file_path);

    if (downloadError || !fileData) {
      throw new Error('Failed to download receipt file');
    }

    // Convert to base64
    const buffer = await fileData.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');

    // Determine media type
    const mediaType = receipt.file_type.includes('png') ? 'image/png' :
                      receipt.file_type.includes('gif') ? 'image/gif' :
                      receipt.file_type.includes('webp') ? 'image/webp' :
                      'image/jpeg';

    // Parse with AI
    const model = new AnthropicModel('claude-sonnet-4-20250514');
    const response = await model.analyzeImage(
      [{ type: 'base64', media_type: mediaType as any, data: base64 }],
      RECEIPT_PARSING_PROMPT,
      { systemPrompt: RECEIPT_PARSING_SYSTEM_PROMPT, maxTokens: 4096 }
    );

    // Parse response
    const parsed = JSON.parse(response.text);

    // Update receipt with parsed data
    await supabaseAdmin
      .from('fb_receipts')
      .update({
        store_name: parsed.store_name,
        receipt_date: parsed.receipt_date,
        receipt_number: parsed.receipt_number,
        subtotal: parsed.subtotal,
        tax_amount: parsed.tax_amount,
        discount_amount: parsed.discount_amount,
        total_amount: parsed.total_amount,
        raw_ocr_text: response.text,
        parsing_status: 'completed',
        confidence: parsed.confidence,
        ai_model_used: 'claude-sonnet-4-20250514',
      })
      .eq('id', id);

    // Insert receipt items
    if (parsed.items && parsed.items.length > 0) {
      const items = parsed.items.map((item: any, index: number) => ({
        receipt_id: id,
        user_id: user.id,
        item_order: index + 1,
        item_name: item.item_name,
        quantity: item.quantity || 1,
        unit: item.unit,
        unit_price: item.unit_price,
        total_price: item.total_price,
      }));

      await supabaseAdmin.from('fb_receipt_items').insert(items);
    }

    // Fetch updated receipt with items
    const { data: updatedReceipt } = await supabaseAdmin
      .from('fb_receipts')
      .select(`*, items:fb_receipt_items(*)`)
      .eq('id', id)
      .single();

    return res.status(200).json({ receipt: updatedReceipt });
  } catch (error: any) {
    console.error('Receipt parsing error:', error);

    // Update status to failed
    await supabaseAdmin
      .from('fb_receipts')
      .update({
        parsing_status: 'failed',
        parsing_error: error.message,
      })
      .eq('id', id);

    return res.status(500).json({ error: error.message });
  }
});
```

---

### `src/pages/api/receipts/[id]/create-sub-transactions.ts`

```typescript
// Convert receipt items to sub-transactions

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { TABLE_EMAILS_PROCESSED } from '@/lib/constants/database';

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid receipt ID' });
  }

  // Fetch receipt with items
  const { data: receipt, error: receiptError } = await supabaseAdmin
    .from('fb_receipts')
    .select(`
      *,
      items:fb_receipt_items(*),
      transaction:fb_emails_processed!transaction_id(*)
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (receiptError || !receipt) {
    return res.status(404).json({ error: 'Receipt not found' });
  }

  if (receipt.parsing_status !== 'completed') {
    return res.status(400).json({ error: 'Receipt not parsed yet' });
  }

  if (!receipt.items || receipt.items.length === 0) {
    return res.status(400).json({ error: 'No items in receipt' });
  }

  // Filter out excluded, tax, and discount items
  const eligibleItems = receipt.items.filter(
    (item: any) => !item.is_excluded && !item.is_tax && !item.is_discount
  );

  if (eligibleItems.length < 2) {
    return res.status(400).json({
      error: 'Need at least 2 eligible items (non-tax, non-discount)',
    });
  }

  try {
    // Check if sub-transactions already exist
    const { count } = await supabaseAdmin
      .from(TABLE_EMAILS_PROCESSED)
      .select('id', { count: 'exact', head: true })
      .eq('parent_transaction_id', receipt.transaction_id);

    if (count && count > 0) {
      return res.status(400).json({
        error: 'Sub-transactions already exist for this transaction',
      });
    }

    // Create sub-transactions
    const subTransactions = eligibleItems.map((item: any, index: number) => ({
      parent_transaction_id: receipt.transaction_id,
      is_sub_transaction: true,
      sub_transaction_order: index + 1,
      receipt_item_id: item.id,
      amount: item.total_price,
      merchant_name: item.item_name,
      category: item.category,
    }));

    const { data: created, error: createError } = await supabaseAdmin
      .from(TABLE_EMAILS_PROCESSED)
      .insert(subTransactions)
      .select();

    if (createError) {
      return res.status(500).json({ error: createError.message });
    }

    // Update receipt items with sub-transaction links
    for (let i = 0; i < created.length; i++) {
      await supabaseAdmin
        .from('fb_receipt_items')
        .update({ sub_transaction_id: created[i].id })
        .eq('id', eligibleItems[i].id);
    }

    return res.status(201).json({
      success: true,
      subTransactions: created,
      count: created.length,
    });
  } catch (error: any) {
    console.error('Create sub-transactions error:', error);
    return res.status(500).json({ error: error.message });
  }
});
```

---

### `src/pages/api/receipts/[id]/items.ts`

```typescript
// Update receipt items

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const { items } = req.body;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid receipt ID' });
  }

  if (!items || !Array.isArray(items)) {
    return res.status(400).json({ error: 'items array required' });
  }

  // Verify receipt belongs to user
  const { data: receipt } = await supabaseAdmin
    .from('fb_receipts')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!receipt) {
    return res.status(404).json({ error: 'Receipt not found' });
  }

  try {
    // Update each item
    for (const item of items) {
      if (!item.id) continue;

      const updates: any = {};
      if (item.item_name !== undefined) updates.item_name = item.item_name;
      if (item.quantity !== undefined) updates.quantity = item.quantity;
      if (item.total_price !== undefined) updates.total_price = item.total_price;
      if (item.category !== undefined) updates.category = item.category;
      if (item.is_excluded !== undefined) updates.is_excluded = item.is_excluded;
      if (item.is_tax !== undefined) updates.is_tax = item.is_tax;
      if (item.is_discount !== undefined) updates.is_discount = item.is_discount;

      if (Object.keys(updates).length > 0) {
        await supabaseAdmin
          .from('fb_receipt_items')
          .update(updates)
          .eq('id', item.id)
          .eq('user_id', user.id);
      }
    }

    // Fetch updated items
    const { data: updatedItems } = await supabaseAdmin
      .from('fb_receipt_items')
      .select('*')
      .eq('receipt_id', id)
      .order('item_order');

    return res.status(200).json({ items: updatedItems });
  } catch (error: any) {
    console.error('Update items error:', error);
    return res.status(500).json({ error: error.message });
  }
});
```

---

## Validation Steps

1. **Upload receipt**
   ```bash
   curl -X POST /api/transactions/{id}/receipt \
     -H "Authorization: Bearer $TOKEN" \
     -F "file=@receipt.jpg"
   ```

2. **Parse receipt**
   ```bash
   curl -X POST /api/receipts/{id}/parse \
     -H "Authorization: Bearer $TOKEN"
   ```

3. **Update items**
   ```bash
   curl -X PATCH /api/receipts/{id}/items \
     -H "Authorization: Bearer $TOKEN" \
     -d '{"items":[{"id":"...","category":"Food"}]}'
   ```

4. **Create sub-transactions**
   ```bash
   curl -X POST /api/receipts/{id}/create-sub-transactions \
     -H "Authorization: Bearer $TOKEN"
   ```

---

## Success Criteria

- [ ] File upload works (JPEG, PNG, PDF)
- [ ] Files stored in correct path
- [ ] AI parsing extracts items correctly
- [ ] Items can be edited before conversion
- [ ] Sub-transactions created with correct amounts
- [ ] Bidirectional links maintained
- [ ] RLS enforced on all operations
