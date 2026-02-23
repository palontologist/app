'use client';

import { PieChart, TrendingUp, Zap } from 'lucide-react';

interface ActivityBreakdown {
  product: number; // hours
  sales: number;
  ops: number;
  fundraising: number;
  support: number;
  other: number;
}

interface RevenueImpact {
  activity: 'sales' | 'product' | 'ops' | 'fundraising';
  hours: number;
  mrrGenerated: number;
  mrrMultiple?: number; // x factor for valuation
}

interface EquityValue {
  company: string;
  equityPercentage: number; // as decimal (0.05 = 5%)
  estimatedValuation: number; // dollars
  yourValue: number; // dollars (valuation * percentage)
}

interface FounderValueViewProps {
  activityBreakdown: ActivityBreakdown;
  revenueImpacts: RevenueImpact[];
  equityBets: EquityValue[];
  totalMRR?: number;
  totalARR?: number;
  workspaceType?: 'personal' | 'startup';
}

export function FounderValueView({
  activityBreakdown,
  revenueImpacts,
  equityBets,
  totalMRR = 0,
  totalARR = 0,
  workspaceType = 'personal',
}: FounderValueViewProps) {
  const totalHours = Object.values(activityBreakdown).reduce((sum, h) => sum + h, 0);
  const totalEquityValue = equityBets.reduce((sum, bet) => sum + bet.yourValue, 0);
  const totalValue = totalMRR * 12 + totalEquityValue;

  const getActivityColor = (activity: keyof ActivityBreakdown) => {
    const colors = {
      product: 'text-blue-600 bg-blue-100',
      sales: 'text-green-600 bg-green-100',
      ops: 'text-yellow-600 bg-yellow-100',
      fundraising: 'text-purple-600 bg-purple-100',
      support: 'text-pink-600 bg-pink-100',
      other: 'text-gray-600 bg-gray-100',
    };
    return colors[activity] || colors.other;
  };

  return (
    <div className="space-y-6">
      {/* Value Summary */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4">Your value creation story</h3>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <div>
            <p className="text-sm text-muted-foreground">MRR generated</p>
            <p className="mt-1 text-2xl font-bold text-green-600">${totalMRR.toLocaleString()}/mo</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">ARR created</p>
            <p className="mt-1 text-2xl font-bold">${totalARR.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Equity value</p>
            <p className="mt-1 text-2xl font-bold text-purple-600">${totalEquityValue.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total value</p>
            <p className="mt-1 text-2xl font-bold text-[#28A745]">${totalValue.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Time Activity Breakdown */}
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <PieChart className="h-5 w-5 text-[#28A745]" />
          <h3 className="text-lg font-semibold">Time breakdown</h3>
        </div>
        
        <div className="space-y-3">
          {Object.entries(activityBreakdown)
            .filter(([_, hours]) => hours > 0)
            .map(([activity, hours]) => {
              const percentage = ((hours / totalHours) * 100).toFixed(1);
              const colorClass = getActivityColor(activity as keyof ActivityBreakdown);
              
              return (
                <div key={activity} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${colorClass}`}>
                        {activity.charAt(0).toUpperCase() + activity.slice(1)}
                      </span>
                      <span className="text-sm font-medium">{hours.toFixed(1)}h ({percentage}%)</span>
                    </div>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        activity === 'product'
                          ? 'bg-blue-600'
                          : activity === 'sales'
                          ? 'bg-green-600'
                          : activity === 'ops'
                          ? 'bg-yellow-600'
                          : activity === 'fundraising'
                          ? 'bg-purple-600'
                          : activity === 'support'
                          ? 'bg-pink-600'
                          : 'bg-gray-600'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
        </div>

        <div className="mt-4 text-sm text-muted-foreground">
          Total: <span className="font-semibold text-foreground">{totalHours.toFixed(1)}h</span> this period
        </div>
      </div>

      {/* Revenue Impact by Activity */}
      {revenueImpacts.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold">How your time became revenue</h3>
          </div>

          <div className="space-y-3">
            {revenueImpacts.map((impact, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-border p-4 bg-secondary/20"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold capitalize">{impact.activity}</p>
                    <p className="text-xs text-muted-foreground">{impact.hours.toFixed(1)}h of focused work</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">+${impact.mrrGenerated.toLocaleString()}/mo</p>
                    {impact.mrrMultiple && (
                      <p className="text-xs text-muted-foreground">(~${(impact.mrrGenerated * 12 * impact.mrrMultiple).toLocaleString()} valuation)</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Equity Holdings */}
      {equityBets.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-semibold">Equity value you've created</h3>
          </div>

          <div className="space-y-3">
            {equityBets.map((bet, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-border p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold">{bet.company}</p>
                    <p className="text-xs text-muted-foreground">
                      {(bet.equityPercentage * 100).toFixed(2)}% of ${bet.estimatedValuation.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-purple-600">
                      ${bet.yourValue.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">Your value</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Investor story helper */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <h4 className="font-semibold text-blue-900 mb-2">Tell this to investors</h4>
        <p className="text-sm text-blue-800 mb-3">
          "I personally generate <strong>${totalMRR.toLocaleString()}/mo</strong> of recurring revenue through focused sales and product work. My time is creating <strong>${totalValue.toLocaleString()}</strong> in total value (revenue streams + equity). Here's how:"
        </p>
        <ul className="space-y-1 text-sm text-blue-800">
          {revenueImpacts.slice(0, 3).map((impact, idx) => (
            <li key={idx}>
              • {impact.hours.toFixed(1)}h on {impact.activity} → ${impact.mrrGenerated.toLocaleString()}/mo
            </li>
          ))}
          {equityBets.slice(0, 2).map((bet, idx) => (
            <li key={idx}>
              • {bet.company}: ${bet.yourValue.toLocaleString()} equity value
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
