export default function DataTable({
  columns = [],
  data = [],
  keyExtractor = (item, index) => item.id || index,
  emptyText = 'Aucun élément trouvé',
}) {
  return (
    <div className="table-responsive">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th key={col.key || idx} style={col.style} className={col.className}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{ textAlign: 'center', padding: '2rem' }}>
                <span className="text-muted">{emptyText}</span>
              </td>
            </tr>
          ) : (
            data.map((item, rowIndex) => (
              <tr key={keyExtractor(item, rowIndex)}>
                {columns.map((col, colIndex) => (
                  <td key={col.key || colIndex} style={col.style} className={col.className}>
                    {col.render ? col.render(item, rowIndex) : item[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
