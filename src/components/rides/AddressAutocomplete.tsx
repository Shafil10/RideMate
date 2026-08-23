import { useEffect, useRef, useState } from "react";
import { searchPlaces, type GeocodeResult } from "../../lib/api";

interface Props {
  value: string;
  onChange: (text: string) => void;
  onSelectLocation: (loc: GeocodeResult) => void;
  placeholder: string;
  style?: React.CSSProperties;
  required?: boolean;
}

export default function AddressAutocomplete({ value, onChange, onSelectLocation, placeholder, style, required }: Props) {
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextSearch = useRef(false);

  useEffect(() => {
    if (skipNextSearch.current) {
      skipNextSearch.current = false;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 3) {
      setResults([]);
      setOpen(false);
      setError(null);
      return;
    }
    debounceRef.current = setTimeout(() => {
      setLoading(true);
      setError(null);
      searchPlaces(value.trim())
        .then((data) => {
          setResults(data.results);
          setOpen(data.results.length > 0);
          if (data.results.length === 0) setError("No matches — check your spelling or use the map instead.");
        })
        .catch(() => setError("Couldn't reach the server — check your connection and try again."))
        .finally(() => setLoading(false));
    }, 450);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(r: GeocodeResult) {
    skipNextSearch.current = true;
    onChange(r.label);
    onSelectLocation(r);
    setOpen(false);
    setResults([]);
  }

  return (
    <div ref={containerRef} style={{ position: "relative", flex: 1 }}>
      <input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        style={style}
        required={required}
        autoComplete="off"
      />
      {loading && (
        <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "#8b968f" }}>
          searching…
        </span>
      )}
      {!loading && error && (
        <div style={{ fontSize: 11.5, color: "#991b1b", marginTop: 3 }}>{error}</div>
      )}
      {open && results.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            zIndex: 20,
            background: "white",
            border: "1px solid #d1d5db",
            borderRadius: 10,
            marginTop: 4,
            maxHeight: 220,
            overflowY: "auto",
            boxShadow: "0 4px 12px rgba(0,0,0,.1)",
          }}
        >
          {results.map((r, i) => (
            <button
              key={`${r.lat},${r.lng},${i}`}
              type="button"
              onClick={() => handleSelect(r)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "8px 12px",
                fontSize: 12.5,
                background: "none",
                border: "none",
                borderBottom: i < results.length - 1 ? "1px solid #f0f0f0" : "none",
                cursor: "pointer",
                color: "#1a1a1a",
              }}
            >
              📍 {r.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
