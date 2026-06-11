import { getAuthHeaders, handleResponse } from './http';
import { API_BASE_URL } from '../utils/constants';

const ROOMS_ENDPOINT = `${API_BASE_URL}/rooms`;

/**
 * Get all rooms based on filters
 * @param {number|null} hospital_id
 * @param {number|null} category_id
 * @returns {Promise<Array>} Array of rooms
 */
export const getRooms = async (hospital_id = null, category_id = null) => {
    let url = ROOMS_ENDPOINT;
    const params = new URLSearchParams();
    
    if (hospital_id) params.append('hospital_id', hospital_id);
    if (category_id) params.append('category_id', category_id);
    
    const queryString = params.toString();
    if (queryString) {
        url += `?${queryString}`;
    }

    try {
        const response = await fetch(url, {
            headers: { ...getAuthHeaders() },
            credentials: "include",
        });
        return await handleResponse(response, "Không thể tải danh sách phòng khám");
    } catch (error) {
        console.error('Error fetching rooms:', error);
        throw error;
    }
};

/**
 * Bulk create rooms
 * @param {Array} rooms Array of room objects { name, hospital_id, category_id }
 * @returns {Promise<Array>} Created rooms
 */
export const createBulkRooms = async (rooms) => {
    try {
        const response = await fetch(`${ROOMS_ENDPOINT}/bulk`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...getAuthHeaders(),
            },
            credentials: "include",
            body: JSON.stringify(rooms),
        });
        return await handleResponse(response, "Không thể tạo phòng khám hàng loạt");
    } catch (error) {
        console.error('Error creating bulk rooms:', error);
        throw error;
    }
};

export const updateRoom = async (id, data) => {
    try {
        const response = await fetch(`${ROOMS_ENDPOINT}/${id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                ...getAuthHeaders(),
            },
            credentials: "include",
            body: JSON.stringify(data),
        });
        return await handleResponse(response, "Không thể cập nhật phòng khám");
    } catch (error) {
        console.error('Error updating room:', error);
        throw error;
    }
};

export const deleteRoom = async (id) => {
    try {
        const response = await fetch(`${ROOMS_ENDPOINT}/${id}`, {
            method: "DELETE",
            headers: {
                ...getAuthHeaders(),
            },
            credentials: "include",
        });
        return await handleResponse(response, "Không thể xóa phòng khám");
    } catch (error) {
        console.error('Error deleting room:', error);
        throw error;
    }
};
