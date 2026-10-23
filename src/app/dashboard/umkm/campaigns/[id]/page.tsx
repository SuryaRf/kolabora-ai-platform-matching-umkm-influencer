import CampaignDetailClient from "@/components/dashboard/CampaignDetailClient";

export default async function UMKMCampaignDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CampaignDetailClient id={id} />;
}
