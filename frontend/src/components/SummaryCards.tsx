interface SummaryCardsProps {
  total: number;
  completed: number;
  pending: number;
  failed: number;
  duplicates: number;
}

export function SummaryCards(props: SummaryCardsProps) {
  const cards = [
    { label: "Total", value: props.total },
    { label: "Completed", value: props.completed },
    { label: "Pending", value: props.pending },
    { label: "Failed", value: props.failed },
    { label: "Duplicates", value: props.duplicates },
  ];
  return (
    <div className="cards-grid">
      {cards.map((c) => (
        <div key={c.label} className="metric-card">
          <div>{c.label}</div>
          <strong>{c.value}</strong>
        </div>
      ))}
    </div>
  );
}
