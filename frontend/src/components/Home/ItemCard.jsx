import { Link } from "react-router-dom";
import { HiCalendar, HiLocationMarker } from "react-icons/hi";

export default function ItemCard({ item }) {
  return (
    <Link
      to={`/items/${item.id}`}
      className="group block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-950/10"
    >
      <div className="overflow-hidden">
        <img
          src={item.image}
          alt={item.title}
          className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
          {item.category}
        </p>
        <h3 className="mt-2 text-lg font-bold text-slate-900 transition-colors group-hover:text-indigo-700">
          {item.title}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
          {item.description}
        </p>
        <div className="mt-4 grid gap-2 border-t border-slate-100 pt-4 text-sm text-slate-500">
          <p className="flex items-center gap-2">
            <HiLocationMarker className="text-indigo-600" />
            {item.district}, {item.village}
          </p>
          <p className="flex items-center gap-2">
            <HiCalendar className="text-indigo-600" />
            Found {item.date}
          </p>
        </div>
      </div>
    </Link>
  );
}
