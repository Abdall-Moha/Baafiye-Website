import { categories, districts } from "../data/items";

export default function PostItem() {
  return (
    <section className="page-shell py-12 sm:py-16">
      <div className="mx-auto max-w-2xl">
        <div className="text-center">
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
          onSubmit={(e) => e.preventDefault()}
          className="mt-9 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field
                label="Title"
                placeholder="e.g. Black leather wallet"
                helper="Give the item a clear, descriptive name"
              />
            </div>
            <Choice label="Category" options={categories} />
            <Choice label="District" options={districts} />
            <div className="sm:col-span-2">
              <Field
                label="Village"
                placeholder="e.g. Taleex"
                helper="Specific area where the item was found"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="grid gap-2 text-sm font-semibold">
                Found Date
                <p className="text-xs font-normal text-slate-500">
                  When did you find this item?
                </p>
                <input
                  required
                  type="date"
                  className="h-11 w-full rounded-lg border border-slate-300 px-3 font-normal outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10"
                />
              </label>
            </div>
            <div className="sm:col-span-2">
              <Field
                label="Contact Phone"
                type="tel"
                placeholder="+252 61 000 0000"
                helper="Your phone number for the owner to contact you"
              />
            </div>
          </div>

          <button className="mt-7 min-h-12 w-full rounded-lg bg-indigo-700 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-800 focus:outline-none focus:ring-4 focus:ring-indigo-600/20">
            Submit Found Item
          </button>

          <p className="mt-4 text-center text-xs leading-5 text-slate-500">
            This form is a frontend preview and does not submit data.
          </p>
        </form>
      </div>
    </section>
  );
}

function Field({ label, type = "text", placeholder, helper }) {
  return (
    <label className="grid gap-2 text-sm font-semibold">
      {label}
      {helper && <p className="text-xs font-normal text-slate-500">{helper}</p>}
      <input
        required
        type={type}
        placeholder={placeholder}
        className="h-11 w-full rounded-lg border border-slate-300 px-3 font-normal outline-none transition placeholder:text-slate-400 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10"
      />
    </label>
  );
}

function Choice({ label, options }) {
  return (
    <label className="grid gap-2 text-sm font-semibold">
      {label}
      <select
        required
        defaultValue=""
        className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 font-normal outline-none transition focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10"
      >
        <option value="" disabled>
          Select {label.toLowerCase()}
        </option>
        {options.map((x) => (
          <option key={x}>{x}</option>
        ))}
      </select>
    </label>
  );
}
