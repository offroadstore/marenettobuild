import type { NextFunction, Request, Response } from "express";

export const internalRoles = ["owner", "editor", "viewer"] as const;
export type InternalRole = (typeof internalRoles)[number];

export type Permission =
  | "leads:read"
  | "leads:write"
  | "cms:read"
  | "cms:write"
  | "members:manage"
  | "attachments:manage"
  | "notifications:read"
  | "kpi:read"
  | "monitoring:manage";

const permissionsByRole: Record<InternalRole, readonly Permission[]> = {
  owner: [
    "leads:read",
    "leads:write",
    "cms:read",
    "cms:write",
    "members:manage",
    "attachments:manage",
    "notifications:read",
    "kpi:read",
    "monitoring:manage",
  ],
  editor: [
    "leads:read",
    "leads:write",
    "cms:read",
    "cms:write",
    "attachments:manage",
    "notifications:read",
    "kpi:read",
  ],
  viewer: ["leads:read", "cms:read", "notifications:read", "kpi:read"],
};

declare global {
  namespace Express {
    interface Request {
      internalMember?: {
        id: number;
        email: string;
        role: InternalRole;
      };
    }
  }
}

export function isInternalRole(value: string): value is InternalRole {
  return internalRoles.includes(value as InternalRole);
}

export function isActiveInternalMember(
  member: { role: string; status: string } | null | undefined,
): member is { role: InternalRole; status: "active" } {
  return Boolean(
    member &&
      member.status === "active" &&
      isInternalRole(member.role),
  );
}

export function hasPermission(
  role: InternalRole,
  permission: Permission,
): boolean {
  return permissionsByRole[role].includes(permission);
}

export function permissionsForRole(role: InternalRole): Permission[] {
  return [...permissionsByRole[role]];
}

export function requirePermission(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const member = req.internalMember;
    if (!member) {
      res.status(401).json({ error: "Sign in is required." });
      return;
    }
    if (!hasPermission(member.role, permission)) {
      res.status(403).json({ error: "This action is not allowed for your role." });
      return;
    }
    next();
  };
}
