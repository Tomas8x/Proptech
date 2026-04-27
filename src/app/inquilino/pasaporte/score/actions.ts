"use server";

import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { computeConfidenceScore } from "@/lib/ai/confidenceScore";
import { redirect } from "next/navigation";

export async function computeScore() {
  const user = await verifySession();

  const profile = await prisma.inquilinoProfile.findUnique({
    where: { userId: user.id },
    include: { confianzaScore: true },
  });

  if (!profile) redirect("/inquilino/pasaporte/perfil");
  if (profile.confianzaScore) return;

  const result = await computeConfidenceScore({
    monthlyIncome: Number(profile.monthlyIncome),
    guaranteeType: profile.guaranteeType,
    profileType: profile.profileType,
    dniImagePath: profile.dniImagePath,
    incomeDocPath: profile.incomeDocPath,
  });

  await prisma.confianzaScore.create({
    data: {
      inquilinoId: profile.id,
      score: result.score,
      dimensions: result.dimensions,
      improvementText: result.improvement_text,
    },
  });

  const flags: { documentType: "DNI" | "INCOME"; reason: string }[] = [];

  if (result.dimensions.docQuality === "Baja") {
    flags.push({
      documentType: "DNI",
      reason: `Calidad de documento baja detectada por IA. Score Confianza: ${result.score}/100.`,
    });
  }

  if (result.dimensions.completeness === "Incompleto" && profile.incomeDocPath) {
    flags.push({
      documentType: "INCOME",
      reason: `Comprobante de ingresos incompleto o ilegible. Score Confianza: ${result.score}/100.`,
    });
  }

  if (result.score < 35 && flags.length === 0) {
    flags.push({
      documentType: profile.dniImagePath ? "DNI" : "INCOME",
      reason: `Score Confianza muy bajo (${result.score}/100). Revisión manual requerida.`,
    });
  }

  if (flags.length > 0) {
    await prisma.flaggedDocument.createMany({
      data: flags.map((f) => ({ ...f, inquilinoId: profile.id })),
    });
  }

  redirect("/inquilino/pasaporte/score");
}
