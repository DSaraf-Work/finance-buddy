# Phase 5: Vision API Extension

## Objective
Extend `AnthropicModel` to support image content for receipt parsing.

---

## Current Implementation

`src/lib/ai/models/anthropic.ts` only supports text:

```typescript
messages: [
  {
    role: 'user',
    content: request.prompt,  // Text only
  },
],
```

---

## Updated Implementation

### Types: `src/lib/ai/types.ts`

```typescript
/**
 * Image content for vision requests
 */
export interface ImageContent {
  type: 'base64' | 'url';
  media_type: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
  data: string;  // base64 data or URL
}

/**
 * Extended AI request with image support
 */
export interface VisionAIRequest extends AIRequest {
  images?: ImageContent[];
}
```

---

### Update `src/lib/ai/models/anthropic.ts`

```typescript
import Anthropic from '@anthropic-ai/sdk';
import type { AIModel, AIRequest, AIResponse, VisionAIRequest, ImageContent } from '../types';

export class AnthropicModel implements AIModel {
  private client: Anthropic;
  private modelId: string;

  constructor(modelId: string = 'claude-sonnet-4-20250514') {
    this.client = new Anthropic();
    this.modelId = modelId;
  }

  /**
   * Build message content with optional images
   */
  private buildContent(request: VisionAIRequest): Anthropic.MessageParam['content'] {
    const content: Anthropic.ContentBlockParam[] = [];

    // Add images first if present
    if (request.images && request.images.length > 0) {
      for (const image of request.images) {
        if (image.type === 'base64') {
          content.push({
            type: 'image',
            source: {
              type: 'base64',
              media_type: image.media_type,
              data: image.data,
            },
          });
        } else if (image.type === 'url') {
          content.push({
            type: 'image',
            source: {
              type: 'url',
              url: image.data,
            },
          });
        }
      }
    }

    // Add text prompt
    content.push({
      type: 'text',
      text: request.prompt,
    });

    return content;
  }

  async complete(request: VisionAIRequest): Promise<AIResponse> {
    try {
      const response = await this.client.messages.create({
        model: this.modelId,
        max_tokens: request.maxTokens || 4096,
        temperature: request.temperature || 0,
        system: request.systemPrompt,
        messages: [
          {
            role: 'user',
            content: this.buildContent(request),
          },
        ],
      });

      const textBlock = response.content.find((block) => block.type === 'text');
      const text = textBlock?.type === 'text' ? textBlock.text : '';

      return {
        text,
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
        },
        model: this.modelId,
        finishReason: response.stop_reason || 'end_turn',
      };
    } catch (error: any) {
      console.error('Anthropic API error:', error);
      throw new Error(`Anthropic API failed: ${error.message}`);
    }
  }

  /**
   * Convenience method for vision requests
   */
  async analyzeImage(
    images: ImageContent[],
    prompt: string,
    options?: Partial<VisionAIRequest>
  ): Promise<AIResponse> {
    return this.complete({
      prompt,
      images,
      ...options,
    });
  }
}
```

---

## Receipt Parsing Prompt

### `src/lib/receipt-parsing/prompts.ts`

```typescript
export const RECEIPT_PARSING_SYSTEM_PROMPT = `You are an expert receipt parser specialized in Indian receipts. Extract structured data from receipt images accurately.

IMPORTANT:
- All amounts are in INR (Indian Rupees) unless explicitly stated otherwise
- Handle GST/CGST/SGST tax breakdowns
- Recognize common Indian store formats (Big Bazaar, DMart, Reliance, etc.)
- Parse both printed and handwritten receipts
- Handle multiple items per line

OUTPUT FORMAT:
Return valid JSON only, no markdown or explanation.`;

export const RECEIPT_PARSING_PROMPT = `Analyze this receipt image and extract:

1. Store Information:
   - store_name: Name of the store/merchant
   - receipt_date: Date in ISO format (YYYY-MM-DD)
   - receipt_number: Receipt/invoice number if visible

2. Items: Array of line items, each with:
   - item_name: Product name
   - quantity: Number (default 1)
   - unit: Unit of measure if applicable (kg, g, L, pcs, etc.)
   - unit_price: Price per unit
   - total_price: Total for this line

3. Totals:
   - subtotal: Sum before tax/discounts
   - tax_amount: Total tax (GST/VAT)
   - discount_amount: Any discounts applied
   - total_amount: Final amount paid

Return as JSON:
{
  "store_name": "",
  "receipt_date": "",
  "receipt_number": "",
  "items": [
    {
      "item_name": "",
      "quantity": 1,
      "unit": null,
      "unit_price": null,
      "total_price": 0
    }
  ],
  "subtotal": null,
  "tax_amount": null,
  "discount_amount": null,
  "total_amount": 0,
  "confidence": 0.95
}`;
```

---

## Usage Example

```typescript
import { AnthropicModel } from '@/lib/ai/models/anthropic';
import { RECEIPT_PARSING_SYSTEM_PROMPT, RECEIPT_PARSING_PROMPT } from '@/lib/receipt-parsing/prompts';

const model = new AnthropicModel('claude-sonnet-4-20250514');

// From base64
const response = await model.analyzeImage(
  [{
    type: 'base64',
    media_type: 'image/jpeg',
    data: base64ImageData,
  }],
  RECEIPT_PARSING_PROMPT,
  {
    systemPrompt: RECEIPT_PARSING_SYSTEM_PROMPT,
    maxTokens: 4096,
    temperature: 0,
  }
);

const parsed = JSON.parse(response.text);
```

---

## Image Utilities

### `src/lib/receipt-parsing/image-utils.ts`

```typescript
/**
 * Convert file to base64
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (data:image/jpeg;base64,)
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Get media type from file
 */
export function getMediaType(file: File): 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' {
  const type = file.type.toLowerCase();
  if (type === 'image/png') return 'image/png';
  if (type === 'image/gif') return 'image/gif';
  if (type === 'image/webp') return 'image/webp';
  return 'image/jpeg';  // Default
}

/**
 * Validate image file
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 20 * 1024 * 1024;  // 20MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Use JPEG, PNG, GIF, or WebP.' };
  }

  if (file.size > maxSize) {
    return { valid: false, error: 'File too large. Maximum 20MB.' };
  }

  return { valid: true };
}
```

---

## Validation Steps

1. **Unit test image building**
   ```typescript
   const model = new AnthropicModel();
   const content = model['buildContent']({
     prompt: 'Test',
     images: [{ type: 'base64', media_type: 'image/jpeg', data: 'abc123' }],
   });
   // Verify structure
   ```

2. **Test with sample receipt**
   ```typescript
   const response = await model.analyzeImage(
     [{ type: 'base64', media_type: 'image/jpeg', data: sampleBase64 }],
     RECEIPT_PARSING_PROMPT,
     { systemPrompt: RECEIPT_PARSING_SYSTEM_PROMPT }
   );
   console.log(JSON.parse(response.text));
   ```

3. **Verify API response format**
   - Check `usage` includes input/output tokens
   - Verify `finishReason` is correct

---

## Success Criteria

- [ ] `AnthropicModel.complete()` accepts images
- [ ] `analyzeImage()` convenience method works
- [ ] Base64 images processed correctly
- [ ] URL images processed correctly (if supported)
- [ ] Receipt parsing prompt returns valid JSON
- [ ] Image validation utilities work
- [ ] Error handling for invalid images
