import axios, { AxiosInstance } from "axios";
import { getToken } from "./auth";
import type {
  Issue, PaginatedIssues, AIAnalysis, RiskScore,
  Assignment, Resolution, AdminDashboard, WorkerDashboard,
  CitizenDashboard, Hotspot, Ward, Notification, HeatCell, Worker, Department,
} from "@/types";

const API_URL  = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const BASE_URL = `${API_URL.replace(/\/$/, "")}/api`;

const client: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

client.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    client.post("/auth/login", { email, password }).then((r) => r.data),
  logout: () => client.post("/auth/logout").then((r) => r.data),
  me: () => client.get("/auth/me").then((r) => r.data),
  register: (data: { name: string; email: string; password: string; role?: string; ward_id?: string; department_id?: string }) =>
    client.post("/auth/register", data).then((r) => r.data),
};

// ─── Issues ──────────────────────────────────────────────────────────────────
export const issuesApi = {
  list: (params?: {
    status?: string; category?: string; ward_id?: string; officer_id?: string;
    priority?: string; limit?: number; offset?: number; role?: string; user_id?: string;
  }): Promise<PaginatedIssues> =>
    client.get("/issues/", { params }).then((r) => r.data),

  get: (id: string): Promise<{ issue: Issue; analysis: AIAnalysis | null; history: any[]; resolution?: any; voice?: any }> =>
    client.get(`/issues/${id}`).then((r) => r.data),

  create: (formData: FormData) =>
    client.post("/issues/", formData, { headers: {} }).then((r) => r.data),

  updateStatus: (id: string, status: string, changedBy: string, notes?: string) =>
    client.patch(`/issues/${id}/status`, null, {
      params: { status, changed_by: changedBy, notes: notes ?? "" },
    }).then((r) => r.data),

  getByUser: (userId: string): Promise<{ issues: Issue[] }> =>
    client.get(`/issues/citizen/${userId}`).then((r) => r.data),

  getByWorker: (workerId: string): Promise<{ issues: Issue[] }> =>
    client.get(`/issues/worker/${workerId}`).then((r) => r.data),
};

// ─── AI ──────────────────────────────────────────────────────────────────────
export const aiApi = {
  analyze: (issueId: string, imageFile: File) => {
    const fd = new FormData();
    fd.append("issue_id", issueId);
    fd.append("image", imageFile);
    return client.post("/ai/analyze", fd, { headers: {} }).then((r) => r.data);
  },
  quickAnalyze: (imageFile: File): Promise<{
    description: string; category: string; severity: string; risk_score: number;
    summary: string; immediate_action_required: boolean; estimated_repair_days: number; affected_population: string;
  }> => {
    const fd = new FormData();
    fd.append("image", imageFile);
    return client.post("/ai/quick-analyze", fd, { headers: {} }).then((r) => r.data);
  },
  getAnalysis: (issueId: string): Promise<AIAnalysis> =>
    client.get(`/ai/analysis/${issueId}`).then((r) => r.data),
};

// ─── Risk ─────────────────────────────────────────────────────────────────────
export const riskApi = {
  compute: (issueId: string): Promise<RiskScore> =>
    client.post(`/risk/compute/${issueId}`).then((r) => r.data),
  getScore: (issueId: string): Promise<RiskScore> =>
    client.get(`/risk/score/${issueId}`).then((r) => r.data),
  leaderboard: (limit = 10): Promise<{ issues: Issue[] }> =>
    client.get("/risk/leaderboard", { params: { limit } }).then((r) => r.data),
  recomputeAll: () => client.post("/risk/recompute-all").then((r) => r.data),
};

// ─── Assignments ─────────────────────────────────────────────────────────────
export const assignmentsApi = {
  assign: (data: { issue_id: string; officer_id: string; department_id: string; notes?: string }): Promise<{ assignment_id: string; sla_deadline: string }> =>
    client.post("/assignments/", data).then((r) => r.data),
  getByWorker: (workerId: string): Promise<{ assignments: Assignment[] }> =>
    client.get(`/assignments/worker/${workerId}`).then((r) => r.data),
  getByIssue: (issueId: string): Promise<{ assignments: Assignment[] }> =>
    client.get(`/assignments/issue/${issueId}`).then((r) => r.data),
  updateStatus: (assignmentId: string, status: string) =>
    client.patch(`/assignments/${assignmentId}`, { status }).then((r) => r.data),
};

// ─── Resolution ──────────────────────────────────────────────────────────────
export const resolutionApi = {
  resolve: (issueId: string, formData: FormData) =>
    client.post(`/resolution/${issueId}`, formData, { headers: {} }).then((r) => r.data),
  get: (issueId: string): Promise<Resolution> =>
    client.get(`/resolution/${issueId}`).then((r) => r.data),
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const dashboardApi = {
  admin: (): Promise<AdminDashboard> =>
    client.get("/dashboard/admin").then((r) => r.data),
  summary: (role = "admin", userId?: string) =>
    client.get("/dashboard/summary", { params: { role, user_id: userId } }).then((r) => r.data),
  worker: (workerId: string): Promise<WorkerDashboard> =>
    client.get(`/dashboard/worker/${workerId}`).then((r) => r.data),
  citizen: (userId: string): Promise<CitizenDashboard> =>
    client.get(`/dashboard/citizen/${userId}`).then((r) => r.data),
  analytics: (wardId?: string, days?: number) =>
    client.get("/dashboard/analytics", { params: { ward_id: wardId, days } }).then((r) => r.data),
  heatmap: (kind: "complaints" | "risk" = "risk", wardId?: string): Promise<{ kind: string; cells: HeatCell[] }> =>
    client.get("/dashboard/heatmap", { params: { kind, ward_id: wardId } }).then((r) => r.data),
  hotspots: (refresh = false): Promise<{ hotspots: Hotspot[] }> =>
    client.get("/dashboard/hotspots", { params: { refresh } }).then((r) => r.data),
  issuesMap: (status?: string, wardId?: string): Promise<{ issues: Partial<Issue>[] }> =>
    client.get("/dashboard/issues-map", { params: { status, ward_id: wardId } }).then((r) => r.data),
  priorityQueue: (officerId?: string, limit = 50): Promise<{ issues: Issue[] }> =>
    client.get("/dashboard/priority", { params: { officer_id: officerId, limit } }).then((r) => r.data),
  health: () => client.get("/dashboard/health").then((r) => r.data),
};

// ─── Workers ─────────────────────────────────────────────────────────────────
export const workersApi = {
  list: (department?: string): Promise<{ workers: Worker[] }> =>
    client.get("/workers/", { params: { department } }).then((r) => r.data),
  get: (workerId: string): Promise<Worker> =>
    client.get(`/workers/${workerId}`).then((r) => r.data),
  departments: (): Promise<{ departments: Department[] }> =>
    client.get("/workers/departments/list").then((r) => r.data),
  performance: (): Promise<{ workers: Worker[] }> =>
    client.get("/workers/performance/summary").then((r) => r.data),
};

// ─── Notifications ────────────────────────────────────────────────────────────
export const notificationsApi = {
  get: (userId?: string, role?: string, unread = false): Promise<{ notifications: Notification[]; unread_count: number }> =>
    client.get("/notifications/", { params: { user_id: userId, role, unread } }).then((r) => r.data),
  markRead: (id: string) =>
    client.patch(`/notifications/${id}/read`).then((r) => r.data),
  markAllRead: (userId: string) =>
    client.patch("/notifications/read-all", null, { params: { user_id: userId } }).then((r) => r.data),
  create: (data: { user_id?: string; role?: string; type: string; title: string; message: string; issue_id?: string }) =>
    client.post("/notifications/", data).then((r) => r.data),
};

export default client;
