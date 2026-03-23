export interface ResourceFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadTime: string;
  url: string;
}

export interface ManagedUser {
  id: string;
  username: string;
  email: string;
  roles: string[];
  status: "active" | "disabled";
  createdAt: string;
}

export interface EnvConfig {
  id: string;
  env: string;
  key: string;
  value: string;
  description?: string;
}

export interface CustomParam {
  id: string;
  name: string;
  value: string;
  type: "string" | "number" | "boolean" | "json";
  description?: string;
}
