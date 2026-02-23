'use client';

import { AlertCircle, TrendingUp, TrendingDown, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ClientData {
  id: number;
  name: string;
  hoursTracked: number;
  revenue: number; // dollars
  effectiveHourlyRate: number; // dollars/hour
  targetRate: number; // dollars/hour
  pricingStatus: 'underpriced' | 'on-target' | 'overpriced';
  retainerAmount?: number; // dollars
  suggestedRetainer?: number; // dollars
}

interface ClientPricingTableProps {
  clients: ClientData[];
  onAdjustRate?: (clientId: number, newRate: number) => void;
  onUpdateRetainer?: (clientId: number, newAmount: number) => void;
}

export function ClientPricingTable({ clients, onAdjustRate, onUpdateRetainer }: ClientPricingTableProps) {
  const getPricingStatusBadge = (status: string) => {
    switch (status) {
      case 'underpriced':
        return {
          label: 'Underpriced',
          color: 'bg-red-100 text-red-800',
          icon: <TrendingDown className="h-4 w-4" />,
        };
      case 'on-target':
        return {
          label: 'On target',
          color: 'bg-green-100 text-green-800',
          icon: <CheckCircle className="h-4 w-4" />,
        };
      case 'overpriced':
        return {
          label: 'Overpriced',
          color: 'bg-yellow-100 text-yellow-800',
          icon: <TrendingUp className="h-4 w-4" />,
        };
      default:
        return { label: 'Unknown', color: 'bg-gray-100 text-gray-800', icon: null };
    }
  };

  const totalHours = clients.reduce((sum, c) => sum + c.hoursTracked, 0);
  const totalRevenue = clients.reduce((sum, c) => sum + c.revenue, 0);
  const avgHourlyRate = totalHours > 0 ? totalRevenue / totalHours : 0;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total hours across all clients</p>
          <p className="mt-2 text-2xl font-bold">{totalHours.toFixed(1)}h</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total revenue</p>
          <p className="mt-2 text-2xl font-bold">${totalRevenue.toLocaleString()}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Avg hourly rate</p>
          <p className="mt-2 text-2xl font-bold">${avgHourlyRate.toFixed(0)}/hr</p>
        </div>
      </div>

      {/* Clients Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border bg-secondary/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Client</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Hours</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Revenue</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Effective rate</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Target rate</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {clients.map(client => {
                const status = getPricingStatusBadge(client.pricingStatus);
                const rateDifference = client.targetRate - client.effectiveHourlyRate;

                return (
                  <tr key={client.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-sm">{client.name}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{client.hoursTracked.toFixed(1)}h</td>
                    <td className="px-4 py-3 text-sm font-medium">${client.revenue.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm">${client.effectiveHourlyRate.toFixed(0)}/hr</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">${client.targetRate.toFixed(0)}/hr</td>
                    <td className="px-4 py-3">
                      <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                        {status.icon}
                        {status.label}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {client.pricingStatus === 'underpriced' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onAdjustRate?.(client.id, client.targetRate)}
                          className="text-xs"
                        >
                          Raise to ${client.targetRate.toFixed(0)}/hr
                        </Button>
                      )}
                      {client.suggestedRetainer && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onUpdateRetainer?.(client.id, client.suggestedRetainer || 0)}
                          className="text-xs"
                        >
                          Update retainer
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alerts for underpriced clients */}
      {clients.some(c => c.pricingStatus === 'underpriced') && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
            <div>
              <h4 className="font-semibold text-red-900 mb-1">Underpriced clients detected</h4>
              <p className="text-sm text-red-800 mb-3">
                {clients.filter(c => c.pricingStatus === 'underpriced').length} client(s) are earning you less than your target hourly rate. 
                Consider raising your rate or negotiating a new retainer.
              </p>
              <ul className="space-y-1 text-sm text-red-800">
                {clients
                  .filter(c => c.pricingStatus === 'underpriced')
                  .map(c => (
                    <li key={c.id}>
                      • {c.name}: ${c.effectiveHourlyRate.toFixed(0)}/hr (target: ${c.targetRate.toFixed(0)}/hr)
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Suggested retainers */}
      {clients.some(c => c.suggestedRetainer) && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <h4 className="font-semibold text-blue-900 mb-3">Suggested retainer increases</h4>
          <div className="space-y-2">
            {clients
              .filter(c => c.suggestedRetainer)
              .map(c => (
                <div key={c.id} className="flex items-center justify-between">
                  <span className="text-sm text-blue-900">
                    {c.name}: <span className="font-medium">${c.retainerAmount?.toLocaleString() || 'No retainer'}</span> → <span className="font-semibold text-green-600">${c.suggestedRetainer?.toLocaleString()}</span>
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onUpdateRetainer?.(c.id, c.suggestedRetainer || 0)}
                    className="text-xs"
                  >
                    Apply
                  </Button>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
