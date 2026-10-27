const fields = [
  ["Name", "text", "Your name"],
  ["Email", "email", "you@example.com"],
  ["Subject", "text", "How can we help?"],
];

export default function Contact() {
  return (
    <section className="page-shell py-14 sm:py-20">
      <div className="mx-auto max-w-2xl">
        <header className="text-center">
          <p className="text-sm font-bold uppercase tracking-[.18em] text-indigo-600">
            Get in touch
          </p>
          <h1 className="display-font mt-3 text-4xl text-slate-950 sm:text-5xl">
            Contact Baafiye
          </h1>
          <p className="mx-auto mt-4 max-w-xl leading-7 text-slate-600">
            Have a question, suggestion, or need help? Send us a message and
            we&apos;ll get back to you.
          </p>
        </header>
        <form
          onSubmit={(e) => e.preventDefault()}
          className="mt-9 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"
        >
          <div className="grid gap-5">
            {fields.slice(0, 2).map(([label, type, placeholder]) => (
              <Field key={label} {...{ label, type, placeholder }} />
            ))}
            <Field label="Subject" type="text" placeholder="How can we help?" />
            <label className="grid gap-2 text-sm font-semibold text-slate-800">
              Message
              <textarea
                required
                rows="7"
                placeholder="Write your message"
                className="w-full resize-y rounded-lg border border-slate-300 px-3.5 py-3 font-normal leading-6 outline-none transition placeholder:text-slate-400 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10"
              />
            </label>
          </div>
          <button className="mt-7 min-h-12 w-full rounded-lg bg-indigo-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-600/20">
            Send Message
          </button>
          <p className="mt-4 text-center text-sm text-slate-500">
            We&apos;ll do our best to respond as soon as possible.
          </p>
        </form>
      </div>
    </section>
  );
}

function Field({ label, type, placeholder }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-800">
      {label}
      <input
        required
        type={type}
        placeholder={placeholder}
        className="h-12 w-full rounded-lg border border-slate-300 px-3.5 font-normal outline-none transition placeholder:text-slate-400 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10"
      />
    </label>
  );
}
