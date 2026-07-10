import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { DashboardView } from "@/components/member/dashboard-view";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/");
  }

  return <DashboardView name={user.name ?? "there"} role={user.role} />;
}
