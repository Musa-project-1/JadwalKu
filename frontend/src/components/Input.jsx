export function Input({ label, id, className = '', error, ...props }) {
  const inputId = id || props.name
  return (
    <label className={`block ${className}`} htmlFor={inputId}>
      {label ? (
        <span className="mb-1 block text-body-sm text-on-surface-variant">{label}</span>
      ) : null}
      <input
        id={inputId}
        className="w-full rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-lg text-on-surface placeholder:text-outline focus:border-2 focus:border-primary focus:outline-none dark:bg-surface-container-low"
        {...props}
      />
      {error ? <span className="mt-1 block text-body-sm text-error">{error}</span> : null}
    </label>
  )
}
