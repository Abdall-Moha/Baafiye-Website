import { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import {
  HiCheck,
  HiX,
  HiChevronLeft,
  HiChevronRight,
  HiLocationMarker,
  HiCalendar,
  HiClock,
  HiPhone,
  HiPhotograph,
  HiZoomIn,
  HiExclamation,
} from "react-icons/hi";
import { api, imageUrl } from "../../api.js";

// How many posts are shown on one page
const PER_PAGE = 12;

// Turns "2026-08-12T00:00:00.000Z" into "12 Aug 2026"
function formatDate(date) {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Turns a date into "5 minutes ago", "3 hours ago", "2 days ago"
function timeAgo(date) {
  const minutes = Math.floor((Date.now() - new Date(date).getTime()) / 60000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;

  const hours = Math.floor(minutes / 60);

  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;

  const days = Math.floor(hours / 24);

  return `${days} ${days === 1 ? "day" : "days"} ago`;
}

export default function PendingApprovals() {
  // The layout gives us a way to refresh the numbers (the menu badge)
  const { refreshStats } = useOutletContext();

  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Message after an action (success or error)
  const [notice, setNotice] = useState(null);

  // The id of the post that is working now (disables its buttons)
  const [busyId, setBusyId] = useState("");

  // The post waiting for the "reject" confirmation
  const [rejecting, setRejecting] = useState(null);

  // The picture shown big
  const [viewing, setViewing] = useState("");

  // Changes to load the list again
  const [reload, setReload] = useState(0);

  // Get the pending posts (oldest first, the backend sorts them)
  useEffect(() => {
    let cancelled = false;

    async function loadItems() {
      setError("");

      const { ok, data } = await api(
        `/admin/items?status=pending&page=${page}&limit=${PER_PAGE}`,
        { auth: true }
      );

      if (cancelled) return;

      if (ok) {
        // This page is empty but there is a page before it: go back
        if (data.items.length === 0 && page > 1) {
          setPage(page - 1);
          return;
        }

        setItems(data.items);
        setPagination(data.pagination);
      } else {
        setError(data.message || "Failed to load the pending posts");
      }

      setLoading(false);
    }

    loadItems();

    return () => {
      cancelled = true;
    };
  }, [page, reload]);

  // Takes a post out of the list after it was approved or rejected
  function removeItem(id) {
    const remaining = items.filter((item) => item._id !== id);

    setItems(remaining);

    if (pagination) {
      setPagination({ ...pagination, totalItems: pagination.totalItems - 1 });
    }

    // The page is empty now: load it again (it may show the next posts)
    if (remaining.length === 0) {
      setReload((r) => r + 1);
    }

    // Update the number in the menu
    refreshStats();
  }

  // Approve: the post becomes public
  async function handleApprove(item) {
    setBusyId(item._id);
    setNotice(null);

    const { ok, data } = await api(`/admin/items/${item._id}/approve`, {
      method: "PATCH",
      auth: true,
    });

    if (ok) {
      removeItem(item._id);
      setNotice({ type: "success", text: `"${item.title}" is now public for 90 days.` });
    } else {
      setNotice({ type: "error", text: data.message || "Something went wrong" });
    }

    setBusyId("");
  }

  // Reject: runs after the admin confirmed
  async function handleReject() {
    const item = rejecting;

    setBusyId(item._id);
    setNotice(null);

    const { ok, data } = await api(`/admin/items/${item._id}/reject`, {
      method: "PATCH",
      auth: true,
    });

    if (ok) {
      removeItem(item._id);
      setNotice({ type: "success", text: `"${item.title}" was rejected.` });
    } else {
      setNotice({ type: "error", text: data.message || "Something went wrong" });
    }

    setBusyId("");
    setRejecting(null);
  }

  // Go to another page and scroll to the top
  function goToPage(number) {
    setLoading(true);
    setPage(number);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const totalItems = pagination?.totalItems || 0;
  const totalPages = pagination?.totalPages || 0;

  return (
    <div className="space-y-5">
      {/* Intro */}
      <div className="fade-up">
        <p className="max-w-2xl text-sm leading-6 text-slate-600">
          New posts wait here. Check the picture and the details. Approve it to
          show it on the website for 90 days, or reject it if it is not a real
          found item or it is not allowed.
        </p>
        {!loading && !error && totalItems > 0 && (
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
            <HiClock className="size-4" />
            {totalItems} waiting (oldest first)
          </p>
        )}
      </div>

      {notice && (
        <p
          role={notice.type === "success" ? "status" : "alert"}
          className={`rounded-lg border px-4 py-3 text-sm font-medium ${
            notice.type === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {notice.text}
        </p>
      )}

      {/* 1) Loading */}
      {loading && (
        <div className="grid gap-4 lg:grid-cols-2">
          {[1, 2].map((n) => (
            <div
              key={n}
              className="h-96 animate-pulse rounded-2xl border border-slate-200 bg-slate-200/60"
            />
          ))}
        </div>
      )}

      {/* 2) Error */}
      {!loading && error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-5 py-10 text-center text-sm font-medium text-red-700">
          {error}
        </p>
      )}

      {/* 3) Nothing is waiting */}
      {!loading && !error && items.length === 0 && (
        <div className="fade-up rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-full bg-emerald-50 text-emerald-600">
            <HiCheck className="size-6" />
          </span>
          <p className="mt-4 font-bold text-slate-900">All done!</p>
          <p className="mt-1 text-sm text-slate-600">
            No posts are waiting for approval.
          </p>
          <Link
            to="/admin/items"
            className="mt-4 inline-block text-sm font-bold text-indigo-700 hover:text-indigo-900"
          >
            See all items →
          </Link>
        </div>
      )}

      {/* 4) The posts */}
      {!loading && !error && items.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          {items.map((item, index) => {
            const image = imageUrl(item.image);
            const poster = item.postedBy;
            const busy = busyId === item._id;

            return (
              <article
                key={item._id}
                className="fade-up flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow duration-300 hover:shadow-md"
                style={{ animationDelay: `${index * 40}ms` }}
              >
                {/* Picture (click to see it big) */}
                {image ? (
                  <button
                    type="button"
                    onClick={() => setViewing(image)}
                    className="group relative block h-52 w-full overflow-hidden bg-slate-100"
                    aria-label="View the picture big"
                  >
                    <img
                      src={image}
                      alt={item.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-slate-800 opacity-0 shadow-sm backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100">
                      <HiZoomIn className="size-4" /> View big
                    </span>
                  </button>
                ) : (
                  <div className="grid h-52 w-full place-items-center bg-slate-100 text-slate-300">
                    <HiPhotograph className="size-12" />
                  </div>
                )}

                <div className="flex flex-1 flex-col p-4 sm:p-5">
                  {item.category?.name && (
                    <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                      {item.category.name}
                    </p>
                  )}
                  <h3 className="mt-1 text-lg font-bold text-slate-900">
                    {item.title}
                  </h3>

                  <div className="mt-3 grid gap-1.5 text-sm text-slate-500">
                    <p className="flex items-center gap-2">
                      <HiLocationMarker className="shrink-0 text-indigo-600" />
                      {item.district}, {item.village}
                    </p>
                    <p className="flex items-center gap-2">
                      <HiCalendar className="shrink-0 text-indigo-600" />
                      Found {formatDate(item.foundDate)}
                    </p>
                    <p className="flex items-center gap-2">
                      <HiClock className="shrink-0 text-indigo-600" />
                      Sent {timeAgo(item.createdAt)}
                    </p>
                  </div>

                  {/* Who posted it (only the admin sees this) */}
                  <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Posted by
                    </p>
                    <p className="mt-1 font-semibold text-slate-900">
                      {poster?.name || "Unknown user"}
                    </p>
                    {poster?.email && (
                      <p className="break-all text-slate-500">{poster.email}</p>
                    )}
                    <p className="mt-1.5 flex items-center gap-2 text-slate-600">
                      <HiPhone className="shrink-0 text-indigo-600" />
                      Contact: {item.contactPhone}
                    </p>

                    {/* The poster is blocked */}
                    {poster && poster.isActive === false && (
                      <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700">
                        <HiExclamation className="size-4" /> This user is blocked
                      </p>
                    )}
                  </div>

                  {/* Buttons */}
                  <div className="mt-auto grid grid-cols-2 gap-2 pt-4">
                    <button
                      type="button"
                      onClick={() => setRejecting(item)}
                      disabled={busy}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-200 px-3 py-2.5 text-sm font-bold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <HiX className="size-4" /> Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApprove(item)}
                      disabled={busy}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2.5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                    >
                      <HiCheck className="size-4" />
                      {busy ? "Please wait..." : "Approve"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Pages (only when there is more than one) */}
      {!loading && totalPages > 1 && (
        <nav
          aria-label="Pages"
          className="flex items-center justify-center gap-3 pt-2"
        >
          <button
            type="button"
            onClick={() => goToPage(page - 1)}
            disabled={!pagination.hasPreviousPage}
            aria-label="Previous page"
            className="grid size-10 place-items-center rounded-lg border border-slate-200 bg-white text-slate-700 transition-colors hover:border-indigo-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <HiChevronLeft className="size-5" />
          </button>
          <span className="text-sm font-semibold text-slate-600">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => goToPage(page + 1)}
            disabled={!pagination.hasNextPage}
            aria-label="Next page"
            className="grid size-10 place-items-center rounded-lg border border-slate-200 bg-white text-slate-700 transition-colors hover:border-indigo-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <HiChevronRight className="size-5" />
          </button>
        </nav>
      )}

      {/* Picture shown big */}
      {viewing && <ImageViewer src={viewing} onClose={() => setViewing("")} />}

      {/* Small window: confirm the rejection */}
      {rejecting && (
        <ConfirmReject
          title={rejecting.title}
          working={busyId === rejecting._id}
          onConfirm={handleReject}
          onClose={() => setRejecting(null)}
        />
      )}
    </div>
  );
}


// ======================================================
// THE PICTURE SHOWN BIG (the whole picture, nothing cropped)
// ======================================================

function ImageViewer({ src, onClose }) {
  // Esc closes it
  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKey);

    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Picture"
      onClick={onClose}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 grid size-10 place-items-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/30"
      >
        <HiX className="size-6" />
      </button>
      <img
        src={src}
        alt="Item"
        onClick={(e) => e.stopPropagation()}
        className="fade-up max-h-[88vh] max-w-full rounded-xl object-contain shadow-2xl"
      />
    </div>
  );
}


// ======================================================
// SMALL WINDOW: ARE YOU SURE YOU WANT TO REJECT?
// ======================================================

function ConfirmReject({ title, working, onConfirm, onClose }) {
  // Esc closes it (not while the action is running)
  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape" && !working) {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKey);

    return () => window.removeEventListener("keydown", handleKey);
  }, [working, onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Reject this post?"
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4"
    >
      {/* Click outside to close */}
      <div
        className="fixed inset-0"
        onClick={() => !working && onClose()}
        aria-hidden="true"
      />

      <div className="fade-up relative w-full max-w-xs rounded-2xl bg-white p-5 text-center shadow-2xl">
        <h2 className="text-base font-bold text-slate-950">Reject this post?</h2>
        <p className="mt-1 truncate text-sm font-semibold text-indigo-700">
          {title}
        </p>
        <p className="mt-2 text-sm leading-5 text-slate-600">
          It will never be shown to the public.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={working}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            No, go back
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={working}
            className="rounded-lg bg-red-600 px-3 py-2 text-sm font-bold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {working ? "Please wait..." : "Yes, reject"}
          </button>
        </div>
      </div>
    </div>
  );
}