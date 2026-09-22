export default function StatCard({
  icon: Icon,
  title,
  value,
  description
}) {
  return (
    <div className="stat-card group">
      <div className="flex items-start justify-between">
        <div>
          <p className="stat-title">
            {title}
          </p>

          <h3 className="stat-value">
            {value}
          </h3>

          {description && (
            <p className="stat-description">
              {description}
            </p>
          )}
        </div>

        <div className="stat-icon group-hover:scale-110">
          <Icon size={21} strokeWidth={2} />
        </div>
      </div>
    </div>
  );
}