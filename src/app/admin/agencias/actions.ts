"use server";

import { verifyRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function approveAgency(id: string) {
  await verifyRole("ADMIN");
  await prisma.inmobiliariaProfile.update({
    where: { id },
    data: { isApproved: true, approvedAt: new Date() },
  });
  revalidatePath("/admin/agencias");
  revalidatePath("/admin");
}

export async function rejectAgency(id: string) {
  await verifyRole("ADMIN");
  await prisma.inmobiliariaProfile.update({
    where: { id },
    data: { isApproved: false, approvedAt: null },
  });
  revalidatePath("/admin/agencias");
  revalidatePath("/admin");
}
