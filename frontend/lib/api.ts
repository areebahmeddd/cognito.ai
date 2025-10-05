import { getSession } from "next-auth/react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export class ApiClient {
  private async getAuthHeaders() {
    const session = await getSession();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (session?.accessToken) {
      headers.Authorization = `Bearer ${session.accessToken}`;
    }

    return headers;
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = await this.getAuthHeaders();

    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ detail: "Request failed" }));

      let errorMessage = "Request failed";
      if (typeof error === "string") {
        errorMessage = error;
      } else if (error && typeof error === "object") {
        if (error.detail) {
          errorMessage = error.detail;
        } else if (error.message) {
          errorMessage = error.message;
        } else if (error.error) {
          errorMessage = error.error;
        }
      }

      throw new Error(errorMessage || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async register(userData: {
    username: string;
    email: string;
    password: string;
    role: string;
  }) {
    return this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }

  async login(credentials: { username_or_email: string; password: string }) {
    return this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  }

  async getCurrentUser() {
    return this.request("/auth/me");
  }

  async updateUser(userData: {
    username?: string;
    email?: string;
    role?: string;
  }) {
    return this.request("/auth/me", {
      method: "PUT",
      body: JSON.stringify(userData),
    });
  }

  async changePassword(data: {
    current_password: string;
    new_password: string;
  }) {
    return this.request("/auth/change-password", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async deleteAccount() {
    return this.request("/auth/me", {
      method: "DELETE",
    });
  }

  async getCases() {
    return this.request("/cases/");
  }

  async createCase(caseData: {
    title: string;
    description?: string;
    priority_tag?: string;
  }) {
    return this.request("/cases/case", {
      method: "POST",
      body: JSON.stringify(caseData),
    });
  }

  async getCase(caseId: string) {
    return this.request(`/cases/${caseId}`);
  }

  async updateCase(caseId: string, caseData: any) {
    return this.request(`/cases/${caseId}`, {
      method: "PUT",
      body: JSON.stringify(caseData),
    });
  }

  async deleteCase(caseId: string) {
    return this.request(`/cases/${caseId}`, {
      method: "DELETE",
    });
  }

  async getCaseFiles(caseId: string) {
    return this.request(`/cases/${caseId}/files`);
  }

  async getCaseFile(caseId: string, fileName: string) {
    return this.request(`/cases/${caseId}/files/${fileName}`);
  }

  async archiveCase(caseId: string) {
    return this.request(`/cases/${caseId}/archive`, {
      method: "POST",
    });
  }

  async activateCase(caseId: string) {
    return this.request(`/cases/${caseId}/activate`, {
      method: "POST",
    });
  }

  async deleteUpload(caseId: string, zipName: string) {
    return this.request(`/cases/${caseId}/uploads/${zipName}`, {
      method: "DELETE",
    });
  }

  async uploadFile(file: File, caseId?: string, deviceId?: string) {
    const formData = new FormData();
    formData.append("file", file);
    if (caseId) formData.append("case_id", caseId);
    if (deviceId) formData.append("device_id", deviceId);

    const session = await getSession();
    const headers: Record<string, string> = {};

    if (session?.accessToken) {
      headers.Authorization = `Bearer ${session.accessToken}`;
    }

    const response = await fetch(`${API_BASE_URL}/data/upload`, {
      method: "POST",
      body: formData,
      headers,
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ detail: "Upload failed" }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async exportReport(apiResponse: any): Promise<Blob> {
    const session = await getSession();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (session?.accessToken) {
      headers.Authorization = `Bearer ${session.accessToken}`;
    }

    const response = await fetch(`${API_BASE_URL}/data/export`, {
      method: "POST",
      headers,
      body: JSON.stringify(apiResponse),
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ detail: "Export failed" }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.blob();
  }

  async getStats() {
    return this.request("/data/stats");
  }

  async searchQuery(query: string, caseId: string) {
    return this.request("/search/query", {
      method: "POST",
      body: JSON.stringify({ query, case_id: caseId }),
    });
  }

  async sendSupportEmail(formData: FormData) {
    const session = await getSession();
    const headers: Record<string, string> = {};

    if (session?.accessToken) {
      headers.Authorization = `Bearer ${session.accessToken}`;
    }

    const response = await fetch(`${API_BASE_URL}/users/email`, {
      method: "POST",
      body: formData,
      headers,
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ detail: "Failed to send email" }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }
}

export const apiClient = new ApiClient();
