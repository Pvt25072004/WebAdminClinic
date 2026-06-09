// Enhanced HTTP Service - Với retry, timeout, offline handling
import { AppError, handleError, ErrorTypes } from "./errorHandler";
import { networkStatus } from "./networkStatus";
import { cacheService } from "./cacheService";

const MAX_RETRIES = 3;
const TIMEOUT_MS = 15000; // 15 seconds
const RETRY_DELAY_MS = 1000; // 1 second

export const getAuthHeaders = () => {
  if (typeof window === "undefined") {
    return {};
  }
  const token =
    window.localStorage.getItem("token") ||
    window.sessionStorage.getItem("token");
  if (!token) {
    return {};
  }
  return {
    Authorization: `Bearer ${token}`,
  };
};

// Retry logic
const retryFetch = async (url, options, retries = MAX_RETRIES) => {
  try {
    // Check network status
    if (!networkStatus.getStatus()) {
      throw new AppError(ErrorTypes.NETWORK_ERROR, "Mất kết nối mạng", 0);
    }

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  } catch (error) {
    if (retries > 0 && shouldRetry(error)) {
      console.log(
        `🔄 Retry attempt ${MAX_RETRIES - retries + 1}/${MAX_RETRIES}`,
      );
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      return retryFetch(url, options, retries - 1);
    }
    throw error;
  }
};

// Determine if error is retryable
const shouldRetry = (error) => {
  // Don't retry on authentication errors
  if (error?.statusCode === 401 || error?.statusCode === 403) {
    return false;
  }
  // Retry on network errors and timeouts
  if (error instanceof TypeError && error.message === "Failed to fetch") {
    return true;
  }
  if (error?.name === "AbortError") {
    return true;
  }
  return false;
};

export const handleResponse = async (
  response,
  defaultErrorMessage,
  cacheKey = null,
  cacheDuration = 30,
) => {
  // Handle 401 - unauthorized
  if (response.status === 401) {
    window.localStorage.removeItem("token");
    window.sessionStorage.removeItem("token");
    window.location.href = "/";
    throw new AppError(
      ErrorTypes.UNAUTHORIZED_ERROR,
      "Phiên đăng nhập đã hết hạn",
      401,
    );
  }

  if (response.ok) {
    try {
      const data = await response.json();
      // Cache successful response
      if (cacheKey) {
        cacheService.set(cacheKey, data, cacheDuration);
      }
      return data;
    } catch (error) {
      // Return cached data if JSON parse fails
      if (cacheKey) {
        const cached = cacheService.get(cacheKey);
        if (cached) {
          console.warn("⚠️ Using cached data due to parse error");
          return cached;
        }
      }
      throw new AppError(
        ErrorTypes.SERVER_ERROR,
        "Lỗi phân tích dữ liệu từ máy chủ",
        response.status,
      );
    }
  }

  // Try to get cached data on error
  if (cacheKey && !networkStatus.getStatus()) {
    const cached = cacheService.get(cacheKey);
    if (cached) {
      console.warn("⚠️ Offline: Using cached data");
      return cached;
    }
  }

  // Handle error response
  let message = defaultErrorMessage;
  try {
    const errorBody = await response.json();
    if (errorBody?.message) {
      message =
        typeof errorBody.message === "string"
          ? errorBody.message
          : Array.isArray(errorBody.message)
            ? errorBody.message.join(", ")
            : defaultErrorMessage;
    }
  } catch (e) {
    // Ignore JSON parse error
  }

  const error = new AppError(
    response.status >= 500
      ? ErrorTypes.SERVER_ERROR
      : ErrorTypes.VALIDATION_ERROR,
    message,
    response.status,
  );

  throw error;
};

// Wrapper function for API calls with retry
export const fetchWithRetry = async (
  url,
  options = {},
  cacheKey = null,
  cacheDuration = 30,
) => {
  try {
    const response = await retryFetch(url, options);
    return response;
  } catch (error) {
    const appError = handleError(error);

    // Try to return cached data on error
    if (cacheKey) {
      const cached = cacheService.get(cacheKey);
      if (cached) {
        console.warn("⚠️ Using cached data:", cacheKey);
        return cached;
      }
    }

    throw appError;
  }
};
