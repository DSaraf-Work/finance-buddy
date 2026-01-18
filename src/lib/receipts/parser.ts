/**
 * Receipt Parser
 *
 * Parses receipt images using Claude Vision API to extract
 * structured line item data.
 *
 * @module lib/receipts/parser
 */

import { getAIManager } from '@/lib/ai/manager';
import type { AIRequest, AIImageContent } from '@/lib/ai/types';
import type {
  ParsedReceiptData,
  ParsedReceiptItem,
  ReceiptFileType,
} from '@/types/receipts';
import { RECEIPT_LIMITS } from '@/types/receipts';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * System prompt for receipt parsing
 */
const RECEIPT_PARSING_SYSTEM_PROMPT = `You are a receipt parsing AI assistant. Your task is to extract structured data from receipt images.

IMPORTANT RULES:
1. Extract ALL line items visible on the receipt
2. Use INR (₹) as default currency unless another currency symbol is clearly visible
3. Be precise with amounts - extract exactly what you see
4. Identify taxes, discounts, tips, and service charges separately
5. Return JSON only - no explanations or markdown
6. If you can't read something clearly, set confidence lower and include the raw text

For each item, determine:
- is_tax: true if it's a tax line (GST, VAT, CGST, SGST, service tax)
- is_discount: true if it's a discount/coupon line (negative amount)
- is_tip: true if it's a tip/gratuity line
- is_service_charge: true if it's a service charge`;

/**
 * User prompt template for receipt parsing
 */
const RECEIPT_PARSING_USER_PROMPT = `Analyze this receipt image and extract all information in the following JSON format:

{
  "store_name": "string or null",
  "store_address": "string or null",
  "receipt_date": "YYYY-MM-DD or null",
  "receipt_number": "string or null",
  "receipt_total": number or null,
  "currency": "INR",
  "items": [
    {
      "item_name": "string (required)",
      "item_description": "string or null",
      "quantity": number (default 1),
      "unit_price": number or null,
      "total_price": number (required),
      "category": "string or null (e.g., Food, Beverage, Electronics)",
      "is_tax": boolean,
      "is_discount": boolean,
      "is_tip": boolean,
      "is_service_charge": boolean,
      "confidence": number (0.0-1.0),
      "raw_text": "string - original text from receipt"
    }
  ],
  "confidence": number (0.0-1.0, overall parsing confidence),
  "raw_text": "string - full OCR text from receipt"
}

Return ONLY the JSON object, no other text.`;

// ============================================================================
// PARSER CLASS
// ============================================================================

export class ReceiptParser {
  /**
   * Parse a receipt image and extract structured data
   *
   * @param imageBase64 - Base64-encoded image data (without data URI prefix)
   * @param mediaType - MIME type of the image
   * @returns Parsed receipt data with line items
   */
  async parseReceipt(
    imageBase64: string,
    mediaType: ReceiptFileType
  ): Promise<ParsedReceiptData> {
    const startTime = Date.now();

    // Validate input
    if (!imageBase64 || imageBase64.length === 0) {
      throw new Error('Image data is required');
    }

    // Convert file type to AI media type
    const aiMediaType = this.convertToAIMediaType(mediaType);

    // Build AI request with image
    const request: AIRequest = {
      prompt: RECEIPT_PARSING_USER_PROMPT,
      systemPrompt: RECEIPT_PARSING_SYSTEM_PROMPT,
      maxTokens: 4000,
      temperature: 0.1, // Low temperature for consistent extraction
      responseFormat: 'json',
      image: {
        base64: imageBase64,
        mediaType: aiMediaType,
      },
      metadata: {
        task: 'receipt_parsing',
        startTime,
      },
    };

    // Call AI manager
    const manager = getAIManager();
    const response = await manager.generateResponse(request);

    // Parse JSON response
    const parsed = this.parseAIResponse(response.content);

    // Validate and normalize data
    const normalized = this.normalizeReceiptData(parsed);

    return normalized;
  }

  /**
   * Convert receipt file type to AI-compatible media type
   */
  private convertToAIMediaType(
    fileType: ReceiptFileType
  ): AIImageContent['mediaType'] {
    switch (fileType) {
      case 'image/jpeg':
        return 'image/jpeg';
      case 'image/png':
        return 'image/png';
      case 'image/webp':
        return 'image/webp';
      case 'application/pdf':
        // PDF requires conversion - for now, throw error
        // Future: Use pdf-to-image conversion
        throw new Error('PDF parsing not yet supported. Please upload a JPG, PNG, or WebP image.');
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }
  }

  /**
   * Parse AI response JSON
   */
  private parseAIResponse(content: string): ParsedReceiptData {
    // Clean up response - remove markdown code blocks if present
    let cleanContent = content.trim();

    // Remove markdown code blocks
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.slice(7);
    } else if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.slice(3);
    }
    if (cleanContent.endsWith('```')) {
      cleanContent = cleanContent.slice(0, -3);
    }
    cleanContent = cleanContent.trim();

    try {
      const data = JSON.parse(cleanContent);
      return data as ParsedReceiptData;
    } catch (error) {
      console.error('[ReceiptParser] Failed to parse AI response:', content);
      throw new Error('Failed to parse receipt data from AI response');
    }
  }

  /**
   * Normalize and validate receipt data
   */
  private normalizeReceiptData(data: ParsedReceiptData): ParsedReceiptData {
    // Ensure items array exists
    const items: ParsedReceiptItem[] = (data.items || []).map((item, index) => ({
      item_name: item.item_name || `Item ${index + 1}`,
      item_description: item.item_description || undefined,
      quantity: Number(item.quantity) || 1,
      unit_price: item.unit_price !== null ? Number(item.unit_price) : null,
      total_price: Number(item.total_price) || 0,
      category: item.category || undefined,
      is_tax: Boolean(item.is_tax),
      is_discount: Boolean(item.is_discount),
      is_tip: Boolean(item.is_tip),
      is_service_charge: Boolean(item.is_service_charge),
      confidence: Number(item.confidence) || 0.8,
      raw_text: item.raw_text || undefined,
    }));

    // Validate item count
    if (items.length > RECEIPT_LIMITS.MAX_ITEMS) {
      console.warn(`[ReceiptParser] Receipt has ${items.length} items, truncating to ${RECEIPT_LIMITS.MAX_ITEMS}`);
      items.length = RECEIPT_LIMITS.MAX_ITEMS;
    }

    // Calculate overall confidence
    const avgItemConfidence = items.length > 0
      ? items.reduce((sum, item) => sum + item.confidence, 0) / items.length
      : 0.5;
    const overallConfidence = Number(data.confidence) || avgItemConfidence;

    return {
      store_name: data.store_name || null,
      store_address: data.store_address || null,
      receipt_date: this.normalizeDate(data.receipt_date),
      receipt_number: data.receipt_number || null,
      receipt_total: data.receipt_total !== null ? Number(data.receipt_total) : null,
      currency: data.currency || 'INR',
      items,
      confidence: overallConfidence,
      raw_text: data.raw_text || undefined,
    };
  }

  /**
   * Normalize date string to YYYY-MM-DD format
   */
  private normalizeDate(dateStr: string | null): string | null {
    if (!dateStr) return null;

    try {
      // Try parsing various date formats
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    } catch {
      // Ignore parsing errors
    }

    // Try common Indian date formats (DD/MM/YYYY, DD-MM-YYYY)
    const indianDateMatch = dateStr.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (indianDateMatch) {
      const [, day, month, year] = indianDateMatch;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    return null;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let parserInstance: ReceiptParser | null = null;

/**
 * Get singleton receipt parser instance
 */
export function getReceiptParser(): ReceiptParser {
  if (!parserInstance) {
    parserInstance = new ReceiptParser();
  }
  return parserInstance;
}
