import { Talent, Employer } from "@/types";

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const TALENT_TABLE = process.env.AIRTABLE_TALENT_TABLE_ID;
const EMPLOYER_TABLE = process.env.AIRTABLE_EMPLOYER_TABLE_ID;

export async function createTalentRecord(data: Omit<Talent, "id" | "status" | "createdAt">) {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || !TALENT_TABLE) {
    console.warn("Airtable environment variables not configured.");
    return null;
  }

  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${TALENT_TABLE}`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${AIRTABLE_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      records: [
        {
          fields: {
            Name: data.name,
            Email: data.email,
            Phone: data.phone,
            Country: data.country,
            Role: data.role,
            Experience: data.experience,
            Portfolio: data.portfolio || "",
            Bio: data.bio,
            WhyJoin: data.whyJoin,
            CVLink: data.cvLink || "",
            Status: "Applicant",
          }
        }
      ],
      typecast: true,
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("Airtable Error details:", errorBody);
    throw new Error(`Failed to create Airtable record: ${response.statusText} - ${errorBody}`);
  }

  return await response.json();
}

export async function createEmployerRecord(data: Omit<Employer, "id" | "status" | "createdAt">) {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || !EMPLOYER_TABLE) {
    console.warn("Airtable environment variables not configured.");
    return null;
  }

  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${EMPLOYER_TABLE}`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${AIRTABLE_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      records: [
        {
          fields: {
            "Company Name": data.companyName,
            "Contact Person Name": data.contactName,
            "Email Address": data.email,
            "Phone Number": data.phone,
            Country: data.country,
            "Role Needed": data.roleNeeded,
            "Number of People Needed": String(data.numberNeeded),
            "Budget Range (per person)": data.budget,
            "When do you want them to start?": data.startDate,
            "Additional Requirements / Job Description": data.requirements || "",
          }
        }
      ],
      typecast: true,
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("Airtable Employer Error details:", errorBody);
    throw new Error(`Failed to create Airtable record: ${response.statusText} - ${errorBody}`);
  }

  return await response.json();
}
