export const ROLE_RUNNER = "runner";
export const ROLE_ADMIN = "admin";
export const ROLE_PARTNER = "partner";
export const ROLE_LEADER = "leader";

export type RoleCode =
  | typeof ROLE_RUNNER
  | typeof ROLE_ADMIN
  | typeof ROLE_PARTNER
  | typeof ROLE_LEADER
  | string;

export interface AuthenticatedUser {
  id: string;
  email: string;
  roles: string[];
}

export interface AccessTokenPayload {
  sub: string;
  email: string;
  roles: string[];
}
