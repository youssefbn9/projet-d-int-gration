export default function Spinner({ text = 'Chargement…' }) {
  return (
    <div className="loading-container">
      <div className="spinner" />
      {text && <span>{text}</span>}
    </div>
  );
}
