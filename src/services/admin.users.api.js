// Admin Users API
import { getAuthHeaders, handleResponse } from "./http";

import { API_BASE_URL } from "../utils/constants";
const USERS_ENDPOINT = `${API_BASE_URL}/users`;



export const getUsers = async (page = 1, limit = 10) => {
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  
  const response = await fetch(`${USERS_ENDPOINT}?${queryParams.toString()}`, {
    headers: {
      ...getAuthHeaders(),
    },
    credentials: "include",
  });
  return handleResponse(response, "Không thể tải danh sách người dùng");
};

export const toggleUserActive = async (id, currentActive) => {
  const response = await fetch(`${USERS_ENDPOINT}/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ is_active: !currentActive }),
    credentials: "include",
  });
  return handleResponse(response, "Không thể cập nhật trạng thái người dùng");
};

export const deleteUserAdmin = async (id) => {
  const response = await fetch(`${USERS_ENDPOINT}/${id}`, {
    method: "DELETE",
    headers: {
      ...getAuthHeaders(),
    },
    credentials: "include",
  });
  return handleResponse(response, "Không thể xóa người dùng");
};

export const createUserAdmin = async (payload) => {
  const response = await fetch(USERS_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(payload),
    credentials: "include",
  });
  return handleResponse(response, "Không thể tạo người dùng");
};

export const updateUserAdmin = async (id, payload) => {
  const response = await fetch(`${USERS_ENDPOINT}/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(payload),
    credentials: "include",
  });
  return handleResponse(response, "Không thể cập nhật người dùng");
};
