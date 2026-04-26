"use server";

import { verifyRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function resolveFlag(id: string) {
  await verifyRole("ADMIN");
  await prisma.flaggedDocument.update({
    where: { id },
    data: { status: "RESOLVED" },
  });
  revalidatePath("/admin/documentos");
  revalidatePath("/admin");
}
