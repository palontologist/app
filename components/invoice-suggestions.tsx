'use client';

import { useState } from 'react';
import { Copy, Download, Send, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface InvoiceLineItem {
  id: number;
  description: string;
  durationMinutes: number;
  hourlyRate: number; // dollars/hour
  amount: number; // dollars
  sourceEventIds?: number[];
}

interface InvoiceLineItemsProps {
  clientName: string;
  clientEmail?: string;
  lineItems: InvoiceLineItem[];
  invoiceNumber?: string;
  dueDate?: string;
  suggestedRetainer?: {
    current: number;
    suggested: number;
    justification: string;
  };
  onAccept?: (items: InvoiceLineItem[]) => void;
  onExport?: (format: 'pdf' | 'csv' | 'stripe') => void;
}

export function InvoiceSuggestions({
  clientName,
  clientEmail,
  lineItems,
  invoiceNumber,
  dueDate,
  suggestedRetainer,
  onAccept,
  onExport,
}: InvoiceLineItemsProps) {
  const [selectedItems, setSelectedItems] = useState<number[]>(lineItems.map(item => item.id));
  const [copied, setCopied] = useState(false);

  const toggleItem = (itemId: number) => {
    setSelectedItems(prev =>
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  const selectedLineItems = lineItems.filter(item => selectedItems.includes(item.id));
  const totalAmount = selectedLineItems.reduce((sum, item) => sum + item.amount, 0);
  const totalHours = selectedLineItems.reduce((sum, item) => sum + item.durationMinutes, 0) / 60;

  const copyToClipboard = () => {
    const text = selectedLineItems
      .map(item => `${item.description}\n${(item.durationMinutes / 60).toFixed(1)}h @ $${item.hourlyRate.toFixed(0)}/hr = $${item.amount.toFixed(2)}`)
      .join('\n\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="text-lg font-semibold mb-1">Invoice suggestion for {clientName}</h3>
        {clientEmail && <p className="text-sm text-muted-foreground mb-6">{clientEmail}</p>}

        {/* Invoice preview */}
        <div className="space-y-4 mb-6 p-4 bg-secondary/20 rounded-lg">
          <div className="grid grid-cols-3 gap-4 text-sm">
            {invoiceNumber && (
              <div>
                <p className="text-muted-foreground">Invoice #</p>
                <p className="font-medium">{invoiceNumber}</p>
              </div>
            )}
            {dueDate && (
              <div>
                <p className="text-muted-foreground">Due date</p>
                <p className="font-medium">{dueDate}</p>
              </div>
            )}
            <div>
              <p className="text-muted-foreground">Total hours</p>
              <p className="font-medium">{totalHours.toFixed(1)}h</p>
            </div>
          </div>
        </div>

        {/* Line items */}
        <div className="space-y-3 mb-6">
          <h4 className="font-semibold text-sm">Line items ({selectedLineItems.length} of {lineItems.length})</h4>
          <div className="space-y-2">
            {lineItems.map(item => (
              <div
                key={item.id}
                className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card hover:bg-secondary/30 cursor-pointer transition-colors"
                onClick={() => toggleItem(item.id)}
              >
                <input
                  type="checkbox"
                  checked={selectedItems.includes(item.id)}
                  onChange={() => toggleItem(item.id)}
                  className="mt-1 rounded"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{item.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {(item.durationMinutes / 60).toFixed(1)}h @ ${item.hourlyRate.toFixed(0)}/hr
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold">${item.amount.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Total */}
        <div className="border-t border-border pt-4 mb-6">
          <div className="flex justify-between items-baseline">
            <span className="text-lg font-semibold">Total</span>
            <span className="text-3xl font-bold text-[#28A745]">${totalAmount.toFixed(2)}</span>
          </div>
        </div>

        {/* Suggested retainer */}
        {suggestedRetainer && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 mb-6">
            <h4 className="font-semibold text-blue-900 mb-2">Suggested retainer increase</h4>
            <p className="text-sm text-blue-800 mb-3">{suggestedRetainer.justification}</p>
            <div className="flex items-center gap-3">
              <div>
                <p className="text-xs text-blue-700">Current</p>
                <p className="text-lg font-semibold text-blue-900">${suggestedRetainer.current.toLocaleString()}/mo</p>
              </div>
              <span className="text-blue-900">→</span>
              <div>
                <p className="text-xs text-blue-700">Suggested</p>
                <p className="text-lg font-semibold text-green-600">${suggestedRetainer.suggested.toLocaleString()}/mo</p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={copyToClipboard}
            className="flex items-center gap-2"
          >
            <Copy className="h-4 w-4" />
            {copied ? 'Copied!' : 'Copy text'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onExport?.('csv')}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onExport?.('pdf')}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
          <Button
            className="flex items-center gap-2 bg-[#28A745] hover:bg-[#23923d] ml-auto"
            onClick={() => onAccept?.(selectedLineItems)}
          >
            <CheckCircle className="h-4 w-4" />
            Create invoice
          </Button>
        </div>
      </div>

      {/* Integration tips */}
      <div className="rounded-lg border border-border bg-secondary/20 p-4">
        <h4 className="font-semibold text-sm mb-2">Pro tips</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• Copy invoice text and paste directly into Stripe, PayPal, or your invoicing tool</li>
          <li>• Adjust line items by clicking checkboxes before exporting</li>
          <li>• Use suggested retainer to negotiate better terms with recurring clients</li>
          <li>• Track which time entries became invoices to avoid double-billing</li>
        </ul>
      </div>
    </div>
  );
}
