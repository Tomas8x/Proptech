import type { DefaultSession } from "next-auth";
import type { DefaultJWT } from "@auth/core/jwt";

type UserRole = "INQUILINO" | "INMOBILIARIA" | "ADMIN";

declare module "next-auth" {
  interface User {
    role: UserRole;
  }

  interface Session {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role: UserRole;
  }
}
