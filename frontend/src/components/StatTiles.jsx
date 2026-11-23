// A row of number tiles above a table (for example Completed 2 / 6). items: [{ label, value }]
export default function StatTiles({ items }) {
  return (
    <dl className="ic-stats">
      {items.map((item) => (
        <div key={item.label} className="ic-stats__tile">
          <dt className="ic-stats__label">{item.label}</dt>
          <dd className="ic-stats__value">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
