import { resend } from "./mailer";

export type MarketingEmailData = {
  to: string;
  recipientName: string | null;
  organizerName: string;
  organizerEmail: string;
  organizerLogoUrl: string | null;
  subject: string;
  bodyText: string | null;
  imageUrl: string | null;
  ctaText: string | null;
  ctaUrl: string | null;
  unsubscribeUrl: string;
};

function buildHtml(data: MarketingEmailData): string {
  const logoBlock = data.organizerLogoUrl
    ? `<img src="${data.organizerLogoUrl}" width="72" height="72" alt="${data.organizerName}" style="border-radius:50%;display:block;margin:0 auto 14px;object-fit:cover;" />`
    : `<div style="width:72px;height:72px;border-radius:50%;background:#0a0a0a;display:table-cell;text-align:center;vertical-align:middle;margin:0 auto 14px;"><span style="color:#fff;font-size:28px;font-weight:900;line-height:72px;">${data.organizerName.charAt(0).toUpperCase()}</span></div>`;

  const imageBlock = data.imageUrl
    ? `<img src="${data.imageUrl}" alt="" style="width:100%;border-radius:12px;display:block;margin:20px 0;" />`
    : "";

  const ctaBlock =
    data.ctaUrl && data.ctaText
      ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
          <tr><td style="text-align:center;">
            <a href="${data.ctaUrl}" style="display:inline-block;padding:14px 36px;background:#0a0a0a;color:#ffffff;text-decoration:none;border-radius:100px;font-size:14px;font-weight:700;font-family:-apple-system,sans-serif;">
              ${data.ctaText}
            </a>
          </td></tr>
        </table>`
      : "";

  const bodyHtml = data.bodyText
    ? data.bodyText
        .split("\n")
        .map((line) =>
          line.trim()
            ? `<p style="margin:0 0 10px;font-size:14px;color:#444;line-height:1.65;font-family:-apple-system,sans-serif;">${line}</p>`
            : `<p style="margin:0 0 10px;">&nbsp;</p>`
        )
        .join("")
    : "";

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${data.subject}</title></head>
<body style="margin:0;padding:0;background:#f2f2f2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f2f2f2;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <!-- Logo + greeting -->
        <tr><td style="background:#ffffff;border-radius:16px 16px 0 0;padding:36px 32px 24px;text-align:center;border-bottom:1px solid #eeeeee;">
          <table cellpadding="0" cellspacing="0" style="margin:0 auto 14px;"><tr><td>${logoBlock}</td></tr></table>
          <p style="margin:0 0 4px;font-size:18px;font-weight:700;color:#0a0a0a;font-family:-apple-system,sans-serif;">Hola${data.recipientName ? `, ${data.recipientName.split(" ")[0]}` : ""}</p>
          <p style="margin:0;font-size:13px;color:#888;font-family:-apple-system,sans-serif;">Has recibido un mensaje de <strong style="color:#0a0a0a;">${data.organizerName}</strong>.</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#ffffff;border-radius:0 0 16px 16px;padding:28px 32px 36px;">
          ${imageBlock}
          ${bodyHtml}
          ${ctaBlock}
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;border-top:1px solid #eeeeee;padding-top:20px;">
            <tr><td style="text-align:center;font-size:12px;color:#999;line-height:1.7;font-family:-apple-system,sans-serif;">
              Podés contactar a <strong style="color:#666;">${data.organizerName}</strong> directamente a:<br>
              <a href="mailto:${data.organizerEmail}" style="color:#666;">${data.organizerEmail}</a><br>
              o respondiendo a este correo electrónico.
            </td></tr>
          </table>
        </td></tr>

        <!-- Unsubscribe -->
        <tr><td style="padding:20px 0;text-align:center;">
          <a href="${data.unsubscribeUrl}" style="font-size:11px;color:#bbb;text-decoration:underline;font-family:-apple-system,sans-serif;">Desuscribirse</a>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendMarketingBatch(emails: MarketingEmailData[]) {
  const CHUNK = 100;
  for (let i = 0; i < emails.length; i += CHUNK) {
    const chunk = emails.slice(i, i + CHUNK);
    const { error } = await resend.batch.send(
      chunk.map((data) => ({
        from: `${data.organizerName} <onboarding@resend.dev>`,
        replyTo: [data.organizerEmail],
        to: [data.to],
        subject: data.subject,
        html: buildHtml(data),
      }))
    );
    if (error) throw new Error(error.message);
  }
}
