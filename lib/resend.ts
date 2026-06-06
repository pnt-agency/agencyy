import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

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
