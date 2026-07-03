import axios, { type InternalAxiosRequestConfig } from "axios";
import { ApiError } from "@/services/api-error";
import { clearAccessToken, getAccessToken } from "@/services/token-storage";

const RETRYABLE_METHOD = "get";
const MAX_RETRIES = 2;
const RETRY_BASE_DELAY_MS = 300;

type RetryableConfig = InternalAxiosRequestConfig & { __retryCount?: number };

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:4000",
  timeout: 15000,
});

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

let onUnauthorized: (() => void) | null = null;

export function registerUnauthorizedHandler(handler: () => void): void {
  onUnauthorized = handler;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) return Promise.reject(error);

    const config = error.config as RetryableConfig | undefined;
    const status = error.response?.status;
    const isNetworkError = !error.response;
    const isRetryable =
      config?.method?.toLowerCase() === RETRYABLE_METHOD && (isNetworkError || (status ?? 0) >= 500);

    if (isRetryable && config) {
      config.__retryCount = (config.__retryCount ?? 0) + 1;
      if (config.__retryCount <= MAX_RETRIES) {
        await wait(RETRY_BASE_DELAY_MS * 2 ** (config.__retryCount - 1));
        return apiClient(config);
      }
    }

    if (status === 401) {
      clearAccessToken();
      onUnauthorized?.();
    }

    return Promise.reject(new ApiError(status ?? 0, error.response?.data));
  }
);
