/**
 * BioDigital Human Content API & OAuth2 Client
 * Implements BioDigital OAuth2 v2 /token specification
 * Documentation: https://developer.biodigital.com/docs/content-api/api-reference/authentication/2.0/token-2-0
 */

export interface BioDigitalTokenResponse {
  service_version?: number;
  access_token: string;
  token_type: string;
  expires_in: number;
  timestamp?: string;
}

export interface BioDigitalErrorResponse {
  service_version?: number;
  error_more_info?: string;
  error_status_code?: number;
  error_code?: string;
  error_message?: string;
  error_type?: string;
}

const STORAGE_KEY_DEVELOPER_KEY = 'biodigital_dev_key';
const STORAGE_KEY_DEVELOPER_SECRET = 'biodigital_dev_secret';
const STORAGE_KEY_TOKEN = 'biodigital_access_token';
const STORAGE_KEY_TOKEN_EXPIRY = 'biodigital_token_expiry';

/**
 * Step 1 & 2: Exchange Developer Key and Secret for Bearer Access Token
 * Endpoint: POST https://apis.biodigital.com/oauth2/v2/token
 */
export async function fetchBioDigitalAccessToken(
  developerKey: string,
  developerSecret: string
): Promise<{ success: true; data: BioDigitalTokenResponse } | { success: false; error: BioDigitalErrorResponse }> {
  const cleanKey = developerKey.trim();
  const cleanSecret = developerSecret.trim();

  if (!cleanKey || !cleanSecret) {
    return {
      success: false,
      error: {
        error_type: 'invalid_credentials',
        error_code: '1001',
        error_message: 'Please provide both Developer Key and Developer Secret.'
      }
    };
  }

  // URL encode then Base64 encode
  const concatenated = `${encodeURIComponent(cleanKey)}:${encodeURIComponent(cleanSecret)}`;
  const authStr = typeof btoa !== 'undefined'
    ? btoa(concatenated)
    : (typeof (globalThis as any).Buffer !== 'undefined'
        ? (globalThis as any).Buffer.from(concatenated).toString('base64')
        : '');

  const requestBody = {
    grant_type: 'client_credentials',
    scope: 'contentapi'
  };

  try {
    // Try local Vite proxy endpoint first (avoids browser CORS)
    let response: Response;
    try {
      response = await fetch('/api/biodigital/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          developerKey: cleanKey,
          developerSecret: cleanSecret
        })
      });
    } catch {
      // Fallback: direct call to BioDigital API
      response = await fetch('https://apis.biodigital.com/oauth2/v2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
          'Accept': 'application/json',
          'Authorization': `Basic ${authStr}`
        },
        body: JSON.stringify(requestBody)
      });
    }

    const json = await response.json();

    if (response.ok && json.access_token) {
      // Persist in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_DEVELOPER_KEY, cleanKey);
        localStorage.setItem(STORAGE_KEY_DEVELOPER_SECRET, cleanSecret);
        localStorage.setItem(STORAGE_KEY_TOKEN, json.access_token);
        const expiryTime = Date.now() + (json.expires_in || 3600) * 1000;
        localStorage.setItem(STORAGE_KEY_TOKEN_EXPIRY, expiryTime.toString());
      }

      return {
        success: true,
        data: json as BioDigitalTokenResponse
      };
    } else {
      return {
        success: false,
        error: {
          error_status_code: response.status || 400,
          error_type: json.error_type || 'unauthorized_client',
          error_code: json.error_code || '1010',
          error_message: json.error_message || json.error || 'Authentication failed. Please check your credentials.',
          error_more_info: json.error_more_info
        }
      };
    }
  } catch (err: any) {
    return {
      success: false,
      error: {
        error_type: 'network_error',
        error_code: '5000',
        error_message: err?.message || 'Failed to connect to BioDigital token service.'
      }
    };
  }
}

/**
 * Get active stored token if not expired
 */
export function getStoredBioDigitalAuth(): {
  developerKey: string;
  developerSecret: string;
  token: string | null;
  isExpired: boolean;
  expiresInMinutes: number;
} {
  if (typeof window === 'undefined') {
    return { developerKey: '', developerSecret: '', token: null, isExpired: true, expiresInMinutes: 0 };
  }

  const developerKey = localStorage.getItem(STORAGE_KEY_DEVELOPER_KEY) || '';
  const developerSecret = localStorage.getItem(STORAGE_KEY_DEVELOPER_SECRET) || '';
  const token = localStorage.getItem(STORAGE_KEY_TOKEN);
  const expiry = parseInt(localStorage.getItem(STORAGE_KEY_TOKEN_EXPIRY) || '0', 10);

  const now = Date.now();
  const isExpired = !token || now >= expiry;
  const expiresInMinutes = isExpired ? 0 : Math.max(0, Math.round((expiry - now) / 60000));

  return {
    developerKey,
    developerSecret,
    token: isExpired ? null : token,
    isExpired,
    expiresInMinutes
  };
}

/**
 * Clear stored BioDigital credentials
 */
export function clearStoredBioDigitalAuth() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY_DEVELOPER_KEY);
  localStorage.removeItem(STORAGE_KEY_DEVELOPER_SECRET);
  localStorage.removeItem(STORAGE_KEY_TOKEN);
  localStorage.removeItem(STORAGE_KEY_TOKEN_EXPIRY);
}
