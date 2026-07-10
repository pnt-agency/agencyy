import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { TrainingView } from "@/components/member/training-view";

export default async function TrainingPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/");
  }

  return <TrainingView />;
}
