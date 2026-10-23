import { redirect } from "next/navigation";
import { auth } from "@/auth";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

export default async function InfluencerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) redirect("/login");
  if (session.user.role !== "INFLUENCER") redirect("/dashboard");

  return (
    <DashboardLayout
      role="INFLUENCER"
      user={{
        id: session.user.id,
        name: session.user.name ?? null,
        email: session.user.email ?? "",
        image: session.user.image ?? null,
        role: "INFLUENCER",
      }}
    >
      {children}
    </DashboardLayout>
  );
}
