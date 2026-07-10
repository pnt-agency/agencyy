import Link from "next/link";

export const metadata = {
  title: "Terms of Service | Agency Build",
};

export default function TermsOfServicePage() {
  return (
    <div className="flex-1 bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16 lg:py-24">
        <h1 className="text-4xl font-display font-black text-black mb-2">Terms of Service</h1>
        <p className="text-gray-500 mb-10">Last updated: July 2026</p>

        <div className="space-y-8 text-gray-700 leading-relaxed">
          <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            This is a general template and not legal advice. Have it reviewed by qualified counsel before relying on it.
          </p>

          <section>
            <h2 className="text-xl font-bold text-black mb-3">1. Acceptance of terms</h2>
            <p>
              By accessing or using Agency Build, you agree to these Terms of Service. If you do not agree, please do
              not use the platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black mb-3">2. Accounts</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials and for all activity
              under your account. You agree to provide accurate information and to keep it up to date.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black mb-3">3. Acceptable use</h2>
            <p>
              You agree not to misuse the platform, including by submitting false information, impersonating others,
              attempting to disrupt the service, or using it for any unlawful purpose.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black mb-3">4. Talent & employer relationships</h2>
            <p>
              Agency Build facilitates connections between talent and employers. We do not guarantee placements,
              hiring outcomes, or the conduct of any party. Engagements between talent and employers are between those
              parties.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black mb-3">5. Intellectual property</h2>
            <p>
              The platform and its content are owned by Agency Build and protected by applicable laws. You retain
              rights to the content you submit but grant us a license to use it to operate the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black mb-3">6. Limitation of liability</h2>
            <p>
              The service is provided &ldquo;as is&rdquo; without warranties of any kind. To the maximum extent
              permitted by law, Agency Build is not liable for any indirect or consequential damages arising from your
              use of the platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black mb-3">7. Changes & contact</h2>
            <p>
              We may update these terms from time to time. Continued use after changes constitutes acceptance. Questions?
              See our{" "}
              <Link href="/about" className="text-black font-semibold underline hover:no-underline">About</Link> page.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
