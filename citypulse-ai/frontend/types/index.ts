// ─── User ────────────────────────────────────────────────────────────────────
export type Role = "citizen" | "worker" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  ward: string;
  ward_id?: string;
  department_id?: string;
}

// ─── Issues ──────────────────────────────────────────────────────────────────
export type IssueStatus =
  | "open"
  | "ai_analyzed"
  | "verified"
  | "assigned"
  | "in_progress"
  | "resolved"
  | "ai_verified"
  | "reopened"
  | "closed";

export type IssuePriority = "low" | "medium" | "high" | "critical";

export type IssueCategory =
  | "pothole"
  | "streetlight"
  | "garbage"
  | "sewage"
  | "footpath"
  | "water_leak"
  | "road_damage"
  | "electrical_hazard"
  | "park_damage"
  | "tree_hazard"
  | "traffic_signal"
  | "waterlogging"
  | "manhole"
  | "crack"
  | "fallen_tree"
  | "drain"
  | "other";

export interface Issue {
  id: string;
  issue_code?: string;
  title: string;
  description: string;
  category: IssueCategory;
  status: IssueStatus;
  priority: IssuePriority;
  risk_score: number;
  ward: string;
  ward_id?: string;
  latitude: number;
  longitude: number;
  reporter_id?: string;
  reported_by?: string;
  assigned_to?: string;
  department_id?: string;
  image_path: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  severity?: string;
  is_duplicate?: boolean;
  duplicate_of?: string;
}

// ─── AI Analysis ─────────────────────────────────────────────────────────────
export interface AIAnalysis {
  id: string;
  issue_id: string;
  model?: string;
  category?: string;
  confidence?: number;
  severity?: string;
  summary?: string;
  reasoning?: string;
  recommended_action?: string;
  estimated_repair_days?: number;
  affected_population?: string;
  gemini_description?: string;
  gemini_category?: string;
  gemini_severity?: string;
  yolo_detections?: string;
  yolo_confidence?: number;
  dinov2_embedding_path?: string;
  ai_risk_score?: number;
  ai_summary?: string;
  analyzed_at?: string;
  created_at?: string;
}

// ─── Risk ─────────────────────────────────────────────────────────────────────
export interface RiskScore {
  id: string;
  issue_id: string;
  severity_score?: number;
  exposure_score?: number;
  location_score?: number;
  recurrence_score?: number;
  weather_score?: number;
  frequency_score?: number;
  final_score: number;
  priority: string;
  reasoning?: string;
  created_at?: string;
}

// ─── Assignment ───────────────────────────────────────────────────────────────
export interface Assignment {
  id: string;
  issue_id: string;
  department_id: string;
  officer_id: string;
  assigned_at: string;
  sla_deadline: string;
  status: string;
}

// ─── Resolution ──────────────────────────────────────────────────────────────
export interface Resolution {
  id: string;
  issue_id: string;
  officer_id: string;
  before_image: string;
  after_image: string;
  notes: string;
  started_at: string;
  completed_at: string;
  time_taken_hours: number;
  verification_status: string;
  verification_score: number;
  verification_reason: string;
  resolved_at: string;
}

// ─── Hotspot ──────────────────────────────────────────────────────────────────
export interface Hotspot {
  id: string;
  name?: string;
  ward: string;
  ward_id?: string;
  latitude: number;
  longitude: number;
  radius_meters?: number;
  issue_count: number;
  dominant_category?: string;
  avg_risk_score: number;
  severity: IssuePriority;
  trend?: string;
  prediction?: string;
  detected_at?: string;
  is_active?: boolean;
  created_at?: string;
}

// ─── Ward ─────────────────────────────────────────────────────────────────────
export interface Ward {
  id: string;
  name: string;
  lat_center?: number;
  lng_center?: number;
  population?: number;
  area_sqkm?: number;
  councillor?: string;
  contact_email?: string;
  total_issues: number;
  open_issues: number;
  resolved_issues: number;
  health_score: number;
}

// ─── Department ───────────────────────────────────────────────────────────────
export interface Department {
  id: string;
  name: string;
  category: string;
  sla_hours: number;
  head?: string;
  email?: string;
  phone?: string;
  active_workers?: number;
  total_issues?: number;
  open_issues?: number;
  resolved_issues?: number;
  sla_compliance?: number;
}

// ─── Worker ───────────────────────────────────────────────────────────────────
export interface Worker {
  id: string;
  name: string;
  email: string;
  role: "worker";
  ward_id?: string;
  department_id?: string;
  active_issues?: number;
  resolved_issues?: number;
  total_issues?: number;
  performance_score?: number;
  avg_resolve_hours?: number;
}

// ─── Notification ─────────────────────────────────────────────────────────────
export interface Notification {
  id: string;
  user_id: string;
  role: string;
  type: "assignment" | "status_update" | "resolution" | "alert";
  title: string;
  message: string;
  issue_id?: string;
  read: string; // "true" | "false" (CSV-stored)
  created_at: string;
}

// ─── Heatmap Cell ─────────────────────────────────────────────────────────────
export interface HeatCell {
  latitude: number;
  longitude: number;
  value: number;
  intensity: number;
  issue_count: number;
  avg_risk_score: number;
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
export interface AdminDashboard {
  health_score: number;
  total_issues: number;
  open_issues: number;
  in_progress: number;
  resolved_issues: number;
  critical_issues: number;
  active_hotspots: number;
  total_wards: number;
  category_breakdown: Record<string, number>;
  wards: Ward[];
  hotspots: Hotspot[];
}

export interface WorkerDashboard {
  assigned_count: number;
  resolved_today: number;
  priority_queue: Issue[];
}

export interface CitizenDashboard {
  total_reported: number;
  open: number;
  in_progress: number;
  resolved: number;
  recent_issues: Issue[];
}

// ─── API Responses ────────────────────────────────────────────────────────────
export interface ApiError {
  detail: string;
}

export interface PaginatedIssues {
  total: number;
  issues: Issue[];
}
