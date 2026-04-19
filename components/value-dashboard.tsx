'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { AlertTriangle, TrendingDown, DollarSign, Clock, Zap, Plus, ChevronRight } from 'lucide-react';
import { StatsCardPanel } from './stats-card-panel';
import { ClientPricingTable } from './client-pricing-table';
import { InvoiceSuggestions } from './invoice-suggestions';
import { FounderValueView } from './founder-value-view';

interface ValueDashboardProps {
  userProfile?: {
    workspaceType: 'personal' | 'startup';
  };
}

interface QuickClient {
  id: number;
  name: string;
  hourlyRate: number;
  hoursTracked: number;
  revenue: number;
  effectiveHourlyRate: number;
  targetRate: number;
  pricingStatus: 'underpriced' | 'on-target' | 'overpriced';
  retainerAmount?: number;
  suggestedRetainer?: number;
}

const mockClients: QuickClient[] = [
  { id: 1, name: 'Acme Corp', hourlyRate: 150, hoursTracked: 42.5, revenue: 6375, effectiveHourlyRate: 150, targetRate: 150, pricingStatus: 'on-target', retainerAmount: 3000 },
  { id: 2, name: 'TechStart', hourlyRate: 140, hoursTracked: 28, revenue: 3360, effectiveHourlyRate: 120, targetRate: 150, pricingStatus: 'underpriced', suggestedRetainer: 4500 },
  { id: 3, name: 'Design Collective', hourlyRate: 150, hoursTracked: 15, revenue: 2250, effectiveHourlyRate: 150, targetRate: 140, pricingStatus: 'overpriced' },
];

const mockInvoiceItems = [
  { id: 1, description: 'Design sprint – Acme Corp', durationMinutes: 390, hourlyRate: 150, amount: 975, sourceEventIds: [1] },
  { id: 2, description: 'Client meeting – TechStart', durationMinutes: 120, hourlyRate: 140, amount: 280, sourceEventIds: [3] },
];

export function ValueDashboard({ userProfile }: ValueDashboardProps) {
  const [calcInput, setCalcInput] = useState({ clientName: '', hourlyRate: 100, hoursTracked: 20 });
  const [quickResults, setQuickResults] = useState<{ effectiveRate: number; lostRevenue: number; verdict: string } | null>(null);
  const [clients, setClients] = useState<QuickClient[]>(mockClients);

  const isStartup = userProfile?.workspaceType === 'startup';

  useEffect(() => {
    if (calcInput.hourlyRate > 0 && calcInput.hoursTracked > 0) {
      const effective = calcInput.hourlyRate;
      const totalRevenue = effective * calcInput.hoursTracked;
      const totalBilled = calcInput.hourlyRate * calcInput.hoursTracked;
      const lost = totalBilled - totalRevenue;
      const effectiveRate = totalRevenue / calcInput.hoursTracked;
      
      let verdict = '';
      if (effectiveRate < 15) {
        verdict = "You're making less than minimum wage. This client is costing you money.";
      } else if (effectiveRate < 40) {
        verdict = "Warning: You're effectively earning far less than you think.";
      } else if (effectiveRate < 80) {
        verdict = "You're undercharging. There's room to raise rates.";
      } else {
        verdict = "This client is paying well. Keep them!";
      }

      setQuickResults({
        effectiveRate,
        lostRevenue: lost,
        verdict
      });
    }
  }, [calcInput]);

  const totalRevenue = clients.reduce((sum, c) => sum + c.revenue, 0);
  const totalHours = clients.reduce((sum, c) => sum + c.hoursTracked, 0);
  const overallEffective = totalRevenue / totalHours || 0;
  const underpricedClients = clients.filter(c => c.pricingStatus === 'underpriced');

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Value Dashboard</h1>
          <p className="mt-1 text-muted-foreground text-sm sm:text-base">
            {isStartup ? "See how your time compounds into revenue, valuation, and impact." : "Track how your calendar becomes cash. Find out if you're being underpaid."}
          </p>
        </div>

        {/* QUICK CALCULATOR - The AHA moment, no tabs needed */}
        <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Quick Value Check
            </CardTitle>
            <p className="text-sm text-muted-foreground">Enter ONE client to see if you're actually making what you think.</p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-4">
              <div>
                <Label className="text-xs">Client Name</Label>
                <Input
                  placeholder="e.g. Acme Corp"
                  value={calcInput.clientName}
                  onChange={(e) => setCalcInput({ ...calcInput, clientName: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Your Rate ($/hr)</Label>
                <Input
                  type="number"
                  value={calcInput.hourlyRate}
                  onChange={(e) => setCalcInput({ ...calcInput, hourlyRate: Number(e.target.value) })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Hours This Month</Label>
                <Input
                  type="number"
                  value={calcInput.hoursTracked}
                  onChange={(e) => setCalcInput({ ...calcInput, hoursTracked: Number(e.target.value) })}
                  className="mt-1"
                />
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={() => setQuickResults(null)}
                  variant="outline" 
                  className="w-full mt-1"
                >
                  Reset
                </Button>
              </div>
            </div>

            {quickResults && (
              <div className="mt-6 rounded-lg bg-white p-4 border border-orange-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`text-3xl font-bold ${quickResults.effectiveRate < 40 ? 'text-red-600' : quickResults.effectiveRate < 80 ? 'text-orange-600' : 'text-green-600'}`}>
                    ${quickResults.effectiveRate.toFixed(0)}/hr
                  </div>
                  <div className="text-sm text-muted-foreground">effective rate</div>
                </div>
                
                <div className={`p-3 rounded-lg ${quickResults.effectiveRate < 40 ? 'bg-red-50 border border-red-200' : quickResults.effectiveRate < 80 ? 'bg-orange-50 border border-orange-200' : 'bg-green-50 border border-green-200'}`}>
                  <p className={`font-medium ${quickResults.effectiveRate < 40 ? 'text-red-700' : quickResults.effectiveRate < 80 ? 'text-orange-700' : 'text-green-700'}`}>
                    {quickResults.verdict}
                  </p>
                </div>

                {quickResults.effectiveRate < calcInput.hourlyRate && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    You're billing ${calcInput.hourlyRate} but actually making ${quickResults.effectiveRate.toFixed(0)} per hour of your time.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* OVERALL STATS */}
        <StatsCardPanel
          thisWeek={{
            totalTimeTracked: 32,
            revenueLiked: 4560,
            equityValue: 18000,
          }}
          lastWeek={{
            totalTimeTracked: 28,
            revenueLiked: 3500,
            equityValue: 16000,
          }}
          effectiveHourlyRate={{
            thisWeek: 142,
            lastWeek: 125,
          }}
        />

        {/* ALL CLIENTS + PRICING + INVOICES - Single page, no switching */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Client Pricing Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Your Clients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ClientPricingTable
                clients={clients}
                onAdjustRate={(clientId, newRate) => {
                  console.log('Adjust rate:', clientId, newRate);
                  setClients(clients.map(c => c.id === clientId ? { ...c, hourlyRate: newRate, effectiveHourlyRate: c.revenue / c.hoursTracked } : c));
                }}
                onUpdateRetainer={(clientId, newAmount) => {
                  console.log('Update retainer:', clientId, newAmount);
                }}
              />
            </CardContent>
          </Card>

          {/* Invoice Suggestions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-green-600" />
                Generate Invoice
              </CardTitle>
            </CardHeader>
            <CardContent>
              <InvoiceSuggestions
                clientName="Acme Corp"
                clientEmail="billing@acme.com"
                lineItems={mockInvoiceItems}
                invoiceNumber="INV-001"
                dueDate="March 15, 2024"
                suggestedRetainer={{
                  current: 3000,
                  suggested: 4500,
                  justification: 'Based on 42.5 hours tracked this month at $150/hr, a $4,500 monthly retainer covers your baseline availability.',
                }}
                onAccept={(items) => {
                  console.log('Accept invoice items:', items);
                }}
                onExport={(format) => {
                  console.log('Export as:', format);
                }}
              />
            </CardContent>
          </Card>
        </div>

        {/* FOUNDER VIEW - Only for startups */}
        {isStartup && (
          <FounderValueView
            activityBreakdown={{
              product: 18,
              sales: 8,
              ops: 4,
              fundraising: 2,
              support: 0,
              other: 0,
            }}
            revenueImpacts={[
              { activity: 'sales', hours: 8, mrrGenerated: 2500, mrrMultiple: 12 },
              { activity: 'product', hours: 18, mrrGenerated: 4000, mrrMultiple: 15 },
              { activity: 'fundraising', hours: 2, mrrGenerated: 0, mrrMultiple: 0 },
            ]}
            equityBets={[
              { company: 'Startup X', equityPercentage: 0.1, estimatedValuation: 2000000, yourValue: 200000 },
            ]}
            totalMRR={6500}
            totalARR={78000}
            workspaceType="startup"
          />
        )}
      </div>
    </div>
  );
}