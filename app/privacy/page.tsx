import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | Agency Build",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="flex-1 bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16 lg:py-24">
        <h1 className="text-4xl font-display font-black text-black mb-2">Privacy Policy</h1>
        <p className="text-gray-500 mb-10">Last updated: July 2026</p>

        <div className="space-y-8 text-gray-700 leading-relaxed">
          <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            This is a general template and not legal advice. Have it reviewed by qualified counsel before relying on it.
          </p>

          <section>
            <h2 className="text-xl font-bold text-black mb-3">1. Information we collect</h2>
            <p>
              When you apply as talent, submit a hiring inquiry, or create an account, we collect the information you
              provide — such as your name, email address, phone number, country, professional details, and any content
              you choose to share (bio, portfolio links, CV links). We also store account credentials in hashed form.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black mb-3">2. How we use your information</h2>
            <p>
              We use your information to operate the platform: to match talent with employers, communicate with you
              about your application or inquiry, verify accounts, provide training, and improve our services. We do not
              sell your personal information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black mb-3">3. Sharing</h2>
            <p>
              We share information only as needed to provide the service — for example, sharing a verified talent
              profile with a prospective employer — or with service providers who process data on our behalf (such as
              our email and database providers), and where required by law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black mb-3">4. Data retention & security</h2>
            <p>
              We retain your information for as long as your account is active or as needed to provide the service and
              meet legal obligations. We use industry-standard measures to protect your data, though no method of
              transmission or storage is completely secure.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black mb-3">5. Your rights</h2>
            <p>
              You may request access to, correction of, or deletion of your personal information. To make a request,
              contact us using the details below.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black mb-3">6. Contact</h2>
            <p>
              Questions about this policy? Reach us through the details on our{" "}
              <Link href="/about" className="text-black font-semibold underline hover:no-underline">About</Link> page.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
