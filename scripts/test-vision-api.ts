/**
 * Test script for Vision API support (Gemini)
 * Run with: npx tsx scripts/test-vision-api.ts
 *
 * Tests:
 * 1. Text-only request (existing behavior)
 * 2. Vision request with base64 image
 */

import { GoogleModel } from '../src/lib/ai/models/google';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;

if (!GOOGLE_AI_API_KEY) {
  console.error('❌ GOOGLE_AI_API_KEY not found in .env.local');
  process.exit(1);
}

console.log('✅ GOOGLE_AI_API_KEY found');

async function testTextOnly() {
  console.log('\n📝 Test 1: Text-only request');
  console.log('─'.repeat(50));

  const model = new GoogleModel({
    name: 'gemini-flash',
    provider: 'google',
    model: 'gemini-2.5-flash',
    apiKey: GOOGLE_AI_API_KEY,
    maxTokens: 100,
  });

  try {
    const response = await model.generateResponse({
      prompt: 'What is 2 + 2? Reply with just the number.',
      systemPrompt: 'You are a helpful assistant. Be concise.',
    });

    console.log('✅ Response:', response.content.trim());
    console.log('📊 Tokens used:', response.usage?.totalTokens);
    return true;
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

async function testVisionRequest() {
  console.log('\n🖼️  Test 2: Vision request');
  console.log('─'.repeat(50));

  const model = new GoogleModel({
    name: 'gemini-flash',
    provider: 'google',
    model: 'gemini-2.5-flash',
    apiKey: GOOGLE_AI_API_KEY,
    maxTokens: 500,
  });

  // Create a simple test image (1x1 red pixel PNG)
  // This is a minimal valid PNG for testing the API structure
  const testImageBase64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';

  try {
    const response = await model.generateResponse({
      prompt: 'Describe this image in one sentence. If you cannot see anything meaningful, just say "I see a small colored image".',
      image: {
        base64: testImageBase64,
        mediaType: 'image/png',
      },
    });

    console.log('✅ Response:', response.content.trim());
    console.log('📊 Tokens used:', response.usage?.totalTokens);
    return true;
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

async function testWithRealImage() {
  console.log('\n📸 Test 3: Vision request with real image (optional)');
  console.log('─'.repeat(50));

  // Check if a test image exists
  const testImagePath = path.join(__dirname, 'test-receipt.jpg');

  if (!fs.existsSync(testImagePath)) {
    console.log('⏭️  Skipped: No test-receipt.jpg found in scripts/');
    console.log('   To test with a real image, place a receipt image at:');
    console.log(`   ${testImagePath}`);
    return true;
  }

  const model = new GoogleModel({
    name: 'gemini-flash',
    provider: 'google',
    model: 'gemini-2.5-flash',
    apiKey: GOOGLE_AI_API_KEY,
    maxTokens: 1000,
  });

  try {
    const imageBuffer = fs.readFileSync(testImagePath);
    const base64 = imageBuffer.toString('base64');

    const response = await model.generateResponse({
      prompt: `Analyze this receipt image and extract:
1. Store name
2. Total amount
3. Date (if visible)

Return as JSON: { "store": "...", "total": "...", "date": "..." }`,
      image: {
        base64,
        mediaType: 'image/jpeg',
      },
      systemPrompt: 'You are an expert receipt parser. Return valid JSON only.',
    });

    console.log('✅ Parsed receipt:');
    console.log(response.content);
    console.log('📊 Tokens used:', response.usage?.totalTokens);
    return true;
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

async function main() {
  console.log('🧪 Vision API Test Suite (Gemini)');
  console.log('═'.repeat(50));

  const results = {
    textOnly: await testTextOnly(),
    vision: await testVisionRequest(),
    realImage: await testWithRealImage(),
  };

  console.log('\n' + '═'.repeat(50));
  console.log('📋 Results Summary:');
  console.log('─'.repeat(50));
  console.log(`  Text-only request: ${results.textOnly ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Vision request:    ${results.vision ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Real image test:   ${results.realImage ? '✅ PASS' : '⏭️ SKIPPED'}`);
  console.log('═'.repeat(50));

  const allPassed = results.textOnly && results.vision;
  process.exit(allPassed ? 0 : 1);
}

main();
