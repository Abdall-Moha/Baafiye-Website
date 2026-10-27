import { FaPlusCircle, FaSearch } from "react-icons/fa";
import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <section className="mx-auto max-w-[1200px] px-5 pb-10 pt-16 text-center">
      
      <h1 className="mb-3 bg-gradient-to-r from-indigo-950 to-indigo-600 bg-clip-text text-[2.8rem] font-extrabold text-transparent">
        Reunite with what you've lost
      </h1>

      <p className="mx-auto mb-8 max-w-[600px] text-[1.2rem] text-gray-600">
        Browse found items or post what you've discovered. Help your
        community get their belongings back.
      </p>

      <div className="flex flex-wrap justify-center gap-4">

        <Link
          to="/post-item"
          className="flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-7 py-3 font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:-translate-y-0.5 hover:shadow-xl"
        >
          <FaPlusCircle />
          Post Item
        </Link>

        <Link
          to="/items"
          className="flex items-center gap-2 rounded-full border border-white/40 bg-white/60 px-7 py-3 font-semibold text-[#1a1a2e] transition hover:bg-white/90"
        >
          <FaSearch />
          Browse Items
        </Link>

      </div>

    </section>
  );
};

export default Hero;