import { getAuthHeaders } from "./http";
import { API_BASE_URL } from "../utils/constants";
const APPOINTMENTS_ENDPOINT = `${API_BASE_URL}/appointments`;

export const getAllAppointments = async () => {
  const response = await fetch(APPOINTMENTS_ENDPOINT, {
    headers: {
      ...getAuthHeaders(),
    },
    credentials: "include",
  });
  if (response.ok) {
    try {
      const data = await response.json();
      return Array.isArray(data) ? data : (data.data || data.items || []);
    } catch {
      return [];
    }
  }
  return [];
};
