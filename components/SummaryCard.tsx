type SummaryCardProps = {
  title: string;
  amount: number;
  type: string;
};

export default function SummaryCard({
  title,
  amount,
}: SummaryCardProps) {
  return (
    <div className="w-72 rounded-lg border p-4 shadow">
      <h2 className="text-gray-600">{title}</h2>

      <p className="mt-2 text-3xl font-bold">
        ${amount}
      </p>
    </div>
  );
}