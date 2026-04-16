export type RlsRule =
  | undefined
  | Record<string, unknown>;

export type AuthUser = {
  email: string;
  role: string;
  fullName?: string | null;
};

type Condition =
  | { created_by: "{{user.email}}" }
  | { user_condition: { role: string } }
  | { $or: Condition[] }
  | Record<string, unknown>;

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const matchesCondition = (condition: Condition, user: AuthUser | null, recordCreatedBy?: string | null) => {
  if (!isPlainObject(condition)) return false;

  if ("$or" in condition && Array.isArray((condition as any).$or)) {
    return (condition as any).$or.some((c: any) => matchesCondition(c, user, recordCreatedBy));
  }

  if ("user_condition" in condition) {
    const uc = (condition as any).user_condition;
    if (!user) return false;
    if (isPlainObject(uc) && typeof uc.role === "string") {
      return user.role === uc.role;
    }
  }

  if ("created_by" in condition) {
    if (!user) return false;
    const expected = (condition as any).created_by;
    if (expected === "{{user.email}}") {
      return !!recordCreatedBy && recordCreatedBy === user.email;
    }
  }

  return false;
};

export const isAllowed = (
  action: "create" | "read" | "update" | "delete",
  rule: RlsRule,
  user: AuthUser | null,
  recordCreatedBy?: string | null
) => {
  // Admin override: always allow
  if (user?.role === "admin") return true;

  if (!rule) return false;
  if (!isPlainObject(rule)) return false;
  if (Object.keys(rule).length === 0) return true;

  return matchesCondition(rule as any, user, recordCreatedBy);
};

export const needsAuth = (rule: RlsRule) => {
  if (!rule) return true;
  if (!isPlainObject(rule)) return true;
  if (Object.keys(rule).length === 0) return false;
  return true;
};

