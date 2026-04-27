import { Resend } from "resend";
import { TRANSACTION_STAGES } from "@/config/transaction";
import { TransactionStage } from "@/generated/prisma";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = "PropTech <onboarding@resend.dev>";

type StageEmailParams = {
  toEmail: string;
  tenantName: string;
  propertyTitle: string;
  propertyAddress: string;
  agencyName: string;
  newStage: TransactionStage;
  portalToken: string;
};

const STAGE_SUBJECT: Record<TransactionStage, string> = {
  DOCUMENTACION: "Tu alquiler entró en etapa de Documentación",
  CONTRATO: "Pasaste a la etapa de Contrato",
  ACTIVO: "¡Tu alquiler está activo!",
  FINALIZADO: "Tu alquiler ha finalizado",
};

function buildHtml(p: StageEmailParams): string {
  const config = TRANSACTION_STAGES[p.newStage];
  const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://proptech-ysgy.vercel.app"}/portal/${p.portalToken}`;

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:system-ui,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:32px 16px">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden">
        <tr><td style="background:#2563eb;padding:24px 32px">
          <span style="color:#fff;font-size:18px;font-weight:700">PropTech</span>
        </td></tr>
        <tr><td style="padding:32px">
          <p style="margin:0 0 4px;font-size:13px;color:#6b7280">Hola, ${p.tenantName}</p>
          <h1 style="margin:0 0 24px;font-size:22px;font-weight:700;color:#111827">${STAGE_SUBJECT[p.newStage]}</h1>
          <div style="background:#f3f4f6;border-radius:8px;padding:16px;margin-bottom:24px">
            <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#374151">${p.propertyTitle}</p>
            <p style="margin:0;font-size:12px;color:#6b7280">${p.propertyAddress}</p>
          </div>
          <p style="margin:0 0 8px;font-size:14px;color:#374151">
            Tu trámite con <strong>${p.agencyName}</strong> avanzó a la etapa
            <strong>${config.label}</strong>.
          </p>
          ${p.newStage === "DOCUMENTACION" ? `<p style="margin:0 0 24px;font-size:14px;color:#374151">La inmobiliaria te solicitará los documentos necesarios. Podés ver el estado en el portal compartido.</p>` : ""}
          ${p.newStage === "CONTRATO" ? `<p style="margin:0 0 24px;font-size:14px;color:#374151">Ya están revisando la documentación. Pronto te contactarán para coordinar la firma del contrato.</p>` : ""}
          ${p.newStage === "ACTIVO" ? `<p style="margin:0 0 24px;font-size:14px;color:#374151">El contrato fue firmado y el alquiler está activo. ¡Bienvenido a tu nuevo hogar!</p>` : ""}
          ${p.newStage === "FINALIZADO" ? `<p style="margin:0 0 24px;font-size:14px;color:#374151">El contrato de alquiler ha llegado a su fin. Gracias por usar PropTech.</p>` : ""}
          <a href="${portalUrl}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600">
            Ver portal del alquiler →
          </a>
        </td></tr>
        <tr><td style="padding:16px 32px;border-top:1px solid #f3f4f6">
          <p style="margin:0;font-size:11px;color:#9ca3af">Este es un correo automático de PropTech. No respondas este mensaje.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendStageAdvanceEmail(params: StageEmailParams): Promise<void> {
  if (!resend) return;
  try {
    await resend.emails.send({
      from: FROM,
      to: params.toEmail,
      subject: STAGE_SUBJECT[params.newStage],
      html: buildHtml(params),
    });
  } catch {
    // non-blocking — log but don't crash the transaction flow
    console.error("[email] failed to send stage notification");
  }
}
