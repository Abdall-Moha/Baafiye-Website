import { useEffect, useState } from "react";
import { HiSearch, HiX, HiChevronLeft, HiChevronRight } from "react-icons/hi";
import ItemCard from "../components/Home/ItemCard.jsx";
import { api } from "../api.js";
import { districts } from "../data/items";

// How many items are shown on one page
const PER_PAGE = 12;

export default function Items() {
  // What the user typed / selected
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState(""); // the search text sent to the backend
  const [category, setCategory] = useState("");
  const [district, setDistrict] = useState("");
  const [page, setPage] = useState(1);

  // Data from the backend
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Get the categories ONE time (for the dropdown)
  useEffect(() => {
    async function loadCategories() {
      const { ok, data } = await api("/categories");

      if (ok) {
        setCategories(data.categories);
      }
    }

    loadCategories();
  }, []);

  // Wait 0.4 seconds after the user stops typing, then search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(query.trim());
      setPage(1);
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  // Get the items from the backend when a filter or the page changes
  useEffect(() => {
    // Stops an old answer from replacing a newer one
    let cancelled = false;

    async function loadItems() {
      setLoading(true);
      setError("");

      // Build the URL: /items?page=1&limit=12&search=...&category=...&district=...
      const params = new URLSearchParams({ page, limit: PER_PAGE });

      if (search) params.set("search", search);
      if (category) params.set("category", category);
      if (district) params.set("district", district);

      const { ok, data } = await api(`/items?${params.toString()}`);

      if (cancelled) return;

      if (ok) {
        setItems(data.items);
        setPagination(data.pagination);
      } else {
        setItems([]);
        setPagination(null);
        setError(data.message || "Failed to load items");
      }

      setLoading(false);
    }

    loadItems();

    return () => {
      cancelled = true;
    };
  }, [search, category, district, page]);

  // Category or district changed: go back to page 1
  function changeCategory(value) {
    setCategory(value);
    setPage(1);
  }

  function changeDistrict(value) {
    setDistrict(value);
    setPage(1);
  }

  // Clear every filter
  function clearFilters() {
    setQuery("");
    setSearch("");
    setCategory("");
    setDistrict("");
    setPage(1);
  }

  // Go to another page and scroll to the top
  function goToPage(number) {
    setPage(number);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const hasActiveFilters = query || category || district;
  const totalItems = pagination?.totalItems || 0;
  const totalPages = pagination?.totalPages || 0;

  // Page numbers to show: the current page and 2 pages on each side
  const pageNumbers = [];
  const firstPage = Math.max(1, page - 2);
  const lastPage = Math.min(totalPages, page + 2);

  for (let n = firstPage; n <= lastPage; n++) {
    pageNumbers.push(n);
  }

  return (
    <section className="page-shell py-12 sm:py-16">
      <div className="fade-up max-w-2xl">
        <p className="text-sm font-bold uppercase tracking-[.16em] text-indigo-700">
          Found item directory
        </p>
        <h1 className="display-font mt-2 text-4xl text-slate-950 sm:text-5xl">
          Browse found items
        </h1>
        <p className="mt-4 leading-7 text-slate-600">
          Search recent reports by item, category, or district and find what
          you lost.
        </p>
      </div>

      {/* Filters */}
      <div
        className="fade-up mt-9 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow duration-300 hover:shadow-md sm:p-6"
        style={{ animationDelay: "80ms" }}
      >
        <div className="grid gap-4 sm:grid-cols-[1fr_1fr] lg:grid-cols-[1.5fr_1fr_1fr_auto]">
          <label className="relative block sm:col-span-2 lg:col-span-1">
            <span className="sr-only">Search items</span>
            <HiSearch className="absolute left-3 top-3.5 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-11 w-full rounded-lg border border-slate-300 pl-10 pr-3 text-sm outline-none transition hover:border-slate-400 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10"
              placeholder="Search by item name"
            />
          </label>

          {/* Category: the value is the category id */}
          <select
            value={category}
            onChange={(e) => changeCategory(e.target.value)}
            className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition hover:border-slate-400 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* District */}
          <select
            value={district}
            onChange={(e) => changeDistrict(e.target.value)}
            className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition hover:border-slate-400 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10"
          >
            <option value="">All districts</option>
            {districts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-bold text-slate-700 transition-colors hover:border-indigo-300 hover:bg-slate-50 hover:text-indigo-700 sm:col-span-2 lg:col-span-1"
            >
              <HiX /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Title + number of results */}
      <div className="mt-9 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-bold">
          {loading ? "Loading items..." : items.length ? "Items found" : "No items found"}
        </h2>
        {!loading && !error && (
          <span className="text-sm text-slate-500">
            {totalItems} {totalItems === 1 ? "result" : "results"}
          </span>
        )}
      </div>

      <div className="mt-5">
        {/* 1) Loading: grey pulsing cards */}
        {loading && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse overflow-hidden rounded-2xl border border-slate-200 bg-white"
              >
                <div className="h-48 bg-slate-100" />
                <div className="space-y-3 p-5">
                  <div className="h-3 w-1/4 rounded bg-slate-100" />
                  <div className="h-5 w-3/4 rounded bg-slate-100" />
                  <div className="h-3 w-full rounded bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 2) Error from the backend */}
        {!loading && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-14 text-center text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {/* 3) No records */}
        {!loading && !error && items.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center text-slate-600">
            {hasActiveFilters
              ? "No items match your search. Try clearing a filter or search for another item."
              : "There are no records available at the moment."}
          </div>
        )}

        {/* 4) The items (cards appear one after another) */}
        {!loading && !error && items.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item, index) => (
              <div
                key={item._id}
                className="fade-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <ItemCard item={item} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination (only when there is more than one page) */}
      {!loading && totalPages > 1 && (
        <nav
          aria-label="Pages"
          className="mt-10 flex flex-wrap items-center justify-center gap-2"
        >
          <button
            type="button"
            onClick={() => goToPage(page - 1)}
            disabled={!pagination.hasPreviousPage}
            aria-label="Previous page"
            className="grid size-10 place-items-center rounded-lg border border-slate-200 text-slate-700 transition-colors hover:border-indigo-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:bg-transparent"
          >
            <HiChevronLeft className="size-5" />
          </button>

          {pageNumbers.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => goToPage(n)}
              aria-current={n === page ? "page" : undefined}
              className={`size-10 rounded-lg border text-sm font-bold transition-colors ${
                n === page
                  ? "border-indigo-600 bg-indigo-600 text-white"
                  : "border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-slate-50"
              }`}
            >
              {n}
            </button>
          ))}

          <button
            type="button"
            onClick={() => goToPage(page + 1)}
            disabled={!pagination.hasNextPage}
            aria-label="Next page"
            className="grid size-10 place-items-center rounded-lg border border-slate-200 text-slate-700 transition-colors hover:border-indigo-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:bg-transparent"
          >
            <HiChevronRight className="size-5" />
          </button>
        </nav>
      )}
    </section>
  );
}