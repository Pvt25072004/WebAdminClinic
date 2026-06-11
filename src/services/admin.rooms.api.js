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
