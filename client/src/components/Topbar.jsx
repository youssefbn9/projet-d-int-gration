import { Menu } from 'lucide-react';

export default function Topbar({ title, onMenuToggle, actions }) {
  return (
    <header className="topbar">
      <div className="flex-gap-3">
        <button
          type="button"
          className="hamburger"
          onClick={onMenuToggle}
          aria-label="Menu de navigation"
        >
          <Menu size={20} strokeWidth={1.75} />
        </button>
        <h1 className="topbar-title">{title}</h1>
      </div>
      {actions && <div className="topbar-actions">{actions}</div>}
    </header>
  );
}
