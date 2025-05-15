import useHttpClient from "../hooks/api/useHttpClient";

/**
 * Fetch product details for a list of product IDs.
 * @param {Function} sendRequest - The sendRequest function from useHttpClient.
 * @param {Array} productIds - List of product IDs.
 * @returns {Promise<Array>} - List of product details.
 */
export const fetchProductDetails = async (sendRequest, productIds) => {
    try {
        const response = await sendRequest(
            "/api/chat/allActiveChatProducts",
            "POST",
            { productIds },
            {},
            false,
            true
        );
        return response.data;
    } catch (error) {
        console.error("Failed to fetch product details:", error);
        return [];
    }
};

/**
 * Fetch participants for a specific chat room.
 * @param {Function} sendRequest - The sendRequest function from useHttpClient.
 * @param {string} roomId - Chat room ID.
 * @returns {Promise<Array>} - List of participants.
 */
export const fetchParticipants = async (sendRequest, roomId) => {
    try {
        const response = await sendRequest(
            `/api/chat/${roomId}/participants`,
            "GET",
            null,
            {},
            false,
            true
        );
        return response.data;
    } catch (error) {
        console.error("Failed to fetch participants:", error);
        return [];
    }
};
