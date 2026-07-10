import { Resend } from "resend";
import type { Talent, Employer } from "@/types";

const resend = new Resend(process.env.RESEND_API_KEY);

// Basic HTML escaping so user-supplied fields can't inject markup into the
// notification emails we send to ourselves.
function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function sendTalentConfirmationEmail(email: string, name: string) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("Resend API key not configured.");
    return null;
  }

  const { data: resendData, error } = await resend.emails.send({
    from: "Agency Build <onboarding@resend.dev>", // Changed for testing without verified domain
    to: email, // NOTE: Resend test emails can only be sent to the email registered on your Resend account
    subject: "Application Received - Agency Build",
    html: `
      <div>
        <h2>Hi ${name},</h2>
        <p>Thank you for applying to Agency Build!</p>
        <p>We have received your application and our team is currently reviewing your profile.</p>
        <p>If your experience aligns with our needs, we will reach out within 48 hours with next steps regarding the screening and training process.</p>
        <br />
        <p>Best regards,</p>
        <p>The Agency Build Team</p>
      </div>
    `,
  });

  if (error) {
    console.error("Resend Error:", error);
    throw new Error(`Resend failed: ${error.message}`);
  }

  return resendData;
}

export async function sendAdminTalentNotification(
  data: Pick<Talent, "name" | "email" | "phone" | "country" | "role" | "experience" | "portfolio" | "cvLink" | "bio" | "whyJoin">
) {
  const to = process.env.ADMIN_NOTIFICATION_EMAIL;
  if (!process.env.RESEND_API_KEY || !to) {
    return null;
  }

  const { data: resendData, error } = await resend.emails.send({
    from: "Agency Build <onboarding@resend.dev>",
    to,
    subject: `New talent application: ${data.name} (${data.role})`,
    html: `
      <div>
        <h2>New talent application</h2>
        <ul>
          <li><strong>Name:</strong> ${esc(data.name)}</li>
          <li><strong>Email:</strong> ${esc(data.email)}</li>
          <li><strong>Phone:</strong> ${esc(data.phone)}</li>
          <li><strong>Country:</strong> ${esc(data.country)}</li>
          <li><strong>Role:</strong> ${esc(data.role)}</li>
          <li><strong>Experience:</strong> ${esc(data.experience)}</li>
          <li><strong>Portfolio:</strong> ${esc(data.portfolio || "-")}</li>
          <li><strong>CV:</strong> ${esc(data.cvLink || "-")}</li>
        </ul>
        <p><strong>Bio:</strong><br />${esc(data.bio)}</p>
        <p><strong>Why join:</strong><br />${esc(data.whyJoin)}</p>
      </div>
    `,
  });

  if (error) {
    console.error("Resend Error:", error);
    throw new Error(`Resend failed: ${error.message}`);
  }

  return resendData;
}

export async function sendEmployerConfirmationEmail(email: string, contactName: string) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("Resend API key not configured.");
    return null;
  }

  const { data: resendData, error } = await resend.emails.send({
    from: "Agency Build <onboarding@resend.dev>", // Changed for testing without verified domain
    to: email, // NOTE: Resend test emails can only be sent to the email registered on your Resend account
    subject: "Inquiry Received - Agency Build",
    html: `
      <div>
        <h2>Hi ${contactName},</h2>
        <p>Thank you for reaching out to Agency Build.</p>
        <p>We've received your request for verified remote talent. One of our account managers will review your requirements and get back to you within 24 hours.</p>
        <br />
        <p>Best regards,</p>
        <p>The Agency Build Team</p>
      </div>
    `,
  });

  if (error) {
    console.error("Resend Error:", error);
    throw new Error(`Resend failed: ${error.message}`);
  }

  return resendData;
}

export async function sendAdminEmployerNotification(
  data: Pick<Employer, "companyName" | "contactName" | "email" | "phone" | "country" | "roleNeeded" | "numberNeeded" | "budget" | "startDate" | "requirements">
) {
  const to = process.env.ADMIN_NOTIFICATION_EMAIL;
  if (!process.env.RESEND_API_KEY || !to) {
    return null;
  }

  const { data: resendData, error } = await resend.emails.send({
    from: "Agency Build <onboarding@resend.dev>",
    to,
    subject: `New employer inquiry: ${data.companyName} (${data.roleNeeded})`,
    html: `
      <div>
        <h2>New employer inquiry</h2>
        <ul>
          <li><strong>Company:</strong> ${esc(data.companyName)}</li>
          <li><strong>Contact:</strong> ${esc(data.contactName)}</li>
          <li><strong>Email:</strong> ${esc(data.email)}</li>
          <li><strong>Phone:</strong> ${esc(data.phone)}</li>
          <li><strong>Country:</strong> ${esc(data.country)}</li>
          <li><strong>Role needed:</strong> ${esc(data.roleNeeded)}</li>
          <li><strong>Number needed:</strong> ${data.numberNeeded}</li>
          <li><strong>Budget:</strong> ${esc(data.budget)}</li>
          <li><strong>Start date:</strong> ${esc(data.startDate)}</li>
        </ul>
        <p><strong>Requirements:</strong><br />${esc(data.requirements || "-")}</p>
      </div>
    `,
  });

  if (error) {
    console.error("Resend Error:", error);
    throw new Error(`Resend failed: ${error.message}`);
  }

  return resendData;
}
