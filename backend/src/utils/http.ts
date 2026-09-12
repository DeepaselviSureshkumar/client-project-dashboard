import type { Response } from "express";

export function ok(res: Response, data: unknown, status = 200) {
  return res.status(status).json({ success: true, data });
}

export function fail(res: Response, status: number, code: string, message: string, details?: unknown) {
  return res.status(status).json({
    success: false,
    error: { code, message, ...(details === undefined ? {} : { details }) }
  });
}
