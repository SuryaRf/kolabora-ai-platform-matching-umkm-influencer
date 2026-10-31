import { MessageSquare } from "lucide-react";
import { auth } from "@/auth";
import FeaturePage from "@/components/dashboard/FeaturePage";
import ChatRoom from "@/components/dashboard/ChatRoom";

export default async function UMKMConversationPage({
  searchParams,
}: {
  /** Didapat dari tautan agenda/insight: /dashboard/umkm/chat?collaboration=<id> */
  searchParams: Promise<{ collaboration?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { collaboration } = await searchParams;

  return (
    <FeaturePage
      title="Chat & Collaboration"
      description="Diskusikan brief, negosiasi tarif, dan koordinasi konten dengan influencer secara real-time."
      icon={MessageSquare}
      gradient="bg-umkm"
    >
      <ChatRoom
        role="UMKM"
        meId={session.user.id}
        initialId={collaboration}
        emptyHint="Chat aktif otomatis setelah Anda mengajukan kolaborasi atau menerima pelamar."
      />
    </FeaturePage>
  );
}
