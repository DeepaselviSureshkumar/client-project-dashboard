import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import { loginSchema } from "../validators/auth.js";
import { hashToken } from "../utils/hash.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt.js";
import { fail, ok } from "../utils/http.js";

const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: env.NODE_ENV === "production" ? "none" as const : "lax" as const,
  path: "/api/auth",
};

export async function login(req: Request, res: Response) {
  const body = loginSchema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { email: body.email } });
  if (!user || !(await bcrypt.compare(body.password, user.passwordHash))) {
    return fail(res, 401, "INVALID_CREDENTIALS", "Invalid email or password.");
  }

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user.id);

  await prisma.refreshToken.create({
    data: {
      tokenHash: hashToken(refreshToken),
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  });

  res.cookie("refreshToken", refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  return ok(res, {
    accessToken,
    user: { id: user.id, name: user.name, email: user.email, role: user.role }
  });
}

export async function refresh(req: Request, res: Response) {
  const token = req.cookies.refreshToken;
  if (!token) return fail(res, 401, "UNAUTHORIZED", "Refresh token missing.");

  try {
    const payload = verifyRefreshToken(token);
    const stored = await prisma.refreshToken.findUnique({
      where: { tokenHash: hashToken(token) },
      include: { user: true }
    });

    if (!stored || stored.expiresAt < new Date() || stored.user.id !== Number(payload.sub)) {
      return fail(res, 401, "UNAUTHORIZED", "Refresh token is invalid.");
    }

    await prisma.refreshToken.delete({ where: { id: stored.id } });

    const nextRefresh = signRefreshToken(stored.user.id);
    await prisma.refreshToken.create({
      data: {
        tokenHash: hashToken(nextRefresh),
        userId: stored.user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    res.cookie("refreshToken", nextRefresh, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return ok(res, { accessToken: signAccessToken(stored.user) });
  } catch {
    return fail(res, 401, "UNAUTHORIZED", "Refresh token is invalid or expired.");
  }
}

export async function logout(req: Request, res: Response) {
  const token = req.cookies.refreshToken;
  if (token) await prisma.refreshToken.deleteMany({ where: { tokenHash: hashToken(token) } });
  res.clearCookie("refreshToken", cookieOptions);
  return ok(res, { message: "Logged out." });
}

export async function me(req: Request, res: Response) {
  return ok(res, req.user);
}
