import { getAuthHeaders, handleResponse } from "./http";

import { API_BASE_URL } from "../utils/constants";
const REVIEWS_ENDPOINT = `${API_BASE_URL}/reviews`;




export const getAllReviews = async () => {
  const response = await fetch(REVIEWS_ENDPOINT, {
    headers: {
      ...getAuthHeaders(),
    },
  });
  return handleResponse(response, "Không thể tải danh sách đánh giá");
};
