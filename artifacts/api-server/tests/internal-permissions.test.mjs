import assert from "node:assert/strict";
import test from "node:test";
import {
  isActiveInternalMember,
  hasPermission,
  permissionsForRole,
  requirePermission,
} from "../src/middlewares/internalPermissions.ts";

const permissions = [
  "leads:read",
  "leads:write",
  "cms:read",
  "cms:write",
  "members:manage",
  "attachments:manage",
  "notifications:read",
  "kpi:read",
  "monitoring:manage",
];

test("owner has all internal permissions", () => {
  assert.deepEqual(
    permissionsForRole("owner").sort(),
    [...permissions].sort(),
  );
});

test("editor can edit leads, CMS and attachments but cannot manage members", () => {
  for (const permission of [
    "leads:read",
    "leads:write",
    "cms:read",
    "cms:write",
    "attachments:manage",
    "notifications:read",
  ]) {
    assert.equal(hasPermission("editor", permission), true, permission);
  }
  assert.equal(hasPermission("editor", "members:manage"), false);
  assert.equal(hasPermission("editor", "monitoring:manage"), false);
  assert.equal(hasPermission("editor", "kpi:read"), true);
  assert.equal(hasPermission("viewer", "monitoring:manage"), false);
  assert.equal(hasPermission("viewer", "kpi:read"), true);
});

test("viewer can read leads and CMS but cannot write or access private files", () => {
  for (const permission of ["leads:read", "cms:read", "notifications:read"]) {
    assert.equal(hasPermission("viewer", permission), true, permission);
  }
  for (const permission of [
    "leads:write",
    "cms:write",
    "members:manage",
    "attachments:manage",
  ]) {
    assert.equal(hasPermission("viewer", permission), false, permission);
  }
});

test("only active members with known roles pass the membership gate", () => {
  assert.equal(isActiveInternalMember({ role: "owner", status: "active" }), true);
  assert.equal(isActiveInternalMember({ role: "editor", status: "active" }), true);
  assert.equal(isActiveInternalMember({ role: "viewer", status: "active" }), true);
  assert.equal(isActiveInternalMember({ role: "editor", status: "invited" }), false);
  assert.equal(isActiveInternalMember({ role: "editor", status: "revoked" }), false);
  assert.equal(isActiveInternalMember({ role: "unrecognized", status: "active" }), false);
  assert.equal(isActiveInternalMember(null), false);
});

test("permission middleware rejects missing identities and disallowed roles", () => {
  const invoke = (internalMember) => {
    let statusCode;
    let body;
    let nextCalled = false;
    const req = { internalMember };
    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(value) {
        body = value;
        return this;
      },
    };
    requirePermission("attachments:manage")(req, res, () => {
      nextCalled = true;
    });
    return { statusCode, body, nextCalled };
  };

  assert.deepEqual(invoke(undefined), {
    statusCode: 401,
    body: { error: "Sign in is required." },
    nextCalled: false,
  });
  assert.deepEqual(
    invoke({ id: 1, email: "viewer@example.com", role: "viewer" }),
    {
      statusCode: 403,
      body: { error: "This action is not allowed for your role." },
      nextCalled: false,
    },
  );
  assert.deepEqual(
    invoke({ id: 2, email: "editor@example.com", role: "editor" }),
    { statusCode: undefined, body: undefined, nextCalled: true },
  );
});

test("returned permission lists cannot mutate the policy", () => {
  const permissions = permissionsForRole("viewer");
  permissions.push("attachments:manage");
  assert.equal(hasPermission("viewer", "attachments:manage"), false);
});
