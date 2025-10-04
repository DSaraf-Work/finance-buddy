import { google } from 'googleapis';
import { GmailMessage, GmailListResponse, OAuthTokens } from '@/types';

const GMAIL_CLIENT_ID = process.env.GMAIL_CLIENT_ID!;
const GMAIL_CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET!;
const REDIRECT_URI = `${process.env.NEXTAUTH_URL}/api/gmail/callback`;

if (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET) {
  throw new Error('Missing Gmail OAuth credentials');
}

export function createOAuth2Client() {
  return new google.auth.OAuth2(
    GMAIL_CLIENT_ID,
    GMAIL_CLIENT_SECRET,
    REDIRECT_URI
  );
}

export function getAuthUrl(state: string) {
  const oauth2Client = createOAuth2Client();
  
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ],
    state,
    prompt: 'consent', // Force consent to get refresh token
    include_granted_scopes: true,
  });
}

export async function exchangeCodeForTokens(code: string): Promise<OAuthTokens> {
  const oauth2Client = createOAuth2Client();
  
  const { tokens } = await oauth2Client.getToken(code);
  return tokens as OAuthTokens;
}

export async function refreshAccessToken(refreshToken: string): Promise<OAuthTokens> {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  
  const { credentials } = await oauth2Client.refreshAccessToken();
  return credentials as OAuthTokens;
}

export async function revokeToken(token: string): Promise<void> {
  const oauth2Client = createOAuth2Client();
  await oauth2Client.revokeToken(token);
}

export function createGmailClient(accessToken: string) {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });
  
  return google.gmail({ version: 'v1', auth: oauth2Client });
}

export async function getUserInfo(accessToken: string) {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });
  
  const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
  const { data } = await oauth2.userinfo.get();
  
  return data;
}

export async function listMessages(
  accessToken: string,
  options: {
    q?: string;
    maxResults?: number;
    pageToken?: string;
  } = {}
): Promise<GmailListResponse> {
  const gmail = createGmailClient(accessToken);
  
  const { data } = await gmail.users.messages.list({
    userId: 'me',
    q: options.q,
    maxResults: options.maxResults,
    pageToken: options.pageToken,
  });
  
  return data as GmailListResponse;
}

export async function getMessage(
  accessToken: string,
  messageId: string
): Promise<GmailMessage> {
  const gmail = createGmailClient(accessToken);

  const { data } = await gmail.users.messages.get({
    userId: 'me',
    id: messageId,
    format: 'full',
  });

  console.log("📧 Gmail API Response Analysis:", JSON.stringify(data));
  console.log("=".repeat(80));
  console.log("Message ID:", messageId);
  console.log("Payload MIME Type:", data.payload?.mimeType);
  console.log("Has Body Data:", !!data.payload?.body?.data);
  console.log("Body Size:", data.payload?.body?.size || 0);
  console.log("Has Parts:", !!data.payload?.parts);
  console.log("Parts Count:", data.payload?.parts?.length || 0);

  if (data.payload?.parts) {
    console.log("Parts Analysis:");
    data.payload.parts.forEach((part, index) => {
      console.log(`  Part ${index}:`, {
        mimeType: part.mimeType,
        hasBodyData: !!part.body?.data,
        bodySize: part.body?.size || 0,
        hasNestedParts: !!part.parts,
        nestedPartsCount: part.parts?.length || 0
      });

      // Check nested parts
      if (part.parts) {
        part.parts.forEach((nestedPart, nestedIndex) => {
          console.log(`    Nested Part ${nestedIndex}:`, {
            mimeType: nestedPart.mimeType,
            hasBodyData: !!nestedPart.body?.data,
            bodySize: nestedPart.body?.size || 0
          });
        });
      }
    });
  }

  console.log("Snippet:", data.snippet);
  console.log("=".repeat(80));

  return data as GmailMessage;
}

export async function getMessageRaw(
  accessToken: string,
  messageId: string
): Promise<any> {
  const gmail = createGmailClient(accessToken);

  console.log('📧 Fetching RAW message from Gmail API...');
  const { data } = await gmail.users.messages.get({
    userId: 'me',
    id: messageId,
    format: 'raw',
  });

  console.log('📧 Raw message data:', {
    messageId: data.id,
    threadId: data.threadId,
    hasRaw: !!data.raw,
    rawLength: data.raw?.length || 0
  });

  if (data.raw) {
    // Decode the raw email content
    const rawEmail = Buffer.from(data.raw, 'base64').toString('utf-8');
    console.log('📄 Raw email preview:', rawEmail.substring(0, 500) + '...');
    return {
      ...data,
      decodedRaw: rawEmail
    };
  }

  return data;
}

export function parseRawEmailContent(rawEmail: string): {
  subject?: string;
  from?: string;
  to?: string;
  date?: string;
  plainTextBody?: string;
  htmlBody?: string;
  allBodies: string[];
} {
  console.log('🔍 Parsing raw email content...');

  const result: {
    subject?: string;
    from?: string;
    to?: string;
    date?: string;
    plainTextBody?: string;
    htmlBody?: string;
    allBodies: string[];
  } = {
    allBodies: []
  };

  // Extract headers
  const headerMatch = rawEmail.match(/^([\s\S]*?)\r?\n\r?\n([\s\S]*)$/);
  if (!headerMatch) {
    console.log('❌ Could not separate headers from body');
    return result;
  }

  const [, headers, body] = headerMatch;

  // Parse headers
  const subjectMatch = headers.match(/^Subject:\s*(.*)$/m);
  if (subjectMatch) result.subject = subjectMatch[1].trim();

  const fromMatch = headers.match(/^From:\s*(.*)$/m);
  if (fromMatch) result.from = fromMatch[1].trim();

  const toMatch = headers.match(/^To:\s*(.*)$/m);
  if (toMatch) result.to = toMatch[1].trim();

  const dateMatch = headers.match(/^Date:\s*(.*)$/m);
  if (dateMatch) result.date = dateMatch[1].trim();

  console.log('📧 Parsed headers:', {
    subject: result.subject,
    from: result.from,
    hasBody: body.length > 0
  });

  // Parse MIME content
  const contentTypeMatch = headers.match(/^Content-Type:\s*([^;\r\n]+)/m);
  const contentType = contentTypeMatch ? contentTypeMatch[1].trim().toLowerCase() : 'text/plain';

  console.log('📧 Content-Type:', contentType);

  if (contentType.includes('multipart')) {
    // Extract boundary
    const boundaryMatch = headers.match(/boundary[=:]\s*["']?([^"'\r\n;]+)["']?/i);
    if (boundaryMatch) {
      const boundary = boundaryMatch[1];
      console.log('🔍 Found boundary:', boundary);

      // Split by boundary
      const parts = body.split(new RegExp(`--${boundary.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g'));

      console.log(`🔍 Found ${parts.length} MIME parts`);

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i].trim();

        console.log(`📧 Analyzing part ${i} (length: ${part.length}):`, part.substring(0, 200) + '...');

        if (!part || part === '--' || part === '') {
          console.log(`⚠️ Skipping empty part ${i}`);
          continue;
        }

        console.log(`📧 Processing part ${i} (length: ${part.length}):`, part.substring(0, 100) + '...');

        // Separate part headers from part body
        const partMatch = part.match(/^([\s\S]*?)\r?\n\r?\n([\s\S]*)$/);
        if (!partMatch) {
          console.log(`⚠️ Part ${i} has no header/body separation, treating as body-only`);
          console.log(`📄 Part ${i} raw content:`, part.substring(0, 500) + '...');

          // If no header/body separation, treat the whole part as body
          const partHeaders = '';
          const partBody = part;

          // Process as plain text - this might contain the actual transaction content!
          result.allBodies.push(`[PART${i}] ${partBody}`);
          console.log(`✅ Added part ${i} as body-only content:`, partBody.substring(0, 200) + '...');

          // Also try to extract as plain text if it looks like transaction content
          if (partBody.includes('debited') || partBody.includes('credited') || partBody.includes('INR') || partBody.includes('Rs.')) {
            console.log(`🎯 Part ${i} contains transaction keywords - using as plain text body!`);
            result.plainTextBody = partBody;
          }

          continue;
        }

        const [, partHeaders, partBody] = partMatch;

        // Get part content type
        const partContentTypeMatch = partHeaders.match(/^Content-Type:\s*([^;\r\n]+)/m);
        const partContentType = partContentTypeMatch ? partContentTypeMatch[1].trim().toLowerCase() : 'text/plain';

        // Check for content transfer encoding
        const encodingMatch = partHeaders.match(/^Content-Transfer-Encoding:\s*(.*)$/m);
        const encoding = encodingMatch ? encodingMatch[1].trim().toLowerCase() : '';

        console.log(`📧 Part ${i} details:`, {
          contentType: partContentType,
          encoding: encoding,
          bodyLength: partBody.length
        });

        let decodedBody = partBody;

        // Decode if needed
        if (encoding === 'base64') {
          try {
            decodedBody = Buffer.from(partBody.replace(/\s/g, ''), 'base64').toString('utf-8');
            console.log(`✅ Decoded base64 content for part ${i}`);
          } catch (error) {
            console.log(`❌ Failed to decode base64 for part ${i}:`, error);
          }
        } else if (encoding === 'quoted-printable') {
          // Basic quoted-printable decoding
          decodedBody = partBody
            .replace(/=\r?\n/g, '')
            .replace(/=([0-9A-F]{2})/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)));
          console.log(`✅ Decoded quoted-printable content for part ${i}`);
        }

        // Store content based on type
        if (partContentType.includes('text/plain')) {
          result.plainTextBody = decodedBody;
          result.allBodies.push(`[PLAIN] ${decodedBody}`);
          console.log(`✅ Found plain text body in part ${i}:`, decodedBody.substring(0, 200) + '...');
        } else if (partContentType.includes('text/html')) {
          result.htmlBody = decodedBody;
          result.allBodies.push(`[HTML] ${decodedBody}`);
          console.log(`✅ Found HTML body in part ${i}:`, decodedBody.substring(0, 200) + '...');
        } else {
          // Store any other text content
          result.allBodies.push(`[${partContentType.toUpperCase()}] ${decodedBody}`);
          console.log(`✅ Found other content in part ${i}:`, decodedBody.substring(0, 200) + '...');
        }
      }
    }
  } else {
    // Simple single-part email
    console.log('📧 Processing single-part email');

    // Check for content transfer encoding
    const encodingMatch = headers.match(/^Content-Transfer-Encoding:\s*(.*)$/m);
    const encoding = encodingMatch ? encodingMatch[1].trim().toLowerCase() : '';

    let decodedBody = body;

    if (encoding === 'base64') {
      try {
        decodedBody = Buffer.from(body.replace(/\s/g, ''), 'base64').toString('utf-8');
        console.log('✅ Decoded base64 content');
      } catch (error) {
        console.log('❌ Failed to decode base64:', error);
      }
    }

    if (contentType.includes('text/plain')) {
      result.plainTextBody = decodedBody;
    } else if (contentType.includes('text/html')) {
      result.htmlBody = decodedBody;
    }

    result.allBodies.push(decodedBody);
  }

  console.log('✅ Raw email parsing complete:', {
    hasPlainText: !!result.plainTextBody,
    hasHtml: !!result.htmlBody,
    totalBodies: result.allBodies.length,
    plainTextLength: result.plainTextBody?.length || 0,
    htmlLength: result.htmlBody?.length || 0
  });

  return result;
}

// Content validation functions
export function isContentTruncated(content: string | null): boolean {
  if (!content) return true;

  // Check if content is too short (likely truncated)
  if (content.length < 200) return true;

  // Check if content only contains disclaimer
  const disclaimerKeywords = [
    'Email disclaimer',
    'please note',
    'do not reply',
    'sender email ID is not monitored',
    'customercare@dcbbank.com'
  ];

  const hasOnlyDisclaimer = disclaimerKeywords.some(keyword =>
    content.toLowerCase().includes(keyword.toLowerCase())
  ) && content.length < 500;

  return hasOnlyDisclaimer;
}

export function hasTransactionContent(content: string | null): boolean {
  if (!content) return false;

  const transactionKeywords = [
    'debited',
    'credited',
    'INR',
    'Rs.',
    'account number',
    'available bal',
    'transaction',
    'fund transfer',
    'payment',
    'withdrawal',
    'deposit'
  ];

  return transactionKeywords.some(keyword =>
    content.toLowerCase().includes(keyword.toLowerCase())
  );
}

export function validateEmailContent(content: string | null): {
  isValid: boolean;
  isTruncated: boolean;
  hasTransaction: boolean;
  contentLength: number;
  issues: string[];
} {
  const issues: string[] = [];
  const contentLength = content?.length || 0;
  const isTruncated = isContentTruncated(content);
  const hasTransaction = hasTransactionContent(content);

  if (!content) {
    issues.push('No content found');
  }

  if (isTruncated) {
    issues.push('Content appears to be truncated');
  }

  if (!hasTransaction) {
    issues.push('No transaction-related content detected');
  }

  if (contentLength < 100) {
    issues.push('Content too short');
  }

  const isValid = !isTruncated && hasTransaction && contentLength > 100;

  return {
    isValid,
    isTruncated,
    hasTransaction,
    contentLength,
    issues
  };
}

// Enhanced Gmail message fetcher with multiple strategies
export async function getEnhancedMessage(
  accessToken: string,
  messageId: string
): Promise<{
  message: any;
  content: string | null;
  strategy: string;
  validation: ReturnType<typeof validateEmailContent>;
}> {
  console.log(`🔧 Enhanced message fetch for ${messageId}`);

  const strategies = [
    'structured_full',
    'raw_parsing',
    'structured_minimal',
    'alternative_fetch'
  ];

  for (const strategy of strategies) {
    try {
      console.log(`📧 Trying strategy: ${strategy}`);

      let message: any = null;
      let content: string | null = null;

      switch (strategy) {
        case 'structured_full':
          message = await getMessage(accessToken, messageId);
          content = extractPlainTextBody(message.payload);
          break;

        case 'raw_parsing':
          const rawMessage = await getMessageRaw(accessToken, messageId);
          message = rawMessage;
          if (rawMessage.decodedRaw) {
            const parsed = parseRawEmailContent(rawMessage.decodedRaw);
            content = parsed.plainTextBody || parsed.htmlBody || parsed.allBodies.join('\n\n');
          }
          break;

        case 'structured_minimal':
          message = await getMessageWithFormat(accessToken, messageId, 'minimal');
          content = extractPlainTextBody(message.payload);
          break;

        case 'alternative_fetch':
          message = await getMessageWithAlternativeMethod(accessToken, messageId);
          content = extractPlainTextBody(message.payload);
          break;
      }

      const validation = validateEmailContent(content);

      console.log(`📊 Strategy ${strategy} results:`, {
        contentLength: validation.contentLength,
        isValid: validation.isValid,
        hasTransaction: validation.hasTransaction,
        issues: validation.issues
      });

      // If we found valid transaction content, return it
      if (validation.isValid) {
        console.log(`✅ Strategy ${strategy} succeeded!`);
        return { message, content, strategy, validation };
      }

      // If this strategy found some content but not complete, continue to next strategy
      if (content && validation.contentLength > 0) {
        console.log(`⚠️ Strategy ${strategy} found partial content, trying next strategy`);
      }

    } catch (error) {
      console.error(`❌ Strategy ${strategy} failed:`, error);
    }
  }

  // If all strategies failed, return the best attempt
  console.log(`⚠️ All strategies failed, returning fallback`);
  const fallbackMessage = await getMessage(accessToken, messageId);
  const fallbackContent = extractPlainTextBody(fallbackMessage.payload);
  const fallbackValidation = validateEmailContent(fallbackContent);

  return {
    message: fallbackMessage,
    content: fallbackContent,
    strategy: 'fallback',
    validation: fallbackValidation
  };
}

// Alternative Gmail API methods
export async function getMessageWithFormat(
  accessToken: string,
  messageId: string,
  format: 'minimal' | 'full' | 'raw' | 'metadata' = 'full'
): Promise<any> {
  const gmail = createGmailClient(accessToken);

  console.log(`📧 Fetching message with format: ${format}`);

  const { data } = await gmail.users.messages.get({
    userId: 'me',
    id: messageId,
    format: format,
  });

  console.log(`📧 Message fetched with format ${format}:`, {
    messageId: data.id,
    payloadMimeType: data.payload?.mimeType,
    hasBody: !!data.payload?.body?.data,
    partsCount: data.payload?.parts?.length || 0
  });

  return data;
}

export async function getMessageWithAlternativeMethod(
  accessToken: string,
  messageId: string
): Promise<any> {
  const gmail = createGmailClient(accessToken);

  console.log(`📧 Fetching message with alternative method`);

  // Try fetching with different parameters
  const { data } = await gmail.users.messages.get({
    userId: 'me',
    id: messageId,
    format: 'full',
    // Add additional parameters that might help get complete content
  });

  console.log(`📧 Alternative method results:`, {
    messageId: data.id,
    payloadMimeType: data.payload?.mimeType,
    hasBody: !!data.payload?.body?.data,
    partsCount: data.payload?.parts?.length || 0,
    snippet: data.snippet
  });

  return data;
}

// Enhanced MIME parser with better content extraction
export function parseRawEmailContentEnhanced(rawEmail: string): {
  subject?: string;
  from?: string;
  to?: string;
  date?: string;
  plainTextBody?: string;
  htmlBody?: string;
  allBodies: string[];
  transactionContent?: string;
  validation: ReturnType<typeof validateEmailContent>;
} {
  console.log('🔧 Enhanced raw email parsing...');

  const result: {
    subject?: string;
    from?: string;
    to?: string;
    date?: string;
    plainTextBody?: string;
    htmlBody?: string;
    allBodies: string[];
    transactionContent?: string;
    validation: ReturnType<typeof validateEmailContent>;
  } = {
    allBodies: [],
    validation: validateEmailContent(null)
  };

  // First try the standard parsing
  const standardParsed = parseRawEmailContent(rawEmail);
  Object.assign(result, standardParsed);

  // Enhanced content extraction strategies
  const enhancedStrategies = [
    'extract_from_html',
    'extract_from_text_blocks',
    'extract_from_quoted_printable',
    'extract_from_base64_blocks'
  ];

  for (const strategy of enhancedStrategies) {
    try {
      console.log(`🔍 Trying enhanced strategy: ${strategy}`);

      let extractedContent: string | null = null;

      switch (strategy) {
        case 'extract_from_html':
          extractedContent = extractTransactionFromHtml(rawEmail);
          break;

        case 'extract_from_text_blocks':
          extractedContent = extractTransactionFromTextBlocks(rawEmail);
          break;

        case 'extract_from_quoted_printable':
          extractedContent = extractFromQuotedPrintable(rawEmail);
          break;

        case 'extract_from_base64_blocks':
          extractedContent = extractFromBase64Blocks(rawEmail);
          break;
      }

      if (extractedContent) {
        const validation = validateEmailContent(extractedContent);
        console.log(`📊 Strategy ${strategy} results:`, {
          contentLength: validation.contentLength,
          hasTransaction: validation.hasTransaction,
          isValid: validation.isValid
        });

        if (validation.hasTransaction) {
          result.transactionContent = extractedContent;
          result.allBodies.push(`[${strategy.toUpperCase()}] ${extractedContent}`);

          if (validation.isValid) {
            result.plainTextBody = extractedContent;
            result.validation = validation;
            console.log(`✅ Enhanced strategy ${strategy} found valid transaction content!`);
            break;
          }
        }
      }

    } catch (error) {
      console.error(`❌ Enhanced strategy ${strategy} failed:`, error);
    }
  }

  // Final validation
  const bestContent = result.transactionContent || result.plainTextBody || result.htmlBody || null;
  result.validation = validateEmailContent(bestContent);

  console.log('✅ Enhanced raw email parsing complete:', {
    hasPlainText: !!result.plainTextBody,
    hasHtml: !!result.htmlBody,
    hasTransaction: !!result.transactionContent,
    totalBodies: result.allBodies.length,
    isValid: result.validation.isValid
  });

  return result;
}

// Enhanced content extraction helper functions
function extractTransactionFromHtml(rawEmail: string): string | null {
  console.log('🔍 Extracting transaction from HTML content...');

  // Look for HTML content that might contain transaction details
  const htmlMatches = rawEmail.match(/<[^>]*>([^<]*(?:debited|credited|INR|Rs\.|account)[^<]*)<\/[^>]*>/gi);

  if (htmlMatches) {
    const transactionTexts = htmlMatches
      .map(match => match.replace(/<[^>]*>/g, '').trim())
      .filter(text => text.length > 10 && hasTransactionContent(text));

    if (transactionTexts.length > 0) {
      const result = transactionTexts.join('\n');
      console.log('✅ Found transaction content in HTML:', result.substring(0, 200) + '...');
      return result;
    }
  }

  return null;
}

function extractTransactionFromTextBlocks(rawEmail: string): string | null {
  console.log('🔍 Extracting transaction from text blocks...');

  // Split email into blocks and look for transaction content
  const blocks = rawEmail.split(/\n\s*\n/);

  for (const block of blocks) {
    const cleanBlock = block.trim();
    if (cleanBlock.length > 50 && hasTransactionContent(cleanBlock)) {
      // Remove email headers and technical content
      const cleanedContent = cleanBlock
        .replace(/^[A-Za-z-]+:\s*.*/gm, '') // Remove headers
        .replace(/Content-Type:.*$/gm, '') // Remove content type
        .replace(/Content-Transfer-Encoding:.*$/gm, '') // Remove encoding
        .replace(/boundary=.*$/gm, '') // Remove boundary
        .trim();

      if (cleanedContent.length > 30 && hasTransactionContent(cleanedContent)) {
        console.log('✅ Found transaction content in text block:', cleanedContent.substring(0, 200) + '...');
        return cleanedContent;
      }
    }
  }

  return null;
}

function extractFromQuotedPrintable(rawEmail: string): string | null {
  console.log('🔍 Extracting from quoted-printable content...');

  // Look for quoted-printable encoded content
  const qpMatches = rawEmail.match(/Content-Transfer-Encoding:\s*quoted-printable[\s\S]*?(?=\n--|\n\n|\nContent-|$)/gi);

  if (qpMatches) {
    for (const match of qpMatches) {
      try {
        // Extract the content part (after headers)
        const contentMatch = match.match(/\n\n([\s\S]*)/);
        if (contentMatch) {
          const qpContent = contentMatch[1];

          // Decode quoted-printable
          const decoded = qpContent
            .replace(/=\r?\n/g, '') // Remove soft line breaks
            .replace(/=([0-9A-F]{2})/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)));

          if (hasTransactionContent(decoded)) {
            console.log('✅ Found transaction content in quoted-printable:', decoded.substring(0, 200) + '...');
            return decoded;
          }
        }
      } catch (error) {
        console.error('❌ Error decoding quoted-printable:', error);
      }
    }
  }

  return null;
}

function extractFromBase64Blocks(rawEmail: string): string | null {
  console.log('🔍 Extracting from base64 blocks...');

  // Look for base64 encoded content blocks
  const base64Matches = rawEmail.match(/Content-Transfer-Encoding:\s*base64[\s\S]*?(?=\n--|\n\n|\nContent-|$)/gi);

  if (base64Matches) {
    for (const match of base64Matches) {
      try {
        // Extract the content part (after headers)
        const contentMatch = match.match(/\n\n([\s\S]*)/);
        if (contentMatch) {
          const base64Content = contentMatch[1].replace(/\s/g, '');

          // Decode base64
          const decoded = Buffer.from(base64Content, 'base64').toString('utf-8');

          if (hasTransactionContent(decoded)) {
            console.log('✅ Found transaction content in base64:', decoded.substring(0, 200) + '...');
            return decoded;
          }
        }
      } catch (error) {
        console.error('❌ Error decoding base64:', error);
      }
    }
  }

  return null;
}

export function extractEmailFromHeaders(headers: any[]): string | null {
  const fromHeader = headers.find(h => h.name.toLowerCase() === 'from');
  if (!fromHeader) return null;
  
  // Extract email from "Name <email@domain.com>" format
  const match = fromHeader.value.match(/<([^>]+)>/);
  return match ? match[1] : fromHeader.value;
}

export function extractSubjectFromHeaders(headers: any[]): string | null {
  const subjectHeader = headers.find(h => h.name.toLowerCase() === 'subject');
  return subjectHeader?.value || null;
}

export function extractToAddressesFromHeaders(headers: any[]): string[] {
  const toHeader = headers.find(h => h.name.toLowerCase() === 'to');
  if (!toHeader) return [];
  
  // Simple extraction - could be enhanced for complex cases
  return toHeader.value.split(',').map((email: string) => {
    const match = email.trim().match(/<([^>]+)>/);
    return match ? match[1] : email.trim();
  });
}

export function extractPlainTextBody(payload: any): string | null {
  console.log("🔍 Extracting plain text body...");

  if (!payload) {
    console.log("❌ No payload provided");
    return null;
  }

  console.log("📧 Payload analysis:", {
    mimeType: payload.mimeType,
    hasBodyData: !!payload.body?.data,
    bodySize: payload.body?.size || 0,
    hasParts: !!payload.parts,
    partsCount: payload.parts?.length || 0
  });

  // If it's a simple text message
  if (payload.mimeType === 'text/plain' && payload.body?.data) {
    console.log("✅ Found direct text/plain content");
    const content = Buffer.from(payload.body.data, 'base64').toString('utf-8');
    console.log("📄 Content preview:", content.substring(0, 200) + "...");
    return content;
  }

  // If it's HTML, decode and parse it properly
  if (payload.mimeType === 'text/html' && payload.body?.data) {
    console.log("⚠️ Found HTML content, decoding and parsing...");
    const htmlContent = Buffer.from(payload.body.data, 'base64').toString('utf-8');
    console.log("📄 HTML content preview:", htmlContent.substring(0, 200) + "...");

    // Parse HTML to extract clean text content
    const cleanText = parseHTMLToCleanText(htmlContent);
    console.log("📄 Parsed clean text preview:", cleanText?.substring(0, 200) + "...");

    return cleanText || htmlContent; // Return clean text or fallback to HTML
  }

  // If it's multipart, find the text/plain part
  if (payload.parts) {
    console.log(`🔍 Searching through ${payload.parts.length} parts...`);

    for (let i = 0; i < payload.parts.length; i++) {
      const part = payload.parts[i];
      console.log(`📧 Part ${i}:`, {
        mimeType: part.mimeType,
        hasBodyData: !!part.body?.data,
        bodySize: part.body?.size || 0,
        hasNestedParts: !!part.parts
      });

      if (part.mimeType === 'text/plain' && part.body?.data) {
        console.log(`✅ Found text/plain in part ${i}`);
        const content = Buffer.from(part.body.data, 'base64').toString('utf-8');
        console.log("📄 Content preview:", content.substring(0, 200) + "...");
        return content;
      }

      // Recursively search in nested parts
      const nestedText = extractPlainTextBody(part);
      if (nestedText) {
        console.log(`✅ Found content in nested part ${i}`);
        return nestedText;
      }
    }

    // If no text/plain found, try HTML as fallback
    for (let i = 0; i < payload.parts.length; i++) {
      const part = payload.parts[i];
      if (part.mimeType === 'text/html' && part.body?.data) {
        console.log(`⚠️ Using HTML fallback from part ${i}`);
        const htmlContent = Buffer.from(part.body.data, 'base64').toString('utf-8');
        console.log("📄 HTML content preview:", htmlContent.substring(0, 200) + "...");

        // Parse HTML to extract clean text content
        const cleanText = parseHTMLToCleanText(htmlContent);
        console.log("📄 Parsed clean text preview:", cleanText?.substring(0, 200) + "...");

        return cleanText || htmlContent; // Return clean text or fallback to HTML
      }
    }
  }

  console.log("❌ No extractable content found");
  return null;
}

// Enhanced HTML parsing to extract clean text content
export function parseHTMLToCleanText(htmlContent: string): string | null {
  console.log('🔧 Parsing HTML to clean text...');

  if (!htmlContent || htmlContent.trim().length === 0) {
    return null;
  }

  try {
    // Step 1: Decode HTML entities
    let cleanText = htmlContent
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'");

    // Step 2: Remove HTML tags but preserve line breaks
    cleanText = cleanText
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<\/h[1-6]>/gi, '\n\n')
      .replace(/<[^>]*>/g, ''); // Remove all other HTML tags

    // Step 3: Clean up whitespace and formatting
    cleanText = cleanText
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\n\s*\n\s*\n/g, '\n\n') // Remove excessive line breaks
      .replace(/[ \t]+/g, ' ') // Normalize spaces
      .replace(/^\s+|\s+$/gm, '') // Trim each line
      .trim();

    // Step 4: Validate the extracted content
    if (cleanText.length < 50) {
      console.log('⚠️ Extracted text too short, might be incomplete');
      return null;
    }

    console.log('✅ HTML parsing successful:', {
      originalLength: htmlContent.length,
      cleanTextLength: cleanText.length,
      hasTransactionContent: hasTransactionContent(cleanText)
    });

    return cleanText;

  } catch (error) {
    console.error('❌ HTML parsing failed:', error);
    return null;
  }
}

// Enhanced Gmail API methods to fetch complete email content without limits
export async function getCompleteMessageContent(
  accessToken: string,
  messageId: string
): Promise<{
  content: string | null;
  method: string;
  success: boolean;
  details: any;
}> {
  console.log(`🔧 Fetching complete message content for ${messageId}`);

  const methods = [
    'raw_full_decode',
    'attachments_method'
  ];

  for (const method of methods) {
    try {
      console.log(`📧 Trying method: ${method}`);

      let result = null;

      switch (method) {
        case 'raw_full_decode':
          result = await fetchViaRawFullDecode(accessToken, messageId);
          break;

        case 'attachments_method':
          result = await fetchViaAttachmentsAPI(accessToken, messageId);
          break;
      }

      if (result && result.content && result.content.length > 500) {
        console.log(`✅ Method ${method} succeeded with ${result.content.length} characters`);
        return {
          content: result.content,
          method: method,
          success: true,
          details: result.details || {}
        };
      }

    } catch (error) {
      console.error(`❌ Method ${method} failed:`, error);
    }
  }

  return {
    content: null,
    method: 'none',
    success: false,
    details: { error: 'All methods failed' }
  };
}

// Method 1: Fetch via Attachments API (treats email body as attachment)
async function fetchViaAttachmentsAPI(accessToken: string, messageId: string): Promise<any> {
  console.log('📧 Trying attachments API method...');

  const gmail = createGmailClient(accessToken);

  // Get message with attachments
  const { data: message } = await gmail.users.messages.get({
    userId: 'me',
    id: messageId,
    format: 'full'
  });

  // Look for attachments that might contain the email body
  if (message.payload?.parts) {
    for (const part of message.payload.parts) {
      if (part.body?.attachmentId) {
        console.log('📎 Found attachment, fetching...');

        const { data: attachment } = await gmail.users.messages.attachments.get({
          userId: 'me',
          messageId: messageId,
          id: part.body.attachmentId
        });

        if (attachment.data) {
          const content = Buffer.from(attachment.data, 'base64').toString('utf-8');
          if (hasTransactionContent(content)) {
            return { content, details: { attachmentId: part.body.attachmentId } };
          }
        }
      }
    }
  }

  return null;
}

// Method 2: Enhanced Raw Full Decode with better parsing
async function fetchViaRawFullDecode(accessToken: string, messageId: string): Promise<any> {
  console.log('📧 Trying raw full decode method...');

  const gmail = createGmailClient(accessToken);

  // Get raw message
  const { data: rawMessage } = await gmail.users.messages.get({
    userId: 'me',
    id: messageId,
    format: 'raw'
  });

  if (rawMessage.raw) {
    const rawEmail = Buffer.from(rawMessage.raw, 'base64').toString('utf-8');

    // Enhanced parsing with multiple strategies
    const strategies = [
      () => extractFromMultipartAlternative(rawEmail),
      () => extractFromMultipartMixed(rawEmail),
      () => extractFromQuotedPrintableAdvanced(rawEmail),
      () => extractFromBase64Advanced(rawEmail),
      () => extractFromHTMLContent(rawEmail)
    ];

    for (const strategy of strategies) {
      try {
        const content = strategy();
        if (content && hasTransactionContent(content)) {
          return { content, details: { strategy: strategy.name } };
        }
      } catch (error) {
        console.error('Strategy failed:', error);
      }
    }
  }

  return null;
}

// Helper functions for enhanced raw parsing strategies
function extractFromMultipartAlternative(rawEmail: string): string | null {
  const match = rawEmail.match(/Content-Type:\s*multipart\/alternative[\s\S]*?boundary[=:]\s*["']?([^"'\r\n;]+)["']?[\s\S]*?\n\n([\s\S]*)/i);
  if (match) {
    const [, boundary, content] = match;
    const parts = content.split(new RegExp(`--${boundary.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g'));

    for (const part of parts) {
      if (part.includes('text/html') && part.includes('debited')) {
        const htmlMatch = part.match(/\n\n([\s\S]*)/);
        if (htmlMatch) {
          const decoded = Buffer.from(htmlMatch[1].replace(/\s/g, ''), 'base64').toString('utf-8');
          return parseHTMLToCleanText(decoded);
        }
      }
    }
  }
  return null;
}

function extractFromMultipartMixed(rawEmail: string): string | null {
  const match = rawEmail.match(/Content-Type:\s*multipart\/mixed[\s\S]*?boundary[=:]\s*["']?([^"'\r\n;]+)["']?[\s\S]*?\n\n([\s\S]*)/i);
  if (match) {
    const [, boundary, content] = match;
    const parts = content.split(new RegExp(`--${boundary.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g'));

    for (const part of parts) {
      if (part.includes('text/html') && part.includes('debited')) {
        const htmlMatch = part.match(/\n\n([\s\S]*)/);
        if (htmlMatch) {
          const decoded = Buffer.from(htmlMatch[1].replace(/\s/g, ''), 'base64').toString('utf-8');
          return parseHTMLToCleanText(decoded);
        }
      }
    }
  }
  return null;
}

function extractFromQuotedPrintableAdvanced(rawEmail: string): string | null {
  const qpMatches = rawEmail.match(/Content-Transfer-Encoding:\s*quoted-printable[\s\S]*?\n\n([\s\S]*?)(?=\n--|\n\nContent-|$)/gi);

  if (qpMatches) {
    for (const match of qpMatches) {
      const contentMatch = match.match(/\n\n([\s\S]*)/);
      if (contentMatch) {
        const decoded = contentMatch[1]
          .replace(/=\r?\n/g, '')
          .replace(/=([0-9A-F]{2})/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)));

        if (hasTransactionContent(decoded)) {
          return parseHTMLToCleanText(decoded) || decoded;
        }
      }
    }
  }
  return null;
}

function extractFromBase64Advanced(rawEmail: string): string | null {
  const base64Matches = rawEmail.match(/Content-Transfer-Encoding:\s*base64[\s\S]*?\n\n([\s\S]*?)(?=\n--|\n\nContent-|$)/gi);

  if (base64Matches) {
    for (const match of base64Matches) {
      const contentMatch = match.match(/\n\n([\s\S]*)/);
      if (contentMatch) {
        try {
          const decoded = Buffer.from(contentMatch[1].replace(/\s/g, ''), 'base64').toString('utf-8');
          if (hasTransactionContent(decoded)) {
            return parseHTMLToCleanText(decoded) || decoded;
          }
        } catch (error) {
          console.error('Base64 decode error:', error);
        }
      }
    }
  }
  return null;
}

function extractFromHTMLContent(rawEmail: string): string | null {
  const htmlMatches = rawEmail.match(/<html[\s\S]*?<\/html>/gi);

  if (htmlMatches) {
    for (const htmlContent of htmlMatches) {
      if (hasTransactionContent(htmlContent)) {
        return parseHTMLToCleanText(htmlContent);
      }
    }
  }
  return null;
}

// Method 3: Recursive Parts Fetching (fetch each part individually)
async function fetchViaRecursiveParts(accessToken: string, messageId: string): Promise<any> {
  console.log('📧 Trying recursive parts method...');

  const gmail = createGmailClient(accessToken);

  // Get message structure
  const { data: message } = await gmail.users.messages.get({
    userId: 'me',
    id: messageId,
    format: 'full'
  });

  // Recursively fetch all parts
  const allContent: string[] = [];

  async function fetchPartRecursively(part: any, depth = 0): Promise<void> {
    console.log(`${'  '.repeat(depth)}📧 Processing part at depth ${depth}:`, {
      mimeType: part.mimeType,
      hasBody: !!part.body?.data,
      bodySize: part.body?.size || 0,
      hasAttachment: !!part.body?.attachmentId
    });

    // If part has direct body data
    if (part.body?.data) {
      try {
        const content = Buffer.from(part.body.data, 'base64').toString('utf-8');
        allContent.push(content);
        console.log(`${'  '.repeat(depth)}✅ Extracted ${content.length} characters`);
      } catch (error) {
        console.error(`${'  '.repeat(depth)}❌ Failed to decode part:`, error);
      }
    }

    // If part has attachment, fetch it
    if (part.body?.attachmentId) {
      try {
        const { data: attachment } = await gmail.users.messages.attachments.get({
          userId: 'me',
          messageId: messageId,
          id: part.body.attachmentId
        });

        if (attachment.data) {
          const content = Buffer.from(attachment.data, 'base64').toString('utf-8');
          allContent.push(content);
          console.log(`${'  '.repeat(depth)}✅ Extracted attachment ${content.length} characters`);
        }
      } catch (error) {
        console.error(`${'  '.repeat(depth)}❌ Failed to fetch attachment:`, error);
      }
    }

    // Process nested parts
    if (part.parts) {
      for (const nestedPart of part.parts) {
        await fetchPartRecursively(nestedPart, depth + 1);
      }
    }
  }

  if (message.payload) {
    await fetchPartRecursively(message.payload);
  }

  // Combine all content and find the best one
  const combinedContent = allContent.join('\n\n');
  const bestContent = allContent.find(content => hasTransactionContent(content)) || combinedContent;

  if (bestContent && bestContent.length > 100) {
    return {
      content: bestContent,
      details: {
        totalParts: allContent.length,
        totalLength: combinedContent.length
      }
    };
  }

  return null;
}
