"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

const hireSchema = z.object({
  companyName: z.string().min(2, "Company name is required"),
  contactName: z.string().min(2, "Contact name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(5, "Phone number is required"),
  country: z.string().min(2, "Country is required"),
  roleNeeded: z.string().min(1, "Please select a role"),
  numberNeeded: z.coerce.number().min(1, "Must need at least 1 person"),
  budget: z.string().min(1, "Please select a budget range"),
  startDate: z.string().min(1, "Start date is required"),
  requirements: z.string().optional(),
});

type HireFormValues = z.infer<typeof hireSchema>;

const roles = [
  "Virtual Assistant",
  "Customer Support",
  "Social Media Manager",
  "Content Writer",
  "Bookkeeper",
  "Project Manager",
  "Multiple Roles",
  "Other"
];

const budgetRanges = [
  "Under $500/month",
  "$500 - $1000/month",
  "$1000 - $2000/month",
  "$2000+/month"
];

export default function HirePage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<HireFormValues>({
    resolver: zodResolver(hireSchema) as any,
  });

  const onSubmit = async (data: HireFormValues) => {
    setIsSubmitting(true);
    
    const { submitEmployerInquiry } = await import('@/app/actions');
    const result = await submitEmployerInquiry({
      companyName: data.companyName,
      contactName: data.contactName,
      email: data.email,
      phone: data.phone,
      country: data.country,
      roleNeeded: data.roleNeeded,
      numberNeeded: data.numberNeeded,
      budget: data.budget,
      startDate: data.startDate,
      requirements: data.requirements,
    });
    
    setIsSubmitting(false);
    if (result.success) {
      setIsSuccess(true);
    } else {
      alert("Something went wrong. Please try again.");
    }
  };

  if (isSuccess) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[60vh]">
        <div className="w-16 h-16 bg-black/5 text-black rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold text-black mb-4">Inquiry Received!</h1>
        <p className="text-gray-600 max-w-md mx-auto mb-8">
          Thank you for your interest in hiring through Agency Build. An account manager will reach out to you within 24 hours to discuss your needs.
        </p>
        <Button onClick={() => setIsSuccess(false)} variant="outline">Submit another inquiry</Button>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 py-12 lg:py-24">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-gray-100">
          <div className="mb-10 text-center">
            <h1 className="text-4xl font-display font-bold text-black mb-6">Hire Verified Talent</h1>
            <p className="text-gray-600 text-lg leading-relaxed max-w-2xl mx-auto">
              Are you looking to scale your business with the best professionals in the industry? At Agency Build, we understand that finding reliable, highly skilled experts can be a challenge. That is why we have cultivated an elite network of meticulously vetted talent ready to integrate seamlessly into your operations. Whether you need specialized expertise or dedicated support to drive your company forward, our streamlined process ensures you get matched with exactly who you need. Transform the way you work and build the remote team you have always envisioned right here.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-black">Company Name *</label>
                <input
                  {...register("companyName")}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="Acme Corp"
                />
                {errors.companyName && <p className="text-red-500 text-xs">{errors.companyName.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-black">Contact Person Name *</label>
                <input
                  {...register("contactName")}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="Jane Smith"
                />
                {errors.contactName && <p className="text-red-500 text-xs">{errors.contactName.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-black">Email Address *</label>
                <input
                  {...register("email")}
                  type="email"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="jane@acmecorp.com"
                />
                {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-black">Phone Number *</label>
                <input
                  {...register("phone")}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="+1 234 567 8900"
                />
                {errors.phone && <p className="text-red-500 text-xs">{errors.phone.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-black">Country *</label>
                <input
                  {...register("country")}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="United States"
                />
                {errors.country && <p className="text-red-500 text-xs">{errors.country.message}</p>}
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6 mt-6">
              <h3 className="text-lg font-bold text-black mb-4">Role Details</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-black">Role Needed *</label>
                  <select
                    {...register("roleNeeded")}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-white"
                  >
                    <option value="">Select a role...</option>
                    {roles.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  {errors.roleNeeded && <p className="text-red-500 text-xs">{errors.roleNeeded.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-black">Number of People Needed *</label>
                  <input
                    {...register("numberNeeded")}
                    type="number"
                    min="1"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="1"
                  />
                  {errors.numberNeeded && <p className="text-red-500 text-xs">{errors.numberNeeded.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-black">Budget Range (per person) *</label>
                  <select
                    {...register("budget")}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-white"
                  >
                    <option value="">Select budget range...</option>
                    {budgetRanges.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                  {errors.budget && <p className="text-red-500 text-xs">{errors.budget.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-black">When do you want them to start? *</label>
                  <input
                    {...register("startDate")}
                    type="date"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  />
                  {errors.startDate && <p className="text-red-500 text-xs">{errors.startDate.message}</p>}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-black">Additional Requirements / Job Description</label>
              <textarea
                {...register("requirements")}
                rows={4}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black resize-none"
                placeholder="List any specific tools, software, or skills required..."
              />
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Inquiry"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
