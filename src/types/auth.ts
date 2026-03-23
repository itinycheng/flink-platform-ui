export interface User {
  id: string;
  username: string;
  roles: string[];
  permissions: string[];
}

export interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  checkToken: () => boolean;
}
