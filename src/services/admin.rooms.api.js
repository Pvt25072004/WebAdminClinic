import http from './httpEnhanced';

/**
 * Get all rooms based on filters
 * @param {number|null} hospital_id
 * @param {number|null} category_id
 * @returns {Promise<Array>} Array of rooms
 */
export const getRooms = async (hospital_id = null, category_id = null) => {
    let url = '/rooms';
    const params = new URLSearchParams();
    
    if (hospital_id) params.append('hospital_id', hospital_id);
    if (category_id) params.append('category_id', category_id);
    
    const queryString = params.toString();
    if (queryString) {
        url += `?${queryString}`;
    }

    try {
        const response = await http.get(url);
        // Tùy thuộc vào backend format (có paginate hay không)
        // Nếu NestJS trả về array thì map ra, nếu trả về {data, total} thì lấy data
        return response.data;
    } catch (error) {
        console.error('Error fetching rooms:', error);
        throw error;
    }
};
