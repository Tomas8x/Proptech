import { TransactionStage } from "@/generated/prisma";

export type StageConfig = {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  suggestedDocs: string[];
  next: TransactionStage | null;
};

export const TRANSACTION_STAGES: Record<TransactionStage, StageConfig> = {
  DOCUMENTACION: {
    label: "Documentación",
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    suggestedDocs: ["DNI del inquilino", "Comprobante de ingresos", "Formulario de garantía"],
    next: "CONTRATO",
  },
  CONTRATO: {
    label: "Contrato",
    color: "text-purple-700",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    suggestedDocs: ["Contrato de locación firmado", "Copia del garante", "Sellado de contrato"],
    next: "ACTIVO",
  },
  ACTIVO: {
    label: "Activo",
    color: "text-green-700",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    suggestedDocs: ["Primer mes de alquiler", "Depósito de garantía", "Acta de entrega de llaves"],
    next: "FINALIZADO",
  },
  FINALIZADO: {
    label: "Finalizado",
    color: "text-gray-600",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
    suggestedDocs: [],
    next: null,
  },
};

export const STAGE_ORDER: TransactionStage[] = [
  "DOCUMENTACION",
  "CONTRATO",
  "ACTIVO",
  "FINALIZADO",
];
