// Messages: what people sent from the Contact page.
import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  HiSearch,
  HiX,
  HiChevronLeft,
  HiChevronRight,
  HiMail,
  HiPhone,
  HiTrash,
  HiMailOpen,
} from "react-icons/hi";
import { api } from "../../api.js";

const PER_PAGE = 10;

const tabs = [
  { value: "", label: "All" },
  { value: "new", label: "New" },
  { value: "read", label: "Read" },
];

// Turns a date into "12 Aug 2026, 14:30"
function formatDateTime(date) {
  return new Date(date).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Messages() {
  const { refreshStats } = useOutletContext();

  const [messages, setMessages] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(null);
  const [reload, setReload] = useState(0);

  const [searchText, setSearchText] = useState("");
  const [search, setSearch] = useState("");

  // The message opened in the window
  const [selected, setSelected] = useState(null);

  // The message waiting for the delete confirmation
  const [deleting, setDeleting] = useState(null);
  const [working, setWorking] = useState(false);

  // Search only after the admin stops typing for a moment
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchText.trim());
      setPage(1);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchText]);

  // Get the messages
  useEffect(() => {
    let cancelled = false;

    async function loadMessages() {
      setError("");

      const query = new URLSearchParams({
        page: String(page),
        limit: String(PER_PAGE),
      });

      if (status) query.set("status", status);
      if (search) query.set("search", search);

      const { ok, data } = await api(`/admin/messages?${query.toString()}`, {
        auth: true,
      });

      if (cancelled) return;

      if (ok) {
        if (data.messages.length === 0 && page > 1) {
          setPage(page - 1);
          return;
        }

        setMessages(data.messages);
        setPagination(data.pagination);
      } else {
        setError(data.message || "Failed to load the messages");
      }

      setLoading(false);
    }

    loadMessages();

    return () => {
      cancelled = true;
    };
  }, [status, search, page, reload]);

  function changeTab(value) {
    setLoading(true);
    setPage(1);
    setStatus(value);
  }

  function goToPage(number) {
    setLoading(true);
    setPage(number);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Changes a message to read / new (also updates the list and the menu number)
  async function setMessageStatus(message, newStatus) {
    const { ok, data } = await api(`/admin/messages/${message._id}/status`, {
      method: "PATCH",
      auth: true,
      body: { status: newStatus },
    });

    if (!ok) {
      setNotice({ type: "error", text: data.message || "Something went wrong" });
      return false;
    }

    setMessages((list) =>
      list.map((m) => (m._id === message._id ? { ...m, status: newStatus } : m))
    );
    setSelected((current) =>
      current && current._id === message._id ? { ...current, status: newStatus } : current
    );
    refreshStats();

    // In the "New" or "Read" tab the message may leave the list
    if (status) {
      setReload((r) => r + 1);
    }

    return true;
  }

  // Opens a message. A new message becomes "read".
  function openMessage(message) {
    setSelected(message);
    setNotice(null);

    if (message.status === "new") {
      setMessageStatus(message, "read");
    }
  }

  // Runs after the admin confirmed the delete
  async function handleDelete() {
    const message = deleting;

    setWorking(true);
    setNotice(null);

    const { ok, data } = await api(`/admin/messages/${message._id}`, {
      method: "DELETE",
      auth: true,
    });

    if (ok) {
      setNotice({ type: "success", text: "The message was deleted." });
      setSelected(null);
      setReload((r) => r + 1);
      refreshStats();
    } else {
      setNotice({ type: "error", text: data.message || "Something went wrong" });
    }

    setWorking(false);
    setDeleting(null);
  }

  const totalMessages = pagination?.totalItems || 0;
  const totalPages = pagination?.totalPages || 0;

  return (
    <div className="space-y-5">
      <div className="fade-up space-y-3">
        <div className="relative max-w-md">
          <HiSearch className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search name, email or subject..."
            className="w-full rounded-full border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition-shadow focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          />
        </div>

        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => changeTab(tab.value)}
              className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-all duration-200 ${
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
            {totalMessages} {totalMessages === 1 ? "message" : "messages"}
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

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-20 animate-pulse rounded-2xl bg-slate-200/70" />
          ))}
        </div>
      )}

      {!loading && error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-5 py-10 text-center text-sm font-medium text-red-700">
          {error}
        </p>
      )}

      {!loading && !error && messages.length === 0 && (
        <div className="fade-up rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center">
          <p className="font-bold text-slate-900">No messages</p>
          <p className="mt-1 text-sm text-slate-600">Messages from the Contact page appear here.</p>
        </div>
      )}

      {!loading && !error && messages.length > 0 && (
        <div className="space-y-3">
          {messages.map((message, index) => {
            const isNew = message.status === "new";

            return (
              <div
                key={message._id}
                className={`fade-up flex items-stretch overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                  isNew ? "border-indigo-200" : "border-slate-200"
                }`}
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <button
                  type="button"
                  onClick={() => openMessage(message)}
                  className="flex min-w-0 flex-1 items-start gap-3 p-4 text-left"
                >
                  <span
                    className={`mt-0.5 grid size-10 shrink-0 place-items-center rounded-full ${
                      isNew ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {isNew ? <HiMail className="size-5" /> : <HiMailOpen className="size-5" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className={`truncate text-sm ${isNew ? "font-extrabold text-slate-950" : "font-semibold text-slate-700"}`}>
                        {message.name}
                      </span>
                      {isNew && (
                        <span className="shrink-0 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                          NEW
                        </span>
                      )}
                    </span>
                    <span className={`block truncate text-sm ${isNew ? "font-bold text-slate-900" : "text-slate-700"}`}>
                      {message.subject}
                    </span>
                    <span className="block truncate text-xs text-slate-500">{message.message}</span>
                    <span className="mt-1 block text-[11px] text-slate-400">
                      {formatDateTime(message.createdAt)}
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setDeleting(message)}
                  aria-label="Delete message"
                  className="grid w-12 shrink-0 place-items-center text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  <HiTrash className="size-5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

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

      {selected && (
        <MessageWindow
          message={selected}
          onToggle={() =>
            setMessageStatus(selected, selected.status === "new" ? "read" : "new")
          }
          onDelete={() => setDeleting(selected)}
          onClose={() => setSelected(null)}
        />
      )}

      {deleting && (
        <ConfirmBox
          question="Delete this message?"
          name={deleting.subject}
          help="It will be deleted forever."
          yes="Yes, delete"
          working={working}
          onConfirm={handleDelete}
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  );
}


// THE MESSAGE WINDOW (scrollable, centered)
function MessageWindow({ message, onToggle, onDelete, onClose }) {
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
      aria-label="Message"
      className="fixed inset-0 z-[70] overflow-y-auto bg-slate-950/60 backdrop-blur-sm"
    >
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative flex min-h-full items-center justify-center p-4">
        <div className="fade-up relative w-full max-w-lg space-y-4 rounded-2xl bg-white p-5 shadow-2xl">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-950">{message.subject}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="grid size-9 shrink-0 place-items-center rounded-full text-slate-500 transition-colors hover:bg-slate-100"
            >
              <HiX className="size-5" />
            </button>
          </div>

          <div className="space-y-1.5 rounded-xl bg-slate-50 p-3 text-sm">
            <p className="font-bold text-slate-900">{message.name}</p>
            <p className="flex items-center gap-2 break-all text-slate-600">
              <HiMail className="shrink-0 text-slate-400" />
              <a href={`mailto:${message.email}`} className="hover:text-indigo-700 hover:underline">
                {message.email}
              </a>
            </p>
            {message.phone && (
              <p className="flex items-center gap-2 text-slate-600">
                <HiPhone className="shrink-0 text-slate-400" />
                <a href={`tel:${message.phone}`} className="hover:text-indigo-700 hover:underline">
                  {message.phone}
                </a>
              </p>
            )}
            <p className="text-xs text-slate-400">{formatDateTime(message.createdAt)}</p>
          </div>

          <p className="whitespace-pre-line break-words text-sm leading-6 text-slate-700">
            {message.message}
          </p>

          <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onToggle}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
            >
              {message.status === "new" ? "Mark as read" : "Mark as new"}
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="rounded-lg bg-red-600 px-3 py-2 text-sm font-bold text-white transition-colors hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


// SMALL WINDOW: ARE YOU SURE?
function ConfirmBox({ question, name, help, yes, working, onConfirm, onClose }) {
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
      <div className="fixed inset-0" onClick={() => !working && onClose()} aria-hidden="true" />

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
            className="rounded-lg bg-red-600 px-3 py-2 text-sm font-bold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {working ? "Please wait..." : yes}
          </button>
        </div>
      </div>
    </div>
  );
}