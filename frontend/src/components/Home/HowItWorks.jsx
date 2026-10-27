import {
  HiSearch,
  HiUpload,
  HiUser,
  HiCheckCircle,
} from "react-icons/hi";

const steps = [
  {
    number: "01",
    icon: HiSearch,
    title: "Find something",
    description:
      "You find a lost belonging and want to help its owner get it back.",
  },
  {
    number: "02",
    icon: HiUpload,
    title: "Post it on Baafiye",
    description:
      "Add the important details so the owner can easily recognize their item.",
  },
  {
    number: "03",
    icon: HiUser,
    title: "The owner finds it",
    description:
      "People searching for their belongings can discover your found-item post.",
  },
  {
    number: "04",
    icon: HiCheckCircle,
    title: "Bring it back",
    description:
      "Connect with the owner and arrange a safe and respectful return.",
  },
];

export default function HowItWorks() {
  return (
    <section className="relative overflow-hidden bg-white py-20 sm:py-24 lg:py-28">
      {/* Background decoration */}
      <div className="pointer-events-none absolute left-0 top-20 h-72 w-72 rounded-full bg-indigo-100/40 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-purple-100/40 blur-3xl" />

      <div className="page-shell relative">
        {/* Section heading */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700">
            <span className="h-2 w-2 rounded-full bg-indigo-600" />
            How Baafiye works
          </div>

          <h2 className="display-font mt-5 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
            From found to{" "}
            <span className="text-indigo-600">reunited.</span>
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            Baafiye makes it simple to report something you've found and gives
            its owner a better chance of getting it back.
          </p>
        </div>

        {/* Steps */}
        <div className="relative mx-auto mt-16 max-w-6xl">
          {/* Desktop connecting line */}
          <div className="absolute left-[12%] right-[12%] top-10 hidden h-px bg-gradient-to-r from-indigo-100 via-indigo-300 to-indigo-100 lg:block" />

          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {steps.map((step, index) => {
              const Icon = step.icon;

              return (
                <div key={step.number} className="group relative">
                  {/* Step number + icon */}
                  <div className="relative z-10 flex justify-center">
                    <div className="relative">
                      {/* Outer ring */}
                      <div className="absolute -inset-2 rounded-full border border-indigo-100 transition duration-300 group-hover:border-indigo-300 group-hover:scale-110" />

                      {/* Icon */}
                      <div className="grid h-20 w-20 place-items-center rounded-full border border-indigo-100 bg-white shadow-[0_8px_30px_rgba(79,70,229,0.10)] transition duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_15px_35px_rgba(79,70,229,0.18)]">
                        <Icon className="h-8 w-8 text-indigo-600 transition duration-300 group-hover:scale-110" />
                      </div>

                      {/* Number */}
                      <span className="absolute -right-2 -top-2 grid h-7 w-7 place-items-center rounded-full bg-slate-950 text-[10px] font-bold text-white shadow-md">
                        {step.number}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="mt-8 text-center">
                    <h3 className="text-lg font-bold text-slate-950 transition-colors group-hover:text-indigo-600 sm:text-xl">
                      {step.title}
                    </h3>

                    <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-slate-600">
                      {step.description}
                    </p>
                  </div>

                  {/* Mobile connector */}
                  {index < steps.length - 1 && (
                    <div className="mx-auto mt-8 h-10 w-px bg-gradient-to-b from-indigo-200 to-transparent sm:hidden" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom message */}
        <div className="mx-auto mt-16 max-w-3xl">
          <div className="flex flex-col items-center justify-between gap-5 rounded-2xl border border-slate-200 bg-slate-50 px-6 py-6 text-center sm:flex-row sm:text-left">
            <div>
              <p className="font-semibold text-slate-900">
                Every found item can make a difference.
              </p>

              <p className="mt-1 text-sm text-slate-600">
                A small act can help someone recover something important.
              </p>
            </div>

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white shadow-sm">
              <HiCheckCircle className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}