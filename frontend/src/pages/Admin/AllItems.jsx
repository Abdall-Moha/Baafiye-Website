// All items: the admin sees every post, filters it, and changes its status.
import { useEffect, useState } from "react";
import { useOutletContext, useSearchParams } from "react-router-dom";
import {
  HiSearch,
  HiX,
  HiChevronLeft,
  HiChevronRight,
  HiLocationMarker,
  HiCalendar,
  HiPhone,
  HiPhotograph,
  HiUser,
  HiMail,
} from "react-icons/hi";
import { api, imageUrl } from "../../api.js";

// How many items are shown on one page
const PER_PAGE = 12;

// The filter buttons ("" = every status)
const tabs = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "active", label: "Public" },
  { value: "returned", label: "Returned" },
  { value: "expired", label: "Expired" },
  { value: "cancelled", label: "Cancelled" },
];

// The colour and the name of each status
const statusStyles = {
  pending: { label: "Pending", css: "bg-amber-100 text-amber-800" },
  active: { label: "Public", css: "bg-emerald-100 text-emerald-800" },
  returned: { label: "Returned", css: "bg-sky-100 text-sky-800" },
  expired: { label: "Expired", css: "bg-slate-200 text-slate-700" },
  cancelled: { label: "Cancelled", css: "bg-red-100 text-red-700" },
};

// Turns "2026-08-12T00:00:00.000Z" into "12 Aug 2026"
function formatDate(date) {
  if (!date) return "-";

  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// The buttons the admin can press for each status.
// "id" is what the item becomes. "kind" is the colour of the button.
function getActions(status) {
  if (status === "pending") {
    return [
      { id: "approve", label: "Approve", kind: "green", question: "Approve this post?", help: "It becomes public for 90 days." },
      { id: "reject", label: "Reject", kind: "red", question: "Reject this post?", help: "It will never be shown to the public." },
    ];
  }

  if (status === "active") {
    return [
      { id: "returned", label: "Mark returned", kind: "blue", question: "Mark as returned?", help: "The owner got it back. It leaves the public list." },
      { id: "expired", label: "Mark expired", kind: "gray", question: "Mark as expired?", help: "It leaves the public list." },
      { id: "cancelled", label: "Hide", kind: "red", question: "Hide this item?", help: "It is cancelled and not shown to the public." },
    ];
  }

  if (status === "returned") {
    return [
      { id: "active", label: "Show again", kind: "green", question: "Show it again?", help: "It becomes public for 90 days." },
      { id: "cancelled", label: "Hide", kind: "red", question: "Hide this item?", help: "It is cancelled and not shown to the public." },
    ];
  }

  if (status === "expired") {
    return [
      { id: "active", label: "Restore (90 days)", kind: "green", question: "Restore this item?", help: "It becomes public for another 90 days." },
      { id: "cancelled", label: "Hide", kind: "red", question: "Hide this item?", help: "It is cancelled and not shown to the public." },
    ];
  }

  // cancelled
  return [
    { id: "active", label: "Restore (90 days)", kind: "green", question: "Restore this item?", help: "It becomes public for 90 days." },
  ];
}

// Colours of the buttons
const buttonColors = {
  green: "bg-emerald-600 text-white hover:bg-emerald-700",
  red: "bg-red-600 text-white hover:bg-red-700",
  blue: "bg-sky-600 text-white hover:bg-sky-700",
  gray: "bg-slate-700 text-white hover:bg-slate-800",
};

export default function AllItems() {
  const { refreshStats } = useOutletContext();

  // The status is kept in the address (?status=active) so the dashboard cards can link here
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get("status") || "";

  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // What the admin is typing, and the word that is really searched (after a short wait)
  const [searchText, setSearchText] = useState("");
  const [search, setSearch] = useState("");

  // The item opened in the details window
  const [selected, setSelected] = useState(null);

  // The action waiting for "are you sure?" (item + action)
  const [confirming, setConfirming] = useState(null);
  const [working, setWorking] = useState(false);

  // Message after an action
  const [notice, setNotice] = useState(null);

  // Changes to load the list again
  const [reload, setReload] = useState(0);

  // Search only after the admin stops typing for a moment
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchText.trim());
      setPage(1);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchText]);

  // Get the items
  useEffect(() => {
    let cancelled = false;

    async function loadItems() {
      setError("");

      const query = new URLSearchParams({
        page: String(page),
        limit: String(PER_PAGE),
      });

      if (status) query.set("status", status);
      if (search) query.set("search", search);

      const { ok, data } = await api(`/admin/items?${query.toString()}`, {
        auth: true,
      });

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
        setError(data.message || "Failed to load the items");
      }

      setLoading(false);
    }

    loadItems();

    return () => {
      cancelled = true;
    };
  }, [status, search, page, reload]);

  // The admin pressed a status button
  function changeTab(value) {
    setLoading(true);
    setPage(1);

    if (value) {
      setSearchParams({ status: value });
    } else {
      setSearchParams({});
    }
  }

  // Go to another page and scroll to the top
  function goToPage(number) {
    setLoading(true);
    setPage(number);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Runs after the admin said "Yes" in the small window
  async function handleConfirm() {
    const { item, action } = confirming;

    setWorking(true);
    setNotice(null);

    // Approve and reject have their own routes, the rest use /status
    let result;

    if (action.id === "approve") {
      result = await api(`/admin/items/${item._id}/approve`, {
        method: "PATCH",
        auth: true,
      });
    } else if (action.id === "reject") {
      result = await api(`/admin/items/${item._id}/reject`, {
        method: "PATCH",
        auth: true,
      });
    } else {
      result = await api(`/admin/items/${item._id}/status`, {
        method: "PATCH",
        auth: true,
        body: { status: action.id },
      });
    }

    if (result.ok) {
      setNotice({ type: "success", text: `"${item.title}": done.` });
      setSelected(null);
      setReload((r) => r + 1);
      refreshStats();
    } else {
      setNotice({
        type: "error",
        text: result.data.message || "Something went wrong",
      });
    }

    setWorking(false);
    setConfirming(null);
  }

  const totalItems = pagination?.totalItems || 0;
  const totalPages = pagination?.totalPages || 0;

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="fade-up space-y-3">
        {/* Search */}
        <div className="relative max-w-md">
          <HiSearch className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search by title..."
            className="w-full rounded-full border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition-shadow focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          />
        </div>

        {/* Status buttons (they scroll sideways on small screens) */}
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => changeTab(tab.value)}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-semibold transition-all duration-200 ${
                status === tab.value
                  ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
                  : "border-slate-300 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {!loading && !error && (
          <p className="text-sm text-slate-500">
            {totalItems} {totalItems === 1 ? "item" : "items"} found
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
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div
              key={n}
              className="h-64 animate-pulse rounded-2xl bg-slate-200/70"
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

      {/* 3) Nothing found */}
      {!loading && !error && items.length === 0 && (
        <div className="fade-up rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center">
          <p className="font-bold text-slate-900">No items found</p>
          <p className="mt-1 text-sm text-slate-600">
            Try another word or another status.
          </p>
        </div>
      )}

      {/* 4) The items */}
      {!loading && !error && items.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item, index) => {
            const image = imageUrl(item.image);
            const style = statusStyles[item.status] || statusStyles.pending;

            return (
              <button
                key={item._id}
                type="button"
                onClick={() => setSelected(item)}
                className="fade-up group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <div className="relative h-32 w-full overflow-hidden bg-slate-100 sm:h-40">
                  {image ? (
                    <img
                      src={image}
                      alt={item.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-slate-300">
                      <HiPhotograph className="size-10" />
                    </div>
                  )}
                  <span
                    className={`absolute left-2 top-2 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${style.css}`}
                  >
                    {style.label}
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-3 sm:p-4">
                  {item.category?.name && (
                    <p className="truncate text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                      {item.category.name}
                    </p>
                  )}
                  <h3 className="mt-0.5 truncate text-sm font-bold text-slate-900 sm:text-base">
                    {item.title}
                  </h3>
                  <p className="mt-2 flex items-center gap-1.5 truncate text-xs text-slate-500">
                    <HiLocationMarker className="shrink-0 text-indigo-600" />
                    {item.district}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-slate-500">
                    <HiUser className="shrink-0 text-slate-400" />
                    {item.postedBy?.name || "Unknown"}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Pages */}
      {!loading && !error && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => goToPage(page - 1)}
            disabled={!pagination.hasPreviousPage}
            className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <HiChevronLeft className="size-4" /> Previous
          </button>
          <span className="text-sm font-semibold text-slate-600">
            Page {pagination.currentPage} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => goToPage(page + 1)}
            disabled={!pagination.hasNextPage}
            className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next <HiChevronRight className="size-4" />
          </button>
        </div>
      )}

      {/* Details window */}
      {selected && (
        <ItemWindow
          item={selected}
          onAction={(action) => setConfirming({ item: selected, action })}
          onClose={() => setSelected(null)}
        />
      )}

      {/* Are you sure? */}
      {confirming && (
        <ConfirmBox
          question={confirming.action.question}
          name={confirming.item.title}
          help={confirming.action.help}
          yes={`Yes, ${confirming.action.label.toLowerCase()}`}
          danger={confirming.action.kind === "red"}
          working={working}
          onConfirm={handleConfirm}
          onClose={() => setConfirming(null)}
        />
      )}
    </div>
  );
}


// ======================================================
// THE DETAILS WINDOW (scrollable, centered)
// ======================================================

function ItemWindow({ item, onAction, onClose }) {
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

  const image = imageUrl(item.image);
  const poster = item.postedBy;
  const style = statusStyles[item.status] || statusStyles.pending;
  const actions = getActions(item.status);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Item details"
      className="fixed inset-0 z-[70] overflow-y-auto bg-slate-950/60 backdrop-blur-sm"
    >
      {/* Click outside to close */}
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative flex min-h-full items-center justify-center p-4">
        <div className="fade-up relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-3 top-3 z-10 grid size-9 place-items-center rounded-full bg-white/90 text-slate-700 shadow transition-colors hover:bg-white"
          >
            <HiX className="size-5" />
          </button>

          {/* The whole picture, nothing cropped */}
          <div className="grid max-h-72 place-items-center bg-slate-100">
            {image ? (
              <img
                src={image}
                alt={item.title}
                className="max-h-72 w-full object-contain"
              />
            ) : (
              <div className="grid h-40 place-items-center text-slate-300">
                <HiPhotograph className="size-12" />
              </div>
            )}
          </div>

          <div className="space-y-4 p-5">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${style.css}`}>
                  {style.label}
                </span>
                {item.category?.name && (
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                    {item.category.name}
                  </span>
                )}
              </div>
              <h2 className="mt-2 text-xl font-bold text-slate-950">{item.title}</h2>
              {item.description && (
                <p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-600">
                  {item.description}
                </p>
              )}
            </div>

            <div className="grid gap-2 text-sm text-slate-600">
              <p className="flex items-center gap-2">
                <HiLocationMarker className="shrink-0 text-indigo-600" />
                {item.district}
                {item.village ? `, ${item.village}` : ""}
              </p>
              <p className="flex items-center gap-2">
                <HiCalendar className="shrink-0 text-indigo-600" />
                Found: {formatDate(item.foundDate)}
              </p>
              <p className="flex items-center gap-2">
                <HiCalendar className="shrink-0 text-slate-400" />
                Posted: {formatDate(item.createdAt)}
                {item.expiresAt && ` · Expires: ${formatDate(item.expiresAt)}`}
              </p>
              {item.contactPhone && (
                <p className="flex items-center gap-2">
                  <HiPhone className="shrink-0 text-indigo-600" />
                  Contact: {item.contactPhone}
                </p>
              )}
            </div>

            {/* Who posted it */}
            {poster && (
              <div className="rounded-xl bg-slate-50 p-3 text-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Posted by
                </p>
                <p className="mt-1 flex items-center gap-2 font-semibold text-slate-900">
                  <HiUser className="shrink-0 text-slate-400" />
                  {poster.name}
                  {poster.isActive === false && (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-700">
                      Blocked
                    </span>
                  )}
                </p>
                {poster.email && (
                  <p className="mt-1 flex items-center gap-2 break-all text-slate-600">
                    <HiMail className="shrink-0 text-slate-400" />
                    {poster.email}
                  </p>
                )}
                {poster.phone && (
                  <p className="mt-1 flex items-center gap-2 text-slate-600">
                    <HiPhone className="shrink-0 text-slate-400" />
                    {poster.phone}
                  </p>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
              {actions.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => onAction(action)}
                  className={`flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-bold transition-colors ${buttonColors[action.kind]}`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


// ======================================================
// SMALL WINDOW: ARE YOU SURE?
// ======================================================

function ConfirmBox({ question, name, help, yes, danger, working, onConfirm, onClose }) {
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
      aria-label={question}
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/50 p-4"
    >
      <div
        className="fixed inset-0"
        onClick={() => !working && onClose()}
        aria-hidden="true"
      />

      <div className="fade-up relative w-full max-w-xs rounded-2xl bg-white p-5 text-center shadow-2xl">
        <h2 className="text-base font-bold text-slate-950">{question}</h2>
        <p className="mt-1 truncate text-sm font-semibold text-indigo-700">{name}</p>
        <p className="mt-2 text-sm leading-5 text-slate-600">{help}</p>

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
            className={`rounded-lg px-3 py-2 text-sm font-bold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
              danger ? "bg-red-600 hover:bg-red-700" : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {working ? "Please wait..." : yes}
          </button>
        </div>
      </div>
    </div>
  );
}