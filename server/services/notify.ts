import sg from "@sendgrid/mail";

const key = process.env.SENDGRID_API_KEY;
if (key) sg.setApiKey(key);

export async function sendEmail({ to, subject, html, from }: { to: string | string[]; subject: string; html: string; from?: string }) {
  if (!key) return; // silently no-op in dev if not configured
  const fromAddr = from || process.env.NOTIFY_FROM || "no-reply@aipaper.pro";
  await sg.send({ to, from: fromAddr, subject, html, mailSettings: { sandboxMode: { enable: false } } as any });
}