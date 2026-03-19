"use client";

import * as React from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { getOpportunitiesWithUnlocks } from "@/app/actions/social";
import { ArrowLeft, ExternalLink, Loader2, Lock, Unlock } from "lucide-react";

export default function OpportunitiesScreen() {
  const [loading, setLoading] = React.useState(true);
  const [opps, setOpps] = React.useState<any[]>([]);

  const load = React.useCallback(async () => {
    setLoading(true);
    const res = await getOpportunitiesWithUnlocks();
    if (res.success) setOpps(res.opportunities);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <AppShell>
      <div className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur-md border-b border-black/[0.06] px-5 py-3 flex items-center justify-between lg:static lg:bg-transparent lg:border-0 lg:pt-6">
        <div className="flex items-center gap-2">
          <Link href="/social/feed" className="p-2 -ml-2 rounded-xl hover:bg-slate-100">
            <ArrowLeft className="h-4 w-4 text-slate-600" />
          </Link>
          <span className="text-[17px] font-semibold text-slate-800 tracking-tight">opportunities</span>
        </div>
        <button onClick={load} className="text-[12px] text-green-700 font-semibold hover:underline">
          Refresh
        </button>
      </div>

      <div className="px-5 pt-4 pb-8 max-w-lg mx-auto space-y-3">
        <div className="bg-white rounded-2xl border border-black/[0.07] p-3.5">
          <p className="text-[12px] font-bold text-slate-800">Unlock real-world opportunities</p>
          <p className="text-[11px] text-slate-500 mt-1">
            Each opportunity has a checklist. As you complete activities, you unlock access.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <Loader2 className="h-6 w-6 animate-spin text-green-600" />
          </div>
        ) : opps.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-6 text-center">
            <p className="text-[13px] font-semibold text-slate-800">No opportunities configured yet</p>
            <p className="text-[12px] text-slate-500 mt-1">
              Add rows to the `opportunities` + `opportunity_unlock_rules` tables to start.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {opps.map((o) => (
              <div key={o.id} className="bg-white rounded-2xl border border-black/[0.07] p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400">{o.type}</p>
                    <p className="text-[13px] font-semibold text-slate-800 mt-1">{o.title}</p>
                    {o.description && <p className="text-[12px] text-slate-500 mt-1 leading-relaxed">{o.description}</p>}
                  </div>
                  <div className={`shrink-0 flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${o.unlocked ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}>
                    {o.unlocked ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                    {o.unlocked ? "Unlocked" : "Locked"}
                  </div>
                </div>

                {Array.isArray(o.checklist) && o.checklist.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {o.checklist.map((c: any) => {
                      const done = c.progress >= c.threshold;
                      return (
                        <div key={c.ruleId} className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2">
                          <div>
                            <p className="text-[12px] text-slate-700">{c.label}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {c.progress} / {c.threshold}
                            </p>
                          </div>
                          <span className={`text-[11px] font-semibold ${done ? "text-green-700" : "text-slate-500"}`}>
                            {done ? "Done" : "In progress"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="mt-3 flex items-center justify-between">
                  {o.url ? (
                    <a
                      href={o.url}
                      target="_blank"
                      rel="noreferrer"
                      className={`text-[12px] font-semibold rounded-xl px-3 py-2 inline-flex items-center gap-2 transition-colors ${
                        o.unlocked ? "bg-green-600 text-white hover:bg-green-700" : "bg-slate-100 text-slate-400 cursor-not-allowed"
                      }`}
                      onClick={(e) => {
                        if (!o.unlocked) e.preventDefault();
                      }}
                    >
                      Open <ExternalLink className="h-4 w-4" />
                    </a>
                  ) : (
                    <span className="text-[12px] text-slate-400">No link provided</span>
                  )}
                  <Link href="/goals" className="text-[12px] text-green-700 font-semibold hover:underline">
                    Do actions → unlock
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

