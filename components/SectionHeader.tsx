import type { ReactNode } from "react";

type SectionHeaderProps = {
  icon: ReactNode;
  title: string;
  subtitle?: string;
};

// Reusable icon-tile header for dashboard sections: a small accent
// square with an icon, the title beside it, and an optional subtitle
// line underneath. Generic on purpose — the icon itself is passed in
// (see the hand-drawn icons defined in DashboardManager.tsx, matching
// the app's existing pattern of local SVG definitions per file) rather
// than owned by this component.
export default function SectionHeader({
  icon,
  title,
  subtitle,
}: SectionHeaderProps) {
  return (
    <div className="mb-4 flex items-center gap-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-accent text-on-accent">
        {icon}
      </div>

      <div>
        <h3 className="text-base font-semibold text-primary">{title}</h3>
        {subtitle && <p className="text-sm text-secondary">{subtitle}</p>}
      </div>
    </div>
  );
}
