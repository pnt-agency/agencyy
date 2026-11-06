import Link from "next/link";
import {
  LegalPage,
  LegalDocument,
  Section,
  Subsection,
  BulletList,
  NumberedList,
  Term,
  ContactEmail,
  ExternalLink,
  legalLinkClass,
} from "@/components/legal/legal-document";

// Transcribed from legaldocs/AMARIS PARTNERS_PRIVACY POLICY.pdf, which holds
// both the Privacy Policy and the Cookie Policy. Keep the wording in step with
// that document; only headings are re-cased for the web.

export const metadata = {
  title: "Privacy & Cookie Policy | Amaris Partners",
};

const DATA_CATEGORIES: { category: string; elements: string; source: string }[] = [
  {
    category: "Candidate Identity & Contact",
    elements:
      "Full name, professional email, phone number, physical address, professional photograph, screening interview video recordings.",
    source: "Directly from Candidate",
  },
  {
    category: "Candidate Portfolio & History",
    elements:
      "CVs, cover letters, educational background, employment history, work samples, references, code repositories, LinkedIn profile URLs.",
    source: "Candidate & Third-Party References",
  },
  {
    category: "Vetting & Assessment Data",
    elements:
      "Technical assessment scores, skills test logs, 5-module Core Values Training completion logs, Verified Badge status.",
    source: "Amaris Partners Assessment Engine",
  },
  {
    category: "Financial & Transactional",
    elements: "Bank account details, payment card tokens, invoice history, tax identification numbers.",
    source: "Employer & PCI-DSS Payment Gateways",
  },
  {
    category: "Employer Corporate Data",
    elements:
      "Business legal name, business registration number, corporate email, billing address, contact person details, talent requisitions.",
    source: "Directly from Employer",
  },
  {
    category: "Technical & Telemetry Data",
    elements: "IP address, user specifications, operating system, geolocation, access logs, cookies.",
    source: "Automated Telemetry / Site Interactions",
  },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Privacy & Cookie Policy"
      contents={[
        { id: "privacy-policy", label: "Privacy Policy" },
        { id: "cookie-policy", label: "Cookie Policy" },
      ]}
    >
      <LegalDocument
        id="privacy-policy"
        title="Privacy Policy"
        dates={["Effective Date: September 10th, 2026", "Last Updated: November 6th, 2026"]}
      >
        <Section title="1. Introduction">
          <p>
            Amaris Partners Limited (“Amaris Partners”, “we”, “us”, or “our”) is committed to protecting the privacy
            and personal data of our users worldwide. This Privacy Policy informs visitors to our website and other
            third parties how we collect, use, disclose, and protect personal information provided to us through our
            website.
          </p>
        </Section>

        <Section title="2. Policy Review">
          <p>
            This Policy may be amended or updated from time to time to reflect changes in our practices or applicable
            law. When such an update is made, users on our platform are informed via email and by a general
            notification on our site. Your continued use of our platform after such an update constitutes acceptance.
          </p>
          <p>Any reference in this policy to “we”, “us” or “Our” refers to AMARIS PARTNERS.</p>
          <p>Last Update: 6 November 2026</p>
        </Section>

        <Section title="3. Categories of Personal Data Collected">
          <p>We collect and process personal data across various categories:</p>
          <p>The personal data that we collect and process may include:</p>
          <BulletList>
            <li>
              basic information such as name, employment status, title, age, relationship affiliations with a person or
              organization (employment history);
            </li>
            <li>contact information such as physical address, email address, fax and phone number(s);</li>
            <li>technical information (including your IP address): Information obtained from a visit to our website;</li>
            <li>
              background information such as provided by you or collected by us as part of our recruitment processes;
            </li>
            <li>any other information relating to you which you may provide to us</li>
          </BulletList>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead className="bg-gray-50 text-black">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">Data Category</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Data Elements</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {DATA_CATEGORIES.map((row) => (
                  <tr key={row.category} className="align-top">
                    <th scope="row" className="px-4 py-3 font-semibold text-black">{row.category}</th>
                    <td className="px-4 py-3">{row.elements}</td>
                    <td className="px-4 py-3">{row.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="4. Legal Bases for Processing User Data">
          <NumberedList>
            <li>
              <Term>Consent:</Term> Express consent obtained for recording video screening interviews, processing
              promotional communications, or placing non-essential cookies.
            </li>
            <li>
              <Term>Legitimate Interests:</Term> Processing required for fraud prevention, network security, refining
              candidate matching algorithms, and protecting legal rights and improving our services
            </li>
            <li>
              <Term>Legal Obligation:</Term> Statutory compliance under Nigerian tax laws, anti-money laundering
              regulations, and Nigeria Data Protection Commission (NDPC) regulatory reporting.
            </li>
          </NumberedList>
        </Section>

        <Section title="5. Purposes of Processing">
          <Subsection title="How we use your personal data">
            <p>
              Whether we obtain your personal data directly from you or from a third party, we will only use your
              personal data in connection with our professional activities (including the fulfilment of our legal or
              regulatory obligations). These “Authorized Uses” may include:
            </p>
            <BulletList>
              <li>Our professional service of connecting job seekers with potential employers</li>
              <li>
                managing our business relationship with you or your organization, whether in connection with rendering
                professional services to you, or as your employer or former employer, including processing payments,
                accounting, billing and collection and related services;
              </li>
              <li>acting in compliance with our legal obligations;</li>
              <li>supervision of access to our systems and online platforms;</li>
              <li>complying with court orders and other legal requirements;</li>
              <li>
                processing that is necessary for purposes of the reasonable interest of AMARIS PARTNERS or third parties
                provided that such interests do not override your interests or your fundamental rights and freedoms;
                and
              </li>
              <li>
                for any purpose relating to the foregoing or for any purpose for which you provided the personal data to
                AMARIS PARTNERS.
              </li>
              <li>
                Executing the 5-Step Verification Process (Portfolio Review, Interview, Technical Assessment, Core
                Values Training, Verification);
              </li>
              <li>Matching Candidates with prospective Employers globally;</li>
              <li>Administering employer and candidate accounts;</li>
              <li>Facilitating payments, billing, and commercial invoicing;</li>
              <li>
                Detecting, preventing, and mitigating fraudulent activities, unauthorized access, and security
                incidents;
              </li>
              <li>Complying with regulatory obligations under the law</li>
            </BulletList>
            <p>
              If you have given us your express consent, we may process your personal data for additional purposes.
              Please note that you may withdraw your consent at any time, if you so wish.
            </p>
            <p>Ways in which we may process your personal data may include:</p>
            <BulletList>
              <li>
                communicating with you with respect to recent developments in the way we offer our services,
                announcements, events and our services which may be of interest to you;
              </li>
              <li>issuing reviews or marketing materials;</li>
              <li>
                gathering information regarding your preferences to improve the quality of our interaction with you,
                such as through website analytics or the tracking of our client publications; and
              </li>
              <li>any other purpose for which you have given consent.</li>
            </BulletList>
          </Subsection>

          <Subsection title="Safeguarding your personal data">
            <p>
              Our website is built with strong security features that continuously protect your information. If we do
              detect something risky that we think you should know about, we’ll notify you and help guide you through
              steps to stay better protected.
            </p>
            <BulletList>
              <li>We use encryption to keep your data private while in transit</li>
              <li>
                We offer a range of security features, like{" "}
                <Link href="/account#security" className={legalLinkClass}>
                  Security Checkup and passcode
                </Link>
                , to help you protect your account
              </li>
              <li>
                We review our information collection, storage, and processing practices, including physical security
                measures, to prevent unauthorized access to our systems
              </li>
            </BulletList>
            <p>
              We restrict access to personal information to AMARIS PARTNERS employees, contractors, and agents who need
              that information in order to process it. Anyone with this access is subject to strict contractual
              confidentiality obligations and may be disciplined or terminated if they fail to meet these obligations.
            </p>
          </Subsection>

          <Subsection title="Retaining your personal data">
            <p>
              We will delete your personal data when it is no longer reasonably required for the Authorized Uses, or
              you withdraw your consent (whichever is applicable), provided that we are not legally required or
              otherwise authorized to continue to hold such data. We may retain your personal data for an additional
              period to the extent that deletion would require us to overwrite our automated disaster recovery backup
              systems or to the extent we deem it necessary to assert or defend legal claims during any relevant
              retention period.
            </p>
          </Subsection>
        </Section>

        <Section title="6. Data Sharing and Disclosure">
          <p>Amaris Partners does not sell, rent, or trade personal data. Data is shared strictly with:</p>
          <NumberedList>
            <li>
              <Term>Prospective Employers:</Term> Verified candidate profiles, assessment summaries, and portfolio
              materials are shared with employers seeking relevant skills;
            </li>
            <li>
              <Term>Third-Party Service Providers:</Term> Cloud hosting providers (e.g., AWS, Google Cloud), technical
              assessment vendors, video conference software, and payment processors bound by strict Data Processing
              Agreements (DPAs);
            </li>
            <li>
              <Term>Legal Authorities:</Term> Regulatory bodies (e.g., NDPC, law enforcement agencies) when compelled
              by binding court orders or statutory mandates.
            </li>
          </NumberedList>
        </Section>

        <Section title="7. Retention and Security Measures">
          <Subsection title="7.1 Retention Policy">
            <p>
              Personal data is retained only for as long as necessary to fulfill the purposes set out in this Policy:
            </p>
            <BulletList>
              <li>
                <Term>Active Candidate Accounts:</Term> Retained for the duration of platform membership;
              </li>
              <li>
                <Term>Inactive Candidate Records:</Term> Archived after two (2) years of inactivity, or erased upon
                verified request;
              </li>
              <li>
                <Term>Financial &amp; Transaction Records:</Term> Retained for seven (7) years in compliance with
                Nigerian tax and accounting laws.
              </li>
            </BulletList>
          </Subsection>
        </Section>

        <Section title="8. Your Data Subject Rights">
          <p>As a data subject using our platform, you hold the following rights:</p>
          <BulletList>
            <li>
              <Term>Right of Access:</Term> Request copies of your personal data processed by us;
            </li>
            <li>
              <Term>Right to Rectification:</Term> Request correction of inaccurate or incomplete information;
            </li>
            <li>
              <Term>Right to Erasure (“Right to be Forgotten”):</Term> Request deletion of data where processing is no
              longer lawful or necessary;
            </li>
            <li>
              <Term>Right to Restrict or Object:</Term> Limit or object to processing based on legitimate interests or
              direct marketing;
            </li>
            <li>
              <Term>Right to Data Portability:</Term> Receive your data in a structured, commonly used,
              machine-readable format;
            </li>
            <li>
              <Term>Right to Withdraw Consent:</Term> Revoke consent at any time without affecting prior lawful
              processing.
            </li>
            <li>
              <Term>Right to lodge a complaint:</Term> You also maintain the right to lodge a complaint with your local
              data protection authority. In Nigeria, this is the{" "}
              <ExternalLink href="https://ndpc.gov.ng">Nigeria Data Protection Commission (NDPC)</ExternalLink>.
            </li>
          </BulletList>
          <p>
            In addition to your rights under applicable data protection legislation and where we are authorized or
            required by applicable law and by our professional obligations, we will provide you, upon request, with a
            copy of your personal data and we will correct any errors identified by you. Except as provided above, we
            will not use your data for any automated decision-making or any profiling. You also have the right to be
            forgotten and to limit our processing of your personal data.
          </p>
          <p>
            If you have concerns regarding our data handling, you can email us at <ContactEmail />.
          </p>
          <p>Requests are processed within 30 days without charge.</p>
        </Section>
      </LegalDocument>

      <LegalDocument id="cookie-policy" title="Cookie Policy" dates={["Last Updated: September 10, 2026"]}>
        <Section title="1. What Are Cookies and Tracking Technologies?">
          <p>
            This Cookie Policy explains how Amaris Partners Limited uses cookies, web beacons, pixels, and local storage
            (collectively, “Tracking Technologies”) on our Site. A cookie is a small text file placed on your device by
            a web server that enables site functionality, user preference storage, and analytical tracking.
          </p>
          <p>
            We utilise Cookies to differentiate each user of our platform from other users and gauge your interaction
            with our website to enhance our services. Depending on your Cookie management settings and preferences, we
            may store Cookies on your device when you visit our website. We will exclusively deploy analytics Cookies if
            you provide consent or accept these Cookies. Certain browsers may automatically accept Cookies, while
            others can be adjusted to reject Cookies or notify you when a website intends to place a Cookie on your
            computer. If you opt to disable non-essential Cookies could potentially limit your ability to fully
            experience our website.
          </p>
        </Section>

        <Section title="2. Categories of Cookies We Use">
          <p>We deploy Tracking Technologies across four primary categories:</p>
          <Subsection title="2.1 Essential / Strictly Necessary Cookies">
            <p>
              These cookies are indispensable for core site operations, account authentication, session management, and
              platform security. They cannot be disabled in our systems, and we process them based on Contractual
              Necessity and Legitimate Interest.
            </p>
          </Subsection>
          <Subsection title="2.2 Performance and Analytics Cookies">
            <p>
              These cookies collect aggregated telemetry on how visitors interact with the Site, identifying traffic
              volume, popular pages, loading times, and navigation drop-offs (e.g., Google Analytics). This is processed
              based on your consent.
            </p>
          </Subsection>
          <Subsection title="2.3 Functional & Preference Cookies">
            <p>
              These cookies allow the Site to remember user preferences (such as selected language, regional layout, or
              dashboard view settings) to deliver an enhanced, personalized experience. This is processed based on
              consent.
            </p>
          </Subsection>
          <Subsection title="2.4 Targeting & Advertising Cookies">
            <p>
              Used by third-party advertising partners to build a profile of your interests and display relevant
              recruitment advertisements on non-Amaris Partners websites. This is processed only based on explicit
              consent.
            </p>
          </Subsection>
        </Section>

        <Section title="3. Cookie Consent & Preference Management">
          <Subsection title="3.1 Cookie Consent Banner">
            <p>
              Upon your initial visit to our Site from the EU, UK, Nigeria, or applicable jurisdictions, you will be
              presented with a granular Cookie Consent Management banner. Non-essential cookies will not be loaded prior
              to receiving your explicit consent.
            </p>
          </Subsection>
          <Subsection title="3.2 Managing and Withdrawing Consent">
            <p>You may update your cookie preferences or revoke consent at any time by:</p>
            <NumberedList>
              <li>Clicking the “Privacy &amp; Cookie Settings” widget located at the footer of our website;</li>
              <li>
                Adjusting your web browser preferences to block, delete, or reject cookies:
                <ul className="mt-2 list-[circle] space-y-1 pl-6">
                  <li>
                    <ExternalLink href="https://support.google.com/chrome/answer/95647">
                      Google Chrome Settings
                    </ExternalLink>
                  </li>
                  <li>
                    <ExternalLink href="https://support.mozilla.org/en-US/kb/enhanced-tracking-protection-firefox-desktop">
                      Mozilla Firefox Settings
                    </ExternalLink>
                  </li>
                  <li>
                    <ExternalLink href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac">
                      Apple Safari Settings
                    </ExternalLink>
                  </li>
                  <li>
                    <ExternalLink href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-6394120f-43b0-0053-b014-7f37701b10d4">
                      Microsoft Edge Settings
                    </ExternalLink>
                  </li>
                </ul>
              </li>
            </NumberedList>
          </Subsection>
        </Section>

        <Section title="4. Updates and Contact">
          <p>
            We may update this Cookie Policy periodically to reflect technological shifts or statutory revisions under
            relevant regulatory guidelines.
          </p>
          <p>
            For inquiries concerning our use of tracking technologies, please contact us at <ContactEmail />.
          </p>
        </Section>
      </LegalDocument>
    </LegalPage>
  );
}
