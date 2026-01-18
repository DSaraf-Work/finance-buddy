/**
 * Interactive Vision API Test
 *
 * Usage:
 *   npx tsx scripts/test-vision-interactive.ts <path-to-image>
 *
 * Example:
 *   npx tsx scripts/test-vision-interactive.ts ~/Downloads/receipt.jpg
 */

import { GoogleModel } from '../src/lib/ai/models/google';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;

if (!GOOGLE_AI_API_KEY) {
  console.error('❌ GOOGLE_AI_API_KEY not found in .env.local');
  process.exit(1);
}

async function parseReceipt(imagePath: string) {
  // Validate file exists
  if (!fs.existsSync(imagePath)) {
    console.error(`❌ File not found: ${imagePath}`);
    process.exit(1);
  }

  // Determine media type
  const ext = path.extname(imagePath).toLowerCase();
  const mediaTypeMap: Record<string, 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
  };

  const mediaType = mediaTypeMap[ext];
  if (!mediaType) {
    console.error(`❌ Unsupported image format: ${ext}`);
    console.error('   Supported: .jpg, .jpeg, .png, .webp, .gif');
    process.exit(1);
  }

  console.log('🧾 Receipt Parser - Gemini 2.5 Flash Vision');
  console.log('═'.repeat(50));
  console.log(`📁 File: ${imagePath}`);
  console.log(`📐 Type: ${mediaType}`);

  // Read and encode image
  const imageBuffer = fs.readFileSync(imagePath);
  const base64 = imageBuffer.toString('base64');
  const fileSizeKB = (imageBuffer.length / 1024).toFixed(1);
  console.log(`📦 Size: ${fileSizeKB} KB`);
  console.log('─'.repeat(50));

  const model = new GoogleModel({
    name: 'gemini-2.5-flash',
    provider: 'google',
    model: 'gemini-2.5-flash',
    apiKey: GOOGLE_AI_API_KEY,
    maxTokens: 2000,
    temperature: 0.1,
  });

  console.log('🔄 Sending to Gemini Vision API...\n');

  try {
    const response = await model.generateResponse({
      prompt: `Analyze this receipt image and extract all information.

Return a JSON object with this structure:
{
  "store_name": "Store/merchant name",
  "store_address": "Address if visible",
  "date": "Date in YYYY-MM-DD format",
  "time": "Time if visible",
  "items": [
    { "name": "Item description", "quantity": 1, "price": 0.00 }
  ],
  "subtotal": 0.00,
  "tax": 0.00,
  "total": 0.00,
  "payment_method": "Cash/Card/UPI etc",
  "currency": "INR/USD/etc"
}

If any field is not visible, use null. Be precise with amounts.`,
      image: {
        base64,
        mediaType,
      },
      systemPrompt: 'You are an expert receipt parser. Extract all visible information accurately. Return valid JSON only, no markdown.',
    });

    console.log('✅ Parsed Receipt Data:');
    console.log('─'.repeat(50));

    // Try to parse and pretty-print JSON
    try {
      const parsed = JSON.parse(response.content);
      console.log(JSON.stringify(parsed, null, 2));
    } catch {
      // If not valid JSON, print raw response
      console.log(response.content);
    }

    console.log('─'.repeat(50));
    console.log(`📊 Tokens used: ${response.usage?.totalTokens || 'N/A'}`);

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Main
const imagePath = process.argv[2];
if (!imagePath) {
  console.log('Usage: npx tsx scripts/test-vision-interactive.ts <path-to-image>');
  console.log('');
  console.log('Example:');
  console.log('  npx tsx scripts/test-vision-interactive.ts ~/Downloads/receipt.jpg');
  console.log('  npx tsx scripts/test-vision-interactive.ts ./test-receipt.png');
  process.exit(0);
}

parseReceipt(path.resolve(imagePath));
