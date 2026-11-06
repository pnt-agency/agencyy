import type { ReactNode } from "react";

/**
 * Shared layout for the legal pages (/privacy, /terms).
 *
 * The text itself lives in those pages, transcribed from the source PDFs in
 * legaldocs/. These components only carry the styling, so the documents read
 * consistently and an edit to the wording never has to touch markup.
 */

/**
 * The address the legal documents send people to: data-privacy requests,
 * cookie questions, security reports and legal questions.
 *
 * The source documents leave this blank, so it renders as a visible
 * placeholder until it's set. Set it here and every mention on both pages
 * becomes a working mailto link.
 */
export const LEGAL_CONTACT_EMAIL: string | null = null;

export const legalLinkClass = "text-black font-semibold underline hover:no-underline";

// The navbar is fixed, so an in-page jump would otherwise land with its target
// hidden underneath it. See "Scroll offset with sticky headers" in the Next.js
// <Link> docs.
const anchorOffset = "scroll-mt-28";

export function ContactEmail() {
  if (LEGAL_CONTACT_EMAIL) {
    return (
      <a href={`mailto:${LEGAL_CONTACT_EMAIL}`} className={legalLinkClass}>
        {LEGAL_CONTACT_EMAIL}
      </a>
    );
  }
  return (
    <span className="rounded bg-amber-50 px-1.5 py-0.5 text-sm font-medium text-amber-900">
      [contact email coming soon]
    </span>
  );
}

export function LegalPage({
  title,
  contents,
  children,
}: {
  title: string;
  /** The documents on this page, for the jump links at the top. */
  contents: { id: string; label: string }[];
  children: ReactNode;
}) {
  return (
    <div className="flex-1 bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16 lg:py-24">
        <h1 className="text-4xl font-display font-black text-black mb-6">{title}</h1>
        <nav aria-label="On this page" className="mb-14 rounded-xl border border-gray-100 bg-gray-50 p-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-400">On this page</p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {contents.map((item) => (
              <li key={item.id}>
                <a href={`#${item.id}`} className={legalLinkClass}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="space-y-20">{children}</div>
      </div>
    </div>
  );
}

export function LegalDocument({
  id,
  title,
  dates,
  children,
}: {
  id: string;
  title: string;
  dates: string[];
  children: ReactNode;
}) {
  return (
    <article id={id} className={anchorOffset}>
      <header className="mb-10 border-b border-gray-100 pb-6">
        <h2 className="mb-2 text-3xl font-display font-black text-black">{title}</h2>
        {dates.map((date) => (
          <p key={date} className="text-sm text-gray-500">
            {date}
          </p>
        ))}
      </header>
      <div className="space-y-10 leading-relaxed text-gray-700">{children}</div>
    </article>
  );
}

export function Section({ id, title, children }: { id?: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className={`${anchorOffset} space-y-4`}>
      <h3 className="text-xl font-bold text-black">{title}</h3>
      {children}
    </section>
  );
}

export function Subsection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-black">{title}</h4>
      {children}
    </div>
  );
}

export function BulletList({ children }: { children: ReactNode }) {
  return <ul className="list-disc space-y-2 pl-6 marker:text-gray-400">{children}</ul>;
}

export function NumberedList({ children }: { children: ReactNode }) {
  return <ol className="list-decimal space-y-2 pl-6 marker:text-gray-500">{children}</ol>;
}

/** The bold lead-in of a list item, e.g. "Consent:". */
export function Term({ children }: { children: ReactNode }) {
  return <strong className="font-semibold text-black">{children}</strong>;
}

/** A link to an outside site, opened in a new tab. */
export function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={legalLinkClass}>
      {children}
    </a>
  );
}
