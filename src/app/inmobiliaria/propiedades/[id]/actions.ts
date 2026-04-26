"use server";

import { verifyRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { PostulacionStatus, PropertyStatus } from "@/generated/prisma";
import { revalidatePath } from "next/cache";

export async function updatePostulacionStatus(postulacionId: string, status: PostulacionStatus) {
  const user = await verifyRole("INMOBILIARIA");
  await prisma.postulacion.update({ where: { id: postulacionId }, data: { status } });

  if (status === "APROBADA") {
    const existing = await prisma.transaction.findUnique({ where: { postulacionId } });
    if (!existing) {
      const tx = await prisma.transaction.create({ data: { postulacionId } });
      await prisma.transactionHistory.create({
        data: { transactionId: tx.id, toStage: "DOCUMENTACION", changedById: user.id },
      });
    }
  }

  revalidatePath(`/inmobiliaria/propiedades`);
  revalidatePath("/inmobiliaria/transacciones");
}

export async function updatePropertyStatus(propertyId: string, status: PropertyStatus) {
  await verifyRole("INMOBILIARIA");
  await prisma.property.update({ where: { id: propertyId }, data: { status } });
  revalidatePath(`/inmobiliaria/propiedades/${propertyId}`);
}
