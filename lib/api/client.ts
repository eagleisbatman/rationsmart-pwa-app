import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from "axios";
import { ApiError } from "@/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 30000,
    });

    // Request interceptor for auth
    // Note: Backend uses query parameters (user_id, admin_user_id) for authentication
    // No Bearer token authentication is used
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // No token-based auth needed - backend uses query params
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        const apiError: ApiError = {
          message: error.message || "An error occurred",
          status: error.response?.status,
        };

        if (error.response?.data) {
          const data = error.response.data as any;
          if (data.message) {
            apiError.message = data.message;
          }
          if (data.errors) {
            apiError.errors = data.errors;
          }
        }

        // Handle 401 unauthorized
        if (error.response?.status === 401) {
          if (typeof window !== "undefined") {
            localStorage.removeItem("user");
            window.location.href = "/login";
          }
        }

        return Promise.reject(apiError);
      }
    );
  }

  get instance(): AxiosInstance {
    return this.client;
  }

  // Helper methods
  async get<T>(url: string, config?: any): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: any): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  async patch<T>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }
}

export const apiClient = new ApiClient();

