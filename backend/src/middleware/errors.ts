import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { fail } from "../utils/http.js";

export const notFound = (_req: any, res: any) =>
  fail(res, 404, "NOT_FOUND", "Route not found.");

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error(err);
  if (err instanceof ZodError) {
    return fail(res, 400, "VALIDATION_ERROR", "Request validation failed.", err.flatten());
  }
  return fail(res, 500, "INTERNAL_ERROR", "An unexpected server error occurred.");
};
