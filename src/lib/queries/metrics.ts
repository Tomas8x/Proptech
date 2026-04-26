import { prisma } from "@/lib/prisma";

export async function getInmobiliariaMetrics(inmobiliariaId: string) {
  const [
    activeProperties,
    transactionsByStage,
    finalizadoTransactions,
    propertiesWithCandidates,
  ] = await Promise.all([
    prisma.property.count({
      where: { inmobiliariaId, status: { in: ["DISPONIBLE", "RESERVADA", "ALQUILADA"] } },
    }),
    prisma.transaction.groupBy({
      by: ["stage"],
      where: { postulacion: { property: { inmobiliariaId } } },
      _count: { stage: true },
    }),
    prisma.transaction.findMany({
      where: {
        postulacion: { property: { inmobiliariaId } },
        stage: "FINALIZADO",
      },
      select: {
        createdAt: true,
        history: {
          where: { toStage: "FINALIZADO" },
          select: { changedAt: true },
          orderBy: { changedAt: "desc" },
          take: 1,
        },
      },
    }),
    prisma.property.findMany({
      where: { inmobiliariaId },
      select: {
        _count: { select: { postulaciones: true, manualCandidates: true } },
      },
    }),
  ]);

  const stageMap: Record<string, number> = {};
  for (const row of transactionsByStage) {
    stageMap[row.stage] = row._count.stage;
  }

  let avgClosingDays: number | null = null;
  if (finalizadoTransactions.length > 0) {
    const totalDays = finalizadoTransactions.reduce((sum, t) => {
      const end = t.history[0]?.changedAt ?? t.createdAt;
      const diffMs = end.getTime() - t.createdAt.getTime();
      return sum + diffMs / (1000 * 60 * 60 * 24);
    }, 0);
    avgClosingDays = Math.round(totalDays / finalizadoTransactions.length);
  }

  const totalCandidates = propertiesWithCandidates.reduce(
    (sum, p) => sum + p._count.postulaciones + p._count.manualCandidates,
    0
  );
  const avgCandidatesPerProperty =
    propertiesWithCandidates.length > 0
      ? +(totalCandidates / propertiesWithCandidates.length).toFixed(1)
      : 0;

  return {
    activeProperties,
    stageMap,
    avgClosingDays,
    avgCandidatesPerProperty,
    totalProperties: propertiesWithCandidates.length,
    finalizadoCount: finalizadoTransactions.length,
  };
}
