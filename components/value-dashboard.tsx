'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatsCardPanel } from './stats-card-panel';
import { WorkLogCalendar } from './work-log-calendar';
import { ClientPricingTable } from './client-pricing-table';
import { InvoiceSuggestions } from './invoice-suggestions';
import { FounderValueView } from './founder-value-view';

interface ValueDashboardProps {
  userProfile?: {
    workspaceType: 'personal' | 'startup';
  };
}

// Mock data - replace with real API calls
const mockWorkEvents = [
  {
    id: 1,
    date: new Date(2024, 1, 15),
    title: 'Design sprint - Acme Corp',
    durationMinutes: 390,
    clientTag: 'Acme Corp',
    projectTag: 'Website redesign',
    activityType: 'product' as const,
    billable: true,
  },
  {
    id: 2,
    date: new Date(2024, 1, 15),
    title: 'Sales call prep',
    durationMinutes: 60,
    activityType: 'sales' as const,
    billable: false,
  },
  {
    id: 3,
    date: new Date(2024, 1, 16),
    title: 'Client meeting - TechStart',
    durationMinutes: 120,
    clientTag: 'TechStart',
    activityType: 'sales' as const,
    billable: true,
  },
];

const mockClients = [
  {
    id: 1,
    name: 'Acme Corp',
    hoursTracked: 42.5,
    revenue: 6375,
    effectiveHourlyRate: 150,
    targetRate: 150,
    pricingStatus: 'on-target' as const,
    retainerAmount: 3000,
    suggestedRetainer: undefined,
  },
  {
    id: 2,
    name: 'TechStart',
    hoursTracked: 28,
    revenue: 3360,
    effectiveHourlyRate: 120,
    targetRate: 150,
    pricingStatus: 'underpriced' as const,
    suggestedRetainer: 4500,
  },
  {
    id: 3,
    name: 'Design Collective',
    hoursTracked: 15,
    revenue: 2250,
    effectiveHourlyRate: 150,
    targetRate: 140,
    pricingStatus: 'overpriced' as const,
  },
];

const mockInvoiceItems = [
  {
    id: 1,
    description: 'Design sprint – Acme Corp',
    durationMinutes: 390,
    hourlyRate: 150,
    amount: 975,
    sourceEventIds: [1],
  },
  {
    id: 2,
    description: 'Client meeting – TechStart',
    durationMinutes: 120,
    hourlyRate: 140,
    amount: 280,
    sourceEventIds: [3],
  },
];

export function ValueDashboard({ userProfile }: ValueDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const isStartup = userProfile?.workspaceType === 'startup';

  return (
    <div className="min-h-screen bg-background p-6 sm:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold">Value Dashboard</h1>
          <p className="mt-2 text-muted-foreground">
            {isStartup
              ? "See how your time compounds into revenue, valuation, and impact."
              : "Track how your calendar becomes cash. Understand your pricing, see where you're undercharging."}
          </p>
        </div>

        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            {isStartup && <TabsTrigger value="founder">Founder view</TabsTrigger>}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
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
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar" className="space-y-6">
            <WorkLogCalendar
              events={mockWorkEvents}
              clients={mockClients}
              onTagEvent={(eventId, tags) => {
                console.log('Tag event:', eventId, tags);
              }}
            />
          </TabsContent>

          {/* Pricing Tab */}
          <TabsContent value="pricing" className="space-y-6">
            <ClientPricingTable
              clients={mockClients}
              onAdjustRate={(clientId, newRate) => {
                console.log('Adjust rate:', clientId, newRate);
              }}
              onUpdateRetainer={(clientId, newAmount) => {
                console.log('Update retainer:', clientId, newAmount);
              }}
            />
          </TabsContent>

          {/* Invoices Tab */}
          <TabsContent value="invoices" className="space-y-6">
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
          </TabsContent>

          {/* Founder View Tab */}
          {isStartup && (
            <TabsContent value="founder" className="space-y-6">
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
                  {
                    activity: 'sales',
                    hours: 8,
                    mrrGenerated: 2500,
                    mrrMultiple: 12,
                  },
                  {
                    activity: 'product',
                    hours: 18,
                    mrrGenerated: 4000,
                    mrrMultiple: 15,
                  },
                  {
                    activity: 'fundraising',
                    hours: 2,
                    mrrGenerated: 0,
                    mrrMultiple: 0,
                  },
                ]}
                equityBets={[
                  {
                    company: 'Startup X',
                    equityPercentage: 0.1,
                    estimatedValuation: 2000000,
                    yourValue: 200000,
                  },
                ]}
                totalMRR={6500}
                totalARR={78000}
                workspaceType="startup"
              />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
