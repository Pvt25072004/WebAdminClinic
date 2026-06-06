import { getAuthHeaders } from "./http";
import { API_BASE_URL } from "../utils/constants";

const POSTS_ENDPOINT = `${API_BASE_URL}/posts`;

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
      message =
        typeof errorBody.message === "string"
          ? errorBody.message
          : errorBody.message.join?.(", ");
    }
  } catch {}
  throw new Error(message);
};

export const getPosts = async (page = 1, limit = 100) => {
  const response = await fetch(`${POSTS_ENDPOINT}?page=${page}&limit=${limit}`, {
    headers: { ...getAuthHeaders() },
    credentials: "include",
  });
  return handleResponse(response, "Không thể tải danh sách bài viết");
};

export const getPostsByHospital = async (hospitalId, page = 1, limit = 100) => {
  const response = await fetch(`${POSTS_ENDPOINT}/hospital/${hospitalId}?page=${page}&limit=${limit}`, {
    headers: { ...getAuthHeaders() },
    credentials: "include",
  });
  return handleResponse(response, "Không thể tải danh sách bài viết");
};

export const createPost = async (postData) => {
  const response = await fetch(POSTS_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(postData),
    credentials: "include",
  });
  return handleResponse(response, "Không thể tạo bài viết");
};

export const updatePost = async (id, postData) => {
  const response = await fetch(`${POSTS_ENDPOINT}/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(postData),
    credentials: "include",
  });
  return handleResponse(response, "Không thể cập nhật bài viết");
};

export const deletePost = async (id) => {
  const response = await fetch(`${POSTS_ENDPOINT}/${id}`, {
    method: "DELETE",
    headers: { ...getAuthHeaders() },
    credentials: "include",
  });
  return handleResponse(response, "Không thể xóa bài viết");
};

export const uploadPostImage = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${POSTS_ENDPOINT}/upload`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
    },
    body: formData,
    credentials: "include",
  });
  return handleResponse(response, "Không thể tải ảnh bài viết lên");
};
