Loaded Prisma config from prisma.config.ts.

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('INQUILINO', 'INMOBILIARIA', 'ADMIN');

-- CreateEnum
CREATE TYPE "GuaranteeType" AS ENUM ('PROPIETARIO', 'FIANZA', 'SEGURO_CAUCION', 'NINGUNA');

-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('DEPARTAMENTO', 'CASA', 'PH', 'LOCAL', 'OFICINA');

-- CreateEnum
CREATE TYPE "PropertyStatus" AS ENUM ('DISPONIBLE', 'RESERVADA', 'ALQUILADA', 'INACTIVA');

-- CreateEnum
CREATE TYPE "PostulacionStatus" AS ENUM ('PENDIENTE', 'EN_EVALUACION', 'APROBADA', 'RECHAZADA', 'RETIRADA');

-- CreateEnum
CREATE TYPE "TransactionStage" AS ENUM ('POSTULACION', 'EVALUACION', 'DOCUMENTACION', 'CONTRATO', 'ACTIVO', 'FINALIZADO');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('DNI', 'INCOME');

-- CreateEnum
CREATE TYPE "FlaggedDocumentStatus" AS ENUM ('PENDING', 'RESOLVED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InquilinoProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dni" TEXT NOT NULL,
    "phone" TEXT,
    "monthlyIncome" DECIMAL(12,2) NOT NULL,
    "guaranteeType" "GuaranteeType" NOT NULL,
    "dniImagePath" TEXT,
    "incomeDocPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InquilinoProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InmobiliariaProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "cuit" TEXT NOT NULL,
    "phone" TEXT,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InmobiliariaProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "inmobiliariaId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "neighborhood" TEXT,
    "city" TEXT NOT NULL DEFAULT 'Buenos Aires',
    "price" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ARS',
    "bedrooms" INTEGER NOT NULL,
    "bathrooms" INTEGER NOT NULL DEFAULT 1,
    "area" DECIMAL(8,2) NOT NULL,
    "propertyType" "PropertyType" NOT NULL,
    "status" "PropertyStatus" NOT NULL DEFAULT 'DISPONIBLE',
    "description" TEXT,
    "images" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Postulacion" (
    "id" TEXT NOT NULL,
    "inquilinoId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "status" "PostulacionStatus" NOT NULL DEFAULT 'PENDIENTE',
    "transactionStage" "TransactionStage" NOT NULL DEFAULT 'POSTULACION',
    "compatibilityPct" INTEGER,
    "compatibilityExplanation" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Postulacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerazScore" (
    "id" TEXT NOT NULL,
    "inquilinoId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "range" TEXT NOT NULL,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerazScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfianzaScore" (
    "id" TEXT NOT NULL,
    "inquilinoId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "dimensions" JSONB NOT NULL,
    "improvementText" TEXT NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConfianzaScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlaggedDocument" (
    "id" TEXT NOT NULL,
    "inquilinoId" TEXT NOT NULL,
    "documentType" "DocumentType" NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "FlaggedDocumentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FlaggedDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "InquilinoProfile_userId_key" ON "InquilinoProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "InquilinoProfile_dni_key" ON "InquilinoProfile"("dni");

-- CreateIndex
CREATE UNIQUE INDEX "InmobiliariaProfile_userId_key" ON "InmobiliariaProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "InmobiliariaProfile_cuit_key" ON "InmobiliariaProfile"("cuit");

-- CreateIndex
CREATE UNIQUE INDEX "Postulacion_inquilinoId_propertyId_key" ON "Postulacion"("inquilinoId", "propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "VerazScore_inquilinoId_key" ON "VerazScore"("inquilinoId");

-- CreateIndex
CREATE UNIQUE INDEX "ConfianzaScore_inquilinoId_key" ON "ConfianzaScore"("inquilinoId");

-- AddForeignKey
ALTER TABLE "InquilinoProfile" ADD CONSTRAINT "InquilinoProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InmobiliariaProfile" ADD CONSTRAINT "InmobiliariaProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_inmobiliariaId_fkey" FOREIGN KEY ("inmobiliariaId") REFERENCES "InmobiliariaProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Postulacion" ADD CONSTRAINT "Postulacion_inquilinoId_fkey" FOREIGN KEY ("inquilinoId") REFERENCES "InquilinoProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Postulacion" ADD CONSTRAINT "Postulacion_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerazScore" ADD CONSTRAINT "VerazScore_inquilinoId_fkey" FOREIGN KEY ("inquilinoId") REFERENCES "InquilinoProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfianzaScore" ADD CONSTRAINT "ConfianzaScore_inquilinoId_fkey" FOREIGN KEY ("inquilinoId") REFERENCES "InquilinoProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlaggedDocument" ADD CONSTRAINT "FlaggedDocument_inquilinoId_fkey" FOREIGN KEY ("inquilinoId") REFERENCES "InquilinoProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

