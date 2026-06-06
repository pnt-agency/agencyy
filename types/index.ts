export interface Talent {
  id?: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  role: string;
  experience: string;
  portfolio?: string;
  bio: string;
  whyJoin: string;
  cvLink?: string;
  status: "Applicant" | "Screened" | "Trained" | "Verified" | "Premium Verified";
  followUpDate?: string;
  notes?: string;
  createdAt?: string;
}

export interface Employer {
  id?: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  country: string;
  roleNeeded: string;
  numberNeeded: number;
  budget: string;
  startDate: string;
  requirements?: string;
  status: "New Inquiry" | "Contacted" | "In Progress" | "Closed Won" | "Closed Lost";
  followUpDate?: string;
  notes?: string;
  createdAt?: string;
}
