"use client"

import * as React from "react"
import {
  DollarSign,
  Clock,
  Users,
  TrendingUp,
  Plus,
  Briefcase,
  ChevronRight,
  Loader2,
  AlertTriangle,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  getValueSummary,
  getClients,
  getPayments,
  getTimeEntries,
  getEquityBets,
  getClientROI,
  createClient,
  createPayment,
  createTimeEntry,
  createEquityBet,
} from "@/app/actions/value"

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
}: {
  title: string
  value: string
  subtitle?: string
  icon: React.ComponentType<{ className?: string }>
  trend?: string
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
          <div className="rounded-lg bg-[#28A745]/10 p-2">
            <Icon className="h-5 w-5 text-[#28A745]" />
          </div>
        </div>
        {trend && (
          <div className="mt-2 text-xs font-medium text-[#28A745]">{trend}</div>
        )}
      </CardContent>
    </Card>
  )
}

function AddClientDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    const result = await createClient(fd)
    if (result.success) {
      setOpen(false)
      onCreated()
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-[#28A745] hover:bg-[#23923d] text-white">
          <Plus className="h-4 w-4 mr-1" /> Add Client
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Client / Project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Client Name *</Label>
            <Input id="name" name="name" placeholder="Acme Corp" required />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="billing@acme.com" />
          </div>
          <div>
            <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
            <Input id="hourlyRate" name="hourlyRate" type="number" step="0.01" placeholder="150" />
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Input id="notes" name="notes" placeholder="Optional notes..." />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-[#28A745] hover:bg-[#23923d] text-white">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Add Client
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function AddPaymentDialog({
  clients,
  onCreated,
}: {
  clients: any[]
  onCreated: () => void
}) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [selectedClient, setSelectedClient] = React.useState<string>("")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    if (selectedClient) fd.set("clientId", selectedClient)
    const result = await createPayment(fd)
    if (result.success) {
      setOpen(false)
      onCreated()
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-[#28A745] hover:bg-[#23923d] text-white">
          <Plus className="h-4 w-4 mr-1" /> Log Revenue
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log Revenue / Payment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="amount">Amount ($) *</Label>
            <Input id="amount" name="amount" type="number" step="0.01" placeholder="1500.00" required />
          </div>
          <div>
            <Label htmlFor="clientSelect">Client</Label>
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger>
                <SelectValue placeholder="Select client (optional)" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="paymentDate">Date *</Label>
            <Input
              id="paymentDate"
              name="paymentDate"
              type="date"
              defaultValue={new Date().toISOString().split("T")[0]}
              required
            />
          </div>
          <div>
            <Label htmlFor="paymentMethod">Payment Method</Label>
            <Select name="paymentMethod">
              <SelectTrigger>
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="stripe">Stripe</SelectItem>
                <SelectItem value="paypal">PayPal</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Input id="description" name="description" placeholder="Invoice #001 for design work" />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-[#28A745] hover:bg-[#23923d] text-white">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Log Payment
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function AddTimeEntryDialog({
  clients,
  onCreated,
}: {
  clients: any[]
  onCreated: () => void
}) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [selectedClient, setSelectedClient] = React.useState<string>("")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    if (selectedClient) fd.set("clientId", selectedClient)
    const result = await createTimeEntry(fd)
    if (result.success) {
      setOpen(false)
      onCreated()
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-1" /> Log Time
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log Time Entry</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="durationMinutes">Duration (minutes) *</Label>
            <Input id="durationMinutes" name="durationMinutes" type="number" placeholder="90" required />
          </div>
          <div>
            <Label htmlFor="clientSelectTime">Client</Label>
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger>
                <SelectValue placeholder="Select client (optional)" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="activityType">Activity Type</Label>
            <Select name="activityType">
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="product">Product</SelectItem>
                <SelectItem value="sales">Sales</SelectItem>
                <SelectItem value="ops">Operations</SelectItem>
                <SelectItem value="fundraising">Fundraising</SelectItem>
                <SelectItem value="support">Support</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="projectTag">Project Tag</Label>
            <Input id="projectTag" name="projectTag" placeholder="Website redesign" />
          </div>
          <div>
            <Label htmlFor="entryDate">Date *</Label>
            <Input
              id="entryDate"
              name="entryDate"
              type="date"
              defaultValue={new Date().toISOString().split("T")[0]}
              required
            />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="billable" name="billable" value="true" defaultChecked className="h-4 w-4" />
            <Label htmlFor="billable">Billable</Label>
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-[#28A745] hover:bg-[#23923d] text-white">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Log Time
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function AddEquityBetDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    const result = await createEquityBet(fd)
    if (result.success) {
      setOpen(false)
      onCreated()
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-1" /> Add Equity Bet
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Equity Bet</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="companyName">Company Name *</Label>
            <Input id="companyName" name="companyName" placeholder="Startup X" required />
          </div>
          <div>
            <Label htmlFor="equityPercentage">Equity % (e.g. 0.5 for 0.5%)</Label>
            <Input id="equityPercentage" name="equityPercentage" type="number" step="0.01" placeholder="0.5" />
          </div>
          <div>
            <Label htmlFor="estimatedValuation">Estimated Valuation ($)</Label>
            <Input id="estimatedValuation" name="estimatedValuation" type="number" placeholder="1000000" />
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Input id="notes" name="notes" placeholder="Advisory shares for Q1 work" />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-[#28A745] hover:bg-[#23923d] text-white">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Add Equity Bet
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function ValueOSDashboard() {
  const [summary, setSummary] = React.useState<any>(null)
  const [clientsData, setClientsData] = React.useState<any[]>([])
  const [paymentsData, setPaymentsData] = React.useState<any[]>([])
  const [timeData, setTimeData] = React.useState<any[]>([])
  const [equityData, setEquityData] = React.useState<any[]>([])
  const [clientROI, setClientROI] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  const loadData = async () => {
    setLoading(true)
    try {
      const [sumResult, clResult, payResult, timeResult, eqResult, roiResult] = await Promise.all([
        getValueSummary(),
        getClients(),
        getPayments(),
        getTimeEntries(),
        getEquityBets(),
        getClientROI(),
      ])
      if (sumResult.success) setSummary(sumResult.summary)
      setClientsData(clResult.clients || [])
      setPaymentsData(payResult.payments || [])
      setTimeData(timeResult.entries || [])
      setEquityData(eqResult.bets || [])
      setClientROI(roiResult.clients || [])
    } catch (err) {
      console.error("ValueOSDashboard load error:", err)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    loadData()
  }, [])

  const hasData = clientsData.length > 0 || paymentsData.length > 0
  const [calcInput, setCalcInput] = React.useState({ clientName: '', hourlyRate: 100, hoursTracked: 20 })
  const [quickResults, setQuickResults] = React.useState<{ effectiveRate: number; lostRevenue: number; verdict: string } | null>(null)

  React.useEffect(() => {
    if (calcInput.hourlyRate > 0 && calcInput.hoursTracked > 0) {
      const effectiveRate = calcInput.hourlyRate
      const totalRevenue = effectiveRate * calcInput.hoursTracked
      const totalBilled = calcInput.hourlyRate * calcInput.hoursTracked
      const lost = totalBilled - totalRevenue
      
      let verdict = ''
      if (effectiveRate < 15) {
        verdict = "You're making less than minimum wage. This client is costing you money."
      } else if (effectiveRate < 40) {
        verdict = "Warning: You're effectively earning far less than you think."
      } else if (effectiveRate < 80) {
        verdict = "You're undercharging. There's room to raise rates."
      } else {
        verdict = "This client is paying well. Keep them!"
      }

      setQuickResults({
        effectiveRate,
        lostRevenue: lost,
        verdict
      })
    }
  }, [calcInput])

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Value OS</h1>
        <p className="text-muted-foreground mt-1">
          Track how your time compounds into revenue, valuation, and impact.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={summary ? `$${summary.totalRevenue.toLocaleString()}` : "$0"}
          subtitle={`$${summary?.weekRevenue.toLocaleString() || 0} this week`}
          icon={DollarSign}
          trend={summary?.weekRevenue > 0 ? `+$${summary.weekRevenue.toFixed(0)} this week` : undefined}
        />
        <StatCard
          title="Hours Tracked"
          value={summary ? `${summary.weekHours.toFixed(1)}h` : "0h"}
          subtitle={`${summary?.totalHours.toFixed(0) || 0}h total`}
          icon={Clock}
        />
        <StatCard
          title="Effective Rate"
          value={summary?.effectiveRate ? `$${summary.effectiveRate}/hr` : "—"}
          subtitle="This week"
          icon={TrendingUp}
        />
        <StatCard
          title="Equity Value"
          value={summary?.totalEquityValue ? `$${(summary.totalEquityValue / 1000).toFixed(0)}k` : "$0"}
          subtitle={`${summary?.equityBetsCount || 0} active bets`}
          icon={Briefcase}
        />
      </div>

      {/* QUICK CALCULATOR */}
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

      {/* ALL ON ONE PAGE - No tabs */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* CLIENTS */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base">Clients ({clientsData.length})</CardTitle>
            <AddClientDialog onCreated={loadData} />
          </CardHeader>
          <CardContent>
            {clientsData.length === 0 ? (
              <div className="text-center py-6">
                <Users className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No clients yet.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {clientsData.map((client) => {
                  const clientPayments = paymentsData.filter((p) => p.clientId === client.id)
                  const totalPaid = clientPayments.reduce((sum, p) => sum + (p.amount || 0), 0) / 100
                  const clientTime = timeData.filter((t) => t.clientId === client.id)
                  const totalHours = clientTime.reduce((sum, t) => sum + (t.durationMinutes || 0), 0) / 60
                  const effectiveRate = totalHours > 0 ? totalPaid / totalHours : 0
                  const targetRate = client.hourlyRate ? client.hourlyRate / 100 : null

                  let pricingStatus: "on-target" | "underpriced" | "overpriced" | "no-rate" = "no-rate"
                  if (targetRate && effectiveRate > 0) {
                    if (effectiveRate >= targetRate * 0.95) pricingStatus = "on-target"
                    else if (effectiveRate < targetRate * 0.85) pricingStatus = "underpriced"
                    else pricingStatus = "overpriced"
                  }

                  return (
                    <div key={client.id} className="p-3 rounded-lg border">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-sm">{client.name}</h3>
                          {client.email && <p className="text-xs text-muted-foreground">{client.email}</p>}
                        </div>
                        {pricingStatus !== "no-rate" && (
                          <Badge
                            className={
                              pricingStatus === "on-target"
                                ? "bg-green-100 text-green-700"
                                : pricingStatus === "underpriced"
                                ? "bg-red-100 text-red-700"
                                : "bg-yellow-100 text-yellow-700"
                            }
                          >
                            {pricingStatus === "on-target"
                              ? "On target"
                              : pricingStatus === "underpriced"
                              ? "Underpriced"
                              : "Overpriced"}
                          </Badge>
                        )}
                      </div>
                      <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-xs text-muted-foreground">Revenue</p>
                          <p className="text-sm font-semibold">${totalPaid.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Hours</p>
                          <p className="text-sm font-semibold">{totalHours.toFixed(1)}h</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Eff. Rate</p>
                          <p className="text-sm font-semibold">
                            {effectiveRate > 0 ? `$${Math.round(effectiveRate)}/hr` : "—"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* REVENUE */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base">Revenue ({paymentsData.length})</CardTitle>
            <AddPaymentDialog clients={clientsData} onCreated={loadData} />
          </CardHeader>
          <CardContent>
            {paymentsData.length === 0 ? (
              <div className="text-center py-6">
                <DollarSign className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No payments logged yet.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {paymentsData.slice(0, 10).map((p) => {
                  const client = clientsData.find((c) => c.id === p.clientId)
                  return (
                    <div key={p.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="text-sm font-medium">${(p.amount / 100).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">
                          {client?.name || "No client"} · {new Date(p.paymentDate).toLocaleDateString()}
                        </p>
                      </div>
                      {p.paymentMethod && (
                        <Badge variant="secondary" className="text-xs capitalize">
                          {p.paymentMethod.replace("_", " ")}
                        </Badge>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* EQUITY */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base">Equity Bets ({equityData.length})</CardTitle>
            <AddEquityBetDialog onCreated={loadData} />
          </CardHeader>
          <CardContent>
            {equityData.length === 0 ? (
              <div className="text-center py-6">
                <Briefcase className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No equity bets yet.</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {equityData.map((bet) => {
                  const pct = (bet.equityPercentage || 0) / 10000
                  const val = (bet.estimatedValuation || 0) / 100
                  const yourValue = pct * val

                  return (
                    <div key={bet.id} className="p-3 rounded-lg border">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-sm">{bet.companyName}</h3>
                          {bet.notes && <p className="text-xs text-muted-foreground mt-0.5">{bet.notes}</p>}
                        </div>
                        <Badge className={bet.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>
                          {bet.status}
                        </Badge>
                      </div>
                      <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-xs text-muted-foreground">Equity</p>
                          <p className="text-sm font-semibold">{(pct * 100).toFixed(2)}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Valuation</p>
                          <p className="text-sm font-semibold">{val > 0 ? `$${(val / 1000).toFixed(0)}k` : "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Your Value</p>
                          <p className="text-sm font-semibold text-[#28A745]">{yourValue > 0 ? `$${Math.round(yourValue / 1000)}k` : "—"}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Empty state */}
      {!hasData && (
        <Card>
          <CardContent className="py-8 text-center">
            <DollarSign className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">Start tracking your value</h3>
            <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
              Add clients, log time entries, and record payments to see how your work compounds into revenue and equity.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <AddClientDialog onCreated={loadData} />
              <AddPaymentDialog clients={clientsData} onCreated={loadData} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
