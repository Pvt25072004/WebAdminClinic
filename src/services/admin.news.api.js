import { getAuthHeaders, handleResponse } from "./http";
import { API_BASE_URL } from "../utils/constants";

const NEWS_ENDPOINT = `${API_BASE_URL}/admin/news`;

export const getNews = async () => {
  const response = await fetch(NEWS_ENDPOINT, {
    headers: { ...getAuthHeaders() },
    credentials: "include",
  });
  return handleResponse(response, "Không thể tải danh sách tin tức");
};


export const createNews = async (payload) => {
  const response = await fetch(NEWS_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(payload),
    credentials: "include",
  });
  return handleResponse(response, "Không thể tạo tin tức");
};

export const updateNews = async (id, payload) => {
  const response = await fetch(`${NEWS_ENDPOINT}/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(payload),
    credentials: "include",
  });
  return handleResponse(response, "Không thể cập nhật tin tức");
};

export const deleteNews = async (id) => {
  const response = await fetch(`${NEWS_ENDPOINT}/${id}`, {
    method: "DELETE",
    headers: { ...getAuthHeaders() },
    credentials: "include",
  });
  return handleResponse(response, "Không thể xóa tin tức");
};

export const uploadNewsImage = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${NEWS_ENDPOINT}/upload`, {
    method: "POST",
    headers: { ...getAuthHeaders() },
    body: formData,
    credentials: "include",
  });
  return handleResponse(response, "Tải ảnh lên thất bại");
};

export const syncGoogleNews = async () => {
  const response = await fetch(`${NEWS_ENDPOINT}/sync-google`, {
    method: "POST",
    headers: { ...getAuthHeaders() },
    credentials: "include",
  });
  return handleResponse(response, "Không thể đồng bộ Google News");
};
