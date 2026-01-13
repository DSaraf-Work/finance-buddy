/**
 * Splitwise API client
 * Core HTTP communication with Splitwise API, shared across all utilities and endpoints
 * 
 * Eliminates duplication across multiple Splitwise endpoint files by providing
 * a centralized, type-safe client for all Splitwise API operations.
 */

export const SPLITWISE_API_KEY = process.env.SPLITWISE_API_KEY;
export const SPLITWISE_API_BASE = 'https://secure.splitwise.com/api/v3.0';

// ============================================================================
// Type Definitions
// ============================================================================

export interface SplitwiseUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  picture?: {
    medium?: string;
  };
}

export interface SplitwiseUserData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  picture?: string;
}

export interface SplitwiseExpenseData {
  id: string;
  description: string;
  cost: string;
  currency_code: string;
  date: string;
  created_at: string;
  payment: boolean;
  deleted_at?: string;
  users?: Array<{
    user?: { first_name: string };
    owed_share?: string;
    paid_share?: string;
  }>;
  group_id?: string;
}

export interface SplitwiseGroup {
  id: string;
  name: string;
  members?: Array<SplitwiseUser>;
}

export interface SplitwiseFriend {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

export interface ApiResult<T> {
  data?: T;
  error?: string;
  statusCode?: number;
}

// ============================================================================
// Generic API Call Handler
// ============================================================================

/**
 * Generic handler for Splitwise API calls with consistent error handling
 */
async function callSplitwiseAPI<T>(
  endpoint: string,
  method: string = 'GET',
  body?: Record<string, string>
): Promise<ApiResult<T>> {
  if (!SPLITWISE_API_KEY) {
    return {
      error: 'Splitwise API key not configured',
      statusCode: 500,
    };
  }

  try {
    const url = `${SPLITWISE_API_BASE}${endpoint}`;
    
    const options: RequestInit = {
      method,
      headers: {
        'Authorization': `Bearer ${SPLITWISE_API_KEY}`,
      },
    };

    // Handle different content types
    if (method === 'POST') {
      if (body) {
        // URL-encoded form data for POST requests
        options.headers = {
          ...options.headers,
          'Content-Type': 'application/x-www-form-urlencoded',
        };
        options.body = Object.keys(body)
          .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(body[key]))
          .join('&');
      }
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      return {
        error: errorText,
        statusCode: response.status,
      };
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unknown error',
      statusCode: 500,
    };
  }
}

// ============================================================================
// Expense Operations
// ============================================================================

/**
 * Fetch expense data from Splitwise API
 * Used by validation and display logic
 */
export async function fetchSplitwiseExpense(
  expenseId: string
): Promise<ApiResult<SplitwiseExpenseData>> {
  const result = await callSplitwiseAPI<{ expense: SplitwiseExpenseData }>(
    `/get_expense/${expenseId}`,
    'GET'
  );

  return {
    data: result.data?.expense,
    error: result.error,
    statusCode: result.statusCode,
  };
}

/**
 * Create a new expense on Splitwise
 */
export async function createSplitwiseExpense(
  expenseData: Record<string, string>
): Promise<ApiResult<{ expenses: SplitwiseExpenseData[] }>> {
  return callSplitwiseAPI<{ expenses: SplitwiseExpenseData[] }>(
    '/create_expense',
    'POST',
    expenseData
  );
}

// ============================================================================
// User Operations
// ============================================================================

/**
 * Fetch current authenticated user
 */
export async function fetchCurrentUser(): Promise<ApiResult<SplitwiseUserData>> {
  const result = await callSplitwiseAPI<{ user: SplitwiseUser }>(
    '/get_current_user',
    'GET'
  );

  if (result.data?.user) {
    return {
      data: {
        id: result.data.user.id,
        firstName: result.data.user.first_name,
        lastName: result.data.user.last_name,
        email: result.data.user.email,
        picture: result.data.user.picture?.medium,
      },
    };
  }

  return {
    error: result.error,
    statusCode: result.statusCode,
  };
}

// ============================================================================
// Group Operations
// ============================================================================

/**
 * Fetch all groups for authenticated user
 */
export async function fetchGroups(): Promise<ApiResult<SplitwiseGroup[]>> {
  const result = await callSplitwiseAPI<{ groups: SplitwiseGroup[] }>(
    '/get_groups',
    'GET'
  );

  return {
    data: result.data?.groups,
    error: result.error,
    statusCode: result.statusCode,
  };
}

// ============================================================================
// Friend Operations
// ============================================================================

/**
 * Fetch all friends for authenticated user
 */
export async function fetchFriends(): Promise<ApiResult<SplitwiseFriend[]>> {
  const result = await callSplitwiseAPI<{ friends: SplitwiseFriend[] }>(
    '/get_friends',
    'GET'
  );

  return {
    data: result.data?.friends,
    error: result.error,
    statusCode: result.statusCode,
  };
}
