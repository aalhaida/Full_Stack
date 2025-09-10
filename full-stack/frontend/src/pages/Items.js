// frontend/src/pages/Items.js
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FixedSizeList as List } from 'react-window';
import { useData } from '../state/DataContext';

const ROW_HEIGHT = 56; // virtualization row height

function Items() {
  const { items, fetchItems } = useData();

  // ---- UI params sent to server (pagination + search) ----
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // ---- local UI state ----
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ---- fetch on param change; prevent memory leaks with AbortController ----
  useEffect(() => {
    let cleanup = null;

    (async () => {
      setLoading(true);
      setError('');
      try {
        // DataContext.fetchItems must accept { page, limit, q } and return an abort fn
        cleanup = await fetchItems({ page, limit, q: query });
      } catch (e) {
        // fetchItems already swallows AbortError; only surface real errors
        setError(e?.message || 'Failed to load items');
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      if (typeof cleanup === 'function') cleanup(); // cancel in-flight request on unmount/param change
    };
  }, [page, limit, query, fetchItems]);

  // If backend doesn't return total metadata, a simple heuristic:
  // fewer than `limit` items means we're on the last page.
  const isLastPage = useMemo(() => items.length < limit, [items.length, limit]);

  // ---- handlers ----
  const submitSearch = (e) => {
    e.preventDefault();
    setPage(1); // reset to first page when searching
  };

  // ---- row renderer for react-window ----
  const Row = ({ index, style }) => {
    const item = items[index];
    if (!item) return <div style={style}>…</div>;
    return (
      <div
        style={{
          ...style,
          display: 'flex',
          alignItems: 'center',
          padding: '8px 12px',
          borderBottom: '1px solid #eee',
        }}
      >
        <div style={{ fontWeight: 600, width: 160 }}>
          <Link to={`/items/${item.id}`}>{item.name}</Link>
        </div>
        <div style={{ color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.description}
        </div>
        <div
          aria-label="item-category"
          style={{
            marginLeft: 'auto',
            fontSize: 12,
            background: '#f3f4f6',
            padding: '4px 8px',
            borderRadius: 12,
          }}
        >
          {item.category}
        </div>
      </div>
    );
  };

  return (
    <section style={{ maxWidth: 920, margin: '24px auto', padding: 16 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Items</h1>

      {/* Search + page size */}
      <form
        onSubmit={submitSearch}
        aria-label="search-form"
        style={{ display: 'flex', gap: 8, marginBottom: 12 }}
      >
        <input
          aria-label="search-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search (name / description / category)"
          style={{ flex: 1, padding: '8px 12px', border: '1px solid #ddd', borderRadius: 8 }}
        />
        <select
          aria-label="limit-select"
          value={limit}
          onChange={(e) => {
            setLimit(Number(e.target.value));
            setPage(1);
          }}
          style={{ padding: '8px 12px' }}
        >
          {[10, 20, 50, 100].map((n) => (
            <option key={n} value={n}>
              {n}/page
            </option>
          ))}
        </select>
        <button type="submit" style={{ padding: '8px 12px' }}>
          Search
        </button>
      </form>

      {/* Loading / Error / Empty states */}
      {loading && (
        <div role="status" aria-live="polite" style={{ margin: '12px 0' }}>
          Loading…
        </div>
      )}
      {error && (
        <div role="alert" style={{ color: 'crimson', marginBottom: 8 }}>
          {error}
        </div>
      )}
      {!loading && items.length === 0 && (
        <div style={{ color: '#666' }}>No results. Try a different search.</div>
      )}

      {/* Virtualized list */}
      {items.length > 0 && (
        <List
          height={Math.min(10, items.length) * ROW_HEIGHT} // show up to 10 rows tall
          itemCount={items.length}
          itemSize={ROW_HEIGHT}
          width="100%"
          style={{ border: '1px solid #eee', borderRadius: 8 }}
        >
          {Row}
        </List>
      )}

      {/* Pagination */}
      <nav
        aria-label="pagination"
        style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}
      >
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1 || loading}
        >
          Prev
        </button>
        <span style={{ minWidth: 80, textAlign: 'center' }}>Page {page}</span>
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={isLastPage || loading}
        >
          Next
        </button>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: '#666' }}>
          Showing {items.length} item{items.length === 1 ? '' : 's'}
        </span>
      </nav>
    </section>
  );
}

export default Items;
