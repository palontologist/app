interface WeeklyDigestProps {
  name: string
  alignmentScore: number
  tasksCompleted: number
  weekValue: number
  topGoal: string | null
  nextSuggestedTask: string | null
}

export function WeeklyDigestHtml({
  name,
  alignmentScore,
  tasksCompleted,
  weekValue,
  topGoal,
  nextSuggestedTask,
}: WeeklyDigestProps): string {
  const firstName = name?.split(" ")[0] || "there"
  const scoreColor = alignmentScore >= 70 ? "#16a34a" : alignmentScore >= 45 ? "#d97706" : "#dc2626"
  const scoreLabel = alignmentScore >= 70 ? "Strong week" : alignmentScore >= 45 ? "Steady progress" : "Needs focus"
  const formattedValue = weekValue >= 1000 ? `$${(weekValue / 1000).toFixed(1)}k` : `$${weekValue}`

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Your weekly digest — Greta</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0f2027 0%,#1a3a2e 100%);padding:32px 40px 24px;">
              <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#86efac;">Weekly digest</p>
              <h1 style="margin:0 0 6px;font-size:22px;font-weight:700;color:#ffffff;">Hey ${firstName}, here's your week.</h1>
              <p style="margin:0;font-size:12px;color:#86efac;">${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>
            </td>
          </tr>

          <!-- Stats row -->
          <tr>
            <td style="padding:28px 40px 0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  ${[
                    { val: `${alignmentScore}%`, lbl: "Mission alignment", color: scoreColor },
                    { val: tasksCompleted.toString(), lbl: "Tasks completed", color: "#1e293b" },
                    { val: formattedValue, lbl: "Value generated", color: "#d97706" },
                  ].map(({ val, lbl, color }) => `
                  <td width="33%" style="text-align:center;padding:16px 8px;background:#f8fafc;border-radius:12px;">
                    <p style="margin:0 0 4px;font-size:22px;font-weight:700;color:${color};font-variant-numeric:tabular-nums;">${val}</p>
                    <p style="margin:0;font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">${lbl}</p>
                  </td>`).join('<td width="8px"></td>')}
                </tr>
              </table>
            </td>
          </tr>

          <!-- Score label -->
          <tr>
            <td style="padding:16px 40px 0;text-align:center;">
              <span style="display:inline-block;background:${scoreColor}20;color:${scoreColor};font-size:12px;font-weight:600;padding:6px 16px;border-radius:20px;">${scoreLabel}</span>
            </td>
          </tr>

          <!-- Divider -->
          <tr><td style="padding:24px 40px 0;"><hr style="border:none;border-top:1px solid #f1f5f9;margin:0;" /></td></tr>

          <!-- Top goal -->
          ${topGoal ? `
          <tr>
            <td style="padding:24px 40px 0;">
              <p style="margin:0 0 8px;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#94a3b8;">Top goal this week</p>
              <p style="margin:0;font-size:14px;font-weight:600;color:#1e293b;line-height:1.5;">${topGoal}</p>
            </td>
          </tr>` : ""}

          <!-- Next task suggestion -->
          ${nextSuggestedTask ? `
          <tr>
            <td style="padding:20px 40px 0;">
              <p style="margin:0 0 8px;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#94a3b8;">Greta's pick for next week</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:14px 16px;">
                    <p style="margin:0 0 4px;font-size:12px;color:#16a34a;font-weight:600;">Best next task</p>
                    <p style="margin:0;font-size:14px;color:#1e293b;font-weight:500;">${nextSuggestedTask}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>` : ""}

          <!-- CTA -->
          <tr>
            <td style="padding:28px 40px 32px;text-align:center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://app.greta.so"}/dashboard"
                 style="display:inline-block;background:#16a34a;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:14px 32px;border-radius:12px;">
                Open Greta →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:18px 40px;border-top:1px solid #f1f5f9;">
              <p style="margin:0;font-size:11px;color:#94a3b8;text-align:center;">
                Greta · You're receiving this weekly digest because you use Greta.
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
