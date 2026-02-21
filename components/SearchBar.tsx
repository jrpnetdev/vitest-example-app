interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/**
 * SearchBar
 * ---------
 * Controlled text input for task search.
 * Includes a clear (×) button that appears whenever the query is non-empty.
 */
export default function SearchBar({
  value,
  onChange,
  placeholder = 'Search tasks…',
}: SearchBarProps) {
  return (
    <div className="relative" role="search">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
        🔍
      </span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Search tasks"
        className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-9 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
        data-testid="search-input"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-400 hover:text-gray-600"
          data-testid="clear-search"
        >
          ✕
        </button>
      )}
    </div>
  );
}
