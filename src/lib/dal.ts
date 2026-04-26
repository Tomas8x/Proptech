import { cache } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const verifySession = cache(async () => {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session.user as { id: string; email: string; role: string };
});

export const verifyRole = cache(async (role: string) => {
  const user = await verifySession();
  if (user.role !== role) redirect(`/${user.role.toLowerCase()}`);
  return user;
});
