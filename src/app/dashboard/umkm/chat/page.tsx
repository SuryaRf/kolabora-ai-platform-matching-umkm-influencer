import { MessageSquare } from "lucide-react";
import { auth } from "@/auth";
import FeaturePage from "@/components/dashboard/FeaturePage";
import ChatRoom from "@/components/dashboard/ChatRoom";

export default async function UMKMConversationPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

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
        emptyHint="Chat aktif otomatis setelah Anda mengajukan kolaborasi atau menerima pelamar."
      />
    </FeaturePage>
  );
}
