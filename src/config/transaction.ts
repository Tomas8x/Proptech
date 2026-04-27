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
    color: "text-blue-800",
    bgColor: "bg-blue-100",
    borderColor: "border-blue-300",
    suggestedDocs: ["DNI del inquilino", "Comprobante de ingresos", "Formulario de garantía"],
    next: "CONTRATO",
  },
  CONTRATO: {
    label: "Contrato",
    color: "text-purple-800",
    bgColor: "bg-purple-100",
    borderColor: "border-purple-300",
    suggestedDocs: ["Contrato de locación firmado", "Copia del garante", "Sellado de contrato"],
    next: "ACTIVO",
  },
  ACTIVO: {
    label: "Activo",
    color: "text-green-800",
    bgColor: "bg-green-100",
    borderColor: "border-green-300",
    suggestedDocs: ["Primer mes de alquiler", "Depósito de garantía", "Acta de entrega de llaves"],
    next: "FINALIZADO",
  },
  FINALIZADO: {
    label: "Finalizado",
    color: "text-gray-700",
    bgColor: "bg-gray-100",
    borderColor: "border-gray-300",
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
