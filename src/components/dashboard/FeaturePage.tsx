import { type LucideIcon } from "lucide-react";

interface FeaturePageProps {
  title: string;
  description: string;
  icon: LucideIcon;
  gradient: string;
  iconColor?: string;
  children: React.ReactNode;
}

export default function FeaturePage({
  title,
  description,
  icon: Icon,
  gradient,
  children,
}: FeaturePageProps) {
  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-2xl ${gradient} flex items-center justify-center shadow-lg flex-shrink-0`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-sm text-zinc-500 mt-1">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}
