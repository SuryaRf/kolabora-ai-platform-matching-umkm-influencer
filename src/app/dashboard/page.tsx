import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function DashboardRedirect() {
  const session = await auth();

  if (!session?.user) redirect("/login");

  if (session.user.role === "UMKM") redirect("/dashboard/umkm");
  if (session.user.role === "INFLUENCER") redirect("/dashboard/influencer");

  redirect("/login");
}
