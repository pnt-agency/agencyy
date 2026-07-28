import { Resend } from "resend";
import type { Talent, Employer } from "@/types";
import {
  emailLayout,
  emailButton,
  emailPanel,
  emailParagraph as p,
  emailFacts,
} from "./email-layout";

// Construct lazily and only when configured — `new Resend(undefined)` throws,
// which would break importing this module in any env without the key. Callers
// gracefully no-op when `resend` is null.
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Sender for every outbound email. Defaults to Resend's shared sandbox address,
// which needs no domain setup but comes with a hard limitation: Resend only
// accepts sends addressed to the email your Resend account is registered under.
// Mail to anyone else is rejected, so member-facing email (confirmations,
// verification, password resets) silently fails until a domain is verified.
// Once you've verified one at resend.com/domains, set EMAIL_FROM to an address
// on it (e.g. "Amaris Partners <noreply@yourdomain.com>") and all of it starts
// working — no code change.
const EMAIL_FROM = process.env.EMAIL_FROM ?? "Amaris Partners <onboarding@resend.dev>";

// Basic HTML escaping so user-supplied fields can't inject markup into the
// emails we send. Applies to member-facing mail as much as internal mail: a
// name is user input wherever it ends up.
function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Single send path for member-facing mail. Every caller had the same
 * null-check / error-check boilerplate; this is that, once.
 */
async function send(to: string, subject: string, html: string) {
  if (!resend) {
    console.warn("Resend API key not configured.");
    return null;
  }
  const { data, error } = await resend.emails.send({ from: EMAIL_FROM, to, subject, html });
  if (error) {
    console.error("Resend Error:", error);
    throw new Error(`Resend failed: ${error.message}`);
  }
  return data;
}

/**
 * Same, for internal notifications. Quietly does nothing when unconfigured —
 * these are for us, and a missing ADMIN_NOTIFICATION_EMAIL shouldn't look like
 * a failure on a member's submission.
 */
async function sendToAdmin(subject: string, html: string) {
  const to = process.env.ADMIN_NOTIFICATION_EMAIL;
  if (!resend || !to) return null;
  const { data, error } = await resend.emails.send({ from: EMAIL_FROM, to, subject, html });
  if (error) {
    console.error("Resend Error:", error);
    throw new Error(`Resend failed: ${error.message}`);
  }
  return data;
}

const SIGN_OFF = p("— The Amaris Partners Team");

export async function sendVerificationEmail(email: string, name: string, url: string) {
  return send(
    email,
    "Verify your email - Amaris Partners",
    emailLayout({
      preheader: "Confirm your email address to finish setting up your account.",
      heading: `Hi ${esc(name)}, confirm your email`,
      body:
        p("Welcome to Amaris Partners. Confirm your email address to finish setting up your account and unlock your profile.") +
        emailButton(url, "Verify my email") +
        emailPanel(`Button not working? Paste this into your browser:<br />${esc(url)}`) +
        p("This link expires in 24 hours."),
    })
  );
}

/**
 * Sent once, when an account's email address becomes trusted — right after a
 * Google signup (Google has already confirmed the address) or when a password
 * signup clicks its verification link. Deliberately not sent at registration:
 * an unverified address may not belong to the person who typed it.
 */
export async function sendWelcomeEmail(email: string, name: string, dashboardUrl: string) {
  return send(
    email,
    "Welcome to Amaris Partners",
    emailLayout({
      preheader: "Your account is ready — next, complete your profile.",
      heading: `Welcome, ${esc(name)}`,
      body:
        p("Your Amaris Partners account is ready and your email address is confirmed.") +
        p("The next step is to complete your profile — it's what our team reviews, and for talent it's what employers see in the directory.") +
        emailButton(dashboardUrl, "Go to my dashboard") +
        p("Any questions? Just reply to this email.") +
        SIGN_OFF,
    })
  );
}

/**
 * Sent when an admin verifies a talent profile — the moment it becomes visible
 * to employers. Pairs with the in-app bell notification raised by the same
 * action, so the news reaches them whether or not they're signed in.
 */
export async function sendTalentVerifiedEmail(email: string, name: string, dashboardUrl: string) {
  return send(
    email,
    "You're verified — your profile is now live",
    emailLayout({
      preheader: "Employers can now discover you in the Amaris Partners directory.",
      heading: `You're verified, ${esc(name)}`,
      body:
        p("Our team has reviewed and <strong>verified your profile</strong>. It's now live in the talent directory, where employers can discover you.") +
        p("You don't need to do anything else. When an employer expresses interest, our team reviews it and makes the introduction personally — so keep an eye on your inbox and your dashboard.") +
        emailButton(dashboardUrl, "View my dashboard") +
        p("Keeping your skills and portfolio up to date is the best way to get matched.") +
        SIGN_OFF,
    })
  );
}

export async function sendPasswordResetEmail(email: string, url: string) {
  return send(
    email,
    "Reset your password - Amaris Partners",
    emailLayout({
      preheader: "Choose a new password for your Amaris Partners account.",
      heading: "Reset your password",
      body:
        p("We received a request to reset your Amaris Partners password. If this was you, choose a new one below.") +
        emailButton(url, "Reset my password") +
        emailPanel(`Button not working? Paste this into your browser:<br />${esc(url)}`) +
        p("This link expires in 1 hour. If you didn't request this, you can safely ignore this email — your password won't change."),
    })
  );
}

export async function sendTalentConfirmationEmail(email: string, name: string) {
  return send(
    email,
    "Application Received - Amaris Partners",
    emailLayout({
      preheader: "We've received your application and our team is reviewing it.",
      heading: `Thanks, ${esc(name)}`,
      body:
        p("We've received your application to join the Amaris Partners talent network, and our team is reviewing your profile.") +
        p("If your experience aligns with what our clients need, we'll be in touch within 48 hours with next steps on screening and training.") +
        SIGN_OFF,
    })
  );
}

export async function sendEmployerConfirmationEmail(email: string, contactName: string) {
  return send(
    email,
    "Inquiry Received - Amaris Partners",
    emailLayout({
      preheader: "An account manager will review your requirements shortly.",
      heading: `Thanks, ${esc(contactName)}`,
      body:
        p("Thank you for reaching out to Amaris Partners. We've received your request for verified remote talent.") +
        p("One of our account managers will review your requirements and get back to you within 24 hours.") +
        SIGN_OFF,
    })
  );
}

export async function sendAdminTalentNotification(
  data: Pick<Talent, "name" | "email" | "phone" | "country" | "role" | "experience" | "portfolio" | "cvLink" | "bio" | "whyJoin">
) {
  return sendToAdmin(
    `New talent application: ${data.name} (${data.role})`,
    emailLayout({
      preheader: `${data.name} applied for ${data.role}.`,
      heading: "New talent application",
      body:
        emailFacts([
          ["Name", esc(data.name)],
          ["Email", esc(data.email)],
          ["Phone", esc(data.phone)],
          ["Country", esc(data.country)],
          ["Role", esc(data.role)],
          ["Experience", esc(data.experience)],
          ["Portfolio", esc(data.portfolio || "—")],
          ["CV", esc(data.cvLink || "—")],
        ]) +
        p(`<strong>Bio</strong><br />${esc(data.bio)}`) +
        p(`<strong>Why join</strong><br />${esc(data.whyJoin)}`),
    })
  );
}

export async function sendAdminEmployerNotification(
  data: Pick<Employer, "companyName" | "contactName" | "email" | "phone" | "country" | "roleNeeded" | "numberNeeded" | "budget" | "startDate" | "requirements">
) {
  return sendToAdmin(
    `New employer inquiry: ${data.companyName} (${data.roleNeeded})`,
    emailLayout({
      preheader: `${data.companyName} needs ${data.numberNeeded} × ${data.roleNeeded}.`,
      heading: "New employer inquiry",
      body:
        emailFacts([
          ["Company", esc(data.companyName)],
          ["Contact", esc(data.contactName)],
          ["Email", esc(data.email)],
          ["Phone", esc(data.phone)],
          ["Country", esc(data.country)],
          ["Role needed", esc(data.roleNeeded)],
          ["Number needed", String(data.numberNeeded)],
          ["Budget", esc(data.budget)],
          ["Start date", esc(data.startDate)],
        ]) + p(`<strong>Requirements</strong><br />${esc(data.requirements || "—")}`),
    })
  );
}

export async function sendAdminInterestNotification(data: {
  employerName: string;
  talentName: string;
  message: string | null;
}) {
  return sendToAdmin(
    `New interest: ${data.employerName} → ${data.talentName}`,
    emailLayout({
      preheader: `${data.employerName} is interested in ${data.talentName}.`,
      heading: "New talent interest",
      body:
        emailFacts([
          ["Employer", esc(data.employerName)],
          ["Talent", esc(data.talentName)],
        ]) +
        p(`<strong>Message</strong><br />${esc(data.message || "—")}`) +
        p("Review it and make the intro from the admin dashboard."),
    })
  );
}
