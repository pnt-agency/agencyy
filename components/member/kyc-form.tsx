"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Upload, Lock } from "lucide-react";
import { FileUpload, type UploadedFile } from "@/components/ui/file-upload";
import { presignKycUploadAction, submitKycAction } from "@/app/kyc-actions";
import { KYC_ID_TYPES } from "@/lib/validation";

const inputClass =
  "w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black bg-white transition-all";

const selectClass = `${inputClass} cursor-pointer`;

export type KycFormInitial = {
  legalName: string;
  dateOfBirth: string;
  country: string;
  idType: string;
  idNumber: string;
};

/** Newest date that still makes someone 18 today. */
function eighteenYearsAgo(): string {
  const date = new Date();
  date.setUTCFullYear(date.getUTCFullYear() - 18);
  return date.toISOString().slice(0, 10);
}

export function KycForm({ initial }: { initial: KycFormInitial }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [legalName, setLegalName] = useState(initial.legalName);
  const [dateOfBirth, setDateOfBirth] = useState(initial.dateOfBirth);
  const [country, setCountry] = useState(initial.country);
  const [idType, setIdType] = useState(initial.idType);
  const [idNumber, setIdNumber] = useState(initial.idNumber);
  const [idDocument, setIdDocument] = useState<UploadedFile | null>(null);
  const [selfie, setSelfie] = useState<UploadedFile | null>(null);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    legalName.trim().length > 1 &&
    Boolean(dateOfBirth) &&
    country.trim().length > 1 &&
    Boolean(idType) &&
    idNumber.trim().length >= 4 &&
    Boolean(idDocument) &&
    Boolean(selfie) &&
    consent &&
    !isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!idDocument || !selfie) {
      setError("Upload both your ID and a selfie before submitting.");
      return;
    }

    startTransition(async () => {
      const result = await submitKycAction({
        legalName,
        dateOfBirth,
        country,
        idType,
        idNumber,
        idDocument,
        selfie,
        consent,
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      // The server re-renders the page as "Pending" once this refreshes.
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8">
        <h2 className="text-lg font-bold text-black mb-1">Your details</h2>
        <p className="text-sm text-gray-500 mb-6">
          Use your name exactly as it appears on your ID.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <label htmlFor="legalName" className="block text-sm font-semibold text-gray-700 mb-1.5">
              Full legal name
            </label>
            <input
              id="legalName"
              value={legalName}
              onChange={(e) => setLegalName(e.target.value)}
              autoComplete="name"
              required
              maxLength={120}
              className={inputClass}
              placeholder="As printed on your ID"
            />
          </div>

          <div>
            <label htmlFor="dateOfBirth" className="block text-sm font-semibold text-gray-700 mb-1.5">
              Date of birth
            </label>
            <input
              id="dateOfBirth"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              max={eighteenYearsAgo()}
              required
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="country" className="block text-sm font-semibold text-gray-700 mb-1.5">
              Country
            </label>
            <input
              id="country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              autoComplete="country-name"
              required
              maxLength={80}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="idType" className="block text-sm font-semibold text-gray-700 mb-1.5">
              Type of ID
            </label>
            <select
              id="idType"
              value={idType}
              onChange={(e) => setIdType(e.target.value)}
              required
              className={selectClass}
            >
              <option value="">Choose one</option>
              {KYC_ID_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="idNumber" className="block text-sm font-semibold text-gray-700 mb-1.5">
              ID number
            </label>
            <input
              id="idNumber"
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value.toUpperCase())}
              required
              maxLength={40}
              className={inputClass}
              placeholder="Letters, digits and hyphens"
            />
          </div>
        </div>
      </section>

      <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8">
        <h2 className="text-lg font-bold text-black mb-1">Documents</h2>
        <p className="text-sm text-gray-500 mb-6">
          Stored privately and visible only to the Amaris review team.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FileUpload
            presign={(contentType, contentLength) =>
              presignKycUploadAction("id", contentType, contentLength)
            }
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            maxBytes={10 * 1024 * 1024}
            label="Photo page of your ID"
            hint="PDF, JPG, PNG or WebP · max 10MB"
            value={idDocument}
            onChange={setIdDocument}
          />
          <FileUpload
            presign={(contentType, contentLength) =>
              presignKycUploadAction("selfie", contentType, contentLength)
            }
            accept=".jpg,.jpeg,.png,.webp"
            maxBytes={10 * 1024 * 1024}
            label="Selfie holding your ID"
            hint="Face and ID clearly visible · max 10MB"
            value={selfie}
            onChange={setSelfie}
          />
        </div>

        <div className="mt-6 flex items-start gap-3 rounded-2xl bg-gray-50 border border-gray-100 p-4">
          <Lock className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
          <p className="text-xs text-gray-500 leading-relaxed">
            Your documents are used only to confirm your identity. They are never shown to employers,
            and the only thing that appears on your profile is an &ldquo;ID verified&rdquo; badge.
          </p>
        </div>
      </section>

      <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-black focus:ring-black cursor-pointer"
          />
          <span className="text-sm text-gray-600 leading-relaxed">
            I confirm the details are mine and consent to Amaris Partners processing my identity
            documents for verification, in line with the{" "}
            <a href="/privacy" className="underline font-medium text-black hover:no-underline">
              Privacy Policy
            </a>
            .
          </span>
        </label>

        {error && (
          <p role="alert" className="mt-4 text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="mt-6 w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-black text-white font-semibold hover:bg-black/85 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isPending ? (
            "Submitting…"
          ) : (
            <>
              <ShieldCheck className="w-4 h-4" />
              Submit for verification
            </>
          )}
        </button>

        <p className="mt-3 text-xs text-gray-400 flex items-center gap-1.5">
          <Upload className="w-3.5 h-3.5" />
          You can resubmit if we need a clearer document.
        </p>
      </section>
    </form>
  );
}
