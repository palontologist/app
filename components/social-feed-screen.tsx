"use client";

import * as React from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import {
  getFollowingFeed,
  getActiveProfiles,
  getInstantValueSuggestions,
  followUser,
  unfollowUser,
} from "@/app/actions/social";
import { Loader2, Users, UserPlus, UserMinus, Sparkles, Globe, Lock } from "lucide-react";

type LoadState<T> =
  | { kind: "loading" }
  | { kind: "ready"; data: T }
  | { kind: "error"; message: string };

export default function SocialFeedScreen() {
  const [followingFeed, setFollowingFeed] = React.useState<LoadState<any[]>>({ kind: "loading" });
  const [suggestions, setSuggestions] = React.useState<LoadState<any[]>>({ kind: "loading" });
  const [activeProfiles, setActiveProfiles] = React.useState<LoadState<any[]>>({ kind: "loading" });
  const [followBusy, setFollowBusy] = React.useState<string | null>(null);
  const [showChallenge, setShowChallenge] = React.useState(false);
  const [challengeVisibility, setChallengeVisibility] = React.useState<"public" | "invite">("invite");

  const load = React.useCallback(async () => {
    setFollowingFeed({ kind: "loading" });
    setSuggestions({ kind: "loading" });
    setActiveProfiles({ kind: "loading" });

    try {
      const [f, s, a] = await Promise.all([
        getFollowingFeed(30),
        getInstantValueSuggestions(),
        getActiveProfiles(12),
      ]);

      setFollowingFeed(f.success ? { kind: "ready", data: f.items } : { kind: "error", message: f.error });
      setSuggestions(s.success ? { kind: "ready", data: s.suggestions } : { kind: "error", message: s.error });
      setActiveProfiles(a.success ? { kind: "ready", data: a.profiles } : { kind: "error", message: a.error });
    } catch (e: any) {
      setFollowingFeed({ kind: "error", message: "Failed to load feed" });
      setSuggestions({ kind: "error", message: "Failed to load suggestions" });
      setActiveProfiles({ kind: "error", message: "Failed to load active people" });
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const toggleFollow = async (userId: string, isFollowing: boolean) => {
    setFollowBusy(userId);
    try {
      if (isFollowing) await unfollowUser(userId);
      else await followUser(userId);
      await load();
    } finally {
      setFollowBusy(null);
    }
  };

  return (
    <AppShell>
      <div className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur-md border-b border-black/[0.06] px-5 py-3 flex items-center justify-between lg:static lg:bg-transparent lg:border-0 lg:pt-6">
        <span className="text-[17px] font-semibold text-slate-800 tracking-tight">social</span>
        <div className="flex items-center gap-2">
          <Link
            href="/social/buddies"
            className="text-[12px] font-semibold rounded-full px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:border-green-300"
          >
            Find buddies
          </Link>
          <Link
            href="/social/opportunities"
            className="text-[12px] font-semibold rounded-full px-3 py-1.5 bg-green-600 text-white hover:bg-green-700"
          >
            Opportunities
          </Link>
        </div>
      </div>

      <div className="px-5 pt-4 pb-8 max-w-lg mx-auto space-y-3">
        {/* Personalized Greta suggestion (compact) */}
        <div className="bg-white rounded-2xl border border-black/[0.07] px-3.5 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="flex items-center gap-1 text-[10px] text-slate-400 bg-slate-50 border border-slate-100 rounded-full px-2 py-0.5 shrink-0">
                <Sparkles className="h-2.5 w-2.5 text-purple-400" /> Greta
              </span>
              {suggestions.kind === "ready" && suggestions.data[0] ? (
                <p className="text-[12px] font-semibold text-slate-800 truncate">{suggestions.data[0].title}</p>
              ) : (
                <p className="text-[12px] font-semibold text-slate-800 truncate">Log one activity toward your top goal</p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={load} className="text-[11px] text-green-700 font-medium hover:underline">
                Refresh
              </button>
              {suggestions.kind === "ready" && suggestions.data[0]?.key === "shared_goal_challenge" && (
                <button
                  onClick={() => setShowChallenge(true)}
                  className="text-[11px] font-semibold bg-green-600 text-white rounded-lg px-2.5 py-1.5 hover:bg-green-700"
                >
                  Start challenge
                </button>
              )}
              {suggestions.kind === "ready" && suggestions.data[0]?.href && suggestions.data[0]?.key !== "shared_goal_challenge" && (
                <Link
                  href={suggestions.data[0].href}
                  className="text-[11px] font-semibold bg-green-600 text-white rounded-lg px-2.5 py-1.5 hover:bg-green-700"
                >
                  {suggestions.data[0].ctaLabel}
                </Link>
              )}
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
            {suggestions.kind === "ready" && suggestions.data[0]?.reason
              ? suggestions.data[0].reason
              : "Small wins compound. Logging keeps you honest and boosts momentum."}
          </p>
        </div>

        {/* Active people */}
        <div className="bg-white rounded-2xl border border-black/[0.07] p-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-slate-600" />
              <p className="text-[12px] font-bold text-slate-800">Active people</p>
            </div>
            <button onClick={load} className="text-[11px] text-green-700 font-medium hover:underline">
              Refresh
            </button>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            People who completed something recently (discoverable profiles only).
          </p>

          {activeProfiles.kind === "loading" ? (
            <div className="py-5 flex justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-green-600" />
            </div>
          ) : activeProfiles.kind === "error" ? (
            <p className="text-[12px] text-slate-500 mt-2">{activeProfiles.message}</p>
          ) : activeProfiles.data.length === 0 ? (
            <p className="text-[12px] text-slate-500 mt-2">No active profiles right now.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {activeProfiles.data.map((p: any) => {
                const who = p.handle ? `@${p.handle}` : p.name || "User";
                const when = p.lastCompletedAt ? new Date(p.lastCompletedAt).toLocaleString() : "Recently";
                const busy = followBusy === p.userId;
                return (
                  <div key={p.userId} className="rounded-xl border border-slate-100 p-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[12.5px] font-semibold text-slate-800">{who}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Active: {when}{p.sharedCategories ? ` · Shared goals: ${p.sharedCategories}` : ""}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleFollow(p.userId, Boolean(p.isFollowing))}
                      disabled={busy}
                      className={`text-[12px] font-semibold rounded-xl px-3 py-2 transition-colors flex items-center gap-2 ${
                        p.isFollowing
                          ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          : "bg-green-600 text-white hover:bg-green-700"
                      } disabled:opacity-60`}
                    >
                      {busy ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : p.isFollowing ? (
                        <UserMinus className="h-4 w-4" />
                      ) : (
                        <UserPlus className="h-4 w-4" />
                      )}
                      {p.isFollowing ? "Following" : "Follow"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Following feed */}
        <div className="bg-white rounded-2xl border border-black/[0.07] p-3.5">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-slate-600" />
            <p className="text-[12px] font-bold text-slate-800">Following</p>
          </div>

          {followingFeed.kind === "loading" ? (
            <div className="py-5 flex justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-green-600" />
            </div>
          ) : followingFeed.kind === "error" ? (
            <p className="text-[12px] text-slate-500 mt-2">{followingFeed.message}</p>
          ) : followingFeed.data.length === 0 ? (
            <p className="text-[12px] text-slate-500 mt-2">
              No activity yet. Follow someone (or add a goal-buddy) to start seeing progress here.
            </p>
          ) : (
            <div className="mt-3 space-y-2">
              {followingFeed.data.map((it: any) => {
                const who = it.handle ? `@${it.handle}` : it.name || "Someone";
                const when = new Date(it.completedAt).toLocaleString();
                const label = it.kind === "task" ? "completed task" : "completed";
                return (
                  <div key={it.id} className="rounded-xl border border-slate-100 p-3">
                    <p className="text-[12.5px] text-slate-800">
                      <span className="font-semibold">{who}</span> {label}{" "}
                      <span className="font-semibold">{it.title}</span>
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{when}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Shared challenge modal (UI-only for now) */}
      {showChallenge && (
        <div className="fixed inset-0 z-50 flex items-end justify-center lg:items-center" onClick={() => setShowChallenge(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative bg-white rounded-t-3xl lg:rounded-2xl w-full max-w-md p-5 pb-7 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-[15px] font-bold text-slate-800 mb-2">Start a shared challenge</h3>
            <p className="text-[12px] text-slate-500 mb-4">
              Choose if anyone can join, or if it requires an invite.
            </p>

            <div className="space-y-2">
              <button
                onClick={() => setChallengeVisibility("public")}
                className={`w-full rounded-xl border px-3.5 py-3 flex items-center justify-between ${
                  challengeVisibility === "public" ? "border-green-300 bg-green-50" : "border-slate-200 bg-white"
                }`}
              >
                <span className="flex items-center gap-2 text-[12.5px] font-semibold text-slate-800">
                  <Globe className="h-4 w-4 text-green-700" /> Public
                </span>
                <span className="text-[11px] text-slate-500">Anyone can join</span>
              </button>
              <button
                onClick={() => setChallengeVisibility("invite")}
                className={`w-full rounded-xl border px-3.5 py-3 flex items-center justify-between ${
                  challengeVisibility === "invite" ? "border-green-300 bg-green-50" : "border-slate-200 bg-white"
                }`}
              >
                <span className="flex items-center gap-2 text-[12.5px] font-semibold text-slate-800">
                  <Lock className="h-4 w-4 text-slate-700" /> Invite-only
                </span>
                <span className="text-[11px] text-slate-500">Requires invite</span>
              </button>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowChallenge(false)}
                className="flex-1 bg-slate-100 text-slate-700 rounded-xl py-2.5 text-[13px] font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Backend challenge objects are not implemented yet; keep UI decision for now.
                  console.log("Start shared challenge visibility:", challengeVisibility);
                  setShowChallenge(false);
                }}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-xl py-2.5 text-[13px] font-semibold"
              >
                Start
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

