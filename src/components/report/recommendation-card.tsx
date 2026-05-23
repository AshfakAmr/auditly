import type { LucideIcon } from "lucide-react";

type RecommendationCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export function RecommendationCard({
  icon: Icon,
  title,
  description,
}: RecommendationCardProps) {
  return (
    <article className="flex gap-4 rounded-xl border border-[#55544d] bg-[#30302d] p-5">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-[#605f57] bg-[#2b2b28] text-[#eee8d8]">
        <Icon className="size-5" />
      </div>

      <div>
        <h3 className="text-[15px] font-semibold text-white">{title}</h3>
        <p className="mt-2 text-[13px] leading-6 text-[#cfc8b8]">
          {description}
        </p>
      </div>
    </article>
  );
}
