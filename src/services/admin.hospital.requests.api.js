import { getAuthHeaders } from "./http";
import { API_BASE_URL } from "../utils/constants";

const REQUESTS_ENDPOINT = `${API_BASE_URL}/doctor-hospital-requests`;

const handleResponse = async (response, defaultErrorMessage) => {
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
      message = typeof errorBody.message === "string" ? errorBody.message : errorBody.message.join?.(", ");
    }
  } catch {}
  throw new Error(message);
};

export const getRequestsByHospital = async (hospitalId) => {
  const response = await fetch(`${REQUESTS_ENDPOINT}/hospital/${hospitalId}`, {
    headers: { ...getAuthHeaders() },
    credentials: "include",
  });
  return handleResponse(response, "Không thể tải danh sách yêu cầu");
};

export const updateRequestStatus = async (id, status) => {
  const response = await fetch(`${REQUESTS_ENDPOINT}/${id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ status }),
    credentials: "include",
  });
  return handleResponse(response, "Không thể cập nhật trạng thái");
};
