import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { HiCalendar, HiLocationMarker, HiArrowLeft, HiShieldCheck } from "react-icons/hi";
import { items } from "../data/items";

export default function ItemDetails() {
  const { id } = useParams();
  const item = items.find((x) => x.id === id);
  const [notice, setNotice] = useState(false);

  if (!item)
    return (
      <section className="page-shell py-16">
        <h1 className="display-font text-4xl">Item not found</h1>
        <Link
          className="mt-5 inline-block font-bold text-indigo-700"
          to="/items"
        >
          Browse all items
        </Link>
      </section>
    );

  return (
    <section className="page-shell py-10 sm:py-16">
      <Link
        to="/items"
        className="inline-flex items-center gap-2 text-sm font-bold text-indigo-700 hover:text-indigo-900 transition-colors"
      >
        <HiArrowLeft /> Back to items
      </Link>

      <div className="mt-7 grid gap-8 lg:grid-cols-2 lg:gap-14">
        <div className="relative">
          <img
            src={item.image}
            alt={item.title}
            className="h-72 w-full rounded-2xl object-cover sm:h-96"
          />
          <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-emerald-700 backdrop-blur-sm">
            <HiShieldCheck className="size-4" />
            Ready to return
          </div>
        </div>

        <div>
          <p className="text-sm font-bold uppercase tracking-[.16em] text-indigo-700">
            {item.category}
          </p>
          <h1 className="display-font mt-3 text-4xl text-slate-950 sm:text-5xl">
            {item.title}
          </h1>
          <p className="mt-6 leading-7 text-slate-600">{item.description}</p>

          <dl className="mt-7 grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm">
            <div className="flex gap-3">
              <HiLocationMarker className="mt-0.5 size-5 text-indigo-700 shrink-0" />
              <div>
                <dt className="font-bold text-slate-900">Found location</dt>
                <dd className="mt-1 text-slate-600">
                  {item.village}, {item.district}
                </dd>
              </div>
            </div>
            <div className="flex gap-3">
              <HiCalendar className="mt-0.5 size-5 text-indigo-700 shrink-0" />
              <div>
                <dt className="font-bold text-slate-900">Found date</dt>
                <dd className="mt-1 text-slate-600">{item.date}</dd>
              </div>
            </div>
          </dl>

          <div className="mt-7 rounded-xl border border-indigo-100 bg-indigo-50 p-5">
            <p className="text-sm font-bold text-indigo-900">
              Is this your item?
            </p>
            <p className="mt-1 text-sm leading-6 text-indigo-700">
              Contact the finder to arrange a safe return. Please be prepared to
              describe the item to confirm ownership.
            </p>
            <button
              onClick={() => setNotice(true)}
              className="mt-4 w-full rounded-lg bg-indigo-700 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-800 transition-colors sm:w-auto"
            >
              Contact finder
            </button>
          </div>

          {notice && (
            <div className="mt-4 rounded-lg border-l-4 border-indigo-600 bg-indigo-50 p-4">
              <p className="text-sm font-bold text-indigo-900">
                Contact feature coming soon
              </p>
              <p className="mt-1 text-sm leading-6 text-indigo-700">
                Contact matching will be available when the service is connected.
                For now, this is a UI preview only.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
