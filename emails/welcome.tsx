interface WelcomeEmailProps {
  name: string
}

export function WelcomeEmailHtml({ name }: WelcomeEmailProps): string {
  const firstName = name?.split(" ")[0] || "there"
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Welcome to Greta</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0f2027 0%,#1a3a2e 100%);padding:36px 40px 28px;">
              <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#86efac;">Your coach</p>
              <h1 style="margin:0;font-size:28px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">greta</h1>
              <p style="margin:8px 0 0;font-size:13px;color:#bbf7d0;">ship mission-aligned work</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 40px 24px;">
              <p style="margin:0 0 16px;font-size:16px;color:#1e293b;line-height:1.6;">
                Hey ${firstName} 👋
              </p>
              <p style="margin:0 0 16px;font-size:14px;color:#475569;line-height:1.7;">
                Welcome to <strong style="color:#1e293b;">Greta</strong> — your AI work-methods coach. I'm here to help you stay focused on what actually matters: mission-aligned work that compounds into real impact.
              </p>
              <p style="margin:0 0 24px;font-size:14px;color:#475569;line-height:1.7;">
                Here's what to do first:
              </p>

              <!-- Steps -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                ${[
                  ["1", "Set your mission", "Tell me your North Star — what you're building and why it matters."],
                  ["2", "Add your goals", "Break your mission into 3–5 measurable goals. I'll sort them by impact."],
                  ["3", "Let me suggest your next task", "Each day, I'll pick the single best task to move you forward."],
                ].map(([num, title, desc]) => `
                <tr>
                  <td style="padding:0 0 16px;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:32px;height:32px;background:#dcfce7;border-radius:50%;text-align:center;vertical-align:middle;">
                          <span style="font-size:13px;font-weight:700;color:#16a34a;">${num}</span>
                        </td>
                        <td style="padding-left:14px;vertical-align:top;">
                          <p style="margin:0 0 3px;font-size:13px;font-weight:600;color:#1e293b;">${title}</p>
                          <p style="margin:0;font-size:12px;color:#64748b;line-height:1.5;">${desc}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>`).join("")}
              </table>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td align="center">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://app.greta.so"}/dashboard"
                       style="display:inline-block;background:#16a34a;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:14px 32px;border-radius:12px;letter-spacing:0.2px;">
                      Open Greta →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.6;">
                Questions? Just reply to this email — I read every one.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #f1f5f9;">
              <p style="margin:0;font-size:11px;color:#94a3b8;text-align:center;">
                Greta · ship mission-aligned work · You're receiving this because you just signed up.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
