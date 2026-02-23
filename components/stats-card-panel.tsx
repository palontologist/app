'use client';

import { TrendingUp, TrendingDown, Clock, DollarSign, Zap } from 'lucide-react';

interface StatCard {
  label: string;
  value: string | number;
  change?: {
    value: number;
    direction: 'up' | 'down';
    percentage: number;
  };
  icon: React.ReactNode;
}

interface StatsCardPanelProps {
  thisWeek: {
    totalTimeTracked: number; // hours
    revenueLiked: number; // dollars
    equityValue: number; // dollars
  };
  lastWeek?: {
    totalTimeTracked: number;
    revenueLiked: number;
    equityValue: number;
  };
  effectiveHourlyRate: {
    thisWeek: number; // dollars/hour
    lastWeek?: number;
  };
}

export function StatsCardPanel({ thisWeek, lastWeek, effectiveHourlyRate }: StatsCardPanelProps) {
  const calculateChange = (current: number, previous?: number) => {
    if (!previous || previous === 0) return undefined;
    const percentChange = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(current - previous),
      direction: current > previous ? 'up' : 'down' as const,
      percentage: Math.round(percentChange),
    };
  };

  const rateChange = calculateChange(effectiveHourlyRate.thisWeek, effectiveHourlyRate.lastWeek);

  const cards: StatCard[] = [
    {
      label: 'Total time tracked',
      value: `${thisWeek.totalTimeTracked}h`,
      change: lastWeek ? calculateChange(thisWeek.totalTimeTracked, lastWeek.totalTimeTracked) : undefined,
      icon: <Clock className="h-5 w-5 text-[#28A745]" />,
    },
    {
      label: 'Revenue linked',
      value: `$${thisWeek.revenueLiked.toLocaleString()}`,
      change: lastWeek ? calculateChange(thisWeek.revenueLiked, lastWeek.revenueLiked) : undefined,
      icon: <DollarSign className="h-5 w-5 text-[#28A745]" />,
    },
    {
      label: 'Equity value',
      value: `$${thisWeek.equityValue.toLocaleString()}`,
      icon: <Zap className="h-5 w-5 text-[#28A745]" />,
    },
  ];

  return (
    <div className="space-y-4">
      {/* This Week Header */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground">This week</h3>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((card, idx) => (
          <div key={idx} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <p className="text-2xl font-bold">{card.value}</p>
                  {card.change && (
                    <div className={`flex items-center gap-1 text-sm font-medium ${
                      card.change.direction === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {card.change.direction === 'up' ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      <span>{card.change.percentage > 0 ? '+' : ''}{card.change.percentage}%</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-muted-foreground">{card.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Effective Hourly Rate Card */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-4 text-sm font-semibold text-muted-foreground">Effective hourly rate</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">This week</p>
            <p className="mt-1 text-2xl font-bold">${effectiveHourlyRate.thisWeek}/hr</p>
          </div>
          {effectiveHourlyRate.lastWeek && rateChange && (
            <div>
              <p className="text-xs text-muted-foreground">Last week</p>
              <div className="mt-1 flex items-baseline gap-2">
                <p className="text-2xl font-bold">${effectiveHourlyRate.lastWeek}/hr</p>
                <div className={`flex items-center gap-1 text-sm font-medium ${
                  rateChange.direction === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {rateChange.direction === 'up' ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  <span>{rateChange.direction === 'up' ? '+' : ''}{rateChange.percentage}%</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
