import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Test Webhook Logger Endpoint
 * 
 * This endpoint simply logs all request details and returns 200 OK.
 * Use this to debug webhook payloads without any processing.
 * 
 * Endpoint: POST /api/webhooks/test-logger
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧪 TEST WEBHOOK LOGGER - Request Received');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  // Log timestamp
  console.log('⏰ TIMESTAMP:');
  console.log(new Date().toISOString());
  console.log('');

  // Log HTTP method
  console.log('📍 HTTP METHOD:');
  console.log(req.method);
  console.log('');

  // Log URL
  console.log('🔗 URL:');
  console.log(req.url);
  console.log('');

  // Log headers
  console.log('📨 HEADERS:');
  console.log(JSON.stringify(req.headers, null, 2));
  console.log('');

  // Log query parameters
  console.log('🔍 QUERY PARAMETERS:');
  console.log(JSON.stringify(req.query, null, 2));
  console.log('');

  // Log request body
  console.log('📦 REQUEST BODY:');
  console.log(JSON.stringify(req.body, null, 2));
  console.log('');

  // If body has message.data (Pub/Sub format), decode it
  if (req.body?.message?.data) {
    try {
      const decodedData = Buffer.from(req.body.message.data, 'base64').toString('utf-8');
      console.log('🔓 DECODED MESSAGE DATA (base64 → utf-8):');
      console.log(decodedData);
      console.log('');

      // Try to parse as JSON
      try {
        const parsedData = JSON.parse(decodedData);
        console.log('📋 PARSED MESSAGE DATA (JSON):');
        console.log(JSON.stringify(parsedData, null, 2));
        console.log('');
      } catch {
        console.log('⚠️ Message data is not valid JSON (plain text)');
        console.log('');
      }
    } catch (decodeError) {
      console.error('❌ Failed to decode message data:', decodeError);
      console.log('');
    }
  }

  // Log content type
  console.log('📄 CONTENT-TYPE:');
  console.log(req.headers['content-type'] || 'Not specified');
  console.log('');

  // Log content length
  console.log('📏 CONTENT-LENGTH:');
  console.log(req.headers['content-length'] || 'Not specified');
  console.log('');

  // Log user agent
  console.log('🤖 USER-AGENT:');
  console.log(req.headers['user-agent'] || 'Not specified');
  console.log('');

  // Log IP address
  console.log('🌐 IP ADDRESS:');
  const ip = req.headers['x-forwarded-for'] || 
             req.headers['x-real-ip'] || 
             req.socket.remoteAddress || 
             'Unknown';
  console.log(ip);
  console.log('');

  // Log Vercel-specific headers
  console.log('⚡ VERCEL HEADERS:');
  const vercelHeaders = {
    'x-vercel-id': req.headers['x-vercel-id'],
    'x-vercel-deployment-url': req.headers['x-vercel-deployment-url'],
    'x-vercel-forwarded-for': req.headers['x-vercel-forwarded-for'],
  };
  console.log(JSON.stringify(vercelHeaders, null, 2));
  console.log('');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Request logged successfully');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  // Return success response
  return res.status(200).json({
    success: true,
    message: 'Request logged successfully',
    timestamp: new Date().toISOString(),
    method: req.method,
    receivedData: {
      hasBody: !!req.body,
      hasMessageData: !!req.body?.message?.data,
      bodyKeys: req.body ? Object.keys(req.body) : [],
    }
  });
}

