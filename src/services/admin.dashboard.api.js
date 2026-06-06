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

export const getAdminCharts = async ({ startDate, endDate, status } = {}) => {
  const query = new URLSearchParams();
  if (startDate) query.append("startDate", startDate);
  if (endDate) query.append("endDate", endDate);
  if (status) query.append("status", status);

  const response = await fetch(`${DASHBOARD_ENDPOINT}/admin-charts?${query.toString()}`, {
    headers: {
      ...getAuthHeaders(),
    },
    credentials: "include",
  });
  return handleResponse(response, "Không thể tải dữ liệu biểu đồ");
};
