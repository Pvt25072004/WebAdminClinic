import { getAuthHeaders, handleResponse } from "./http";
import { API_BASE_URL } from "../utils/constants";

const DASHBOARD_ENDPOINT = `${API_BASE_URL}/dashboard`;

export const getDashboardStats = async () => {
  const response = await fetch(`${DASHBOARD_ENDPOINT}/stats`, {
    headers: {
      ...getAuthHeaders(),
    },
    credentials: "include",
  });
  return handleResponse(response, "Không thể tải dữ liệu thống kê");
};
