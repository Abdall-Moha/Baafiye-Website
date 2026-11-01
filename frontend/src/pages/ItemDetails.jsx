import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  HiCalendar,
  HiLocationMarker,
  HiArrowLeft,
  HiShieldCheck,
  HiPhone,
  HiClipboardCopy,
  HiCheck,
  HiPhotograph,
} from "react-icons/hi";
import { imageUrl } from "../api.js"; // ItemCard: "../../api.js" if it is in components/Home
import { api } from "../api.js";

// Turns "2026-08-12T00:00:00.000Z" into "12 August 2026"
function formatDate(date) {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function ItemDetails() {
  const { id } = useParams();

  // The item from the backend
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // The finder's phone number (only loaded when the user presses Contact finder)
  const [phone, setPhone] = useState("");
  const [contactLoading, setContactLoading] = useState(false);
  const [contactError, setContactError] = useState("");
  const [copied, setCopied] = useState(false);

  // Get the item when the page opens (or the id changes)
  useEffect(() => {
    let cancelled = false;

    async function loadItem() {
      setLoading(true);
      setError("");
      setItem(null);
      setPhone("");
      setContactError("");

      const { ok, data } = await api(`/items/${id}`);

      if (cancelled) return;

      if (ok) {
        setItem(data.item);
      } else {
        setError(data.message || "Item not found");
      }

      setLoading(false);
    }

    loadItem();
    window.scrollTo({ top: 0 });

    return () => {
      cancelled = true;
    };
  }, [id]);

  // Runs when the user presses "Contact finder"
  async function handleContact() {
    setContactError("");
    setContactLoading(true);

    const { ok, data } = await api(`/items/${id}/contact`);

    if (ok) {
      setPhone(data.contactPhone);
    } else {
      // Example: "Too many requests, try again later"
      setContactError(data.message || "Could not get the contact number");
    }

    setContactLoading(false);
  }

  // Copies the phone number
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(phone);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Copy is not allowed in this browser: do nothing
    }
  }

  // 1) Loading: grey pulsing page
  if (loading) {
    return (
      <section className="page-shell py-10 sm:py-16">
        <div className="animate-pulse">
          <div className="h-5 w-32 rounded bg-slate-100" />
          <div className="mt-7 grid gap-8 lg:grid-cols-2 lg:gap-14">
            <div className="h-72 rounded-2xl bg-slate-100 sm:h-96" />
            <div className="space-y-4">
              <div className="h-4 w-24 rounded bg-slate-100" />
              <div className="h-10 w-3/4 rounded bg-slate-100" />
              <div className="h-32 rounded-xl bg-slate-100" />
              <div className="h-28 rounded-xl bg-slate-100" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  // 2) Item not found / expired / error
  if (error || !item) {
    return (
      <section className="page-shell py-16">
        <div className="fade-up">
          <h1 className="display-font text-4xl">Item not found</h1>
          <p className="mt-3 text-slate-600">
            {error || "This item is no longer available."}
          </p>
          <Link
            className="mt-5 inline-flex items-center gap-2 font-bold text-indigo-700 transition-colors hover:text-indigo-900"
            to="/items"
          >
            <HiArrowLeft /> Browse all items
          </Link>
        </div>
      </section>
    );
  }

  // The picture comes from the category (users do not upload pictures)
    const image = imageUrl(item.image) || imageUrl(item.category?.image);

  // 3) The item
  return (
    <section className="page-shell py-10 sm:py-16">
      <Link
        to="/items"
        className="group inline-flex items-center gap-2 text-sm font-bold text-indigo-700 transition-colors hover:text-indigo-900"
      >
        <HiArrowLeft className="transition-transform duration-200 group-hover:-translate-x-1" />
        Back to items
      </Link>

      <div className="mt-7 grid gap-8 lg:grid-cols-2 lg:gap-14">
        {/* Picture */}
        <div className="fade-up group relative overflow-hidden rounded-2xl">
          {image ? (
            <img
              src={image}
              alt={item.title}
              className="h-72 w-full object-cover transition-transform duration-700 group-hover:scale-105 sm:h-96"
            />
          ) : (
            <div className="grid h-72 w-full place-items-center bg-slate-100 text-slate-300 sm:h-96">
              <HiPhotograph className="size-16" />
            </div>
          )}
          <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-emerald-700 shadow-sm backdrop-blur-sm">
            <HiShieldCheck className="size-4" />
            Ready to return
          </div>
        </div>

        {/* Details */}
        <div className="fade-up" style={{ animationDelay: "100ms" }}>
          <p className="text-sm font-bold uppercase tracking-[.16em] text-indigo-700">
            {item.category?.name}
          </p>
          <h1 className="display-font mt-3 text-4xl text-slate-950 sm:text-5xl">
            {item.title}
          </h1>
          {item.description && (
            <p className="mt-6 leading-7 text-slate-600">{item.description}</p>
          )}

          <dl className="mt-7 grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm transition-shadow duration-300 hover:shadow-md">
            <div className="flex gap-3">
              <HiLocationMarker className="mt-0.5 size-5 shrink-0 text-indigo-700" />
              <div>
                <dt className="font-bold text-slate-900">Found location</dt>
                <dd className="mt-1 text-slate-600">
                  {item.village}, {item.district}
                </dd>
              </div>
            </div>
            <div className="flex gap-3">
              <HiCalendar className="mt-0.5 size-5 shrink-0 text-indigo-700" />
              <div>
                <dt className="font-bold text-slate-900">Found date</dt>
                <dd className="mt-1 text-slate-600">{formatDate(item.foundDate)}</dd>
              </div>
            </div>
          </dl>

          {/* Contact finder */}
          <div className="mt-7 rounded-xl border border-indigo-100 bg-indigo-50 p-5">
            <p className="text-sm font-bold text-indigo-900">Is this your item?</p>
            <p className="mt-1 text-sm leading-6 text-indigo-700">
              Contact the finder to arrange a safe return. Please be prepared to
              describe the item to confirm ownership.
            </p>

            {/* Before pressing: the button */}
            {!phone && (
              <button
                type="button"
                onClick={handleContact}
                disabled={contactLoading}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-700 px-5 py-3 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-800 hover:shadow-md active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 sm:w-auto"
              >
                <HiPhone className="size-4" />
                {contactLoading ? "Getting number..." : "Contact finder"}
              </button>
            )}

            {/* After pressing: the phone number */}
            {phone && (
              <div className="fade-up mt-4 rounded-lg border border-indigo-200 bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Finder&apos;s phone number
                </p>
                <p className="mt-1 text-xl font-bold text-slate-900">{phone}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href={`tel:${phone.replace(/[^0-9+]/g, "")}`}
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-700 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-indigo-800"
                  >
                    <HiPhone className="size-4" /> Call
                  </a>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:border-indigo-300 hover:bg-slate-50"
                  >
                    {copied ? (
                      <>
                        <HiCheck className="size-4 text-emerald-600" /> Copied
                      </>
                    ) : (
                      <>
                        <HiClipboardCopy className="size-4" /> Copy
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Error (example: too many requests) */}
            {contactError && (
              <p
                role="alert"
                className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
              >
                {contactError}
              </p>
            )}
          </div>

          <p className="mt-4 text-xs leading-5 text-slate-500">
            Safety tip: meet in a public place and never send money before you
            get your item back.
          </p>
        </div>
      </div>
    </section>
  );
}