// Users: the admin searches users, blocks / unblocks them and changes their role.
import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  HiSearch,
  HiChevronLeft,
  HiChevronRight,
  HiMail,
  HiPhone,
  HiShieldCheck,
  HiBan,
  HiCheckCircle,
} from "react-icons/hi";
import { api } from "../../api.js";
import { useAuth } from "../../Auth/AuthContext.jsx";

// How many users are shown on one page
const PER_PAGE = 12;

// Turns "2026-08-12T00:00:00.000Z" into "12 Aug 2026"
function formatDate(date) {
  if (!date) return "-";

  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function Users() {
  const { refreshStats } = useOutletContext();
  const { user: me } = useAuth();

  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // What the admin is typing, and the word that is really searched
  const [searchText, setSearchText] = useState("");
  const [search, setSearch] = useState("");

  // The action waiting for "are you sure?" ({ person, kind })
  const [confirming, setConfirming] = useState(null);
  const [working, setWorking] = useState(false);

  const [notice, setNotice] = useState(null);
  const [reload, setReload] = useState(0);

  // Search only after the admin stops typing for a moment
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchText.trim());
      setPage(1);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchText]);

  // Get the users
  useEffect(() => {
    let cancelled = false;

    async function loadUsers() {
      setError("");

      const query = new URLSearchParams({
        page: String(page),
        limit: String(PER_PAGE),
      });

      if (search) query.set("search", search);

      const { ok, data } = await api(`/admin/users?${query.toString()}`, {
        auth: true,
      });

      if (cancelled) return;

      if (ok) {
        if (data.users.length === 0 && page > 1) {
          setPage(page - 1);
          return;
        }

        setUsers(data.users);
        setPagination(data.pagination);
      } else {
        setError(data.message || "Failed to load the users");
      }

      setLoading(false);
    }

    loadUsers();

    return () => {
      cancelled = true;
    };
  }, [search, page, reload]);

  // Is this row the logged-in admin? (he cannot change himself)
  function isMe(person) {
    const myId = me?._id || me?.id;
    return Boolean(myId) && person._id === myId;
  }

  // Runs after the admin said "Yes"
  async function handleConfirm() {
    const { person, kind } = confirming;

    setWorking(true);
    setNotice(null);

    let result;

    if (kind === "block" || kind === "unblock") {
      result = await api(`/admin/users/${person._id}/active`, {
        method: "PATCH",
        auth: true,
        body: { isActive: kind === "unblock" },
      });
    } else {
      result = await api(`/admin/users/${person._id}/role`, {
        method: "PATCH",
        auth: true,
        body: { role: kind === "makeAdmin" ? "admin" : "user" },
      });
    }

    if (result.ok) {
      setNotice({ type: "success", text: result.data.message || "Done." });
      setReload((r) => r + 1);
      refreshStats();
    } else {
      setNotice({ type: "error", text: result.data.message || "Something went wrong" });
    }

    setWorking(false);
    setConfirming(null);
  }

  function goToPage(number) {
    setLoading(true);
    setPage(number);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // The texts of the small window
  const texts = {
    block: { q: "Block this user?", help: "He cannot login and his waiting and public posts are cancelled.", yes: "Yes, block", danger: true },
    unblock: { q: "Unblock this user?", help: "He can login again. His old posts stay cancelled.", yes: "Yes, unblock", danger: false },
    makeAdmin: { q: "Make this user an admin?", help: "He will control the whole website.", yes: "Yes, make admin", danger: true },
    makeUser: { q: "Remove admin role?", help: "He becomes a normal user.", yes: "Yes, remove", danger: true },
  };

  const totalUsers = pagination?.totalItems || 0;
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
            placeholder="Search by name, email or phone..."
            className="w-full rounded-full border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition-shadow focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          />
        </div>

        {!loading && !error && (
          <p className="text-sm text-slate-500">
            {totalUsers} {totalUsers === 1 ? "user" : "users"} found
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
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-40 animate-pulse rounded-2xl bg-slate-200/70" />
          ))}
        </div>
      )}

      {!loading && error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-5 py-10 text-center text-sm font-medium text-red-700">
          {error}
        </p>
      )}

      {!loading && !error && users.length === 0 && (
        <div className="fade-up rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center">
          <p className="font-bold text-slate-900">No users found</p>
          <p className="mt-1 text-sm text-slate-600">Try another word.</p>
        </div>
      )}

      {!loading && !error && users.length > 0 && (
        <div className="grid gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
          {users.map((person, index) => {
            const mine = isMe(person);
            const blocked = person.isActive === false;
            const admin = person.role === "admin";

            return (
              <article
                key={person._id}
                className="fade-up flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <div className="flex items-center gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-full bg-indigo-600 text-lg font-bold uppercase text-white">
                    {person.name?.charAt(0)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-bold text-slate-900">
                      {person.name} {mine && <span className="text-xs font-semibold text-slate-400">(you)</span>}
                    </p>
                    <div className="mt-0.5 flex flex-wrap gap-1.5">
                      {admin && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-bold text-indigo-700">
                          <HiShieldCheck className="size-3.5" /> Admin
                        </span>
                      )}
                      {blocked ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-700">
                          <HiBan className="size-3.5" /> Blocked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                          <HiCheckCircle className="size-3.5" /> Active
                        </span>
                      )}
                      {person.isVerified === false && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                          Not verified
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid gap-1.5 text-sm text-slate-600">
                  <p className="flex items-center gap-2 break-all">
                    <HiMail className="shrink-0 text-slate-400" /> {person.email}
                  </p>
                  {person.phone && (
                    <p className="flex items-center gap-2">
                      <HiPhone className="shrink-0 text-slate-400" /> {person.phone}
                    </p>
                  )}
                  <p className="text-xs text-slate-400">Joined {formatDate(person.createdAt)}</p>
                </div>

                {/* Buttons (not for yourself) */}
                {!mine && (
                  <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
                    <button
                      type="button"
                      onClick={() => setConfirming({ person, kind: blocked ? "unblock" : "block" })}
                      className={`rounded-lg px-3 py-2 text-sm font-bold transition-colors ${
                        blocked
                          ? "bg-emerald-600 text-white hover:bg-emerald-700"
                          : "bg-red-50 text-red-700 hover:bg-red-100"
                      }`}
                    >
                      {blocked ? "Unblock" : "Block"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirming({ person, kind: admin ? "makeUser" : "makeAdmin" })}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
                    >
                      {admin ? "Remove admin" : "Make admin"}
                    </button>
                  </div>
                )}
              </article>
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

      {confirming && (
        <ConfirmBox
          question={texts[confirming.kind].q}
          name={confirming.person.name}
          help={texts[confirming.kind].help}
          yes={texts[confirming.kind].yes}
          danger={texts[confirming.kind].danger}
          working={working}
          onConfirm={handleConfirm}
          onClose={() => setConfirming(null)}
        />
      )}
    </div>
  );
}


// SMALL WINDOW: ARE YOU SURE?
function ConfirmBox({ question, name, help, yes, danger, working, onConfirm, onClose }) {
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
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4"
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