import DashboardLayout from "@/components/dashboard/DashboardLayout";

export default function UMKMLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout role="umkm">{children}</DashboardLayout>;
}
