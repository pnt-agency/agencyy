/**
 * Shared branded shell for every outbound email.
 *
 * Email clients are not browsers: no flexbox, no grid, no external stylesheets,
 * and Outlook ignores most of what it does see. So this is tables and inline
 * styles on purpose — it looks dated next to the app's CSS and renders the same
 * everywhere, which is the trade worth making here.
 */

// Pulled from app/globals.css so the mail matches the site. The contrast rules
// documented there apply here too, and matter more: gold on white is 2.10:1 and
// unreadable, so gold is only ever a *fill* behind black text, and gold-deep is
// the only gold used as text on white.
const BRAND = {
  gold: "#d4af37",
  goldDeep: "#8a6d1f",
  goldSoft: "#f7edd2",
  ink: "#0a0a0a",
  paper: "#ffffff",
  paperSoft: "#f5f5f5",
  border: "#e0e0e0",
  muted: "#6b6b6b",
} as const;

const FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

/** A gold call-to-action button. Black on gold is 9.42:1. */
export function emailButton(href: string, label: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0">
      <tr>
        <td style="background:${BRAND.gold};border-radius:10px">
          <a href="${href}" style="display:inline-block;padding:14px 28px;color:${BRAND.ink};font-family:${FONT};font-size:15px;font-weight:700;text-decoration:none">${label}</a>
        </td>
      </tr>
    </table>`;
}

/** A muted panel for secondary detail — fallback links, metadata, expiry notes. */
export function emailPanel(inner: string): string {
  return `
    <div style="background:${BRAND.paperSoft};border:1px solid ${BRAND.border};border-radius:10px;padding:14px 16px;margin:20px 0;font-family:${FONT};font-size:13px;line-height:1.6;color:${BRAND.muted};word-break:break-all">
      ${inner}
    </div>`;
}

/** A labelled list, used by the internal notification emails. */
export function emailFacts(rows: [string, string][]): string {
  const cells = rows
    .map(
      ([label, value]) => `
      <tr>
        <td style="padding:7px 0;font-family:${FONT};font-size:14px;color:${BRAND.muted};width:150px;vertical-align:top">${label}</td>
        <td style="padding:7px 0;font-family:${FONT};font-size:14px;color:${BRAND.ink};vertical-align:top">${value}</td>
      </tr>`
    )
    .join("");
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:18px 0;border-top:1px solid ${BRAND.border}">${cells}</table>`;
}

export function emailParagraph(html: string): string {
  return `<p style="margin:0 0 14px;font-family:${FONT};font-size:15px;line-height:1.65;color:#3a3a3a">${html}</p>`;
}

type LayoutOptions = {
  /** Shown in the inbox preview line, next to the subject. */
  preheader: string;
  heading: string;
  /** Pre-rendered HTML — compose it from the helpers above. */
  body: string;
};

export function emailLayout({ preheader, heading, body }: LayoutOptions): string {
  return `
<div style="background:${BRAND.paperSoft};margin:0;padding:32px 16px;font-family:${FONT}">
  <!-- Preheader: shown in the inbox list, hidden once the mail is open. -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;height:0;width:0">${preheader}</div>

  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;margin:0 auto;background:${BRAND.paper};border:1px solid ${BRAND.border};border-radius:14px;overflow:hidden">

    <tr>
      <td style="background:${BRAND.ink};padding:22px 32px">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="background:${BRAND.gold};color:${BRAND.ink};font-family:${FONT};font-size:14px;font-weight:800;width:36px;height:36px;text-align:center;border-radius:9px">AP</td>
            <td style="padding-left:12px;color:${BRAND.paper};font-family:${FONT};font-size:16px;font-weight:700;white-space:nowrap">Amaris Partners</td>
          </tr>
        </table>
      </td>
    </tr>

    <tr>
      <td style="padding:34px 32px 30px">
        <h1 style="margin:0 0 18px;font-family:${FONT};font-size:23px;line-height:1.3;font-weight:800;color:${BRAND.ink}">${heading}</h1>
        ${body}
      </td>
    </tr>

    <tr>
      <td style="background:#fafafa;border-top:1px solid ${BRAND.border};padding:20px 32px">
        <p style="margin:0;font-family:${FONT};font-size:12px;line-height:1.6;color:${BRAND.muted}">
          <span style="color:${BRAND.goldDeep};font-weight:700">Amaris Partners</span><br />
          Verified remote talent for growing teams.
        </p>
      </td>
    </tr>

  </table>
</div>`;
}
