import { useState } from "react";
import { Link } from "react-router-dom";
import { HiFilter, HiSearch } from "react-icons/hi";
import ItemsGrid from "./ItemsGrid.jsx";
import { categories, districts, items } from "../../data/items";

export default function BrowseSection() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [district, setDistrict] = useState("");

  const visible = items.filter(
    (i) =>
      (!query || i.title.toLowerCase().includes(query.toLowerCase())) &&
      (!category || i.category === category) &&
      (!district || i.district === district)
  );

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

      <div className="mt-8 grid gap-3 rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm sm:grid-cols-[1fr_1fr] md:grid-cols-[1.5fr_1fr_1fr_auto] md:items-end">
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
        <Select
          value={category}
          set={setCategory}
          options={categories}
          text="All categories"
        />
        <Select
          value={district}
          set={setDistrict}
          options={districts}
          text="All districts"
        />
        <button className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 sm:col-span-2 md:col-span-1">
          <HiFilter /> Filter
        </button>
      </div>

      <div className="mt-8">
        {visible.length ? (
          <ItemsGrid items={visible.slice(0, 3)} />
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center text-sm text-slate-500">
            No matching found items yet.
          </div>
        )}
      </div>
    </section>
  );
}

function Select({ value, set, options, text }) {
  return (
    <select
      value={value}
      onChange={(e) => set(e.target.value)}
      className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10"
    >
      <option value="">{text}</option>
      {options.map((option) => (
        <option key={option}>{option}</option>
      ))}
    </select>
  );
}
