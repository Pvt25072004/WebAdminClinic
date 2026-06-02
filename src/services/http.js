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



export const handleResponse = async (response, defaultErrorMessage) => {
  if (response.status === 401) {
    window.localStorage.removeItem("token");
    window.sessionStorage.removeItem("token");
    window.location.href = "/";
    throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
  }

  if (response.ok) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  let message = defaultErrorMessage;
  try {
    const errorBody = await response.json();
    if (errorBody?.message) {
      message =
        typeof errorBody.message === "string"
          ? errorBody.message
          : errorBody.message.join?.(", ");
    }
  } catch {}
  throw new Error(message);
};
