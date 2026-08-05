import type { ReactNode } from "react";

type SectionHeaderProps = {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  // "sm" (default): compact in-card section header, as used throughout
  // DashboardManager. "lg": page-level header, sized to match the
  // secondary pages' former standalone text-3xl <h2> heading.
  size?: "sm" | "lg";
};

// Reusable icon-tile header. Generic on purpose — the icon itself is
// passed in (see the hand-drawn icons defined locally in
// DashboardManager.tsx and each page file, matching the app's existing
// pattern of local SVG definitions per file) rather than owned by this
// component.
export default function SectionHeader({
  icon,
  title,
  subtitle,
  size = "sm",
}: SectionHeaderProps) {
  if (size === "lg") {
    return (
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent text-on-accent">
          {icon}
        </div>

        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">
            {title}
          </h2>
          {subtitle && <p className="mt-1 text-secondary">{subtitle}</p>}
        </div>
      </div>
    );
  }

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
