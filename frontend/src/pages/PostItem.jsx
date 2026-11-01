import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  HiCheckCircle,
  HiLockClosed,
  HiPhotograph,
  HiX,
} from "react-icons/hi";
import { api } from "../api.js";
import { useAuth } from "../Auth/AuthContext.jsx";
import { districts } from "../data/items";
import { FormMessage } from "../Auth/Login.jsx";

// Phone format: 7 to 20 characters (numbers, +, spaces, brackets, dash)
const phonePattern = /^[0-9+\s()-]{7,20}$/;

// Picture rules (the backend checks them again)
const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
const maxImageSize = 5 * 1024 * 1024; // 5 MB

// Today's date as "2026-10-31" (a found date cannot be in the future)
function today() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${now.getFullYear()}-${month}-${day}`;
}

// Empty form (used at the start and after a successful post)
const emptyForm = {
  title: "",
  category: "",
  district: "",
  village: "",
  foundDate: "",
  contactPhone: "",
};

export default function PostItem() {
  // The logged-in user (null if nobody is logged in)
  const { user } = useAuth();

  // What the user typed / selected
  const [form, setForm] = useState(emptyForm);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // The picture the user chose + a small preview of it
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");

  // The item after it was posted (shows the success card)
  const [postedItem, setPostedItem] = useState(null);

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

  // Make a preview when a picture is chosen, and clean it when it changes
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

  // Runs when the user chooses a picture
  function handleImageChange(e) {
    const file = e.target.files[0];

    if (!file) return;

    // Check the picture before using it
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

  // Runs when the user presses Submit
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

    if (!phonePattern.test(contactPhone)) {
      setError("Please enter a valid phone number");
      return;
    }

    if (form.foundDate > today()) {
      setError("Found date cannot be in the future");
      return;
    }

    if (!image) {
      setError("Please add a picture of the item");
      return;
    }

    setLoading(true);

    // The data + the picture are sent together as FormData
    const formData = new FormData();
    formData.append("title", title);
    formData.append("category", form.category);
    formData.append("district", form.district);
    formData.append("village", village);
    formData.append("foundDate", form.foundDate);
    formData.append("contactPhone", contactPhone);
    formData.append("image", image); // the backend reads the file called "image"

    // Call the backend (auth: true sends the login token)
    const { ok, data } = await api("/items", {
      method: "POST",
      auth: true,
      body: formData,
    });

    // Posted: show the success card and clear the form
    if (ok) {
      setPostedItem(data.item);
      setForm(emptyForm);
      setImage(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      // Show the message from the backend (example: "Too many requests")
      setError(data.message || "Failed to post the item. Please try again.");
    }

    setLoading(false);
  }

  // 1) Not logged in: ask the user to login first
  if (!user) {
    return (
      <section className="page-shell py-12 sm:py-16">
        <div className="fade-up mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-indigo-50 text-indigo-700">
            <HiLockClosed className="size-7" />
          </span>
          <h1 className="display-font mt-5 text-3xl text-slate-950">
            Login to post an item
          </h1>
          <p className="mt-3 leading-7 text-slate-600">
            You need an account to post a found item. This helps us keep
            Baafiye safe for everyone.
          </p>

          {/* "state" brings the user back to this page after login */}
          <Link
            to="/login"
            state={{ from: { pathname: "/post-item" } }}
            className="mt-6 block rounded-lg bg-indigo-700 px-5 py-3 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-800 hover:shadow-md"
          >
            Login
          </Link>
          <p className="mt-4 text-sm text-slate-600">
            New here?{" "}
            <Link
              to="/register"
              className="font-bold text-indigo-700 transition-colors hover:text-indigo-900"
            >
              Create an account
            </Link>
          </p>
        </div>
      </section>
    );
  }

  // 2) Item posted: success card (it waits for the admin)
  if (postedItem) {
    return (
      <section className="page-shell py-12 sm:py-16">
        <div className="fade-up mx-auto max-w-md rounded-2xl border border-emerald-200 bg-white p-8 text-center shadow-sm">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-50 text-emerald-600">
            <HiCheckCircle className="size-8" />
          </span>
          <h1 className="display-font mt-5 text-3xl text-slate-950">
            Item submitted!
          </h1>
          <p className="mt-3 leading-7 text-slate-600">
            <strong>{postedItem.title}</strong> is waiting for admin approval.
            Once it is approved it becomes public for 90 days, so the owner
            can find it and contact you.
          </p>

          <Link
            to="/items"
            className="mt-6 block rounded-lg bg-indigo-700 px-5 py-3 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-800 hover:shadow-md"
          >
            Browse items
          </Link>
          <button
            type="button"
            onClick={() => setPostedItem(null)}
            className="mt-3 w-full rounded-lg border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 transition-colors hover:border-indigo-300 hover:bg-slate-50"
          >
            Post another item
          </button>
        </div>
      </section>
    );
  }

  // 3) The form
  return (
    <section className="page-shell py-12 sm:py-16">
      <div className="mx-auto max-w-2xl">
        <div className="fade-up text-center">
          <p className="text-sm font-bold uppercase tracking-[.16em] text-indigo-700">
            Found something?
          </p>
          <h1 className="display-font mt-2 text-4xl text-slate-950 sm:text-5xl">
            Post a found item
          </h1>
          <p className="mt-4 leading-7 text-slate-600">
            Share the essentials so the right person can recognise their
            belonging. Do not post private item details.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="fade-up mt-9 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow duration-300 hover:shadow-md sm:p-8"
          style={{ animationDelay: "80ms" }}
        >
          {error && (
            <div className="mb-5">
              <FormMessage>{error}</FormMessage>
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field
                label="Title"
                name="title"
                value={form.title}
                onChange={handleChange}
                maxLength={100}
                placeholder="e.g. Black leather wallet"
                helper="Give the item a clear, descriptive name"
              />
            </div>

            {/* Category: the value is the category id */}
            <label className="grid gap-2 text-sm font-semibold">
              Category
              <select
                required
                name="category"
                value={form.category}
                onChange={handleChange}
                className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 font-normal outline-none transition hover:border-slate-400 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10"
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

            {/* District */}
            <label className="grid gap-2 text-sm font-semibold">
              District
              <select
                required
                name="district"
                value={form.district}
                onChange={handleChange}
                className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 font-normal outline-none transition hover:border-slate-400 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10"
              >
                <option value="" disabled>
                  Select district
                </option>
                {districts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>

            <div className="sm:col-span-2">
              <Field
                label="Village"
                name="village"
                value={form.village}
                onChange={handleChange}
                maxLength={100}
                placeholder="e.g. Taleex"
                helper="Specific area where the item was found"
              />
            </div>

            <div className="sm:col-span-2">
              <Field
                label="Found Date"
                name="foundDate"
                type="date"
                max={today()}
                value={form.foundDate}
                onChange={handleChange}
                helper="When did you find this item?"
              />
            </div>

            {/* Picture */}
            <div className="sm:col-span-2">
              <p className="text-sm font-semibold">Picture of the item</p>
              <p className="mt-2 text-xs text-slate-500">
                JPG, PNG or WEBP, up to 5 MB. Do not show private details such
                as ID numbers.
              </p>

              {/* No picture yet: the upload box */}
              {!preview && (
                <label className="mt-2 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center transition-colors duration-200 hover:border-indigo-400 hover:bg-indigo-50/50">
                  <HiPhotograph className="size-9 text-slate-400" />
                  <span className="text-sm font-bold text-indigo-700">
                    Click to choose a picture
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageChange}
                    className="sr-only"
                  />
                </label>
              )}

              {/* Picture chosen: the preview */}
              {preview && (
                <div className="group relative mt-2 overflow-hidden rounded-xl border border-slate-200">
                  <img
                    src={preview}
                    alt="Preview of the item"
                    className="h-56 w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setImage(null)}
                    aria-label="Remove picture"
                    className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-white/90 text-slate-700 shadow-sm backdrop-blur-sm transition-colors hover:bg-red-50 hover:text-red-600"
                  >
                    <HiX className="size-5" />
                  </button>
                </div>
              )}
            </div>

            <div className="sm:col-span-2">
              <Field
                label="Contact Phone"
                name="contactPhone"
                type="tel"
                value={form.contactPhone}
                onChange={handleChange}
                placeholder="+252 61 000 0000"
                helper="Only shown to people who press 'Contact finder'"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-7 min-h-12 w-full rounded-lg bg-indigo-700 px-5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-800 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-indigo-600/20 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {loading ? "Uploading..." : "Submit Found Item"}
          </button>

          <p className="mt-4 text-center text-xs leading-5 text-slate-500">
            An admin checks every post before it goes public. It then stays
            online for 90 days.
          </p>
        </form>
      </div>
    </section>
  );
}

// One text/date/phone box with a label
function Field({ label, helper, ...inputProps }) {
  return (
    <label className="grid gap-2 text-sm font-semibold">
      {label}
      {helper && <p className="text-xs font-normal text-slate-500">{helper}</p>}
      <input
        required
        {...inputProps}
        className="h-11 w-full rounded-lg border border-slate-300 px-3 font-normal outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10"
      />
    </label>
  );
}