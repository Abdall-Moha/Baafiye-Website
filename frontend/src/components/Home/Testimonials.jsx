import { useState } from "react";
import { HiChevronLeft, HiChevronRight, HiStar } from "react-icons/hi";

const people = [
  {
    name: "Ayaan Mohamed",
    location: "Hodan",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
    quote:
      "I found a report for my bag and was able to arrange a safe return the same day.",
  },
  {
    name: "Abdi Hassan",
    location: "Wadajir",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
    quote:
      "Posting an item was clear and respectful. I knew just what information to share.",
  },
  {
    name: "Hani Ali",
    location: "Yaqshid",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    quote:
      "A simple idea that makes it much easier for neighbours to help one another.",
  },
  {
    name: "Omar Nur",
    location: "Hamar Weyne",
    image: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80",
    quote:
      "The search made it easy to see whether someone had reported my lost item.",
  },
];

function Arrow({ label, onClick, children, className = "" }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`grid size-10 place-items-center rounded-full border border-white/20 text-white transition hover:bg-white/10 ${className}`}
    >
      {children}
    </button>
  );
}

export default function Testimonials() {
  const [start, setStart] = useState(0);
  const next = () => setStart((index) => (index + 1) % people.length);
  const previous = () =>
    setStart((index) => (index - 1 + people.length) % people.length);
  const visible = [0, 1, 2].map((offset) =>
    people[(start + offset) % people.length]
  );

  return (
    <section className="overflow-hidden bg-indigo-950 text-white">
      <div className="page-shell py-16 sm:py-20">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="text-sm font-bold uppercase tracking-[.16em] text-indigo-200">
              Community voices
            </p>
            <h2 className="display-font mt-2 text-3xl sm:text-4xl">
              Built around people helping people.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-indigo-100">
              Sample testimonials shown for design preview only. Replace with
              verified stories when available.
            </p>
          </div>
          <div className="hidden gap-2 sm:flex">
            <Arrow label="Previous testimonial" onClick={previous}>
              <HiChevronLeft />
            </Arrow>
            <Arrow label="Next testimonial" onClick={next}>
              <HiChevronRight />
            </Arrow>
          </div>
        </div>

        <div className="mt-9 grid gap-5 md:grid-cols-3">
          {visible.map((person, index) => (
            <article
              key={person.name}
              className={`rounded-2xl border border-white/10 bg-white/8 p-6 transition hover:-translate-y-1 hover:bg-white/12 ${
                index === 1 ? "md:-translate-y-3 md:bg-white/12" : ""
              }`}
            >
              <div className="text-4xl leading-none text-indigo-300">"</div>
              <p className="mt-3 min-h-24 leading-7 text-indigo-50">
                {person.quote}
              </p>
              <div className="mt-6 flex items-center gap-3">
                <img
                  src={person.image}
                  alt=""
                  className="size-11 rounded-full object-cover ring-2 ring-indigo-300/40"
                />
                <div>
                  <p className="text-sm font-bold">{person.name}</p>
                  <p className="text-xs text-indigo-200">{person.location}</p>
                </div>
                <div className="ml-auto flex text-amber-300">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <HiStar key={star} className="size-3.5" />
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-7 flex items-center justify-center gap-3">
          <Arrow
            className="sm:hidden"
            label="Previous testimonial"
            onClick={previous}
          >
            <HiChevronLeft />
          </Arrow>
          {people.map((person, index) => (
            <button
              key={person.name}
              type="button"
              aria-label={`Show testimonial ${index + 1}`}
              onClick={() => setStart(index)}
              className={`h-2 rounded-full transition ${
                index === start ? "w-6 bg-white" : "w-2 bg-indigo-400"
              }`}
            />
          ))}
          <Arrow
            className="sm:hidden"
            label="Next testimonial"
            onClick={next}
          >
            <HiChevronRight />
          </Arrow>
        </div>
      </div>
    </section>
  );
}
