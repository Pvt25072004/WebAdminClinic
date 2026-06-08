// Error Handler Service - Xử lý các loại lỗi khác nhau
export const ErrorTypes = {
  NETWORK_ERROR: "NETWORK_ERROR",
  TIMEOUT_ERROR: "TIMEOUT_ERROR",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  UNAUTHORIZED_ERROR: "UNAUTHORIZED_ERROR",
  FORBIDDEN_ERROR: "FORBIDDEN_ERROR",
  NOT_FOUND_ERROR: "NOT_FOUND_ERROR",
  SERVER_ERROR: "SERVER_ERROR",
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
};

export class AppError extends Error {
  constructor(type, message, statusCode = null, data = null) {
    super(message);
    this.type = type;
    this.statusCode = statusCode;
    this.data = data;
    this.timestamp = new Date().toISOString();
  }

  isNetworkError() {
    return this.type === ErrorTypes.NETWORK_ERROR;
  }

  isTimeoutError() {
    return this.type === ErrorTypes.TIMEOUT_ERROR;
  }

  isUnauthorized() {
    return this.type === ErrorTypes.UNAUTHORIZED_ERROR;
  }

  isForbidden() {
    return this.type === ErrorTypes.FORBIDDEN_ERROR;
  }

  isServerError() {
    return this.type === ErrorTypes.SERVER_ERROR;
  }

  getUserMessage() {
    const messages = {
      [ErrorTypes.NETWORK_ERROR]:
        "Mất kết nối mạng. Vui lòng kiểm tra internet.",
      [ErrorTypes.TIMEOUT_ERROR]: "Kết nối quá lâu. Vui lòng thử lại.",
      [ErrorTypes.VALIDATION_ERROR]: "Dữ liệu không hợp lệ.",
      [ErrorTypes.UNAUTHORIZED_ERROR]:
        "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
      [ErrorTypes.FORBIDDEN_ERROR]:
        "Bạn không có quyền thực hiện hành động này.",
      [ErrorTypes.NOT_FOUND_ERROR]: "Không tìm thấy tài nguyên.",
      [ErrorTypes.SERVER_ERROR]: "Lỗi máy chủ. Vui lòng thử lại sau.",
      [ErrorTypes.UNKNOWN_ERROR]: "Đã xảy ra lỗi không xác định.",
    };
    return messages[this.type] || this.message;
  }
}

export const handleError = (error) => {
  // Network error
  if (!navigator.onLine) {
    return new AppError(ErrorTypes.NETWORK_ERROR, "Mất kết nối mạng", 0);
  }

  // Timeout error
  if (error?.name === "AbortError" || error?.message?.includes("timeout")) {
    return new AppError(ErrorTypes.TIMEOUT_ERROR, "Kết nối quá lâu", 408);
  }

  // Network fetch error
  if (error instanceof TypeError && error.message === "Failed to fetch") {
    return new AppError(
      ErrorTypes.NETWORK_ERROR,
      "Không thể kết nối đến máy chủ",
      0,
    );
  }

  // HTTP errors
  if (error?.statusCode) {
    if (error.statusCode === 401) {
      return new AppError(
        ErrorTypes.UNAUTHORIZED_ERROR,
        "Phiên đăng nhập hết hạn",
        401,
      );
    }
    if (error.statusCode === 403) {
      return new AppError(
        ErrorTypes.FORBIDDEN_ERROR,
        "Không có quyền truy cập",
        403,
      );
    }
    if (error.statusCode === 404) {
      return new AppError(
        ErrorTypes.NOT_FOUND_ERROR,
        "Không tìm thấy tài nguyên",
        404,
      );
    }
    if (error.statusCode >= 500) {
      return new AppError(
        ErrorTypes.SERVER_ERROR,
        "Lỗi máy chủ",
        error.statusCode,
      );
    }
    if (error.statusCode >= 400) {
      return new AppError(
        ErrorTypes.VALIDATION_ERROR,
        error.message || "Dữ liệu không hợp lệ",
        error.statusCode,
      );
    }
  }

  // Unknown error
  return new AppError(
    ErrorTypes.UNKNOWN_ERROR,
    error?.message || "Đã xảy ra lỗi không xác định",
    null,
    error,
  );
};
