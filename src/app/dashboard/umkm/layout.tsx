import { redirect } from "next/navigation";
import { auth } from "@/auth";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

export default async function UMKMLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) redirect("/login");
  if (session.user.role !== "UMKM") redirect("/dashboard");

  return (
    <DashboardLayout
      role="UMKM"
      user={{
        id: session.user.id,
        name: session.user.name ?? null,
        email: session.user.email ?? "",
        image: session.user.image ?? null,
        role: "UMKM",
      }}
    >
      {children}
    </DashboardLayout>
  );
}
