import DashboardLayout from "@/components/dashboard/DashboardLayout";

export default function InfluencerLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout role="influencer">{children}</DashboardLayout>;
}
