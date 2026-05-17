import { User, UserRole } from "../../../core/models/auth.models";

export interface UserManagement extends User {
  active: boolean;
  createdAt: string;
}

export interface UserFilters {
  search?: string;
  role?: UserRole | null;
}

export interface PaginatedUsers {
  data: UserManagement[];
  total: number;
  page: number;
  limit: number;
}

export interface ListUsersParams {
  page: number,
  limit: number
  filters?: UserFilters
}
