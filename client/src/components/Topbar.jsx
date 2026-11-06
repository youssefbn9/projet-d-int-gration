import { Menu } from 'lucide-react';

export default function Topbar({ title, onMenuToggle, actions, section = 'Accueil' }) {
  return (
    <header className="topbar">
      <div className="flex-gap-3">
        <button
          type="button"
          className="hamburger"
          onClick={onMenuToggle}
          aria-label="Ouvrir le menu de navigation"
        >
          <Menu size={20} strokeWidth={1.75} />
        </button>
        <div>
          <div className="topbar-breadcrumb">
            <span>StockPro</span>
            <span>/</span>
            <span>{section}</span>
          </div>
          <h1 className="topbar-title">{title}</h1>
        </div>
      </div>
      {actions && <div className="topbar-actions">{actions}</div>}
    </header>
  );
}
