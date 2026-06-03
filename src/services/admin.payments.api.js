import { getAuthHeaders, handleResponse } from "./http";
import { API_BASE_URL } from "../utils/constants";
const PAYMENTS_ENDPOINT = `${API_BASE_URL}/payments`;



export const getAllPayments = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.page) query.append('page', params.page);
  if (params.limit) query.append('limit', params.limit);
  if (params.startDate) query.append('startDate', params.startDate);
  if (params.endDate) query.append('endDate', params.endDate);
  if (params.search) query.append('search', params.search);

  const queryString = query.toString() ? `?${query.toString()}` : "";
  const response = await fetch(`${PAYMENTS_ENDPOINT}${queryString}`, {
    headers: {
      ...getAuthHeaders(),
    },
    credentials: "include",
  });
  return handleResponse(response, "Không thể tải danh sách thanh toán");
};

export const getDashboardStats = async () => {
  const response = await fetch(`${PAYMENTS_ENDPOINT}/dashboard-stats`, {
    headers: {
      ...getAuthHeaders(),
    },
    credentials: "include",
  });
  return handleResponse(response, "Không thể tải số liệu thống kê");
};
