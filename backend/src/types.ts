import type { Role } from "./generated/prisma/enums.js";

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: Role;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
