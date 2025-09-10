import React, {
  createContext,
  useContext,
  useState,
  useCallback,
} from 'react';

const DataContext = createContext();

export function DataProvider({ children }) {
  const [items, setItems] = useState([]);

  /**
   * Fetch items from backend with optional params.
   * Uses AbortController to prevent setState after unmount (fixes memory leak).
   */
  const fetchItems = useCallback(async ({ page = 1, limit = 20, q = '' } = {}) => {
    const ac = new AbortController();

    try {
      const params = new URLSearchParams({ page, limit });
      if (q) params.set('q', q);

      const res = await fetch(`http://localhost:3001/api/items?${params.toString()}`, {
        signal: ac.signal,
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch items (${res.status})`);
      }

      const json = await res.json();
      setItems(json.items || []); // backend returns { items, total, ... }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Fetch items failed:', err);
      }
    }

    // return abort cleanup for useEffect
    return () => ac.abort();
  }, []);

  return (
    <DataContext.Provider value={{ items, fetchItems }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
