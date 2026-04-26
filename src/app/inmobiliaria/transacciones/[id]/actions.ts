"use server";

import { verifyRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { TRANSACTION_STAGES } from "@/config/transaction";
import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { sendStageAdvanceEmail } from "@/lib/email/notifications";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getTransactionForUser(transactionId: string) {
  const user = await verifyRole("INMOBILIARIA");
  const profile = await prisma.inmobiliariaProfile.findUnique({ where: { userId: user.id } });
  if (!profile) throw new Error("No profile");

  const tx = await prisma.transaction.findFirst({
    where: { id: transactionId, postulacion: { property: { inmobiliariaId: profile.id } } },
  });
  if (!tx) throw new Error("Transaction not found");
  return { tx, user };
}

export async function advanceStage(transactionId: string) {
  const { tx, user } = await getTransactionForUser(transactionId);
  const next = TRANSACTION_STAGES[tx.stage].next;
  if (!next) return;

  const [, txFull] = await Promise.all([
    prisma.$transaction([
      prisma.transaction.update({ where: { id: transactionId }, data: { stage: next } }),
      prisma.transactionHistory.create({
        data: { transactionId, fromStage: tx.stage, toStage: next, changedById: user.id },
      }),
    ]),
    prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        postulacion: {
          include: {
            inquilino: { include: { user: true } },
            property: { include: { inmobiliaria: true } },
          },
        },
      },
    }),
  ]);

  if (txFull) {
    void sendStageAdvanceEmail({
      toEmail: txFull.postulacion.inquilino.user.email!,
      tenantName: `${txFull.postulacion.inquilino.firstName} ${txFull.postulacion.inquilino.lastName}`,
      propertyTitle: txFull.postulacion.property.title,
      propertyAddress: txFull.postulacion.property.address,
      agencyName: txFull.postulacion.property.inmobiliaria.companyName,
      newStage: next,
      portalToken: txFull.portalToken,
    });
  }

  revalidatePath(`/inmobiliaria/transacciones/${transactionId}`);
  revalidatePath("/inmobiliaria/transacciones");
}

export async function addNote(transactionId: string, body: string) {
  const { tx, user } = await getTransactionForUser(transactionId);

  await prisma.transactionNote.create({
    data: { transactionId, stage: tx.stage, body, authorId: user.id },
  });

  revalidatePath(`/inmobiliaria/transacciones/${transactionId}`);
}

export async function uploadTransactionDoc(transactionId: string, formData: FormData) {
  const { tx, user } = await getTransactionForUser(transactionId);
  const file = formData.get("file") as File | null;
  const label = formData.get("label") as string;

  if (!file || file.size === 0 || !label) return;

  const ext = file.name.split(".").pop();
  const key = `transactions/${transactionId}/${Date.now()}.${ext}`;
  const bytes = await file.arrayBuffer();

  const { error } = await supabase.storage
    .from("documents")
    .upload(key, bytes, { upsert: false, contentType: file.type });

  if (error) throw new Error(error.message);

  const { data: urlData } = supabase.storage.from("documents").getPublicUrl(key);

  await prisma.transactionDocument.create({
    data: { transactionId, stage: tx.stage, label, url: urlData.publicUrl, uploadedById: user.id },
  });

  revalidatePath(`/inmobiliaria/transacciones/${transactionId}`);
}
