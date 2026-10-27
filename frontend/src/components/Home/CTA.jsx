import { Link } from "react-router-dom";
import { HiArrowRight, HiPlus, HiSearch } from "react-icons/hi";

export default function CTA() {
  return (
    <section className="bg-indigo-900">
      <div className="page-shell py-16 sm:py-20">
        <div className="text-center">
          <h2 className="display-font text-3xl font-bold text-white sm:text-4xl">
            Ready to help or find what you lost?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-indigo-100">
            Join the community in making Mogadishu a place where lost items find
            their way home.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              to="/post-item"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-white px-6 text-sm font-bold text-indigo-900 shadow-lg transition hover:bg-indigo-50"
            >
              <HiPlus /> Post Found Item
            </Link>
            <Link
              to="/items"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-indigo-700 bg-indigo-800 px-6 text-sm font-bold text-white transition hover:bg-indigo-700"
            >
              <HiSearch /> Browse Items <HiArrowRight />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}