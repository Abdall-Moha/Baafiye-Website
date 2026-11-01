import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  HiLockClosed,
  HiPhotograph,
  HiPencil,
  HiX,
  HiCheck,
  HiLocationMarker,
  HiCalendar,
} from "react-icons/hi";
import { api, imageUrl } from "../api.js";
import { useAuth } from "../Auth/AuthContext.jsx";
import { districts } from "../data/items";
import { FormMessage } from "../Auth/Login.jsx";

// Phone formats (the backend checks them again)
const itemPhonePattern = /^[0-9+\s()-]{7,20}$/;
const userPhonePattern = /^[0-9+\s()-]{9,20}$/;

// Picture rules (the backend checks them again)
const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
const maxImageSize = 5 * 1024 * 1024; // 5 MB

// Text and colour of each item status
const statusInfo = {
  pending: { text: "Waiting for approval", color: "bg-amber-50 text-amber-700 ring-amber-200" },
  active: { text: "Public", color: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  returned: { text: "Returned", color: "bg-sky-50 text-sky-700 ring-sky-200" },
  expired: { text: "Expired", color: "bg-slate-100 text-slate-600 ring-slate-200" },
  cancelled: { text: "Cancelled", color: "bg-red-50 text-red-700 ring-red-200" },
};

// The text of the small confirm window for each action
const confirmInfo = {
  returned: {
    title: "Mark as returned?",
    text: "It will leave the public list. You cannot undo this.",
    button: "Yes, mark returned",
    tone: "green",
  },
  cancel: {
    title: "Cancel this post?",
    text: "It will be removed from the website. You cannot undo this.",
    button: "Yes, cancel post",
    tone: "red",
  },
};

// Turns "2026-08-12T00:00:00.000Z" into "12 Aug 2026"
function formatDate(date) {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Today's date as "2026-10-31" (a found date cannot be in the future)
function today() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${now.getFullYear()}-${month}-${day}`;
}

// Class of every input box
const inputClass =
  "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10";

export default function Profile() {
  // The logged-in user (null if nobody is logged in)
  const { user } = useAuth();

  // The tab that is open: "items", "details" or "password"
  const [tab, setTab] = useState("items");

  // Not logged in: ask the user to login first
  if (!user) {
    return (
      <section className="page-shell py-12 sm:py-16">
        <div className="fade-up mx-auto max-w-sm rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm">
          <span className="mx-auto grid size-12 place-items-center rounded-full bg-indigo-50 text-indigo-700">
            <HiLockClosed className="size-6" />
          </span>
          <h1 className="display-font mt-4 text-2xl text-slate-950">
            Login to see your profile
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Your posts and account settings are in your profile.
          </p>
          <Link
            to="/login"
            state={{ from: { pathname: "/profile" } }}
            className="mt-5 block rounded-lg bg-indigo-700 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-800 hover:shadow-md"
          >
            Login
          </Link>
        </div>
      </section>
    );
  }

  const tabs = [
    { id: "items", label: "My items" },
    { id: "details", label: "My details" },
    { id: "password", label: "Password" },
  ];

  return (
    <section className="page-shell py-8 sm:py-12">
      {/* Top card: avatar + name */}
      <div className="fade-up flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:gap-4 sm:p-5">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-indigo-700 text-lg font-bold uppercase text-white sm:size-12">
          {user.name?.charAt(0)}
        </span>
        <div className="min-w-0">
          <h1 className="display-font truncate text-xl text-slate-950 sm:text-2xl">
            {user.name}
          </h1>
          <p className="truncate text-sm text-slate-500">{user.email}</p>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="fade-up mt-5 flex gap-1 overflow-x-auto border-b border-slate-200"
        style={{ animationDelay: "60ms" }}
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-bold transition-colors ${
              tab === t.id
                ? "border-indigo-700 text-indigo-700"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {tab === "items" && <MyItems />}
        {tab === "details" && <DetailsForm />}
        {tab === "password" && <PasswordForm />}
      </div>
    </section>
  );
}


// ======================================================
// TAB 1: MY ITEMS (list + mark returned / edit / cancel)
// ======================================================

function MyItems() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Message after an action (success or error)
  const [notice, setNotice] = useState(null);

  // The item that is open in the edit window
  const [editing, setEditing] = useState(null);

  // The action waiting for the user to confirm: { type, item }
  const [confirming, setConfirming] = useState(null);

  // True while the confirmed action is running
  const [working, setWorking] = useState(false);

  // Get my items when the tab opens
  useEffect(() => {
    let cancelled = false;

    async function loadItems() {
      const { ok, data } = await api("/items/my-items", { auth: true });

      if (cancelled) return;

      if (ok) {
        setItems(data.items);
      } else {
        setError(data.message || "Failed to load your items");
      }

      setLoading(false);
    }

    loadItems();

    return () => {
      cancelled = true;
    };
  }, []);

  // Replaces one item in the list with the new version from the backend
  function replaceItem(updated) {
    setItems((list) =>
      list.map((item) => (item._id === updated._id ? updated : item))
    );
  }

  // Runs when the user presses "Yes" in the confirm window
  async function runConfirmed() {
    const { type, item } = confirming;

    setWorking(true);
    setNotice(null);

    // Mark as returned
    if (type === "returned") {
      const { ok, data } = await api(`/items/${item._id}/returned`, {
        method: "PATCH",
        auth: true,
      });

      if (ok) {
        replaceItem(data.item);
        setNotice({ type: "success", text: data.message });
      } else {
        setNotice({ type: "error", text: data.message || "Something went wrong" });
      }
    }

    // Cancel the post
    if (type === "cancel") {
      const { ok, data } = await api(`/items/${item._id}`, {
        method: "DELETE",
        auth: true,
      });

      if (ok) {
        // The backend does not send the item back, so we change it here
        setItems((list) =>
          list.map((x) =>
            x._id === item._id ? { ...x, status: "cancelled" } : x
          )
        );
        setNotice({ type: "success", text: data.message });
      } else {
        setNotice({ type: "error", text: data.message || "Something went wrong" });
      }
    }

    setWorking(false);
    setConfirming(null);
  }

  // Called by the edit window after a successful save
  function handleSaved(updated, message) {
    replaceItem(updated);
    setNotice({ type: "success", text: message });
    setEditing(null);
  }

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-slate-100"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return <FormMessage>{error}</FormMessage>;
  }

  if (items.length === 0) {
    return (
      <div className="fade-up rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center">
        <p className="font-bold text-slate-900">You have not posted anything yet</p>
        <p className="mt-1.5 text-sm text-slate-600">
          Found something? Post it so the owner can find it.
        </p>
        <Link
          to="/post-item"
          className="mt-4 inline-block rounded-lg bg-indigo-700 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-indigo-800"
        >
          Post an item
        </Link>
      </div>
    );
  }

  return (
    <>
      {notice && (
        <div className="mb-4">
          <FormMessage type={notice.type}>{notice.text}</FormMessage>
        </div>
      )}

      {/* 1 card on small phones, 2 on tablets, 3 on computers */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, index) => {
          const status = statusInfo[item.status] || statusInfo.cancelled;
          const image = imageUrl(item.image) || imageUrl(item.category?.image);

          // Days left (only for public items)
          let daysLeft = null;

          if (item.status === "active" && item.expiresAt) {
            daysLeft = Math.max(
              0,
              Math.ceil((new Date(item.expiresAt) - Date.now()) / 86400000)
            );
          }

          // Which buttons this item can have
          const canEdit = item.status === "pending" || item.status === "active";
          const canReturn = item.status === "active";
          const canCancel = item.status === "pending" || item.status === "active";

          return (
            <article
              key={item._id}
              className="fade-up flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
              style={{ animationDelay: `${index * 40}ms` }}
            >
              {/* Picture */}
              <div className="relative">
                {image ? (
                  <img
                    src={image}
                    alt={item.title}
                    className="h-36 w-full object-cover"
                  />
                ) : (
                  <div className="grid h-36 w-full place-items-center bg-slate-100 text-slate-300">
                    <HiPhotograph className="size-9" />
                  </div>
                )}
                <span
                  className={`absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ring-inset ${status.color}`}
                >
                  {status.text}
                </span>
              </div>

              <div className="flex flex-1 flex-col p-4">
                <h3 className="truncate text-base font-bold text-slate-900">
                  {item.title}
                </h3>

                <div className="mt-2 grid gap-1 text-xs text-slate-500">
                  <p className="flex items-center gap-1.5">
                    <HiLocationMarker className="shrink-0 text-indigo-600" />
                    <span className="truncate">
                      {item.district}, {item.village}
                    </span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <HiCalendar className="shrink-0 text-indigo-600" />
                    <span className="truncate">
                      {formatDate(item.foundDate)}
                      {item.category?.name ? ` · ${item.category.name}` : ""}
                    </span>
                  </p>
                  {daysLeft !== null && (
                    <p className="text-slate-400">
                      Public for {daysLeft} more {daysLeft === 1 ? "day" : "days"}
                    </p>
                  )}
                </div>

                {/* Expired: only an admin can bring it back */}
                {item.status === "expired" && (
                  <p className="mt-3 text-xs leading-5 text-slate-500">
                    This post stayed 90 days and expired. To bring it back,{" "}
                    <Link
                      to="/contact"
                      className="font-bold text-indigo-700 hover:text-indigo-900"
                    >
                      contact us
                    </Link>
                    .
                  </p>
                )}

                {/* Buttons */}
                {(canEdit || canReturn || canCancel) && (
                  <div className="mt-auto flex flex-wrap gap-2 pt-4">
                    {canEdit && (
                      <ActionButton onClick={() => setEditing(item)}>
                        <HiPencil className="size-3.5" /> Edit
                      </ActionButton>
                    )}
                    {canReturn && (
                      <ActionButton
                        onClick={() => setConfirming({ type: "returned", item })}
                        tone="green"
                      >
                        <HiCheck className="size-3.5" /> Returned
                      </ActionButton>
                    )}
                    {canCancel && (
                      <ActionButton
                        onClick={() => setConfirming({ type: "cancel", item })}
                        tone="red"
                      >
                        <HiX className="size-3.5" /> Cancel
                      </ActionButton>
                    )}
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {/* Edit window */}
      {editing && (
        <EditItemModal
          item={editing}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}

      {/* Small confirm window */}
      {confirming && (
        <ConfirmModal
          info={confirmInfo[confirming.type]}
          itemTitle={confirming.item.title}
          working={working}
          onConfirm={runConfirmed}
          onClose={() => setConfirming(null)}
        />
      )}
    </>
  );
}

// A small button used under every item
function ActionButton({ tone = "gray", children, ...props }) {
  const colors = {
    gray: "border-slate-300 text-slate-700 hover:border-indigo-300 hover:bg-slate-50 hover:text-indigo-700",
    green: "border-emerald-200 text-emerald-700 hover:bg-emerald-50",
    red: "border-red-200 text-red-600 hover:bg-red-50",
  };

  return (
    <button
      type="button"
      {...props}
      className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${colors[tone]}`}
    >
      {children}
    </button>
  );
}


// ======================================================
// SMALL CONFIRM WINDOW (replaces the browser alert)
// ======================================================

function ConfirmModal({ info, itemTitle, working, onConfirm, onClose }) {
  // Press Esc to close (not while the action is running)
  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape" && !working) {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKey);

    return () => window.removeEventListener("keydown", handleKey);
  }, [working, onClose]);

  const buttonColor =
    info.tone === "red"
      ? "bg-red-600 hover:bg-red-700"
      : "bg-emerald-600 hover:bg-emerald-700";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={info.title}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4"
    >
      {/* Click outside to close */}
      <div
        className="fixed inset-0"
        onClick={() => !working && onClose()}
        aria-hidden="true"
      />

      <div className="fade-up relative w-full max-w-xs rounded-2xl bg-white p-5 text-center shadow-2xl">
        <h2 className="text-base font-bold text-slate-950">{info.title}</h2>
        <p className="mt-1 truncate text-sm font-semibold text-indigo-700">
          {itemTitle}
        </p>
        <p className="mt-2 text-sm leading-5 text-slate-600">{info.text}</p>

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
            className={`rounded-lg px-3 py-2 text-sm font-bold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${buttonColor}`}
          >
            {working ? "Please wait..." : info.button}
          </button>
        </div>
      </div>
    </div>
  );
}


// ======================================================
// EDIT WINDOW (opens on top of the page)
// ======================================================

function EditItemModal({ item, onClose, onSaved }) {
  // Start with the current data of the item
  const [form, setForm] = useState({
    title: item.title,
    category: item.category?._id || "",
    district: item.district,
    village: item.village,
    foundDate: new Date(item.foundDate).toISOString().slice(0, 10),
    contactPhone: item.contactPhone || "",
  });
  const [categories, setCategories] = useState([]);
  const [image, setImage] = useState(null); // a NEW picture (optional)
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // While this window is open: the page behind does not scroll, and Esc closes it
  useEffect(() => {
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKey(e) {
      if (e.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKey);

    return () => {
      document.body.style.overflow = oldOverflow;
      window.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  // Get the categories ONE time (for the dropdown)
  useEffect(() => {
    async function loadCategories() {
      const { ok, data } = await api("/categories");

      if (ok) {
        setCategories(data.categories);
      }
    }

    loadCategories();
  }, []);

  // Make a preview when a new picture is chosen
  useEffect(() => {
    if (!image) {
      setPreview("");
      return;
    }

    const url = URL.createObjectURL(image);
    setPreview(url);

    return () => URL.revokeObjectURL(url);
  }, [image]);

  // Saves what the user types
  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  // Runs when the user chooses a new picture
  function handleImageChange(e) {
    const file = e.target.files[0];

    if (!file) return;

    if (!allowedTypes.includes(file.type)) {
      setError("Picture must be a JPG, PNG or WEBP file");
      e.target.value = "";
      return;
    }

    if (file.size > maxImageSize) {
      setError("Picture is too big. The maximum size is 5 MB");
      e.target.value = "";
      return;
    }

    setError("");
    setImage(file);
  }

  // Runs when the user presses Save
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    // Check the form before calling the backend
    const title = form.title.trim();
    const village = form.village.trim();
    const contactPhone = form.contactPhone.trim();

    if (title.length < 3) {
      setError("Title must be at least 3 characters");
      return;
    }

    if (village.length < 2) {
      setError("Village must be at least 2 characters");
      return;
    }

    if (!itemPhonePattern.test(contactPhone)) {
      setError("Please enter a valid phone number");
      return;
    }

    if (form.foundDate > today()) {
      setError("Found date cannot be in the future");
      return;
    }

    setLoading(true);

    // The data (+ the new picture, if there is one) is sent as FormData
    const formData = new FormData();
    formData.append("title", title);
    formData.append("category", form.category);
    formData.append("district", form.district);
    formData.append("village", village);
    formData.append("foundDate", form.foundDate);
    formData.append("contactPhone", contactPhone);

    if (image) {
      formData.append("image", image);
    }

    // Call the backend
    const { ok, data } = await api(`/items/${item._id}`, {
      method: "PUT",
      auth: true,
      body: formData,
    });

    if (ok) {
      onSaved(data.item, data.message);
      return;
    }

    setError(data.message || "Failed to save. Please try again.");
    setLoading(false);
  }

  // The picture shown: the new one, or the current one
  const shownImage = preview || imageUrl(item.image) || imageUrl(item.category?.image);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Edit item"
      className="fixed inset-0 z-[60] overflow-y-auto bg-slate-950/50"
    >
      {/* This box is as tall as the screen (or taller), so the form is centered
          when it is short and scrollable when it is tall. Click outside = close */}
      <div
        className="flex min-h-full items-center justify-center p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
      <form
        onSubmit={handleSubmit}
        className="fade-up relative w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="display-font text-xl text-slate-950">Edit item</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Change what is wrong, then press Save.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <HiX className="size-5" />
          </button>
        </div>

        {/* Warning: editing a public item sends it back to approval */}
        {item.status === "active" && (
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
            This item is public. After you save, it is hidden until an admin
            approves it again.
          </p>
        )}

        {error && (
          <div className="mt-3">
            <FormMessage>{error}</FormMessage>
          </div>
        )}

        <div className="mt-4 grid gap-3.5 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm font-semibold sm:col-span-2">
            Title
            <input
              required
              name="title"
              value={form.title}
              onChange={handleChange}
              maxLength={100}
              className={inputClass}
            />
          </label>

          <label className="grid gap-1.5 text-sm font-semibold">
            Category
            <select
              required
              name="category"
              value={form.category}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="" disabled>
                Select category
              </option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1.5 text-sm font-semibold">
            District
            <select
              required
              name="district"
              value={form.district}
              onChange={handleChange}
              className={inputClass}
            >
              {districts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1.5 text-sm font-semibold">
            Village
            <input
              required
              name="village"
              value={form.village}
              onChange={handleChange}
              maxLength={100}
              className={inputClass}
            />
          </label>

          <label className="grid gap-1.5 text-sm font-semibold">
            Found date
            <input
              required
              type="date"
              name="foundDate"
              max={today()}
              value={form.foundDate}
              onChange={handleChange}
              className={inputClass}
            />
          </label>

          <label className="grid gap-1.5 text-sm font-semibold sm:col-span-2">
            Contact phone
            <input
              required
              type="tel"
              name="contactPhone"
              value={form.contactPhone}
              onChange={handleChange}
              className={inputClass}
            />
          </label>

          {/* Picture (shown fully, nothing is cropped) */}
          <div className="sm:col-span-2">
            <p className="text-sm font-semibold">Picture</p>
            <div className="relative mt-1.5 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
              {shownImage ? (
                <img
                  src={shownImage}
                  alt="Item"
                  className="mx-auto max-h-72 w-auto max-w-full object-contain"
                />
              ) : (
                <div className="grid h-48 w-full place-items-center text-slate-300">
                  <HiPhotograph className="size-12" />
                </div>
              )}

              {/* Change picture button on top of the picture */}
              <label className="absolute bottom-3 right-3 cursor-pointer rounded-lg bg-white/90 px-3 py-2 text-sm font-bold text-slate-800 shadow-sm backdrop-blur-sm transition-colors hover:bg-white hover:text-indigo-700">
                Change picture
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  className="sr-only"
                />
              </label>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
          >
            Close
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-indigo-700 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
      </div>
    </div>
  );
}


// ======================================================
// TAB 2: MY DETAILS (name + phone)
// ======================================================

function DetailsForm() {
  const { user, updateUser } = useAuth();

  const [form, setForm] = useState({
    name: user.name || "",
    phone: user.phone || "",
  });
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  // Saves what the user types
  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  // Runs when the user presses Save
  async function handleSubmit(e) {
    e.preventDefault();
    setMessage(null);

    const name = form.name.trim();
    const phone = form.phone.trim();

    if (name.length < 3) {
      setMessage({ type: "error", text: "Name must be at least 3 characters" });
      return;
    }

    if (!userPhonePattern.test(phone)) {
      setMessage({ type: "error", text: "Please enter a valid phone number" });
      return;
    }

    setLoading(true);

    // Call the backend
    const { ok, data } = await api("/auth/profile", {
      method: "PUT",
      auth: true,
      body: { name, phone },
    });

    if (ok) {
      // Update the saved user (the Header shows the new name at once)
      updateUser(data.user);
      setMessage({ type: "success", text: data.message });
    } else {
      setMessage({ type: "error", text: data.message || "Failed to save" });
    }

    setLoading(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="fade-up grid max-w-lg gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <div>
        <h2 className="display-font text-xl text-slate-950">My details</h2>
        <p className="mt-0.5 text-sm text-slate-500">
          Keep your name and phone number up to date.
        </p>
      </div>

      {message && <FormMessage type={message.type}>{message.text}</FormMessage>}

      <label className="grid gap-1.5 text-sm font-semibold">
        Full name
        <input
          required
          name="name"
          maxLength={60}
          value={form.name}
          onChange={handleChange}
          className={inputClass}
        />
      </label>

      {/* The email cannot be changed */}
      <label className="grid gap-1.5 text-sm font-semibold">
        Email
        <input
          disabled
          value={user.email}
          className={`${inputClass} cursor-not-allowed bg-slate-50 text-slate-500`}
        />
        <span className="text-xs font-normal text-slate-500">
          The email is your login, so it cannot be changed.
        </span>
      </label>

      <label className="grid gap-1.5 text-sm font-semibold">
        Phone number
        <input
          required
          type="tel"
          name="phone"
          value={form.phone}
          onChange={handleChange}
          className={inputClass}
        />
      </label>

      <button
        type="submit"
        disabled={loading}
        className="min-h-10 rounded-lg bg-indigo-700 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-800 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
      >
        {loading ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}


// ======================================================
// TAB 3: CHANGE PASSWORD
// ======================================================

function PasswordForm() {
  const { saveLogin, user } = useAuth();

  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  // Saves what the user types
  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  // Runs when the user presses Change password
  async function handleSubmit(e) {
    e.preventDefault();
    setMessage(null);

    if (form.newPassword.length < 6) {
      setMessage({ type: "error", text: "New password must be at least 6 characters" });
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match" });
      return;
    }

    if (form.newPassword === form.currentPassword) {
      setMessage({ type: "error", text: "New password must be different from the current one" });
      return;
    }

    setLoading(true);

    // Call the backend
    const { ok, data } = await api("/auth/change-password", {
      method: "PUT",
      auth: true,
      body: {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      },
    });

    if (ok) {
      // The old token stopped working: save the NEW one (user stays logged in)
      saveLogin(data.token, user);
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setMessage({ type: "success", text: data.message });
    } else {
      setMessage({ type: "error", text: data.message || "Failed to change password" });
    }

    setLoading(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="fade-up grid max-w-lg gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <div>
        <h2 className="display-font text-xl text-slate-950">Change password</h2>
        <p className="mt-0.5 text-sm text-slate-500">
          Enter your current password, then choose a new one.
        </p>
      </div>

      {message && <FormMessage type={message.type}>{message.text}</FormMessage>}

      <label className="grid gap-1.5 text-sm font-semibold">
        Current password
        <input
          required
          type="password"
          name="currentPassword"
          autoComplete="current-password"
          value={form.currentPassword}
          onChange={handleChange}
          className={inputClass}
        />
      </label>

      <label className="grid gap-1.5 text-sm font-semibold">
        New password
        <input
          required
          type="password"
          name="newPassword"
          autoComplete="new-password"
          minLength={6}
          maxLength={64}
          value={form.newPassword}
          onChange={handleChange}
          className={inputClass}
        />
      </label>

      <label className="grid gap-1.5 text-sm font-semibold">
        Confirm new password
        <input
          required
          type="password"
          name="confirmPassword"
          autoComplete="new-password"
          maxLength={64}
          value={form.confirmPassword}
          onChange={handleChange}
          className={inputClass}
        />
      </label>

      <button
        type="submit"
        disabled={loading}
        className="min-h-10 rounded-lg bg-indigo-700 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-800 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
      >
        {loading ? "Saving..." : "Change password"}
      </button>
    </form>
  );
}