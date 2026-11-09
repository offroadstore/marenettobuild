import { clerkClient, getAuth } from "@clerk/express";
import type { NextFunction, Request, Response } from "express";
import { and, eq } from "drizzle-orm";
import { db, internalMembersTable } from "@workspace/db";
import { isActiveInternalMember, isInternalRole } from "./internalPermissions";
import type { InternalRole } from "./internalPermissions";

export { permissionsForRole, requirePermission } from "./internalPermissions";
export type { InternalRole } from "./internalPermissions";

function configuredInvites(): Array<{ email: string; role: InternalRole }> {
  return (process.env.INTERNAL_INVITES ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .flatMap((entry) => {
      const [rawEmail, rawRole] = entry.split(":");
      const email = rawEmail?.trim().toLowerCase();
      const role = rawRole?.trim().toLowerCase() ?? "";
      if (
        !email ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        !isInternalRole(role)
      ) {
        return [];
      }
      return [{ email, role }];
    });
}

async function seedConfiguredInvites(): Promise<void> {
  const invites = configuredInvites();
  if (invites.length === 0) return;
  await db
    .insert(internalMembersTable)
    .values(
      invites.map(({ email, role }) => ({
        email,
        role,
        status: "invited",
      })),
    )
    .onConflictDoNothing({ target: internalMembersTable.email });
}

export async function requireInternalAccess(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      res.status(401).json({ error: "Sign in is required." });
      return;
    }

    await seedConfiguredInvites();
    const user = await clerkClient.users.getUser(userId);
    const primaryEmail = user.primaryEmailAddress;
    const email = primaryEmail?.emailAddress.trim().toLowerCase();
    if (!email || !primaryEmail || primaryEmail.verification?.status !== "verified") {
      res.status(403).json({ error: "An invited email address is required." });
      return;
    }

    let [member] = await db
      .select()
      .from(internalMembersTable)
      .where(
        and(
          eq(internalMembersTable.email, email),
          eq(internalMembersTable.status, "active"),
        ),
      )
      .limit(1);

    if (!member) {
      const [invitation] = await db
        .select()
        .from(internalMembersTable)
        .where(
          and(
            eq(internalMembersTable.email, email),
            eq(internalMembersTable.status, "invited"),
          ),
        )
        .limit(1);
      if (invitation) {
        [member] = await db
          .update(internalMembersTable)
          .set({ status: "active" })
          .where(eq(internalMembersTable.id, invitation.id))
          .returning();
      }
    }

    if (!isActiveInternalMember(member)) {
      res.status(403).json({ error: "This account does not have an active invitation." });
      return;
    }

    req.internalMember = { id: member.id, email, role: member.role };
    next();
  } catch (error) {
    req.log.error({ err: error }, "Could not verify internal access");
    res.status(503).json({ error: "Internal access could not be verified." });
  }
}
