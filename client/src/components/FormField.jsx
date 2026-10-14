export default function FormField({
  label,
  id,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  required = false,
  disabled = false,
  autoComplete,
  children,
}) {
  const fieldId = id || name;

  return (
    <div className={`form-group ${error ? 'has-error' : ''}`}>
      {label && (
        <label className="form-label" htmlFor={fieldId}>
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}

      {children ? (
        children
      ) : (
        <input
          id={fieldId}
          name={name}
          type={type}
          className={`form-input ${error ? 'input-error' : ''}`}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
        />
      )}

      {error && <span className="form-error-text">{error}</span>}
    </div>
  );
}
