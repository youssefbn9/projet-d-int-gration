export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  totalCount,
  pageSize = 10,
  onPageChange,
}) {
  if (totalPages <= 1 && (!totalCount || totalCount <= pageSize)) return null;

  const start = (currentPage - 1) * pageSize + 1;
  const end = totalCount ? Math.min(currentPage * pageSize, totalCount) : currentPage * pageSize;

  return (
    <nav className="pagination" aria-label="Pagination">
      <div className="pagination-count">
        {totalCount ? (
          <span>{start}-{end} sur {totalCount}</span>
        ) : (
          <span>Page {currentPage} sur {totalPages}</span>
        )}
      </div>

      <div className="pagination-actions flex-gap-2">
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          Précédent
        </button>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          Suivant
        </button>
      </div>
    </nav>
  );
}
