import type { SavingsOverviewItem } from "@/lib/savingsOverview";

// A small check icon for when this month's contribution has met its
// target — same hand-drawn style as the icons in Nav.tsx/DashboardManager.tsx,
// colored --saving (not --accent) so it stays inside this section's own
// blue world rather than borrowing the green "success" association.
function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 8.5l3 3 7-7" />
    </svg>
  );
}

type SavingCardProps = {
  saving: SavingsOverviewItem;
};

// Presentational only — display order/layout for one saving category.
// Every figure here is cumulative except savedThisMonth, unlike the rest
// of the dashboard (see lib/savingsOverview.ts).
export default function SavingCard({ saving }: SavingCardProps) {
  const { name, targetAmount, monthlyTarget, totalSaved, savedThisMonth } =
    saving;

  const hasTarget = targetAmount !== null;
  const percentOfTarget =
    hasTarget && targetAmount > 0
      ? Math.min((totalSaved / targetAmount) * 100, 100)
      : totalSaved > 0
        ? 100
        : 0;

  const hasMonthlyTarget = monthlyTarget !== null;
  const metMonthlyTarget =
    hasMonthlyTarget && savedThisMonth > 0 && savedThisMonth >= monthlyTarget;

  return (
    <div className="rounded-xl border border-saving/30 bg-saving/10 p-5">
      <p className="text-sm text-secondary">{name}</p>

      <p className="mt-2 tabular-nums">
        <span className="text-2xl font-semibold text-saving">
          ${totalSaved.toFixed(2)}
        </span>
        <span className="ml-1 text-sm text-secondary">
          {hasTarget ? `of $${targetAmount.toFixed(2)}` : "saved"}
        </span>
      </p>

      {hasTarget && (
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface-track">
          <div
            className="h-full rounded-full bg-saving"
            style={{ width: `${percentOfTarget}%` }}
          />
        </div>
      )}

      <div className="mt-3 flex items-center gap-1.5 text-xs tabular-nums">
        {savedThisMonth === 0 ? (
          <span className="text-muted">Nothing saved yet this month</span>
        ) : (
          <>
            <span className="text-secondary">
              {hasMonthlyTarget
                ? `$${savedThisMonth.toFixed(2)} of $${monthlyTarget.toFixed(2)} this month`
                : `$${savedThisMonth.toFixed(2)} this month`}
            </span>
            {metMonthlyTarget && (
              <span className="text-saving">
                <CheckIcon />
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
