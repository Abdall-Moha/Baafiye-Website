import { Link } from "react-router-dom";
import {
  HiOutlineSearch,
  HiOutlineUpload,
  HiOutlineUserGroup,
  HiOutlineShieldCheck,
  HiOutlineGlobe,
  HiOutlineEmojiHappy,
  HiOutlineArrowRight,
  HiOutlineLocationMarker,
  HiOutlineCalendar,
} from "react-icons/hi";

const steps = [
  {
    number: "01",
    title: "Find something",
    description:
      "You come across an item that clearly belongs to someone else.",
    icon: HiOutlineSearch,
  },
  {
    number: "02",
    title: "Post it",
    description:
      "Add a few details about where and when you found it, so it can be identified.",
    icon: HiOutlineUpload,
  },
  {
    number: "03",
    title: "The owner recognises it",
    description:
      "Someone who lost that item searches by location and sees your report.",
    icon: HiOutlineUserGroup,
  },
  {
    number: "04",
    title: "Reconnect",
    description:
      "You get in touch and arrange a safe, respectful return.",
    icon: HiOutlineEmojiHappy,
  },
];

const values = [
  {
    icon: HiOutlineShieldCheck,
    title: "Trust",
    description: "Every report is posted by real people who want to help.",
  },
  {
    icon: HiOutlineUserGroup,
    title: "Community",
    description: "We're built on the simple idea that neighbours help neighbours.",
  },
  {
    icon: HiOutlineGlobe,
    title: "Accessibility",
    description: "Baafiye is free and available to everyone, without barriers.",
  },
  {
    icon: HiOutlineEmojiHappy,
    title: "Respect",
    description: "We treat every lost item and every person with care.",
  },
];

export default function About() {
  return (
    <main className="bg-white text-gray-900">

      {/* ====== HERO ====== */}
      <section className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 lg:py-20">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            {/* Text */}
            <div>
              <span className="text-sm font-semibold uppercase tracking-widest text-indigo-600">
                About Baafiye
              </span>
              <h1 className="mt-2 text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight text-gray-900">
                Helping people reconnect with what matters.
              </h1>
              <p className="mt-4 text-base sm:text-lg text-gray-600 leading-relaxed max-w-lg">
                Baafiye is a simple lost‑and‑found platform that helps people
                report found belongings and gives owners a place to search for
                what they've lost.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to="/post-item"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-full shadow-sm hover:bg-indigo-700 transition"
                >
                  Post Found Item <HiOutlineArrowRight className="text-lg" />
                </Link>
                <Link
                  to="/items"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-full hover:bg-gray-50 hover:border-gray-400 transition"
                >
                  Browse Items
                </Link>
              </div>
            </div>
            {/* Image */}
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?auto=format&fit=crop&w=800&q=80"
                alt="Person helping another person"
                className="rounded-2xl shadow-md object-cover w-full h-64 sm:h-72 md:h-80 lg:h-96"
              />
              <div className="absolute -bottom-3 -right-3 bg-white rounded-xl shadow-lg px-3 py-2 flex items-center gap-2 text-sm border border-gray-100">
                <HiOutlineLocationMarker className="text-indigo-500" />
                <span>Found in your area</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====== WHAT IS BAAFIYE ====== */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-sm font-semibold uppercase tracking-widest text-indigo-600">
                What is Baafiye
              </span>
              <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
                One simple place to report and search.
              </h2>
              <p className="mt-4 text-base sm:text-lg text-gray-600 leading-relaxed">
                Baafiye gives people one simple place to report things they have
                found and search for things they have lost. It removes the
                guesswork and makes it easier for everyone to do the right thing.
              </p>
              <div className="mt-6 flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <HiOutlineCalendar className="text-indigo-500" /> No expiry
                </span>
                <span className="flex items-center gap-1">
                  <HiOutlineLocationMarker className="text-indigo-500" /> Local focus
                </span>
              </div>
            </div>
            <div className="bg-indigo-50 rounded-2xl p-6 sm:p-8 flex justify-center">
              <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                <div className="bg-white rounded-xl shadow-sm p-4 text-center border border-gray-100">
                  <HiOutlineSearch className="mx-auto text-2xl text-indigo-500" />
                  <p className="mt-2 text-sm font-medium">Search</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-4 text-center border border-gray-100">
                  <HiOutlineUpload className="mx-auto text-2xl text-indigo-500" />
                  <p className="mt-2 text-sm font-medium">Report</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-4 text-center border border-gray-100 col-span-2">
                  <HiOutlineUserGroup className="mx-auto text-2xl text-indigo-500" />
                  <p className="mt-2 text-sm font-medium">Reconnect</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====== WHY IT EXISTS ====== */}
      <section className="bg-gray-50 border-t border-b border-gray-200 py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <span className="text-sm font-semibold uppercase tracking-widest text-indigo-600">
              Why it exists
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
              Because doing the right thing should be easier.
            </h2>
            <p className="mt-4 text-base sm:text-lg text-gray-600 leading-relaxed">
              Losing something important can be frustrating. Finding someone
              else's belongings can also leave you wondering how to return them.
            </p>
            <p className="mt-2 text-base sm:text-lg text-gray-600 leading-relaxed">
              Baafiye gives both sides a simple place to start.
            </p>
            <div className="mt-6 flex justify-center">
              <div className="inline-flex items-center gap-2 text-sm bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200">
                <span className="text-indigo-600 font-medium">One platform</span>
                <span className="text-gray-300">|</span>
                <span className="text-gray-600">Two needs – found & lost</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====== HOW IT WORKS ====== */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-sm font-semibold uppercase tracking-widest text-indigo-600">
              How it works
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-gray-900">
              A straightforward path to return.
            </h2>
          </div>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map(({ number, title, description, icon: Icon }) => (
              <div
                key={number}
                className="flex flex-col items-center text-center p-5 bg-white rounded-xl border border-gray-200 hover:border-indigo-200 transition"
              >
                <div className="text-sm font-bold text-indigo-600 bg-indigo-50 rounded-full w-8 h-8 flex items-center justify-center">
                  {number}
                </div>
                <div className="mt-3 w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <Icon className="text-2xl" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-gray-900">{title}</h3>
                <p className="mt-1 text-sm text-gray-500 leading-relaxed">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== OUR VALUES ====== */}
      <section className="bg-gray-50 border-t border-gray-200 py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-sm font-semibold uppercase tracking-widest text-indigo-600">
              Our values
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-gray-900">
              What we stand for.
            </h2>
          </div>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="bg-white rounded-xl p-5 border border-gray-200 hover:border-indigo-200 transition flex flex-col items-center text-center"
              >
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <Icon className="text-xl" />
                </div>
                <h4 className="mt-3 text-base font-bold text-gray-900">{title}</h4>
                <p className="mt-1 text-sm text-gray-500 leading-relaxed">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== FINAL CTA ====== */}
      <section className="py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
            Every found item has a story.
          </h2>
          <p className="mt-3 text-base sm:text-lg text-gray-600">
            Help give it a way home.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              to="/post-item"
              className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-full shadow-sm hover:bg-indigo-700 transition inline-flex items-center gap-2"
            >
              Post Found Item <HiOutlineArrowRight className="text-lg" />
            </Link>
            <Link
              to="/items"
              className="px-6 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-full hover:bg-gray-50 hover:border-gray-400 transition"
            >
              Browse Items
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}