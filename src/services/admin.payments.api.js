import { getAuthHeaders, handleResponse } from "./http";
import { API_BASE_URL } from "../utils/constants";
const PAYMENTS_ENDPOINT = `${API_BASE_URL}/payments`;



export const getAllPayments = async () => {
  const response = await fetch(PAYMENTS_ENDPOINT, {
    headers: {
      ...getAuthHeaders(),
    },
    credentials: "include",
  });
  return handleResponse(response, "Không thể tải danh sách thanh toán");
};
