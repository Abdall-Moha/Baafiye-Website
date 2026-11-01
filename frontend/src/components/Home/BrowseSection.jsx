
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { HiSearch } from "react-icons/hi";
import ItemCard from "./ItemCard.jsx";
import { api } from "../../api.js";
import { districts } from "../../data/items";

// How many items the Home page shows
const HOME_LIMIT = 8;

export default function BrowseSection() {
  // Search and filter values
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [district, setDistrict] = useState("");

  // Data from the backend
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Get categories one time
  useEffect(() => {
    async function loadCategories() {
      const { ok, data } = await api("/categories");

      if (ok) {
        setCategories(data.categories);
      }
    }

    loadCategories();
  }, []);

  // Dynamically fetch items whenever a filter changes
  useEffect(() => {
    let cancelled = false;

    async function loadItems() {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({ limit: HOME_LIMIT });

      if (query.trim()) params.set("search", query.trim());
      if (category) params.set("category", category);
      if (district) params.set("district", district);

      const { ok, data } = await api(`/items?${params.toString()}`);

      if (cancelled) return;

      if (ok) {
        setItems(data.items);
      } else {
        setItems([]);
        setError(data.message || "Failed to load items");
      }

      setLoading(false);
    }

    loadItems();

    return () => {
      cancelled = true;
    };
  }, [query, category, district]);

  // Is the user filtering something?
  const isFiltering = query.trim() || category || district;

  return (
    <section className="page-shell py-16 sm:py-20">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-[.16em] text-indigo-700">
            Found items
          </p>
          <h2 className="display-font mt-2 text-3xl text-slate-950 sm:text-4xl">
            Helping belongings find their way back
          </h2>
          <p className="mt-3 max-w-xl leading-7 text-slate-600">
            Search recent reports and help us make every return possible.
          </p>
        </div>

        <Link
          to="/items"
          className="text-sm font-bold text-indigo-700 hover:text-indigo-900"
        >
          View all items →
        </Link>
      </div>

      {/* Dynamic search and filters */}
      <div className="mt-8 grid gap-3 rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm sm:grid-cols-[1fr_1fr] md:grid-cols-[1.5fr_1fr_1fr] md:items-end">
        <label className="relative sm:col-span-2 md:col-span-1">
          <span className="sr-only">Search found items</span>
          <HiSearch className="absolute left-3 top-3.5 text-slate-400" />

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search items..."
            className="h-11 w-full rounded-lg border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10"
          />
        </label>

        {/* Category */}
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10"
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
          onChange={(e) => setDistrict(e.target.value)}
          className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10"
        >
          <option value="">All districts</option>
          {districts.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-8">
        {/* 1) Loading */}
        {loading && (
          <div className="rounded-xl border border-slate-200 bg-white py-12 text-center text-sm text-slate-500">
            Loading found items...
          </div>
        )}

        {/* 2) Error from the backend */}
        {!loading && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 py-12 text-center text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {/* 3) No records */}
        {!loading && !error && items.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center text-sm text-slate-500">
            {isFiltering
              ? "No found items match your search."
              : "There are no records available at the moment."}
          </div>
        )}

        {/* 4) The items (max 8) */}
        {!loading && !error && items.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => (
              <ItemCard key={item._id} item={item} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
