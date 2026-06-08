import { getAuthHeaders, handleResponse } from "./httpEnhanced";
import { API_BASE_URL } from "../utils/constants";

const APPOINTMENTS_ENDPOINT = `${API_BASE_URL}/appointments`;

export const getAllAppointments = async (
  page = 1,
  limit = 100,
  status = "all",
  hospitalId = "all",
  search = "",
) => {
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  if (status && status !== "all") queryParams.append("status", status);
  if (hospitalId && hospitalId !== "all")
    queryParams.append("hospital_id", hospitalId);
  if (search) queryParams.append("search", search);

  try {
    const response = await fetch(
      `${APPOINTMENTS_ENDPOINT}?${queryParams.toString()}`,
      {
        headers: {
          ...getAuthHeaders(),
        },
        credentials: "include",
      },
    );

    return await handleResponse(
      response,
      "Không thể lấy danh sách lịch hẹn",
      "appointments_list",
      30,
    );
  } catch (error) {
    console.error("Get appointments error:", error);
    return { data: [], total: 0, page: 1, limit: 100, totalPages: 1 };
  }
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
    throw new Error(
      errorData.message || "Không thể cập nhật trạng thái lịch hẹn",
    );
  }

  return await response.json();
};

export const getAppointmentsBySchedule = async (scheduleId) => {
  const response = await fetch(
    `${APPOINTMENTS_ENDPOINT}/schedule/${scheduleId}`,
    {
      headers: {
        ...getAuthHeaders(),
      },
      credentials: "include",
    },
  );
  if (response.ok) {
    try {
      const data = await response.json();
      return Array.isArray(data) ? data : data.data || data.items || [];
    } catch {
      return [];
    }
  }
  return [];
};

export const getMedicalRecord = async (appointmentId) => {
  const response = await fetch(
    `${API_BASE_URL}/medical-records/appointment/${appointmentId}`,
    {
      headers: {
        ...getAuthHeaders(),
      },
      credentials: "include",
    },
  );
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

export const getAvailableTimesForPackage = async (packageId, date) => {
  const queryParams = new URLSearchParams({
    packageId: packageId.toString(),
    date,
  });
  const response = await fetch(
    `${APPOINTMENTS_ENDPOINT}/available-times/package?${queryParams.toString()}`,
  );
  if (!response.ok) throw new Error("Failed to load slots");
  return handleResponse(response);
};

export const getAvailableDoctorsForPackage = async (packageId, date, time) => {
  const queryParams = new URLSearchParams({
    packageId: packageId.toString(),
    date,
    time,
  });
  const response = await fetch(
    `${APPOINTMENTS_ENDPOINT}/available-doctors/package?${queryParams.toString()}`,
  );
  if (!response.ok) throw new Error("Failed to load doctors");
  return handleResponse(response);
};
