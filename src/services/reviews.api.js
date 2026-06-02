import { getAuthHeaders, handleResponse } from "./http";

import { API_BASE_URL } from "../utils/constants";
const REVIEWS_ENDPOINT = `${API_BASE_URL}/reviews`;



export const createReview = async (payload) => {
  const response = await fetch(REVIEWS_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(payload),
  });
  return handleResponse(response, "Không thể gửi đánh giá");
};

export const getReviewsByDoctor = async (doctorId) => {
  const response = await fetch(`${REVIEWS_ENDPOINT}/doctor/${doctorId}`, {
    headers: {
      ...getAuthHeaders(),
    },
  });
  return handleResponse(
    response,
    "Không thể tải danh sách đánh giá của bác sĩ",
  );
};

export const getAllReviews = async () => {
  const response = await fetch(REVIEWS_ENDPOINT, {
    headers: {
      ...getAuthHeaders(),
    },
  });
  return handleResponse(response, "Không thể tải danh sách đánh giá");
};
