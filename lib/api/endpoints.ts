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
  AdminFeedResponse,
  UserResponse,
  Country,
  FeedDetails,
  FeedSubCategory,
  FeedCategoryResponse,
  CheckInsertUpdateRequest,
  CheckInsertUpdateResponse,
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
  ): Promise<AdminFeedResponse> =>
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
};

