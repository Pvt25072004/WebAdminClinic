import { getAuthHeaders, handleResponse } from "./http";
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

export const updateAppointmentStatus = async (id, status, reason = "") => {
  const response = await fetch(`${APPOINTMENTS_ENDPOINT}/${id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    credentials: "include",
    body: JSON.stringify({ status, reason }),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Không thể cập nhật trạng thái lịch hẹn");
  }
  
  return await response.json();
};

export const getAppointmentsBySchedule = async (scheduleId) => {
  const response = await fetch(`${APPOINTMENTS_ENDPOINT}/schedule/${scheduleId}`, {
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

export const getMedicalRecord = async (appointmentId) => {
  const response = await fetch(`${API_BASE_URL}/medical-records/appointment/${appointmentId}`, {
    headers: {
      ...getAuthHeaders(),
    },
    credentials: "include",
  });
  if (response.ok) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }
  return null;
};

export const updateAppointment = async (id, payload) => {
  const response = await fetch(`${APPOINTMENTS_ENDPOINT}/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Không thể cập nhật lịch hẹn");
  }

  return await response.json();
};
