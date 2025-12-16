// Auth Types
export interface Country {
  id: string;
  name: string;
  country_code: string;
  currency?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface User {
  id: string;
  country: Country;
  country_id?: string;
  email_id?: string;
  name?: string;
  created_at?: string;
  updated_at?: string;
  is_admin?: boolean;
  is_active?: boolean;
}

export interface UserAuthResponse {
  message?: string;
  success: boolean;
  user: User;
}

export interface UserLoginRequest {
  email_id: string;
  pin: string;
}

export interface RegisterUserRequest {
  country_id: string;
  email_id: string;
  name: string;
  pin: string;
}

export interface ResetPinRequest {
  email_id: string;
}

export interface ResetPinResponse {
  success: boolean;
  message: string;
}

// Feed Types
export interface CattleInfo {
  breed: string;
  bc_score: number;
  body_weight: number;
  calving_interval: number;
  bw_gain: number;
  days_in_milk: number;
  days_of_pregnancy: number;
  distance: number;
  grazing: boolean;
  lactating: boolean;
  fat_milk: number;
  milk_production: number;
  tp_milk: number;
  parity: number;
  temperature: number;
  topography: string;
}

export interface FeedRecommendation {
  feed_id: string;
  price_per_kg: number;
}

export interface FeedRecommendationRequest {
  cattle_info: CattleInfo;
  feed_selection: FeedRecommendation[];
  simulation_id: string;
  user_id: string;
}

export interface FeedRecommendationResponse {
  report_info?: {
    simulation_id: string;
    report_id: string;
    user_name: string;
    generated_date: string;
  };
  solution_summary?: {
    daily_cost: number;
    milk_production: string;
    dry_matter_intake: string;
  };
  animal_information?: any;
  least_cost_diet?: Array<{
    feed_name: string;
    quantity_kg_per_day: number;
    price_per_kg: number;
    daily_cost: number;
  }>;
  total_diet_cost?: number;
  environmental_impact?: any;
  additional_information?: {
    warnings: string[];
    recommendations: string[];
  };
  [key: string]: any;
}

export interface FeedEvaluationRequest {
  cattle_info: CattleInfo;
  feed_selection: FeedRecommendation[];
  simulation_id: string;
  user_id: string;
}

export interface FeedEvaluationResponse {
  simulation_id: string;
  report_id: string;
  currency: string;
  country: string;
  evaluation_summary?: {
    overall_status: string;
    limiting_factor: string;
  };
  milk_production_analysis?: any;
  intake_evaluation?: any;
  cost_analysis?: any;
  methane_analysis?: any;
  nutrient_balance?: any;
  feed_breakdown?: Array<{
    feed_id: string;
    feed_name: string;
    feed_type: string;
    quantity_as_fed_kg_per_day: number;
    quantity_dm_kg_per_day: number;
    price_per_kg: number;
    total_cost: number;
    contribution_percent: number;
  }>;
  [key: string]: any;
}

// Feed Classification Types
export interface FeedType {
  id: string;
  name: string;
}

export interface FeedCategory {
  id: string;
  name: string;
  feed_type: string;
}

export interface FeedSubCategory {
  feed_cd: string;
  row_id: number;
  feed_uuid: string;
  feed_name: string;
  feed_category: string;
  feed_type: string;
}

export interface FeedDetails {
  feed_id: string;
  fd_code: string | number;
  fd_name: string;
  fd_type?: string;
  fd_category?: string;
  fd_country_id?: string;
  fd_country_name?: string;
  fd_country_cd?: string;
  fd_dm?: number;
  fd_ash?: number;
  fd_cp?: number;
  fd_ee?: number;
  fd_st?: number;
  fd_ndf?: number;
  fd_adf?: number;
  fd_lg?: number;
  fd_ndin?: number;
  fd_adin?: number;
  fd_ca?: number;
  fd_p?: number;
  fd_cf?: number;
  fd_nfe?: number;
  fd_hemicellulose?: number;
  fd_cellulose?: number;
  fd_orginin?: string;
  fd_ipb_local_lab?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CheckInsertUpdateRequest {
  feed_id: string;
  user_id: string;
  country_id: string;
}

export interface CheckInsertUpdateResponse {
  insert_feed: boolean;
  user_id: string;
  country_id: string;
  feed_details: FeedDetails;
}

export interface FeedCategoryResponse {
  feed_type: string;
  unique_feed_categories: string[];
}

export interface FeedClassificationResponse {
  feed_classification: Array<{
    type: string;
    categories: string[];
  }>;
}

// Report Types
export interface Report {
  id: string;
  simulation_id: string;
  user_id: string;
  created_at: string;
  cattle_info: CattleInfo;
  [key: string]: any;
}

export interface UserReportItem {
  bucket_url: string;
  user_name: string;
  report_id: string;
  report_type: string;
  report_created_date: string;
  simulation_id: string;
}

export interface FeedReportResponse {
  success: boolean;
  message: string;
  reports: UserReportItem[];
  total_count?: number;
}

export interface SaveReportRequest {
  report_id: string;
  user_id: string;
}

export interface SavedReportResponse {
  success: boolean;
  message: string;
  bucket_url?: string;
  error_message?: string;
}

// Feedback Types
export interface Feedback {
  id: string;
  overall_rating?: number;
  text_feedback?: string;
  feedback_type: string;
  created_at: string;
}

export interface SubmitFeedbackRequest {
  feedback_type: string;
  overall_rating?: number;
  text_feedback?: string;
}

export interface SubmitFeedbackResponse {
  id: string;
  overall_rating?: number;
  text_feedback?: string;
  feedback_type: string;
  created_at: string;
}

export interface FeedbackResponse {
  feedbacks: Feedback[];
  total_count: number;
}

// Admin Types
export interface AdminFeed {
  id: string;
  name: string;
  feed_type: string;
  feed_category: string;
  country_name: string;
  [key: string]: any;
}

export interface AdminFeedResponse {
  feeds: AdminFeed[];
  total: number;
  page: number;
  page_size: number;
}

export interface AdminUser {
  id: string;
  name: string;
  email_id: string;
  country: Country;
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
}

export interface UserResponse {
  users: AdminUser[];
  total: number;
  page: number;
  page_size: number;
}

// API Error Types
export interface ApiError {
  message: string;
  status?: number;
  errors?: Record<string, string[]>;
}

