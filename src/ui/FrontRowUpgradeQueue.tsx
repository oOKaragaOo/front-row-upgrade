"use client";

import { useMemo, useState } from "react";
import { buildFrontRowUpgradeQueue } from "../buildFrontRowUpgradeQueue";
import { DEFAULT_NOW_ISO, SAMPLE_ENTRIES } from "../sampleEntries";
import type { ScoringMode } from "../core/config";
import type { TicketQueueEntry } from "../types";

const MODE_OPTIONS: { value: ScoringMode; label: string }[] = [
  { value: "normal", label: "Normal" },
  { value: "rushHour", label: "Rush Hour" },
  { value: "vipHour", label: "VIP Hour" },
  { value: "fairQueue", label: "Fair Queue Mode" },
];

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("en", {
    timeZone: "UTC",
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(date);
}

function formatScore(score: number): string {
  return score.toFixed(2);
}

export default function FrontRowUpgradeQueue() {
  const [entries, setEntries] = useState<TicketQueueEntry[]>(() =>
    SAMPLE_ENTRIES.map((entry) => ({ ...entry })),
  );
  const [now, setNow] = useState(() => new Date(DEFAULT_NOW_ISO));
  const [mode, setMode] = useState<ScoringMode>("normal");
  const [activeLoyaltyActions, setActiveLoyaltyActions] = useState<string | null>(null);
  const [editingLoyaltyEntryId, setEditingLoyaltyEntryId] = useState<string | null>(null);
  const [draftLoyaltyPoints, setDraftLoyaltyPoints] = useState("");

  const result = useMemo(
    () => buildFrontRowUpgradeQueue(entries, now, mode),
    [entries, now, mode],
  );

  function moveTimeForward(minutes: number) {
    setNow((currentTime) => new Date(currentTime.getTime() + minutes * 60_000));
  }

  function changeLoyaltyPoints(entryId: string, value: string): boolean {
    const loyaltyPoints = value.trim() === "" ? null : Number(value);

    if (loyaltyPoints !== null && !Number.isFinite(loyaltyPoints)) {
      return false;
    }

    setEntries((currentEntries) =>
      currentEntries.map((entry) =>
        entry.id === entryId ? { ...entry, loyaltyPoints } : entry,
      ),
    );

    return true;
  }

  function beginLoyaltyEdit(entry: TicketQueueEntry, reset: boolean) {
    const originalEntry = SAMPLE_ENTRIES.find(
      (sampleEntry) => sampleEntry.id === entry.id,
    );
    const points = reset
      ? originalEntry?.loyaltyPoints
      : entry.loyaltyPoints;

    setDraftLoyaltyPoints(points == null ? "" : String(points));
    setEditingLoyaltyEntryId(entry.id);
    setActiveLoyaltyActions(null);
  }

  function confirmLoyaltyEdit() {
    if (editingLoyaltyEntryId === null) {
      return;
    }

    if (changeLoyaltyPoints(editingLoyaltyEntryId, draftLoyaltyPoints)) {
      setEditingLoyaltyEntryId(null);
      setDraftLoyaltyPoints("");
    }
  }

  function cancelLoyaltyEdit() {
    setEditingLoyaltyEntryId(null);
    setDraftLoyaltyPoints("");
  }

  function upgradeWinnerTicket() {
    if (result.winner === null) {
      return;
    }

    const winnerId = result.winner.entry.id;
    setEntries((currentEntries) =>
      currentEntries.map((entry) =>
        entry.id === winnerId ? { ...entry, status: "upgraded" } : entry,
      ),
    );
  }

  const eligibleCount = result.fanGroups.reduce(
    (total, group) => total + group.entries.length,
    0,
  );

  return (
    <main className="min-h-screen bg-[#f4f6f9] px-4 py-6 text-slate-900 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#b9f3df] text-sm font-black tracking-tight text-[#145744]">
              FR
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                Front Row Operations
              </p>
              <p className="text-sm font-semibold text-slate-800">
                Upgrade selection desk
              </p>
            </div>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Sample queue
          </div>
        </header>

        <section className="mb-7 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="mb-2 text-sm font-bold text-[#168363]">
              FAIRNESS, MADE VISIBLE
            </p>
            <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Front Row Upgrade Queue
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Review the next upgrade, see how fan accounts connect, and adjust
              the simulation as time moves forward.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:min-w-[380px]">
            <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm">
              <p className="text-xs font-medium text-slate-500">Eligible</p>
              <p className="mt-1 text-xl font-bold">{eligibleCount}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm">
              <p className="text-xs font-medium text-slate-500">Fan groups</p>
              <p className="mt-1 text-xl font-bold">{result.fanGroups.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm">
              <p className="text-xs font-medium text-slate-500">Excluded</p>
              <p className="mt-1 text-xl font-bold">{result.excludedEntries.length}</p>
            </div>
          </div>
        </section>

        <section className="mb-6 grid gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_auto] md:items-center md:p-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">
              Simulation time
            </p>
            <p className="mt-1 text-lg font-bold text-slate-900">{formatTime(now)}</p>
            <p className="mt-1 text-xs text-slate-500">
              Move time forward to refresh eligibility and scores.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex flex-wrap gap-2" aria-label="Advance simulation time">
              <button
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-[#168363] hover:text-[#12694f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#168363]"
                onClick={() => moveTimeForward(5)}
                type="button"
              >
                +5 min
              </button>
              <button
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-[#168363] hover:text-[#12694f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#168363]"
                onClick={() => moveTimeForward(15)}
                type="button"
              >
                +15 min
              </button>
              <button
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-[#168363] hover:text-[#12694f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#168363]"
                onClick={() => moveTimeForward(60)}
                type="button"
              >
                +1 hour
              </button>
            </div>
            <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500">
              Scoring mode
              <select
                className="min-w-44 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 focus:border-[#168363] focus:outline-none focus:ring-2 focus:ring-[#b9f3df]"
                onChange={(event) => setMode(event.target.value as ScoringMode)}
                value={mode}
              >
                {MODE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="mb-6 grid gap-5 lg:grid-cols-[1.4fr_0.8fr]">
          <div className="overflow-hidden rounded-3xl bg-[#142a35] p-6 text-white shadow-lg shadow-slate-300/50 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#a5e8d0]">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-base">
                  ★
                </span>
                Current winner
              </div>
              {result.winner && (
                <span className="rounded-full bg-[#b9f3df] px-3 py-1 text-xs font-bold text-[#145744]">
                  Selected from {result.fanGroups.length} groups
                </span>
              )}
            </div>

            {result.winner ? (
              <div className="mt-6 grid gap-7 md:grid-cols-[1fr_auto]">
                <div>
                  <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
                    {result.winner.entry.fanName}
                  </h2>
                  <p className="mt-2 text-sm text-slate-300">
                    Entry {result.winner.entry.id}
                    {result.winner.entry.membership === "vip" && (
                      <span className="ml-2 rounded-full bg-amber-300/15 px-2 py-0.5 text-xs font-bold text-amber-200">
                        VIP
                      </span>
                    )}
                  </p>
                  <button
                    className="mt-4 rounded-xl bg-[#b9f3df] px-4 py-2.5 text-sm font-bold text-[#145744] transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                    onClick={upgradeWinnerTicket}
                    type="button"
                  >
                    Upgrade ticket
                  </button>
                  <p className="mt-2 text-xs text-slate-300">
                    Mark this entry upgraded and refresh the queue.
                  </p>
                  <div className="mt-7">
                    <p className="mb-2 text-xs font-bold uppercase tracking-[0.15em] text-slate-300">
                      Why this fan is next
                    </p>
                    <ul className="grid gap-2 sm:grid-cols-2">
                      {result.winner.reasons.map((reason) => (
                        <li
                          className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-xs leading-5 text-slate-100"
                          key={reason}
                        >
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="flex min-w-36 flex-col justify-center rounded-2xl border border-white/10 bg-white/[0.06] p-5 md:text-right">
                  <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-300">
                    Priority score
                  </p>
                  <p className="mt-1 text-5xl font-black tracking-tight text-[#b9f3df]">
                    {formatScore(result.winner.score)}
                  </p>
                  <p className="mt-1 text-xs text-slate-300">out of 100</p>
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.06] p-6">
                <h2 className="text-xl font-bold">No eligible fans right now</h2>
                <p className="mt-2 text-sm text-slate-300">
                  Move time forward or review the excluded entries below.
                </p>
              </div>
            )}
          </div>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#168363]">
                  Shortlist
                </p>
                <h2 className="mt-1 text-xl font-black">Top candidates</h2>
              </div>
              <span className="text-xs font-medium text-slate-500">By fan group</span>
            </div>
            {result.topCandidates.length > 0 ? (
              <ol className="space-y-3">
                {result.topCandidates.map((candidate, index) => (
                  <li
                    className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3"
                    key={candidate.entry.id}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-sm font-black text-slate-500 shadow-sm">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-900">
                        {candidate.entry.fanName}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {candidate.entry.id}
                      </p>
                      <details className="mt-2 text-xs text-slate-600">
                        <summary className="w-fit cursor-pointer font-semibold text-[#12694f] hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#168363]">
                          Explore score details
                        </summary>
                        <ul className="mt-2 space-y-1.5 border-l-2 border-[#b9f3df] pl-3">
                          {candidate.reasons.map((reason) => (
                            <li key={reason}>{reason}</li>
                          ))}
                        </ul>
                      </details>
                    </div>
                    <p className="text-sm font-black tabular-nums text-[#12694f]">
                      {formatScore(candidate.score)}
                    </p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                No candidates to rank.
              </p>
            )}
          </section>
        </section>

        <section className="mb-6 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#168363]">
                  Account links
                </p>
                <h2 className="mt-1 text-xl font-black">Fan groups</h2>
              </div>
              <span className="text-xs font-medium text-slate-500">
                {eligibleCount} eligible entries
              </span>
            </div>
            <div className="space-y-3">
              {result.fanGroups.map((group, index) => (
                <article
                  className="rounded-2xl border border-slate-100 p-4"
                  key={group.id}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-bold text-slate-900">
                      Fan group {index + 1}
                      <span className="ml-2 text-xs font-medium text-slate-500">
                        {group.entries.length} {group.entries.length === 1 ? "account" : "accounts"}
                      </span>
                    </p>
                    {group.representative && (
                      <p className="text-xs font-semibold text-[#12694f]">
                        Representative: {group.representative.entry.fanName} · {formatScore(group.representative.score)}
                      </p>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {group.connectionReasons.length > 0 ? (
                      group.connectionReasons.map((reason) => (
                        <span
                          className="rounded-full bg-[#e7f8f1] px-2.5 py-1 text-xs font-semibold text-[#12694f]"
                          key={reason}
                        >
                          {reason}
                        </span>
                      ))
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                        No shared identifiers
                      </span>
                    )}
                  </div>
                  <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                    {group.entries.map((entry) => (
                      <li key={entry.id}>
                        {entry.fanName} <span className="text-slate-400">({entry.id})</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-rose-600">
                  Not in this draw
                </p>
                <h2 className="mt-1 text-xl font-black">Excluded entries</h2>
              </div>
              <span className="text-xs font-medium text-slate-500">
                {result.excludedEntries.length} entries
              </span>
            </div>
            {result.excludedEntries.length > 0 ? (
              <ul className="space-y-2">
                {result.excludedEntries.map(({ entry, reason }) => (
                  <li
                    className="flex items-start justify-between gap-3 rounded-xl bg-rose-50/70 px-3 py-2.5"
                    key={entry.id}
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{entry.fanName}</p>
                      <p className="text-xs text-slate-500">{entry.id}</p>
                    </div>
                    <span className="text-right text-xs font-semibold text-rose-700">
                      {reason}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                No entries are excluded.
              </p>
            )}
          </section>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#168363]">
                Live adjustment
              </p>
              <h2 className="mt-1 text-xl font-black">Loyalty points</h2>
              <p className="mt-1 text-sm text-slate-500" id="loyalty-points-help">
                Select a value, choose Edit or Reset, then confirm to update the queue.
              </p>
            </div>
            <span className="text-xs font-medium text-slate-500">
              {entries.length} sample entries
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
                  <th className="pb-3 pr-4 font-bold">Fan</th>
                  <th className="pb-3 pr-4 font-bold">Entry</th>
                  <th className="pb-3 pr-2 text-right font-bold">Loyalty points</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr className="border-b border-slate-50 last:border-0" key={entry.id}>
                    <td className="py-2.5 pr-4 text-sm font-semibold text-slate-800">
                      {entry.fanName}
                    </td>
                    <td className="py-2.5 pr-4 text-xs text-slate-500">{entry.id}</td>
                    <td className="py-2.5 text-right">
                      <label className="sr-only" htmlFor={`loyalty-${entry.id}`}>
                        Loyalty points for {entry.fanName}
                      </label>
                      <div className="flex flex-col items-end gap-1.5">
                        <input
                          aria-describedby="loyalty-points-help"
                          className={`w-28 rounded-lg border px-2.5 py-1.5 text-right text-sm font-semibold tabular-nums focus:border-[#168363] focus:outline-none focus:ring-2 focus:ring-[#b9f3df] ${
                            editingLoyaltyEntryId === entry.id
                              ? "border-[#168363] bg-white text-slate-800"
                              : "cursor-pointer border-slate-200 bg-slate-100 text-slate-500"
                          }`}
                          id={`loyalty-${entry.id}`}
                          min="0"
                          onChange={(event) =>
                            setDraftLoyaltyPoints(event.target.value)
                          }
                          onClick={() => {
                            if (editingLoyaltyEntryId === null) {
                              setActiveLoyaltyActions(entry.id);
                            }
                          }}
                          onFocus={() => {
                            if (editingLoyaltyEntryId === null) {
                              setActiveLoyaltyActions(entry.id);
                            }
                          }}
                          readOnly={editingLoyaltyEntryId !== entry.id}
                          step="1"
                          type="number"
                          value={
                            editingLoyaltyEntryId === entry.id
                              ? draftLoyaltyPoints
                              : entry.loyaltyPoints ?? ""
                          }
                        />
                        {editingLoyaltyEntryId === entry.id ? (
                          <div className="flex gap-1.5">
                            <button
                              className="rounded-lg bg-[#168363] px-2.5 py-1 text-xs font-bold text-white hover:bg-[#12694f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#168363]"
                              onClick={confirmLoyaltyEdit}
                              type="button"
                            >
                              Confirm
                            </button>
                            <button
                              className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#168363]"
                              onClick={cancelLoyaltyEdit}
                              type="button"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : activeLoyaltyActions === entry.id ? (
                          <div
                            className="flex gap-1.5"
                            id={`loyalty-actions-${entry.id}`}
                          >
                            <button
                              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:border-[#168363] hover:text-[#12694f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#168363]"
                              onClick={() => beginLoyaltyEdit(entry, false)}
                              type="button"
                            >
                              Edit
                            </button>
                            <button
                              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:border-[#168363] hover:text-[#12694f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#168363]"
                              onClick={() => beginLoyaltyEdit(entry, true)}
                              type="button"
                            >
                              Reset
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <footer className="mt-6 flex flex-col justify-between gap-2 border-t border-slate-200 pt-4 text-xs text-slate-500 sm:flex-row">
          <p>Fixed sample data · deterministic scoring · no random selection</p>
          <p>Simulation starts at {formatTime(new Date(DEFAULT_NOW_ISO))}</p>
        </footer>
      </div>
    </main>
  );
}
