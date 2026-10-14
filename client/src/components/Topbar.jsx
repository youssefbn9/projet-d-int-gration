export default function Topbar({ title, onMenuToggle, actions }) {
  return (
    <header className="topbar">
      <div className="flex-gap-3">
        <button
          className="hamburger"
          onClick={onMenuToggle}
          aria-label="Menu"
        >
          <span /><span /><span />
        </button>
        <h1 className="topbar-title">{title}</h1>
      </div>
      {actions && <div className="topbar-actions">{actions}</div>}
    </header>
  );
}
