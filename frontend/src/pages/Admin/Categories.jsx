// Categories: the admin creates, edits, deactivates and reactivates categories.
import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { HiPlus, HiPencil, HiX, HiPhotograph, HiTag } from "react-icons/hi";
import { api, imageUrl } from "../../api.js";

// "ID Card" becomes "id-card"
function makeSlug(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function Categories() {
  const { refreshStats } = useOutletContext();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(null);
  const [reload, setReload] = useState(0);

  // The form window: null = closed, {} = new category, {category} = editing
  const [editing, setEditing] = useState(null);

  // The category waiting for "are you sure?" (hide / show)
  const [confirming, setConfirming] = useState(null);
  const [working, setWorking] = useState(false);

  // Get all categories (also the hidden ones)
  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      setError("");

      const { ok, data } = await api("/admin/categories", { auth: true });

      if (cancelled) return;

      if (ok) {
        setCategories(data.categories);
      } else {
        setError(data.message || "Failed to load the categories");
      }

      setLoading(false);
    }

    loadCategories();

    return () => {
      cancelled = true;
    };
  }, [reload]);

  // Runs after the form was saved
  function handleSaved(text) {
    setEditing(null);
    setNotice({ type: "success", text });
    setReload((r) => r + 1);
    refreshStats();
  }

  // Hide or show again
  async function handleConfirm() {
    const category = confirming;

    setWorking(true);
    setNotice(null);

    const { ok, data } = await api(`/categories/${category._id}`, {
      method: "PUT",
      auth: true,
      body: { isActive: !category.isActive },
    });

    if (ok) {
      setNotice({
        type: "success",
        text: category.isActive
          ? `"${category.name}" is hidden now.`
          : `"${category.name}" is active again.`,
      });
      setReload((r) => r + 1);
    } else {
      setNotice({ type: "error", text: data.message || "Something went wrong" });
    }

    setWorking(false);
    setConfirming(null);
  }

  return (
    <div className="space-y-5">
      <div className="fade-up flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-xl text-sm leading-6 text-slate-600">
          People choose a category when they post an item. A hidden category is
          not shown in the forms, but old items keep it.
        </p>
        <button
          type="button"
          onClick={() => setEditing({})}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-700"
        >
          <HiPlus className="size-4" /> New category
        </button>
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
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} className="h-44 animate-pulse rounded-2xl bg-slate-200/70" />
          ))}
        </div>
      )}

      {!loading && error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-5 py-10 text-center text-sm font-medium text-red-700">
          {error}
        </p>
      )}

      {!loading && !error && categories.length === 0 && (
        <div className="fade-up rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center">
          <p className="font-bold text-slate-900">No categories yet</p>
          <p className="mt-1 text-sm text-slate-600">Press "New category" to add the first one.</p>
        </div>
      )}

      {!loading && !error && categories.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
          {categories.map((category, index) => {
            const image = imageUrl(category.image);

            return (
              <article
                key={category._id}
                className={`fade-up flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${
                  category.isActive ? "border-slate-200" : "border-red-200"
                }`}
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <div className="relative h-28 w-full bg-slate-100 sm:h-32">
                  {image ? (
                    <img
                      src={image}
                      alt={category.name}
                      className={`h-full w-full object-cover ${category.isActive ? "" : "opacity-50 grayscale"}`}
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-slate-300">
                      <HiPhotograph className="size-10" />
                    </div>
                  )}
                  {!category.isActive && (
                    <span className="absolute left-2 top-2 rounded-full bg-red-100 px-2.5 py-0.5 text-[11px] font-bold text-red-700">
                      Hidden
                    </span>
                  )}
                </div>

                <div className="flex flex-1 flex-col p-3 sm:p-4">
                  <h3 className="truncate font-bold text-slate-900">{category.name}</h3>
                  <p className="truncate text-xs text-slate-400">{category.slug}</p>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditing({ category })}
                      className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-300 px-2 py-1.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50"
                    >
                      <HiPencil className="size-3.5" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirming(category)}
                      className={`rounded-lg px-2 py-1.5 text-xs font-bold transition-colors ${
                        category.isActive
                          ? "bg-red-50 text-red-700 hover:bg-red-100"
                          : "bg-emerald-600 text-white hover:bg-emerald-700"
                      }`}
                    >
                      {category.isActive ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {editing && (
        <CategoryForm
          category={editing.category}
          onSaved={handleSaved}
          onClose={() => setEditing(null)}
        />
      )}

      {confirming && (
        <ConfirmBox
          question={confirming.isActive ? "Hide this category?" : "Show this category again?"}
          name={confirming.name}
          help={
            confirming.isActive
              ? "People cannot pick it when posting. Old items keep it."
              : "People can pick it again when posting."
          }
          yes={confirming.isActive ? "Yes, hide" : "Yes, show"}
          danger={confirming.isActive}
          working={working}
          onConfirm={handleConfirm}
          onClose={() => setConfirming(null)}
        />
      )}
    </div>
  );
}


// ======================================================
// THE FORM WINDOW (new category or edit)
// ======================================================

function CategoryForm({ category, onSaved, onClose }) {
  const isNew = !category;

  const [name, setName] = useState(category?.name || "");
  const [slug, setSlug] = useState(category?.slug || "");
  const [image, setImage] = useState(category?.image || "");

  // For a new category the slug follows the name until the admin edits the slug himself
  const [slugTouched, setSlugTouched] = useState(!isNew);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Esc closes it
  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape" && !saving) {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKey);

    return () => window.removeEventListener("keydown", handleKey);
  }, [saving, onClose]);

  function handleName(e) {
    setName(e.target.value);

    if (!slugTouched) {
      setSlug(makeSlug(e.target.value));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!name.trim() || !slug.trim()) {
      setError("Name and slug are required.");
      return;
    }

    setSaving(true);

    const body = { name: name.trim(), slug: slug.trim(), image: image.trim() };

    const { ok, data } = isNew
      ? await api("/categories", { method: "POST", auth: true, body })
      : await api(`/categories/${category._id}`, { method: "PUT", auth: true, body });

    setSaving(false);

    if (ok) {
      onSaved(isNew ? `"${body.name}" was created.` : `"${body.name}" was updated.`);
    } else {
      setError(data.message || "Something went wrong");
    }
  }

  const preview = imageUrl(image.trim());

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isNew ? "New category" : "Edit category"}
      className="fixed inset-0 z-[70] overflow-y-auto bg-slate-950/60 backdrop-blur-sm"
    >
      <div className="fixed inset-0" onClick={() => !saving && onClose()} aria-hidden="true" />

      <div className="relative flex min-h-full items-center justify-center p-4">
        <form
          onSubmit={handleSubmit}
          className="fade-up relative w-full max-w-md space-y-4 rounded-2xl bg-white p-5 shadow-2xl"
        >
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-950">
              <HiTag className="text-indigo-600" />
              {isNew ? "New category" : "Edit category"}
            </h2>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              aria-label="Close"
              className="grid size-9 place-items-center rounded-full text-slate-500 transition-colors hover:bg-slate-100"
            >
              <HiX className="size-5" />
            </button>
          </div>

          {error && (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {error}
            </p>
          )}

          <label className="block text-sm font-semibold text-slate-700">
            Name
            <input
              type="text"
              value={name}
              onChange={handleName}
              maxLength={50}
              placeholder="Example: ID Card"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
          </label>

          <label className="block text-sm font-semibold text-slate-700">
            Slug
            <input
              type="text"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value.toLowerCase());
              }}
              placeholder="id-card"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
            <span className="mt-1 block text-xs font-normal text-slate-400">
              Small letters, numbers and dashes only.
            </span>
          </label>

          <label className="block text-sm font-semibold text-slate-700">
            Picture link (optional)
            <input
              type="text"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://..."
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
          </label>

          {preview && (
            <div className="grid max-h-40 place-items-center overflow-hidden rounded-lg bg-slate-100">
              <img src={preview} alt="Preview" className="max-h-40 w-full object-contain" />
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-bold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
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