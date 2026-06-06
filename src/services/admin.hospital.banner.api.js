import { getAuthHeaders, handleResponse } from "./http";
import { API_BASE_URL } from "../utils/constants";

const HOSPITAL_BANNERS_ENDPOINT = `${API_BASE_URL}/hospital-admin/banners`;



export const getHospitalBanners = async () => {
  const response = await fetch(HOSPITAL_BANNERS_ENDPOINT, {
    headers: {
      ...getAuthHeaders(),
    },
  });

  return handleResponse(response, "Không thể tải danh sách banner bệnh viện");
};


export const uploadHospitalBannerImage = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${HOSPITAL_BANNERS_ENDPOINT}/upload`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
      // Không set Content-Type ở đây.
      // Browser tự set multipart/form-data + boundary.
    },
    body: formData,
  });

  return handleResponse(response, "Không thể upload ảnh banner");
};

export const createHospitalBanner = async (data) => {
  const response = await fetch(HOSPITAL_BANNERS_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(data),
  });

  return handleResponse(response, "Không thể tạo banner bệnh viện");
};

export const updateHospitalBanner = async (id, data) => {
  const response = await fetch(`${HOSPITAL_BANNERS_ENDPOINT}/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(data),
  });

  return handleResponse(response, "Không thể cập nhật banner bệnh viện");
};

export const deleteHospitalBanner = async (id) => {
  const response = await fetch(`${HOSPITAL_BANNERS_ENDPOINT}/${id}`, {
    method: "DELETE",
    headers: {
      ...getAuthHeaders(),
    },
  });

  return handleResponse(response, "Không thể xóa banner bệnh viện");
};
