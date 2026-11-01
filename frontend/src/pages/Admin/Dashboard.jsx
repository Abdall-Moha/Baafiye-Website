import { useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import {
  HiClock,
  HiEye,
  HiCheckCircle,
  HiCalendar,
  HiBan,
  HiUsers,
  HiUserRemove,
  HiTag,
  HiArrowRight,
  HiRefresh,
} from "react-icons/hi";
import { useAuth } from "../../Auth/AuthContext.jsx";

// Colours of each card
const tones = {
  amber: { box: "bg-amber-50 text-amber-600", bar: "bg-amber-400" },
  emerald: { box: "bg-emerald-50 text-emerald-600", bar: "bg-emerald-500" },
  sky: { box: "bg-sky-50 text-sky-600", bar: "bg-sky-500" },
  slate: { box: "bg-slate-100 text-slate-500", bar: "bg-slate-400" },
  red: { box: "bg-red-50 text-red-600", bar: "bg-red-500" },
  indigo: { box: "bg-indigo-50 text-indigo-600", bar: "bg-indigo-500" },
};

export default function Dashboard() {
  const { user } = useAuth();

  // The numbers come from AdminLayout (it loads them once)
  const { stats, refreshStats } = useOutletContext();

  const [refreshing, setRefreshing] = useState(false);

  // Runs when the admin presses Refresh
  async function handleRefresh() {
    setRefreshing(true);
    await refreshStats();
    setRefreshing(false);
  }

  // Numbers not loaded yet: grey pulsing boxes
  if (!stats) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-24 rounded-2xl bg-slate-200/70" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-28 rounded-2xl bg-slate-200/70" />
          ))}
        </div>
      </div>
    );
  }

  const items = stats.items;
  const totalItems =
    items.pending + items.active + items.returned + items.expired + items.cancelled;

  // The cards about items
  const itemCards = [
    { label: "Waiting for approval", value: items.pending, icon: HiClock, tone: "amber", to: "/admin/pending" },
    { label: "Public items", value: items.active, icon: HiEye, tone: "emerald", to: "/admin/items?status=active" },
    { label: "Returned", value: items.returned, icon: HiCheckCircle, tone: "sky", to: "/admin/items?status=returned" },
    { label: "Expired", value: items.expired, icon: HiCalendar, tone: "slate", to: "/admin/items?status=expired" },
    { label: "Cancelled", value: items.cancelled, icon: HiBan, tone: "red", to: "/admin/items?status=cancelled" },
  ];

  // The cards about people and categories
  const otherCards = [
    { label: "Users", value: stats.totalUsers, icon: HiUsers, tone: "indigo", to: "/admin/users" },
    { label: "Blocked users", value: stats.blockedUsers, icon: HiUserRemove, tone: "red", to: "/admin/users" },
    { label: "Categories", value: stats.totalCategories, icon: HiTag, tone: "indigo", to: "/admin/categories" },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="fade-up flex flex-col gap-4 rounded-2xl bg-gradient-to-r from-indigo-700 to-indigo-900 p-5 text-white shadow-lg sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-indigo-200">Welcome back</p>
          <h2 className="display-font mt-0.5 truncate text-2xl sm:text-3xl">
            {user?.name}
          </h2>
          <p className="mt-1 text-sm text-indigo-100">
            Here is what is happening on Baafiye today.
          </p>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-white/25 disabled:opacity-60"
        >
          <HiRefresh className={`size-4 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Needs attention: posts waiting for the admin */}
      {items.pending > 0 && (
        <Link
          to="/admin/pending"
          className="group fade-up flex items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-5"
          style={{ animationDelay: "60ms" }}
        >
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-700">
              <HiClock className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="font-bold text-amber-900">
                {items.pending} {items.pending === 1 ? "post is" : "posts are"} waiting for approval
              </p>
              <p className="text-sm text-amber-800/80">
                People cannot see them until you approve.
              </p>
            </div>
          </div>
          <HiArrowRight className="size-5 shrink-0 text-amber-700 transition-transform duration-200 group-hover:translate-x-1" />
        </Link>
      )}

      {/* Items */}
      <section>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-[.14em] text-slate-500">
          Items
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {itemCards.map((card, index) => (
            <StatCard key={card.label} card={card} delay={index * 40} />
          ))}
        </div>

        {/* Bar: how the items are divided */}
        {totalItems > 0 && (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-center justify-between text-sm">
              <p className="font-bold text-slate-900">All items</p>
              <p className="text-slate-500">{totalItems} in total</p>
            </div>

            <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-slate-100">
              {itemCards.map((card) =>
                card.value > 0 ? (
                  <div
                    key={card.label}
                    className={`${tones[card.tone].bar} transition-all duration-500`}
                    style={{ width: `${(card.value / totalItems) * 100}%` }}
                    title={`${card.label}: ${card.value}`}
                  />
                ) : null
              )}
            </div>

            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-slate-600">
              {itemCards.map((card) => (
                <span key={card.label} className="inline-flex items-center gap-1.5">
                  <span className={`size-2.5 rounded-full ${tones[card.tone].bar}`} />
                  {card.label} ({card.value})
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* People and categories */}
      <section>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-[.14em] text-slate-500">
          People and categories
        </h3>
        <div className="grid gap-4 sm:grid-cols-3">
          {otherCards.map((card, index) => (
            <StatCard key={card.label} card={card} delay={index * 40} />
          ))}
        </div>
      </section>
    </div>
  );
}

// One number card (it is a link to the page that manages it)
function StatCard({ card, delay }) {
  const Icon = card.icon;
  const tone = tones[card.tone];

  return (
    <Link
      to={card.to}
      className="group fade-up flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md sm:p-5"
      style={{ animationDelay: `${delay}ms` }}
    >
      <span
        className={`grid size-11 shrink-0 place-items-center rounded-xl transition-transform duration-200 group-hover:scale-110 ${tone.box}`}
      >
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="text-2xl font-extrabold leading-none text-slate-950">
          {card.value}
        </p>
        <p className="mt-1.5 truncate text-sm text-slate-500">{card.label}</p>
      </div>
    </Link>
  );
}