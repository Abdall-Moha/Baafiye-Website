import { useState } from "react";
import { HiSearch, HiX } from "react-icons/hi";
import ItemsGrid from "../components/Home/ItemsGrid.jsx";
import { categories, districts, items } from "../data/items";

export default function Items() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [district, setDistrict] = useState("");

  const filtered = items.filter(
    (i) =>
      (!query || i.title.toLowerCase().includes(query.toLowerCase())) &&
      (!category || i.category === category) &&
      (!district || i.district === district)
  );

  const hasActiveFilters = query || category || district;

  return (
    <section className="page-shell py-12 sm:py-16">
      <div className="max-w-2xl">
        <p className="text-sm font-bold uppercase tracking-[.16em] text-indigo-700">
          Found item directory
        </p>
        <h1 className="display-font mt-2 text-4xl text-slate-950 sm:text-5xl">
          Browse found items
        </h1>
        <p className="mt-4 leading-7 text-slate-600">
          Search recent reports by item, category, or district. This directory
          is a public preview of found-item listings.
        </p>
      </div>

      <div className="mt-9 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="grid gap-4 sm:grid-cols-[1fr_1fr] lg:grid-cols-[1.5fr_1fr_1fr_auto]">
          <label className="relative block sm:col-span-2 lg:col-span-1">
            <span className="sr-only">Search items</span>
            <HiSearch className="absolute left-3 top-3.5 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-11 w-full rounded-lg border border-slate-300 pl-10 pr-3 text-sm outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10"
              placeholder="Search by item name"
            />
          </label>
          <Select
            value={category}
            change={setCategory}
            label="All categories"
            options={categories}
          />
          <Select
            value={district}
            change={setDistrict}
            label="All districts"
            options={districts}
          />
          {hasActiveFilters && (
            <button
              onClick={() => {
                setQuery("");
                setCategory("");
                setDistrict("");
              }}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-bold text-slate-700 hover:border-indigo-300 hover:bg-slate-50 transition-colors sm:col-span-2 lg:col-span-1"
            >
              <HiX /> Clear
            </button>
          )}
        </div>
      </div>

      <div className="mt-9 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-bold">
          {filtered.length ? "Items found" : "No items found"}
        </h2>
        <span className="text-sm text-slate-500">{filtered.length} results</span>
      </div>

      <div className="mt-5">
        {filtered.length ? (
          <ItemsGrid items={filtered} />
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center text-slate-600">
            Try clearing a filter or search for another item.
          </div>
        )}
      </div>

      {filtered.length > 0 && (
        <div className="mt-10 flex justify-center gap-2">
          <button className="size-10 rounded-lg border border-indigo-600 bg-indigo-600 text-sm font-bold text-white">
            1
          </button>
          <button className="size-10 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:border-indigo-300 hover:bg-slate-50 transition-colors">
            2
          </button>
          <button className="size-10 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:border-indigo-300 hover:bg-slate-50 transition-colors">
            ›
          </button>
        </div>
      )}
    </section>
  );
}

function Select({ value, change, label, options }) {
  return (
    <select
      value={value}
      onChange={(e) => change(e.target.value)}
      className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10"
    >
      <option value="">{label}</option>
      {options.map((x) => (
        <option key={x}>{x}</option>
      ))}
    </select>
  );
}
