import axios from "axios";
import { supabase } from "./supabaseClient";

const API = process.env.NEXT_PUBLIC_BACKEND_URL;

export const api = axios.create({
    baseURL: API,
});

// Response interceptor to handle 401 errors globally
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        // Only sign out on 401 if it's not a login/register endpoint
        if (error.response?.status === 401 &&
            !error.config?.url?.includes('/auth/login') &&
            !error.config?.url?.includes('/auth/register')) {
            console.warn('Session expired, signing out');
            await supabase.auth.signOut();
        }
        return Promise.reject(error);
    }
);

/* attach token dynamically */
export const attachToken = (token: string | null) => {
    api.interceptors.request.clear();

    api.interceptors.request.use((config) => {
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    });
};