import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL + "/auth";

export const registerUser = async (userData) => {
    try {
        const response = await axios.post(`${API_URL}/register`, userData);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: "Erreur iconnue" };
    }
};

export const loginUser = async (userData) => {
    try {
        const response = await axios.post(`${API_URL}/login`, userData);
        // console.log("Reponse de l'api :", response.data);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message:"Erreur inconnu" };
    }
}