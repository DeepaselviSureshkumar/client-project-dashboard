import jwt from "jsonwebtoken";

export type UserRole =
  | "ADMIN"
  | "PROJECT_MANAGER"
  | "DEVELOPER";

export interface AccessTokenPayload extends jwt.JwtPayload {
  sub: string;
  userId: number;
  email: string;
  role: UserRole;
  type: "access";
}

export interface RefreshTokenPayload extends jwt.JwtPayload {
  sub: string;
  type: "refresh";
}

function getSecret(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not configured`);
  }

  return value;
}

const accessSecret = getSecret("JWT_ACCESS_SECRET");
const refreshSecret = getSecret("JWT_REFRESH_SECRET");

export function signAccessToken(user: {
  id: number;
  email: string;
  role: UserRole;
}): string {
  const payload = {
    sub: String(user.id),
    userId: user.id,
    email: user.email,
    role: user.role,
    type: "access" as const,
  };

  return jwt.sign(payload, accessSecret, {
    expiresIn: 15 * 60,
  });
}

export function signRefreshToken(userId: number): string {
  const payload = {
    sub: String(userId),
    type: "refresh" as const,
  };

  return jwt.sign(payload, refreshSecret, {
    expiresIn: 7 * 24 * 60 * 60,
  });
}

export function verifyAccessToken(
  token: string
): AccessTokenPayload {
  const decoded = jwt.verify(token, accessSecret);

  if (typeof decoded === "string") {
    throw new Error("Invalid access token");
  }

  return decoded as unknown as AccessTokenPayload;
}

export function verifyRefreshToken(
  token: string
): RefreshTokenPayload {
  const decoded = jwt.verify(token, refreshSecret);

  if (typeof decoded === "string") {
    throw new Error("Invalid refresh token");
  }

  if (
    typeof decoded.sub !== "string" ||
    decoded.type !== "refresh"
  ) {
    throw new Error("Invalid refresh token");
  }

  return decoded as unknown as RefreshTokenPayload;
}