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
  legalLinkClass,
} from "@/components/legal/legal-document";

// Transcribed from legaldocs/AMARIS PARTNERS_ TERMS OF USE.pdf, which holds
// both the User Agreement and the Terms of Use, in that order. Keep the wording
// in step with that document; only headings are re-cased for the web.

export const metadata = {
  title: "User Agreement & Terms of Use | Amaris Partners",
};

const SITE_URL = "https://amarispartners.com";

export default function TermsPage() {
  return (
    <LegalPage
      title="User Agreement & Terms of Use"
      contents={[
        { id: "user-agreement", label: "User Agreement" },
        { id: "terms-of-use", label: "Terms of Use" },
      ]}
    >
      <LegalDocument
        id="user-agreement"
        title="User Agreement"
        dates={["Effective Date: September 10, 2026", "Last Updated: November 6, 2026"]}
      >
        <Section title="1. Introduction">
          <Subsection title="1.1 Binding Agreement">
            <p>
              This User Agreement (“Agreement”) constitutes a legally binding contract between you (whether an
              individual, sole proprietor, or corporate entity, referred to herein as “User”, “Talent”, “employer”,
              “you”, or “your”) and Amaris Partners Limited (“Amaris Partners”, “Company”, “we”, “us”, or “our”), a
              company incorporated under the laws of the Federal Republic of Nigeria. This Agreement governs your
              registration, access, and participation in the Amaris Partners curated talent marketplace, platform, and
              associated services (collectively, the “Services”).
            </p>
          </Subsection>
          <Subsection title="1.2 Governing Documents">
            <p>
              By creating an account on our website{" "}
              <a href={SITE_URL} className={legalLinkClass}>
                {SITE_URL}
              </a>{" "}
              or accessing or using our Services, you are agreeing to enter into a legally binding contract with AMARIS
              PARTNERS (even if you are using third-party credentials or using our Services on behalf of a company). If
              you do not agree to this contract (“User Agreement”), do not create an account or access or otherwise use
              any of our Services.
            </p>
            <p>
              If you wish to terminate this Contract at any time, you can do so by{" "}
              <Link href="/account" className={legalLinkClass}>
                closing your account
              </Link>{" "}
              and no longer accessing or using our Services.
            </p>
            <p>
              As a Visitor or Member of our Services, the collection, use, and sharing of your personal data is subject
              to our{" "}
              <Link href="/privacy" className={legalLinkClass}>
                Privacy Policy
              </Link>
              , our{" "}
              <Link href="/privacy#cookie-policy" className={legalLinkClass}>
                Cookie Policy
              </Link>
              , the{" "}
              <a href="#terms-of-use" className={legalLinkClass}>
                Terms of Use
              </a>
              , and other documents referenced in our Privacy Policy and updates. You acknowledge that you have read our
              Privacy Policy.
            </p>
            <p>By using the Site, you represent and warrant that:</p>
            <NumberedList>
              <li>all registration information you submit will be true, accurate, current, and complete;</li>
              <li>
                you will maintain the accuracy of such information and promptly update such registration information as
                necessary;
              </li>
              <li>you have the legal capacity, and you agree to comply with our Terms of Use</li>
              <li>
                you are at least 18 years of age (or the age of legal majority in the jurisdiction in which you
                reside), or, if you are a minor, you have received permission from a parent or legal guardian to use
                the Site;
              </li>
              <li>
                you will not access the Site through automated or non-human means, whether through a bot, script, or
                otherwise;
              </li>
              <li>you will not use the Site for any illegal or unauthorized purpose;</li>
              <li>your use of the Site will not violate any applicable law or regulation.</li>
            </NumberedList>
            <p>
              If you provide any information that is untrue, inaccurate, not current, or incomplete, we have the right
              to suspend or terminate your account and refuse any current or future use of the Site (or any portion
              thereof)
            </p>
          </Subsection>
        </Section>

        <Section title="2. Service Status">
          <Subsection title="2.1 Our Service Status">
            <p>
              Amaris Partners operates a specialized, technology-enabled talent marketplace designed to vet, curate, and
              match highly skilled professionals (“Talents”) with commercial organizations (“Employers”).
            </p>
            <p className="font-semibold text-black">
              UNLESS EXPRESSLY AGREED UPON IN A SEPARATE WRITTEN AGREEMENT SIGNED BY AN AUTHORIZED OFFICER OF AMARIS
              PARTNERS, AMARIS PARTNERS IS NOT AN EMPLOYER, AGENT, JOINT VENTURER, OR PAYROLL PROVIDER FOR ANY USER ON
              OUR PLATFORM
            </p>
            <p>
              Candidates matched or placed through the Services are independent professionals engaged directly by the
              Employer, or hired as direct employees of the Employer. AMARIS PARTNERS facilitates connections, verifies
              credentials, and provides training, but does not supervise, direct, or control the day-to-day work
              product, working hours, or employment conditions of Candidates.
            </p>
          </Subsection>
          <Subsection title="2.2 Core Values Integration">
            <p>
              The performance of all obligations under this Agreement shall be guided by AMARIS PARTNERS’ operational
              standard: Integrity, Stewardship, Excellence, Honest Communication, and Confidentiality.
            </p>
          </Subsection>
        </Section>

        <Section title="3. The Candidate Verification Process & Obligations">
          <Subsection title="3.1 The 5-Step Verification Process">
            <p>
              To qualify for placement within the Amaris Partners active talent pool, Candidates must complete our
              proprietary 5-Step Verification Process:
            </p>
            <NumberedList>
              <li>
                <Term>Application &amp; Portfolio Review:</Term> Comprehensive evaluation of professional background,
                resumes, past work samples, and references.
              </li>
              <li>
                <Term>Initial Screening Interview:</Term> Video-based assessment evaluating communication proficiency,
                professional demeanour, and cultural alignment.
              </li>
              <li>
                <Term>Technical Assessment:</Term> Role-specific practical evaluations, code reviews, domain tests, or
                technical problem-solving exercises.
              </li>
              <li>
                <Term>Core Values Training:</Term> Mandatory completion of Amaris Partners’ proprietary 5-module
                training program covering integrity, remote work excellence, professional stewardship, honest
                communication, and data confidentiality.
              </li>
              <li>
                <Term>Verified Status:</Term> Granting of the “Verified Badge” and admission into our active talent
                pool.
              </li>
            </NumberedList>
          </Subsection>
          <Subsection title="3.2 Candidate Warranties and Representations">
            <p>
              Candidates applying for or maintaining Verified Status explicitly represent and warrant that:
            </p>
            <BulletList>
              <li>
                All credentials, employment histories, certifications, portfolios, and identity documents submitted are
                true, complete, authentic, and accurate;
              </li>
              <li>
                Technical assessments and training modules are completed solely by the Candidate without unauthorized
                third-party assistance, impersonation, or unpermitted generative AI augmentation;
              </li>
              <li>
                Candidate is legally eligible to render remote professional services within their home jurisdiction and
                in accordance with any applicable international trade regulations or cross-border employment laws.
              </li>
            </BulletList>
          </Subsection>
          <Subsection title="3.3 Verification Discretion and Revocation">
            <p>
              Amaris Partners retains sole and absolute discretion with regard to the granting, withholding, suspension,
              or revocation of Verified Status. A Candidate’s Verified Status may be revoked immediately without prior
              notice if Amaris Partners detects misrepresentation, performance default, ethics breach, or non-compliance
              with this Agreement.
            </p>
          </Subsection>
        </Section>

        <Section title="4. Employer Engagement and Obligations">
          <Subsection title="4.1 Requisitions and Matching">
            <p>
              Employers submitting talent requisitions agree to provide accurate, non-discriminatory job descriptions,
              performance requirements, and compensation ranges. Amaris Partners will utilize reasonable commercial
              efforts to curate and present Candidates whose verified competencies match the Employer’s requisition.
            </p>
          </Subsection>
          <Subsection title="4.2 Direct Engagement Documentation">
            <p>
              Upon selection of a Candidate, the Employer and Candidate MAY execute an independent agreement or Direct
              Employment Contract governing project scope, deliverables, working hours, and remuneration.
            </p>
          </Subsection>
        </Section>

        <Section title="5. Fees, Billing, and Payments">
          <Subsection title="5.1 Fee Structures">
            <p>
              Amaris Partners charges Employers placement fees, subscription fees, platform usage fees, or managed
              service charges in accordance with the specific Fee Schedule agreed upon during Employer onboarding or
              detailed in a separate Statement of Work.
            </p>
          </Subsection>
          <Subsection title="5.2 Payment Terms and Taxes">
            <BulletList>
              <li>
                All fees are quoted in United States Dollars (USD) or Nigerian Naira (NGN), as designated at checkout or
                contract execution.
              </li>
              <li>Fees are non-refundable unless expressly stated otherwise in writing.</li>
              <li>
                Employers are responsible for all applicable taxes, including Value Added Tax (VAT), withholding taxes,
                sales tax, or operational levies mandated under Nigerian law or the Employer’s domestic jurisdiction.
              </li>
            </BulletList>
          </Subsection>
        </Section>

        <Section title="6. Confidentiality and Intellectual Property">
          <Subsection title="6.1 Confidentiality Obligations">
            <p>
              Each party agrees to safeguard and preserve the other party’s confidential information. “Confidential
              Information” includes, without limitation: trade secrets, Candidate assessment scores, client operations,
              source code, pricing structures, and proprietary training modules (including the 5-module Core Values
              Training).
            </p>
            <BulletList>
              <li>
                Confidential Information shall not be disclosed to any third party except as required by law or to
                authorized employees/advisers under equivalent confidentiality restrictions or in connection with
                matching a talent with an employer.
              </li>
            </BulletList>
          </Subsection>
          <Subsection title="6.2 Ownership of Intellectual Property">
            <BulletList>
              <li>
                <Term>Platform Intellectual Property:</Term> Amaris Partners retains exclusive title and ownership over
                all software, algorithms, assessment materials, training modules, Verified Badges, trademarks, and
                branding associated with the Services.
              </li>
              <li>
                <Term>Work Product:</Term> Unless otherwise agreed in writing between Employer and Candidate, all
                deliverables, code, designs, and intellectual property generated by a Candidate for an Employer pursuant
                to a paid engagement shall vest in the Employer upon full settlement of applicable fees.
              </li>
            </BulletList>
          </Subsection>
        </Section>

        <Section title="7. Indemnification and Limitation of Liability">
          <Subsection title="7.1 Indemnification">
            <p>
              Users (both Talent and Employers) agree to defend, indemnify, and hold harmless Amaris Partners, its
              directors, officers, employees, and affiliates against any third-party claims, damages, losses,
              liabilities, and expenses (including legal fees) arising out of or related to:
            </p>
            <NumberedList>
              <li>Breach of this Agreement or incorporated policies;</li>
              <li>Misrepresentation of candidate credentials or employer job requisitions;</li>
              <li>
                Direct disputes between Employers and Candidates regarding work quality, compensation, or termination of
                engagement.
              </li>
            </NumberedList>
          </Subsection>
          <Subsection title="7.2 Limitation of Liability">
            <p className="font-semibold text-black">TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAWS:</p>
            <BulletList>
              <li className="font-semibold text-black">
                AMARIS PARTNERS SHALL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, CONSEQUENTIAL, SPECIAL, PUNITIVE, OR
                EXEMPLARY DAMAGES, LOSS OF PROFITS, DATA LOSS, OR BUSINESS INTERRUPTION AS A RESULT OF THE USE OR MISUSE
                OF OUR PLATFORM.
              </li>
              <li className="font-semibold text-black">
                AMARIS PARTNERS’ TOTAL AGGREGATE LIABILITY ARISING FROM OR RELATING TO THIS AGREEMENT SHALL NOT EXCEED
                THE TOTAL FEES PAID BY THE USER TO AMARIS PARTNERS IN THE TWO (2) MONTHS PRECEDING THE CLAIM, OR $200
                USD, WHICHEVER IS GREATER.
              </li>
            </BulletList>
          </Subsection>
        </Section>

        <Section id="user-agreement-8" title="8. Dispute Resolution and Governing Law">
          <Subsection title="8.1 Governing Law">
            <p>
              This Agreement, its interpretation, and any non-contractual disputes or claims arising out of or in
              connection with it shall be construed in accordance with the laws of the Federal Republic of Nigeria.
            </p>
          </Subsection>
          <Subsection title="8.2 Amicable Settlement">
            <BulletList>
              <li>
                Any dispute, controversy or claim arising out of or in connection with or in relation to this
                Agreement, including any dispute as to the construction, validity, interpretation, enforceability or
                breach of this Agreement shall be resolved by the parties amicably.
              </li>
              <li>
                If the parties are unable to resolve such dispute within 30 days (or such further period as the parties
                shall agree in writing), the dispute shall be settled finally by arbitration in accordance with the
                Arbitration and Mediation Act, 2023 (or any amendment thereto or replacement thereof) and the
                Arbitration Rules connected thereto.
              </li>
              <li>
                The arbitral tribunal shall consist of three arbitrators; the party initiating the arbitration shall
                give to the other party a notice of arbitration, including the arbitrator that it appoints. The other
                party shall within seven days of the receipt of the notice of arbitration appoint its own arbitrator,
                failing which the appointment shall be made by the Chartered Institute of Arbitrators Nigeria Limited
                by Guarantee (trading as Nigerian Institute of Chartered Arbitrators).
              </li>
              <li>
                The two parties-appointed arbitrators shall jointly appoint the third arbitrator who shall preside over
                the arbitral tribunal. If within seven days of the appointment of the second arbitrator, the two
                parties-appointed arbitrators are unable to agree on the choice of the third arbitrator, the third
                arbitrator shall be appointed by the Chartered Institute of Arbitrators Nigeria Limited by Guarantee
                (trading as Nigerian Institute of Chartered Arbitrators). The place of the arbitration shall be in
                Lagos, Nigeria; and the arbitration procedure shall be governed by the laws of the Federal Republic of
                Nigeria. The language of the arbitration shall be English.
              </li>
            </BulletList>
          </Subsection>
        </Section>

        <Section title="9. Termination, Severability, and General Terms">
          <BulletList>
            <li>
              <Term>Termination:</Term> Amaris Partners reserves the right to suspend or terminate account access
              immediately for violations of platform integrity, ethics breaches, or fraudulent acts.
            </li>
            <li>
              <Term>Severability:</Term> If any provision of this Agreement is held to be invalid or unenforceable, such
              provision shall be severed, and the remaining provisions shall continue in full legal force.
            </li>
            <li>
              <Term>Entire Agreement:</Term> This Agreement, along with the incorporated policies, constitutes the
              entire understanding between the parties regarding the subject matter hereof.
            </li>
          </BulletList>
        </Section>
      </LegalDocument>

      <LegalDocument
        id="terms-of-use"
        title="Terms of Use"
        dates={["Effective Date: September 10, 2026", "Last Updated: November 6, 2026"]}
      >
        <Section title="1. Access and Eligibility">
          <Subsection title="1.1 Acceptance of Terms">
            <p>
              By visiting, browsing, registering for, or interacting with the Amaris Partners website{" "}
              <a href={SITE_URL} className={legalLinkClass}>
                {SITE_URL}
              </a>
              , web application, mobile interfaces, or API endpoints (collectively, the “Site”), you agree to abide by
              these Terms of Use (“Terms”). Your use of our website and any information available through it is subject
              to the following terms and conditions, as amended by us from time to time.
            </p>
          </Subsection>
          <Subsection title="1.2 Eligibility">
            <p>
              The Site is intended for professional users who are at least eighteen (18) years of age (or the age of
              legal majority in your jurisdiction). A minor may use the Site only with the permission of a parent or
              legal guardian. By accessing the Site, you represent and warrant that you meet this eligibility threshold
              or have that permission, and that you (or, for a minor, your parent or legal guardian) possess full legal
              capacity to enter into binding legal agreements.
            </p>
          </Subsection>
        </Section>

        <Section title="2. Account Creation and Security">
          <Subsection title="2.1 Account Credentials">
            <p>
              Users must provide accurate, current, and complete registration data. You are strictly responsible for
              maintaining the confidentiality of your authentication credentials (passwords, two-factor keys, API
              tokens) and for all activities occurring under your account.
            </p>
          </Subsection>
          <Subsection title="2.2 Impersonation and Unauthorized Access">
            <p>
              You shall not create accounts using false identities, misrepresent your corporate affiliations, or use
              another individual’s credentials. Amaris Partners must be notified immediately at <ContactEmail /> upon
              discovery of any security breach or unauthorized access on your account.
            </p>
          </Subsection>
        </Section>

        <Section title="3. Acceptable Use and Unacceptable Use of Our Platform">
          <Subsection title="3.1 Acceptable Use">
            <p>
              You agree to use the Site exclusively for lawful commercial purposes relating to remote talent
              recruitment, professional portfolio presentation, skills assessment, and industry networking.
            </p>
          </Subsection>
          <Subsection title="3.2 Prohibited Use">
            <p>Users shall not, directly or indirectly:</p>
            <BulletList>
              <li>
                <Term>Scraping &amp; Data Extraction:</Term> Use automated scrapers, bots, spiders, or data mining
                algorithms to extract Candidate profiles, employer listings, or platform content;
              </li>
              <li>
                <Term>Reverse Engineering:</Term> Decompile, reverse engineer, disassemble, or derive source code or
                proprietary assessment logic from the Site;
              </li>
              <li>
                <Term>Malicious Software:</Term> Upload, transmit, or distribute viruses, worms, Trojan horses,
                ransomware, or malicious code;
              </li>
              <li>
                <Term>Harassment &amp; Discrimination:</Term> Engage in discriminatory, abusive, defamatory, obscene, or
                illegal communications;
              </li>
              <li>
                <Term>Interference:</Term> Attempt to disrupt, overload, or bypass Site infrastructure, security
                controls, or rate limits.
              </li>
            </BulletList>
          </Subsection>
        </Section>

        <Section title="4. Intellectual Property Rights and User Content">
          <Subsection title="4.1 Proprietary Ownership">
            <p>
              All rights, title, and interest in and to the Site, which includes, but is not limited to visual
              interfaces, logos, code, domain names, assessment methodology, and courseware, are the exclusive property
              of Amaris Partners Limited and its licensors, protected under Nigerian legal frameworks and international
              intellectual property treaties.
            </p>
          </Subsection>
          <Subsection title="4.2 User-Generated Content">
            <p>
              Users retain ownership of CVs, portfolios, logos, and job descriptions uploaded to the Site (“User
              Content”). By uploading User Content, you grant Amaris Partners a worldwide, non-exclusive, royalty-free,
              sublicensable license to host, display, reproduce, and process such content solely for the purpose of
              delivering the Services.
            </p>
          </Subsection>
          <Subsection title="4.3 AI Features and Generative Content">
            <p>
              Where the Site incorporates artificial intelligence (AI) or machine learning tools to assist in job
              description creation, resume parsing, or Candidate matching, you acknowledge that AI output is provided
              for informational and assistance purposes only. Users must independently review and verify AI-generated
              output before operational reliance.
            </p>
          </Subsection>
        </Section>

        <Section title="5. Disclaimers">
          <Subsection title="5.1 Service Provision">
            <p className="font-semibold text-black">
              THE SITE AND PLATFORM ARE PROVIDED ON AN “AS IS” AND “AS AVAILABLE” BASIS WITHOUT WARRANTIES OF ANY KIND,
              EITHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF
              MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.
            </p>
          </Subsection>
          <Subsection title="5.2 No Guarantee of Placement or Employment">
            <p>Amaris Partners makes no guarantees or warranties regarding:</p>
            <BulletList>
              <li>The placement of any Candidate;</li>
              <li>The availability of qualified Candidates for an Employer;</li>
              <li>The uninterrupted, error-free, or secure operation of the Site.</li>
            </BulletList>
          </Subsection>
        </Section>

        <Section title="6. Third-Party Links and Services">
          <p>
            The Site may contain links to third-party web portals, testing suites, or payment processors. Amaris
            Partners Limited exercises no editorial control over, and assumes no responsibility or liability for, the
            content, privacy practices, or operational availability of external third-party platforms.
          </p>
        </Section>

        <Section title="7. Miscellaneous">
          <BulletList>
            <li>
              <Term>Modifications:</Term> Amaris Partners reserves the right to modify these Terms at any time. Material
              amendments will be notified via email or platform notification fourteen (14) days before taking effect.
              Your continued platform usage of our platform after such modification constitutes acceptance on the part
              of the user.
            </li>
            <li>
              <Term>Governing Law &amp; Jurisdiction:</Term> These Terms are governed by Nigerian law, with disputes
              subject to the dispute resolution mechanism outlined in{" "}
              <a href="#user-agreement-8" className={legalLinkClass}>
                Section 8 of the User Agreement
              </a>
              .
            </li>
            <li>
              <Term>Contact:</Term> Any Questions regarding these Terms should be directed to our legal desk at{" "}
              <ContactEmail />.
            </li>
          </BulletList>
        </Section>
      </LegalDocument>
    </LegalPage>
  );
}
