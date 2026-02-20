/**
 * Receipt OCR parser using Claude Haiku via OpenRouter.
 * Uses the existing openai SDK package (no new AI dependency).
 */

import OpenAI from 'openai';
import { RECEIPT_PARSING_SYSTEM_PROMPT, buildReceiptUserPrompt } from './prompts';
import type { ParsedReceipt, ParsedReceiptItem, ReceiptParseInput } from './types';

const MODEL = 'anthropic/claude-haiku-4.5';
const MISMATCH_TOLERANCE = 1.0; // INR — differences ≤ ₹1 are rounding noise

function getClient(): OpenAI {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not configured');
  }
  return new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
    defaultHeaders: {
      'HTTP-Referer': 'https://finance-buddy-sand.vercel.app',
      'X-Title': 'Finance Buddy',
    },
  });
}

export class ReceiptParseError extends Error {
  constructor(
    message: string,
    public readonly code: 'NOT_A_RECEIPT' | 'PARSE_ERROR' | 'MODEL_ERROR',
    public readonly reason?: string
  ) {
    super(message);
    this.name = 'ReceiptParseError';
  }
}

export async function parseReceiptWithOpenRouter(input: ReceiptParseInput): Promise<ParsedReceipt> {
  const { fileBuffer, mimeType, parentAmount } = input;

  const client = getClient();
  const base64 = fileBuffer.toString('base64');

  let rawResponse: Record<string, unknown>;

  try {
    const response = await client.chat.completions.create({
      model: MODEL,
      max_tokens: 2000,
      temperature: 0,
      messages: [
        {
          role: 'system',
          content: RECEIPT_PARSING_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${base64}` },
            },
            {
              type: 'text',
              text: buildReceiptUserPrompt(parentAmount),
            },
          ],
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new ReceiptParseError('Empty response from model', 'MODEL_ERROR');
    }

    // Strip markdown code fences if model wraps JSON anyway
    const cleaned = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

    rawResponse = JSON.parse(cleaned) as Record<string, unknown>;
  } catch (err) {
    if (err instanceof ReceiptParseError) throw err;
    if (err instanceof SyntaxError) {
      throw new ReceiptParseError('Model returned invalid JSON', 'PARSE_ERROR');
    }
    throw new ReceiptParseError(
      `OpenRouter API error: ${err instanceof Error ? err.message : String(err)}`,
      'MODEL_ERROR'
    );
  }

  // Handle explicit "not a receipt" signal from the model
  if (rawResponse.error === 'NOT_A_RECEIPT') {
    throw new ReceiptParseError(
      'The uploaded image does not appear to be a receipt',
      'NOT_A_RECEIPT',
      typeof rawResponse.reason === 'string' ? rawResponse.reason : undefined
    );
  }

  // Parse and normalize items
  const rawItems = Array.isArray(rawResponse.items) ? rawResponse.items : [];
  const items: ParsedReceiptItem[] = rawItems.map((raw: Record<string, unknown>) => ({
    item_name: String(raw.item_name ?? 'Unknown item'),
    quantity: Number(raw.quantity ?? 1),
    unit: raw.unit ? String(raw.unit) : null,
    unit_price: raw.unit_price != null ? Number(raw.unit_price) : null,
    total_price: Number(raw.total_price ?? 0),
    suggested_category: raw.suggested_category ? String(raw.suggested_category) : null,
    is_tax_line: Boolean(raw.is_tax_line),
    is_discount_line: Boolean(raw.is_discount_line),
  }));

  const ocrTotal = items
    .filter((i) => !i.is_tax_line && !i.is_discount_line)
    .reduce((sum, i) => sum + i.total_price, 0);

  // Mismatch detection and "Others" injection
  let mismatch: ParsedReceipt['mismatch'] = {
    has_mismatch: false,
    difference: 0,
    others_amount: null,
  };

  if (parentAmount !== null) {
    const difference = Math.round((parentAmount - ocrTotal) * 100) / 100;
    if (Math.abs(difference) > MISMATCH_TOLERANCE) {
      const othersAmount = Math.round(difference * 100) / 100;
      items.push({
        item_name: 'Others',
        quantity: 1,
        unit: null,
        unit_price: othersAmount,
        total_price: othersAmount,
        suggested_category: 'other',
        is_tax_line: false,
        is_discount_line: false,
      });
      mismatch = { has_mismatch: true, difference, others_amount: othersAmount };
    }
  }

  return {
    store_name: rawResponse.store_name ? String(rawResponse.store_name) : null,
    receipt_date: rawResponse.receipt_date ? String(rawResponse.receipt_date) : null,
    receipt_number: rawResponse.receipt_number ? String(rawResponse.receipt_number) : null,
    items,
    subtotal: rawResponse.subtotal != null ? Number(rawResponse.subtotal) : null,
    tax_amount: rawResponse.tax_amount != null ? Number(rawResponse.tax_amount) : null,
    discount_amount: rawResponse.discount_amount != null ? Number(rawResponse.discount_amount) : null,
    total_amount: rawResponse.total_amount != null ? Number(rawResponse.total_amount) : null,
    currency: String(rawResponse.currency ?? 'INR'),
    confidence: Number(rawResponse.confidence ?? 0),
    raw: rawResponse,
    mismatch,
  };
}
