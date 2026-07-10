import { CheckCircle2 } from "lucide-react";

export default function AboutPage() {
  const values = [
    { title: "Integrity", desc: "We do the right thing, even when no one is watching." },
    { title: "Stewardship", desc: "We treat our clients' businesses as if they were our own." },
    { title: "Excellence", desc: "We deliver outstanding results, on time, every time." },
    { title: "Honest Communication", desc: "We communicate proactively, transparently, and respectfully." },
    { title: "Confidentiality", desc: "We protect our clients' data and maintain the highest level of privacy." },
  ];

  return (
    <div className="flex-1 flex flex-col w-full bg-white">
      {/* Header */}
      <section className="bg-navy text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight mb-6">About Agency Build</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Our mission is to bridge the gap between world-class remote talent and forward-thinking companies.
          </p>
        </div>
      </section>

      {/* Difference Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-navy mb-6">How We Are Different</h2>
            <div className="prose prose-lg text-gray-600 max-w-none">
              <p className="mb-4">
                Most talent platforms leave employers to do the heavy lifting: sifting through hundreds of resumes, interviewing unvetted candidates, and hoping for the best. On the flip side, talented professionals often struggle to stand out in a sea of applicants.
              </p>
              <p>
                <strong>Agency Build sits in the middle as your trusted partner.</strong> We don&apos;t just connect; we curate. We thoroughly screen, test, and train every professional in our network before they ever meet a client. Think of us as your external HR department for remote hiring, lean, fast, and highly reliable.
              </p>
            </div>
          </div>

          {/* Verification Process */}
          <div className="mb-16 bg-gray-50 p-8 md:p-12 rounded-2xl border border-gray-100">
            <h2 className="text-3xl font-bold text-navy mb-8">The Verification Process</h2>
            <div className="space-y-6">
              {[
                { step: "1", title: "Application & Portfolio Review", text: "We review each candidate's experience, skills, and past work." },
                { step: "2", title: "Initial Screening Interview", text: "A video interview to assess communication skills and cultural fit." },
                { step: "3", title: "Technical Assessment", text: "Role-specific tests to verify their technical capabilities." },
                { step: "4", title: "Core Values Training", text: "Candidates complete our proprietary 5-module training on integrity and excellence." },
                { step: "5", title: "Verified & Placed", text: "Only those who pass all stages receive the Verified Badge and enter our active placement pool." }
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-navy text-white font-bold flex items-center justify-center shrink-0">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-navy">{item.title}</h3>
                    <p className="text-gray-600">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Core Values */}
          <div>
            <h2 className="text-3xl font-bold text-navy mb-8 text-center">Our Core Values</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {values.map((val) => (
                <div key={val.title} className="p-6 border border-gray-100 rounded-xl shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <CheckCircle2 className="w-6 h-6 text-gold" />
                    <h3 className="text-xl font-bold text-navy">{val.title}</h3>
                  </div>
                  <p className="text-gray-600">{val.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
