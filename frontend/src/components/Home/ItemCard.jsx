import { Link } from "react-router-dom";
import { HiCalendar, HiLocationMarker, HiPhotograph } from "react-icons/hi";
import { imageUrl } from "../../api.js"; // ItemCard: "../../api.js" if it is in components/Home

// Turns "2026-08-12T00:00:00.000Z" into "12 August 2026"
function formatDate(date) {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function ItemCard({ item }) {
  // The picture comes from the category (users do not upload pictures)
    const image = imageUrl(item.image) || imageUrl(item.category?.image);

  return (
    <Link
      to={`/items/${item._id}`}
      className="group block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-950/10"
    >
      <div className="overflow-hidden">
        {image ? (
          <img
            src={image}
            alt={item.title}
            className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          // No picture: show a grey box with an icon
          <div className="grid h-48 w-full place-items-center bg-slate-100 text-slate-300">
            <HiPhotograph className="size-12" />
          </div>
        )}
      </div>
      <div className="p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
          {item.category?.name}
        </p>
        <h3 className="mt-2 text-lg font-bold text-slate-900 transition-colors group-hover:text-indigo-700">
          {item.title}
        </h3>
        {item.description && (
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
            {item.description}
          </p>
        )}
        <div className="mt-4 grid gap-2 border-t border-slate-100 pt-4 text-sm text-slate-500">
          <p className="flex items-center gap-2">
            <HiLocationMarker className="text-indigo-600" />
            {item.district}, {item.village}
          </p>
          <p className="flex items-center gap-2">
            <HiCalendar className="text-indigo-600" />
            Found {formatDate(item.foundDate)}
          </p>
        </div>
      </div>
    </Link>
  );
}