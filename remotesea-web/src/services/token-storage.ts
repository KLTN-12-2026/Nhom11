const STORAGE_KEY = "remotesea_access_token";

export function getAccessToken(): string | null {
  return localStorage.getItem(STORAGE_KEY) ?? sessionStorage.getItem(STORAGE_KEY);
}

export function setAccessToken(token: string, remember: boolean): void {
  clearAccessToken();
  (remember ? localStorage : sessionStorage).setItem(STORAGE_KEY, token);
}

export function clearAccessToken(): void {
  localStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(STORAGE_KEY);
}
