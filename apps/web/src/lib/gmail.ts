import { google } from 'googleapis';
import { GmailMessage, GmailListResponse, OAuthTokens } from '@finance-buddy/shared';

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
  
  return data as GmailMessage;
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
  if (!payload) return null;
  
  // If it's a simple text message
  if (payload.mimeType === 'text/plain' && payload.body?.data) {
    return Buffer.from(payload.body.data, 'base64').toString('utf-8');
  }
  
  // If it's multipart, find the text/plain part
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        return Buffer.from(part.body.data, 'base64').toString('utf-8');
      }
      
      // Recursively search in nested parts
      const nestedText = extractPlainTextBody(part);
      if (nestedText) return nestedText;
    }
  }
  
  return null;
}
