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
  HiMail,
  HiLocationMarker,
  HiStar,
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
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
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
    { label: "New messages", value: stats.unreadMessages || 0, icon: HiMail, tone: "amber", to: "/admin/messages" },
  ];

  // Report data (the backend sends the top 5, biggest first)
  const topCategories = stats.topCategories || [];
  const topDistricts = stats.topDistricts || [];

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
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-5">
          {itemCards.map((card, index) => (
            <StatCard
              key={card.label}
              card={card}
              delay={index * 40}
              className={index === itemCards.length - 1 ? "col-span-2 sm:col-span-1" : ""}
            />
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

      {/* Reports: what is found the most, and where */}
      <section>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-[.14em] text-slate-500">
          Reports
        </h3>
        <div className="grid gap-4 lg:grid-cols-2">
          <RankCard
            title="Most found category"
            icon={HiStar}
            tone="indigo"
            rows={topCategories}
            total={stats.approvedItems || 0}
            empty="No approved items yet."
            delay={0}
          />
          <RankCard
            title="District with most found items"
            icon={HiLocationMarker}
            tone="emerald"
            rows={topDistricts}
            total={stats.approvedItems || 0}
            empty="No approved items yet."
            delay={60}
          />
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Counts only approved items (public, returned and expired). Waiting and
          cancelled posts are not counted.
        </p>
      </section>

      {/* People and categories */}
      <section>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-[.14em] text-slate-500">
          People and categories
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {otherCards.map((card, index) => (
            <StatCard key={card.label} card={card} delay={index * 40} />
          ))}
        </div>
      </section>
    </div>
  );
}

// One number card (it is a link to the page that manages it).
// Small screens: icon on top, number below (so 2 fit in a row).
function StatCard({ card, delay, className = "" }) {
  const Icon = card.icon;
  const tone = tones[card.tone];

  return (
    <Link
      to={card.to}
      className={`group fade-up flex flex-col items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md sm:flex-row sm:items-center sm:gap-4 sm:p-5 ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <span
        className={`grid size-10 shrink-0 place-items-center rounded-xl transition-transform duration-200 group-hover:scale-110 sm:size-11 ${tone.box}`}
      >
        <Icon className="size-5" />
      </span>
      <div className="min-w-0 max-w-full">
        <p className="text-2xl font-extrabold leading-none text-slate-950">
          {card.value}
        </p>
        <p className="mt-1.5 truncate text-sm text-slate-500">{card.label}</p>
      </div>
    </Link>
  );
}


// A report card: the winner in big letters + the top 5 with bars
function RankCard({ title, icon: Icon, tone, rows, total, empty, delay }) {
  const colors = tones[tone];
  const winner = rows[0];
  const biggest = winner ? winner.count : 1;

  return (
    <div
      className="fade-up rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-3">
        <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${colors.box}`}>
          <Icon className="size-5" />
        </span>
        <p className="text-sm font-bold text-slate-500">{title}</p>
      </div>

      {!winner && <p className="mt-4 text-sm text-slate-500">{empty}</p>}

      {winner && (
        <>
          <p className="display-font mt-3 truncate text-2xl text-slate-950 sm:text-3xl">
            {winner.name}
          </p>
          <p className="text-sm text-slate-500">
            {winner.count} {winner.count === 1 ? "item" : "items"}
            {total > 0 && ` (${Math.round((winner.count / total) * 100)}% of all)`}
          </p>

          <ul className="mt-4 space-y-3">
            {rows.map((row, index) => (
              <li key={row.name}>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate font-semibold text-slate-700">
                    {index + 1}. {row.name}
                  </span>
                  <span className="shrink-0 font-bold text-slate-900">{row.count}</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${colors.bar} transition-all duration-700`}
                    style={{ width: `${(row.count / biggest) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}