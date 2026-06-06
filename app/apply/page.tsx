"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

const applySchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(5, "Phone number is required"),
  country: z.string().min(2, "Country is required"),
  role: z.string().min(1, "Please select a role"),
  experience: z.string().min(1, "Years of experience is required"),
  portfolio: z.string().url("Must be a valid URL").optional().or(z.literal('')),
  bio: z.string().min(10, "Bio must be at least 10 characters"),
  whyJoin: z.string().min(10, "Please tell us why you want to join"),
  cv: z.any().optional(), // File upload placeholder
});

type ApplyFormValues = z.infer<typeof applySchema>;

const roles = [
  "Virtual Assistant",
  "Customer Support",
  "Social Media Manager",
  "Content Writer",
  "Bookkeeper",
  "Project Manager",
  "Other"
];

export default function ApplyPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ApplyFormValues>({
    resolver: zodResolver(applySchema),
  });

  const onSubmit = async (data: ApplyFormValues) => {
    setIsSubmitting(true);
    
    // Import action dynamically or rely on top-level import
    const { submitTalentApplication } = await import('@/app/actions');
    const result = await submitTalentApplication({
      name: data.name,
      email: data.email,
      phone: data.phone,
      country: data.country,
      role: data.role,
      experience: data.experience,
      portfolio: data.portfolio,
      bio: data.bio,
      whyJoin: data.whyJoin,
      cvLink: "", // Handle file upload separately in a real app
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
        <h1 className="text-3xl font-bold text-black mb-4">Application Submitted!</h1>
        <p className="text-gray-600 max-w-md mx-auto mb-8">
          Thank you for applying to Agency Build. We will review your application and be in touch soon regarding the next steps.
        </p>
        <Button onClick={() => setIsSuccess(false)} variant="outline">Submit another application</Button>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 py-12 lg:py-24">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-gray-100">
          <div className="mb-10 text-center">
            <h1 className="text-4xl font-display font-bold text-black mb-6">Join Agency Build</h1>
            <p className="text-gray-600 text-lg leading-relaxed max-w-2xl mx-auto">
              Are you ready to elevate your career and work with the most innovative companies on the globe? At Agency Build, we believe that incredible talent should not be limited by geography. We are searching for passionate, dedicated, and skilled professionals who are ready to make a massive impact. When you join our verified network, you gain exclusive access to premier roles, continuous growth opportunities, and a community of like minded experts. Step into your future and show the world what you are truly capable of. Your next big break starts right here.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-black">Full Name *</label>
                <input
                  {...register("name")}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="John Doe"
                />
                {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-black">Email Address *</label>
                <input
                  {...register("email")}
                  type="email"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="john@example.com"
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

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-black">Role Applying For *</label>
                <select
                  {...register("role")}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-white"
                >
                  <option value="">Select a role...</option>
                  {roles.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                {errors.role && <p className="text-red-500 text-xs">{errors.role.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-black">Years of Experience *</label>
                <input
                  {...register("experience")}
                  type="number"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="3"
                />
                {errors.experience && <p className="text-red-500 text-xs">{errors.experience.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-black">Link to Portfolio / LinkedIn</label>
              <input
                {...register("portfolio")}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="https://linkedin.com/in/..."
              />
              {errors.portfolio && <p className="text-red-500 text-xs">{errors.portfolio.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-black">Short Bio *</label>
              <textarea
                {...register("bio")}
                rows={4}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black resize-none"
                placeholder="Tell us a bit about yourself..."
              />
              {errors.bio && <p className="text-red-500 text-xs">{errors.bio.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-black">Why do you want to join Agency Build? *</label>
              <textarea
                {...register("whyJoin")}
                rows={3}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black resize-none"
                placeholder="I am looking for..."
              />
              {errors.whyJoin && <p className="text-red-500 text-xs">{errors.whyJoin.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-black">Upload CV</label>
              <input
                {...register("cv")}
                type="file"
                className="w-full px-4 py-2 border border-black/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-white text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-black file:text-white hover:file:bg-black/80"
              />
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Application"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
