import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOKEN_PATH = path.join(__dirname, '..', '..', 'data', 'oauth-token.json');

// Claude Code's public OAuth client (PKCE = public client, no secret needed)
const CLIENT_ID = '9d1c250a-e61b-44d9-88ed-5944d1962f5e';
const REDIRECT_URI = 'https://console.anthropic.com/oauth/code/callback';
const TOKEN_URL = 'https://console.anthropic.com/v1/oauth/token';

// Use claude.ai for Max/Pro subscription auth
const AUTH_BASE_URL = 'https://claude.ai/oauth/authorize';
const SCOPES = 'user:inference user:profile';

interface OAuthToken {
  access_token: string;
  refresh_token: string;
  expires_at: number; // unix timestamp ms
}

interface PendingAuth {
  state: string;
  codeVerifier: string;
  createdAt: number;
}

let pendingAuth: PendingAuth | null = null;
let cachedToken: OAuthToken | null = null;

// === PKCE Helpers ===

function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString('base64url');
}

function generateCodeChallenge(verifier: string): string {
  return crypto.createHash('sha256').update(verifier).digest('base64url');
}

function generateState(): string {
  return crypto.randomBytes(16).toString('hex');
}

// === Token Storage ===

function loadStoredToken(): OAuthToken | null {
  try {
    if (fs.existsSync(TOKEN_PATH)) {
      const raw = fs.readFileSync(TOKEN_PATH, 'utf-8');
      const token: OAuthToken = JSON.parse(raw);
      if (token.access_token && token.refresh_token) {
        cachedToken = token;
        return token;
      }
    }
  } catch {
    // ignore
  }
  return null;
}

function saveToken(token: OAuthToken): void {
  const dir = path.dirname(TOKEN_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(token, null, 2), 'utf-8');
  cachedToken = token;
}

function clearToken(): void {
  cachedToken = null;
  try {
    if (fs.existsSync(TOKEN_PATH)) {
      fs.unlinkSync(TOKEN_PATH);
    }
  } catch {
    // ignore
  }
}

// === OAuth Flow ===

/**
 * Step 1: Generate the authorization URL.
 * The user should open this URL in a browser to authorize.
 */
export function startOAuthFlow(): { authUrl: string; state: string } {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);
  const state = generateState();

  pendingAuth = { state, codeVerifier, createdAt: Date.now() };

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  const authUrl = `${AUTH_BASE_URL}?${params.toString()}`;
  return { authUrl, state };
}

/**
 * Step 2: Exchange the authorization code for tokens.
 * The user pastes the code from the callback URL.
 */
export async function exchangeCode(code: string, state: string): Promise<OAuthToken> {
  if (!pendingAuth) {
    throw new Error('No pending OAuth flow. Start the flow first via /api/auth/login');
  }

  if (pendingAuth.state !== state) {
    throw new Error('State mismatch - possible CSRF attack. Start the flow again.');
  }

  // Expire after 10 minutes
  if (Date.now() - pendingAuth.createdAt > 600_000) {
    pendingAuth = null;
    throw new Error('OAuth flow expired. Start the flow again.');
  }

  const body = {
    grant_type: 'authorization_code',
    code,
    state,
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    code_verifier: pendingAuth.codeVerifier,
  };

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    pendingAuth = null;
    throw new Error(`Token exchange failed (${response.status}): ${text}`);
  }

  const data = await response.json() as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };

  pendingAuth = null;

  const token: OAuthToken = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + (data.expires_in * 1000),
  };

  saveToken(token);
  console.log('[OAuth] Token obtained and saved successfully');
  return token;
}

/**
 * Refresh the access token using the refresh token.
 */
async function refreshToken(token: OAuthToken): Promise<OAuthToken> {
  const body = {
    grant_type: 'refresh_token',
    refresh_token: token.refresh_token,
    client_id: CLIENT_ID,
  };

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error(`[OAuth] Token refresh failed (${response.status}): ${text}`);
    clearToken();
    throw new Error('Token refresh failed. Please re-authenticate via /api/auth/login');
  }

  const data = await response.json() as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };

  const newToken: OAuthToken = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + (data.expires_in * 1000),
  };

  saveToken(newToken);
  console.log('[OAuth] Token refreshed successfully');
  return newToken;
}

/**
 * Get a valid access token, refreshing if needed.
 * Returns null if no token is available.
 */
export async function getAccessToken(): Promise<string | null> {
  let token = cachedToken || loadStoredToken();
  if (!token) return null;

  // Refresh if expiring within 5 minutes
  const BUFFER_MS = 5 * 60 * 1000;
  if (Date.now() + BUFFER_MS >= token.expires_at) {
    try {
      token = await refreshToken(token);
    } catch {
      return null;
    }
  }

  return token.access_token;
}

/**
 * Check if OAuth is configured (has a stored token).
 */
export function isOAuthConfigured(): boolean {
  const token = cachedToken || loadStoredToken();
  return !!token;
}

/**
 * Get the current OAuth status for the UI.
 */
export function getOAuthStatus(): { authenticated: boolean; expiresAt: number | null } {
  const token = cachedToken || loadStoredToken();
  if (!token) return { authenticated: false, expiresAt: null };
  return { authenticated: true, expiresAt: token.expires_at };
}

/**
 * Logout: clear stored token.
 */
export function logout(): void {
  clearToken();
  console.log('[OAuth] Token cleared');
}

// Load token on module init
loadStoredToken();
