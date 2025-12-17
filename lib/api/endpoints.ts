import {
  UserAuthResponse,
  UserLoginRequest,
  RegisterUserRequest,
  ResetPinRequest,
  ResetPinResponse,
  FeedRecommendationRequest,
  FeedRecommendationResponse,
  FeedEvaluationRequest,
  FeedEvaluationResponse,
  FeedClassificationResponse,
  FeedReportResponse,
  SaveReportRequest,
  SavedReportResponse,
  SubmitFeedbackRequest,
  SubmitFeedbackResponse,
  FeedbackResponse,
  AdminFeedListResponse,
  UserResponse,
  Country,
  FeedDetails,
  FeedSubCategory,
  FeedCategoryResponse,
  CheckInsertUpdateRequest,
  CheckInsertUpdateResponse,
  AdminBulkUploadResponse,
  AdminExportResponse,
} from "@/lib/types";
import { apiClient } from "./client";

// Auth endpoints
export const authApi = {
  login: (data: UserLoginRequest): Promise<UserAuthResponse> =>
    apiClient.post("/auth/login/", data),

  register: (data: RegisterUserRequest): Promise<UserAuthResponse> =>
    apiClient.post("/auth/register", data),

  resetPin: (data: ResetPinRequest): Promise<ResetPinResponse> =>
    apiClient.post("/auth/forgot-pin/", data),

  getUserProfile: (emailId: string): Promise<any> =>
    apiClient.get(`/auth/user/${emailId}`),

  updateProfile: (emailId: string, data: any): Promise<any> =>
    apiClient.put(`/auth/user/${emailId}`, data),

  deleteAccount: (userId: string, pin: string): Promise<any> =>
    apiClient.post(`/auth/user-delete-account?user_id=${userId}&pin=${pin}`),
};

// Feed endpoints
export const feedApi = {
  getFeedTypes: (countryId: string, userId: string): Promise<string[]> =>
    apiClient.get(`/unique-feed-type/${countryId}/${userId}`),

  getFeedCategories: (
    feedType: string,
    countryId: string,
    userId: string
  ): Promise<FeedCategoryResponse> =>
    apiClient.get("/unique-feed-category/", {
      params: { feed_type: feedType, country_id: countryId, user_id: userId },
    }),

  getFeedSubCategories: (
    feedType: string,
    feedCategory: string,
    countryId: string,
    userId: string
  ): Promise<FeedSubCategory[]> =>
    apiClient.get("/feed-name/", {
      params: {
        feed_type: feedType,
        feed_category: feedCategory,
        country_id: countryId,
        user_id: userId,
      },
    }),

  getFeedDetails: (data: CheckInsertUpdateRequest): Promise<CheckInsertUpdateResponse> =>
    apiClient.post("/check-insert-or-update/", data),

  getFeedClassification: (): Promise<FeedClassificationResponse> =>
    apiClient.get("/feed-classification/structure"),
};

// Recommendation endpoints
export const recommendationApi = {
  getRecommendation: (
    data: FeedRecommendationRequest
  ): Promise<FeedRecommendationResponse> =>
    apiClient.post("/diet-recommendation-working/", data),

  getEvaluation: (
    data: FeedEvaluationRequest
  ): Promise<FeedEvaluationResponse> =>
    apiClient.post("/diet-evaluation-working/", data),
};

// Report endpoints
export const reportApi = {
  getUserReports: (userId: string): Promise<FeedReportResponse> =>
    apiClient.get(`/get-user-reports/`, {
      params: { user_id: userId },
    }),

  saveReport: (data: SaveReportRequest): Promise<SavedReportResponse> =>
    apiClient.post("/save-report/", data),

  // Generate and save PDF report to backend
  generatePdfReport: (
    simulationId: string,
    userId: string,
    apiResponse: any
  ): Promise<any> =>
    apiClient.post(`/generate-pdf-report/?simulation_id=${simulationId}&user_id=${userId}`, apiResponse),

  // Get user's PDF reports
  getUserPdfReports: (userId: string): Promise<any> =>
    apiClient.get(`/pdf-reports/${userId}`),
};

// Feedback endpoints
export const feedbackApi = {
  submitFeedback: (
    userId: string,
    data: SubmitFeedbackRequest
  ): Promise<SubmitFeedbackResponse> =>
    apiClient.post(`/user-feedback/submit?user_id=${userId}`, data),

  getUserFeedbacks: (
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<FeedbackResponse> =>
    apiClient.get("/user-feedback/my", {
      params: { user_id: userId, limit, offset },
    }),
};

// Country endpoints
export const countryApi = {
  getAllCountries: (): Promise<Country[]> =>
    apiClient.get("/auth/countries/"),
};

// Admin endpoints
export const adminApi = {
  getUsers: (
    adminUserId: string,
    page: number = 1,
    pageSize: number = 10,
    countryFilter?: string,
    statusFilter?: string,
    search?: string
  ): Promise<UserResponse> =>
    apiClient.get("/admin/users", {
      params: {
        admin_user_id: adminUserId,
        page,
        page_size: pageSize,
        country_filter: countryFilter,
        status_filter: statusFilter,
        search,
      },
    }),

  getFeeds: (
    adminUserId: string,
    page: number = 1,
    pageSize: number = 10,
    feedType?: string,
    feedCategory?: string,
    countryName?: string,
    search?: string
  ): Promise<AdminFeedListResponse> =>
    apiClient.get("/admin/list-feeds/", {
      params: {
        admin_user_id: adminUserId,
        page,
        page_size: pageSize,
        feed_type: feedType,
        feed_category: feedCategory,
        country_name: countryName,
        search,
      },
    }),

  getAllFeedbacks: (
    adminUserId: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<any> =>
    apiClient.get("/admin/user-feedback/all", {
      params: { admin_user_id: adminUserId, limit, offset },
    }),

  getFeedbackStats: (adminUserId: string): Promise<any> =>
    apiClient.get("/admin/user-feedback/stats", {
      params: { admin_user_id: adminUserId },
    }),

  getAllReports: (
    adminUserId: string,
    page: number = 1,
    pageSize: number = 10
  ): Promise<any> =>
    apiClient.get("/admin/get-all-reports/", {
      params: { user_id: adminUserId, page, page_size: pageSize },
    }),

  bulkUploadFeeds: (
    adminUserId: string,
    file: File
  ): Promise<AdminBulkUploadResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.post(`/admin/bulk-upload/?admin_user_id=${adminUserId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  exportFeeds: (adminUserId: string): Promise<AdminExportResponse> =>
    apiClient.get("/admin/export-feeds/", {
      params: { admin_user_id: adminUserId },
    }),

  exportCustomFeeds: (adminUserId: string): Promise<AdminExportResponse> =>
    apiClient.get("/admin/export-custom-feeds/", {
      params: { admin_user_id: adminUserId },
    }),

  listFeedTypes: (adminUserId: string): Promise<any[]> =>
    apiClient.get("/admin/feed-types/", {
      params: { admin_user_id: adminUserId },
    }),

  addFeedType: (adminUserId: string, data: { type_name: string; description?: string; sort_order?: number }): Promise<any> =>
    apiClient.post("/admin/feed-types/", data, {
      params: { admin_user_id: adminUserId },
    }),

  deleteFeedType: (adminUserId: string, typeId: string): Promise<any> =>
    apiClient.delete(`/admin/feed-types/${typeId}`, {
      params: { admin_user_id: adminUserId },
    }),

  listFeedCategories: (adminUserId: string): Promise<any[]> =>
    apiClient.get("/admin/feed-categories/", {
      params: { admin_user_id: adminUserId },
    }),

  addFeedCategory: (adminUserId: string, data: { category_name: string; feed_type_id: string; description?: string; sort_order?: number }): Promise<any> =>
    apiClient.post("/admin/feed-categories/", data, {
      params: { admin_user_id: adminUserId },
    }),

  deleteFeedCategory: (adminUserId: string, categoryId: string): Promise<any> =>
    apiClient.delete(`/admin/feed-categories/${categoryId}`, {
      params: { admin_user_id: adminUserId },
    }),

  addFeed: (adminUserId: string, data: any): Promise<any> =>
    apiClient.post("/admin/feeds/", data, {
      params: { admin_user_id: adminUserId },
    }),

  updateFeed: (adminUserId: string, feedId: string, data: any): Promise<any> =>
    apiClient.put(`/admin/feeds/${feedId}`, data, {
      params: { admin_user_id: adminUserId },
    }),

  deleteFeed: (adminUserId: string, feedId: string): Promise<any> =>
    apiClient.delete(`/admin/feeds/${feedId}`, {
      params: { admin_user_id: adminUserId },
    }),

  toggleUserStatus: (adminUserId: string, userId: string, data: { is_active: boolean }): Promise<any> =>
    apiClient.patch(`/admin/users/${userId}/status`, data, {
      params: { admin_user_id: adminUserId },
    }),
};

