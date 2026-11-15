export default function StatusBadge({ status }) {
  const className = status.toLowerCase().replace(/\s+/g, '-')
  return <span className={`status-badge status-${className}`}><span className="status-dot" />{status}</span>
}
