/**
 * User Repository Interface (Domain Contract)
 * Authentication and user management contracts
 */

import { Result } from '../../shared/utils/result.util';
import { UserId } from '../value-objects/user-id.vo';

export interface User {
  id: UserId;
  email: string;
  name?: string;
  role: UserRole;
  isActive: boolean;
  emailVerified: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  PLATFORM_ADMIN = 'platform_admin',
  TENANT_ADMIN = 'tenant_admin', 
  ADMIN = 'admin',
  EDITOR = 'editor',
  VIEWER = 'viewer'
}

export interface IUserRepository {
  findById(id: UserId): Promise<Result<User | null>>;
  findByEmail(email: string): Promise<Result<User | null>>;
  save(user: User): Promise<Result<void>>;
  isEmailWhitelisted(email: string): Promise<Result<boolean>>;
  hasRole(userId: UserId, requiredRoles: UserRole[]): Promise<Result<boolean>>;
  updateLastLogin(userId: UserId): Promise<Result<void>>;
}