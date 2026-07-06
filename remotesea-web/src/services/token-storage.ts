const STORAGE_KEY = "remotesea_access_token";

export const getAccessToken = (): string | null =>
  localStorage.getItem(STORAGE_KEY) ?? sessionStorage.getItem(STORAGE_KEY);

export const clearAccessToken = (): void => {
  localStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(STORAGE_KEY);
};

export const setAccessToken = (token: string, remember: boolean): void => {
  clearAccessToken();
  (remember ? localStorage : sessionStorage).setItem(STORAGE_KEY, token);
};
