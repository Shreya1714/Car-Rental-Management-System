import { statusLabel } from '../utils';
export default function StatusBadge({ status }) {
  return <span className={`status-badge status-${status}`}>{statusLabel(status)}</span>;
}
