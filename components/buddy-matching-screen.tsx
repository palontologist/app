"use client";

import * as React from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { followUser, getFollowingIds, getGoalBuddyMatches, unfollowUser } from "@/app/actions/social";
import { Loader2, UserPlus, UserMinus, ArrowLeft } from "lucide-react";

export default function BuddyMatchingScreen() {
  const [loading, setLoading] = React.useState(true);
  const [matches, setMatches] = React.useState<any[]>([]);
  const [followingIds, setFollowingIds] = React.useState<Set<string>>(new Set());
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    const [m, f] = await Promise.all([getGoalBuddyMatches(20), getFollowingIds()]);
    if (m.success) setMatches(m.matches);
    if (f.success) setFollowingIds(new Set(f.followingIds));
    setLoading(false);
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const toggleFollow = async (userId: string) => {
    setBusyId(userId);
    try {
      if (followingIds.has(userId)) {
        await unfollowUser(userId);
      } else {
        await followUser(userId);
      }
      await load();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AppShell>
      <div className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur-md border-b border-black/[0.06] px-5 py-3 flex items-center justify-between lg:static lg:bg-transparent lg:border-0 lg:pt-6">
        <div className="flex items-center gap-2">
          <Link href="/social/feed" className="p-2 -ml-2 rounded-xl hover:bg-slate-100">
            <ArrowLeft className="h-4 w-4 text-slate-600" />
          </Link>
          <span className="text-[17px] font-semibold text-slate-800 tracking-tight">goal buddies</span>
        </div>
        <button onClick={load} className="text-[12px] text-green-700 font-semibold hover:underline">
          Refresh
        </button>
      </div>

      <div className="px-5 pt-4 pb-8 max-w-lg mx-auto space-y-3">
        <div className="bg-white rounded-2xl border border-black/[0.07] p-3.5">
          <p className="text-[12px] font-bold text-slate-800">People with shared goal categories</p>
          <p className="text-[11px] text-slate-500 mt-1">
            Follow someone to start seeing their progress in your feed.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <Loader2 className="h-6 w-6 animate-spin text-green-600" />
          </div>
        ) : matches.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-6 text-center">
            <p className="text-[13px] font-semibold text-slate-800">No matches yet</p>
            <p className="text-[12px] text-slate-500 mt-1">
              Add categories to your goals (e.g. fitness, career, learning) and try again.
            </p>
            <Link href="/goals" className="inline-flex mt-3 text-[12px] font-semibold bg-green-600 text-white rounded-xl px-3.5 py-2 hover:bg-green-700">
              Go to goals
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {matches.map((u) => {
              const isFollowing = followingIds.has(u.userId);
              return (
                <div key={u.userId} className="bg-white rounded-2xl border border-black/[0.07] p-3.5 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[13px] font-semibold text-slate-800">
                      {u.handle ? `@${u.handle}` : u.name || "User"}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Shared categories: {u.sharedCategories}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleFollow(u.userId)}
                    disabled={busyId === u.userId}
                    className={`text-[12px] font-semibold rounded-xl px-3 py-2 transition-colors flex items-center gap-2 ${
                      isFollowing
                        ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        : "bg-green-600 text-white hover:bg-green-700"
                    } disabled:opacity-60`}
                  >
                    {busyId === u.userId ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isFollowing ? (
                      <UserMinus className="h-4 w-4" />
                    ) : (
                      <UserPlus className="h-4 w-4" />
                    )}
                    {isFollowing ? "Following" : "Follow"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}

