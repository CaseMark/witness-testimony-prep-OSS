/**
 * API Key Storage
 *
 * Manages Case.dev API key storage in localStorage.
 * The API key is used for all Case.dev API calls including LLM and Vault operations.
 */

const API_KEY_STORAGE_KEY = "wtp_case_api_key_v1";

/**
 * Store API key in localStorage
 */
export function setApiKey(apiKey: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
}

/**
 * Get API key from localStorage
 */
export function getApiKey(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(API_KEY_STORAGE_KEY);
}

/**
 * Remove API key from localStorage (logout)
 */
export function clearApiKey(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(API_KEY_STORAGE_KEY);
}

/**
 * Check if user is authenticated (has API key)
 */
export function isAuthenticated(): boolean {
  return !!getApiKey();
}
