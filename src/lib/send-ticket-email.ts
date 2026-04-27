import QRCode from "qrcode";
import { resend } from "./mailer";

export type TicketEmailData = {
  to: string;
  buyerName: string | null;
  eventName: string;
  eventDate: string;      // formatted string, e.g. "Sábado 14 de junio, 2025"
  eventTime: string | null;
  eventVenue: string;
  eventCity: string;
  ticketTypeName: string;
  ticketPrice: number;
  currency: "CRC" | "USD" | string;
  qrCodes: string[];       // one per ticket, same email
  postPurchaseMessage: string | null;
  termsConditions: string | null;
  ticketIds: string[];     // for ticket page links
  siteUrl: string;
};

function formatPrice(price: number, currency: string) {
  if (currency === "USD") return `$${(price / 100).toFixed(2)}`;
  return `₡${price.toLocaleString("es-CR")}`;
}

async function buildQRBlock(qrCode: string, ticketId: string, index: number, total: number, data: TicketEmailData) {
  const qrDataUrl = await QRCode.toDataURL(qrCode, {
    width: 220,
    margin: 2,
    color: { dark: "#0a0a0a", light: "#ffffff" },
  });

  const label = total > 1 ? `Entrada ${index + 1} de ${total}` : "Tu entrada";
  const shortId = qrCode.slice(0, 8).toUpperCase();
  const ticketUrl = `${data.siteUrl}/ticket/${qrCode}`;

  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
      <tr>
        <td style="background:#ffffff;border-radius:16px;border:1px solid #e5e5e5;padding:28px;text-align:center;">
          <p style="margin:0 0 4px 0;font-size:10px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#999;">
            ${label}
          </p>
          <p style="margin:0 0 20px 0;font-size:16px;font-weight:700;color:#0a0a0a;">
            ${data.ticketTypeName}
          </p>
          <img src="${qrDataUrl}" width="200" height="200" alt="QR Code" style="display:block;margin:0 auto;border-radius:8px;" />
          <p style="margin:12px 0 0 0;font-size:11px;font-family:monospace;color:#bbb;letter-spacing:0.08em;">
            ${shortId}
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;">
            <tr>
              <td style="text-align:center;">
                <a href="${ticketUrl}" style="display:inline-block;padding:10px 24px;background:#0a0a0a;color:#fff;text-decoration:none;border-radius:100px;font-size:13px;font-weight:600;">
                  Ver entrada completa →
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

export async function sendTicketEmail(data: TicketEmailData) {
  const qrBlocks = await Promise.all(
    data.qrCodes.map((qr, i) => buildQRBlock(qr, data.ticketIds[i] ?? "", i, data.qrCodes.length, data))
  );

  const priceText = data.ticketPrice > 0
    ? `${formatPrice(data.ticketPrice, data.currency)} por entrada`
    : "Entrada gratuita";

  const postMsg = data.postPurchaseMessage
    ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
        <tr>
          <td style="background:#f7f7f7;border-radius:12px;padding:20px;">
            <p style="margin:0 0 6px 0;font-size:10px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#999;">Mensaje del organizador</p>
            <p style="margin:0;font-size:14px;color:#444;line-height:1.6;">${data.postPurchaseMessage.replace(/\n/g, "<br>")}</p>
          </td>
        </tr>
      </table>`
    : "";

  const termsBlock = data.termsConditions
    ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;">
        <tr>
          <td style="border-top:1px solid #e5e5e5;padding-top:20px;">
            <p style="margin:0 0 6px 0;font-size:10px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#bbb;">Términos y condiciones del evento</p>
            <p style="margin:0;font-size:12px;color:#bbb;line-height:1.6;">${data.termsConditions.replace(/\n/g, "<br>")}</p>
          </td>
        </tr>
      </table>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Tu entrada — ${data.eventName}</title></head>
<body style="margin:0;padding:0;background:#f2f2f2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f2f2f2;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:#0a0a0a;border-radius:16px 16px 0 0;padding:28px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin:0;font-size:18px;font-weight:900;letter-spacing:0.12em;color:#fff;text-transform:uppercase;">VYBZ</p>
                    <p style="margin:4px 0 0;font-size:11px;color:rgba(255,255,255,0.3);letter-spacing:0.05em;">Tu entrada para</p>
                  </td>
                  <td style="text-align:right;">
                    <p style="margin:0;font-size:11px;font-weight:600;color:rgba(255,255,255,0.25);text-transform:uppercase;letter-spacing:0.1em;">Tickets</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Event info band -->
          <tr>
            <td style="background:#111;padding:24px 32px 28px;">
              <p style="margin:0 0 6px;font-size:26px;font-weight:900;color:#fff;letter-spacing:0.02em;line-height:1.1;">${data.eventName}</p>
              <table cellpadding="0" cellspacing="0" style="margin-top:14px;">
                <tr>
                  <td style="padding-right:24px;">
                    <p style="margin:0;font-size:10px;color:rgba(255,255,255,0.3);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:3px;">Fecha</p>
                    <p style="margin:0;font-size:13px;font-weight:600;color:#fff;">${data.eventDate}</p>
                  </td>
                  ${data.eventTime ? `<td style="padding-right:24px;">
                    <p style="margin:0;font-size:10px;color:rgba(255,255,255,0.3);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:3px;">Hora</p>
                    <p style="margin:0;font-size:13px;font-weight:600;color:#fff;">${data.eventTime}</p>
                  </td>` : ""}
                  <td>
                    <p style="margin:0;font-size:10px;color:rgba(255,255,255,0.3);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:3px;">Lugar</p>
                    <p style="margin:0;font-size:13px;font-weight:600;color:#fff;">${data.eventVenue}, ${data.eventCity}</p>
                  </td>
                </tr>
              </table>
              ${data.buyerName ? `<p style="margin:14px 0 0;font-size:12px;color:rgba(255,255,255,0.35);">A nombre de <strong style="color:rgba(255,255,255,0.7);">${data.buyerName}</strong> · ${priceText}</p>` : `<p style="margin:14px 0 0;font-size:12px;color:rgba(255,255,255,0.35);">${priceText}</p>`}
            </td>
          </tr>

          <!-- White body -->
          <tr>
            <td style="background:#fafafa;border-radius:0 0 16px 16px;padding:28px 32px 32px;">

              <p style="margin:0 0 20px;font-size:13px;color:#666;line-height:1.5;">
                Presentá este código QR en la entrada del evento. Cada código es único e intransferible.
              </p>

              <!-- QR codes -->
              ${qrBlocks.join("")}

              ${postMsg}
              ${termsBlock}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 0 0;text-align:center;">
              <p style="margin:0;font-size:11px;color:#bbb;">Enviado por <strong>Vybz Tickets</strong> · <a href="${data.siteUrl}" style="color:#bbb;">vybztickets.com</a></p>
              <p style="margin:4px 0 0;font-size:11px;color:#ddd;">¿Problemas? Respondé este correo o escribinos a través de la plataforma.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const { error } = await resend.emails.send({
    from: "Vybz Tickets <onboarding@resend.dev>",
    to: data.to,
    subject: `Tu entrada para ${data.eventName} 🎟`,
    html,
  });

  if (error) throw new Error(error.message);
}
