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
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#28A745]" />
      </div>
    )
  }

  const hasData = clientsData.length > 0 || paymentsData.length > 0

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

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="clients">Clients ({clientsData.length})</TabsTrigger>
          <TabsTrigger value="revenue">Revenue ({paymentsData.length})</TabsTrigger>
          <TabsTrigger value="equity">Equity ({equityData.length})</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-4">
          {!hasData ? (
            <Card>
              <CardContent className="py-12 text-center">
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
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {/* Recent Payments */}
              <Card>
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-base">Recent Revenue</CardTitle>
                  <AddPaymentDialog clients={clientsData} onCreated={loadData} />
                </CardHeader>
                <CardContent>
                  {paymentsData.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No payments logged yet</p>
                  ) : (
                    <div className="space-y-2">
                      {paymentsData.slice(0, 5).map((p) => {
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

              {/* Time by Activity */}
              <Card>
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-base">Time by Activity</CardTitle>
                  <AddTimeEntryDialog clients={clientsData} onCreated={loadData} />
                </CardHeader>
                <CardContent>
                  {timeData.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No time logged yet</p>
                  ) : (
                    <div className="space-y-2">
                      {Object.entries(
                        timeData.reduce((acc: Record<string, number>, e) => {
                          const type = e.activityType || "other"
                          acc[type] = (acc[type] || 0) + (e.durationMinutes || 0)
                          return acc
                        }, {})
                      )
                        .sort(([, a], [, b]) => b - a)
                        .map(([type, minutes]) => (
                          <div key={type} className="flex items-center justify-between py-1">
                            <span className="text-sm capitalize">{type}</span>
                            <span className="text-sm font-medium">
                              {(minutes / 60).toFixed(1)}h
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Clients */}
        <TabsContent value="clients" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-medium text-muted-foreground">
              {clientsData.length} client{clientsData.length !== 1 ? "s" : ""}
            </h2>
            <AddClientDialog onCreated={loadData} />
          </div>
          {clientsData.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Users className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">No clients yet. Add your first client.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
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
                  <Card key={client.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium">{client.name}</h3>
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
                      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
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
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* Revenue */}
        <TabsContent value="revenue" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-medium text-muted-foreground">
              {paymentsData.length} payment{paymentsData.length !== 1 ? "s" : ""}
            </h2>
            <AddPaymentDialog clients={clientsData} onCreated={loadData} />
          </div>
          {paymentsData.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <DollarSign className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">No payments logged yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {paymentsData.map((p) => {
                const client = clientsData.find((c) => c.id === p.clientId)
                return (
                  <Card key={p.id}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-semibold">${(p.amount / 100).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">
                          {client?.name || "No client"} · {new Date(p.paymentDate).toLocaleDateString()}
                        </p>
                        {p.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">{p.description}</p>
                        )}
                      </div>
                      {p.paymentMethod && (
                        <Badge variant="secondary" className="capitalize">
                          {p.paymentMethod.replace("_", " ")}
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* Equity */}
        <TabsContent value="equity" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-medium text-muted-foreground">
              {equityData.length} equity bet{equityData.length !== 1 ? "s" : ""}
            </h2>
            <AddEquityBetDialog onCreated={loadData} />
          </div>
          {equityData.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Briefcase className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">
                  No equity bets yet. Add advisory shares, startup investments, or equity compensation.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {equityData.map((bet) => {
                const pct = (bet.equityPercentage || 0) / 10000
                const val = (bet.estimatedValuation || 0) / 100
                const yourValue = pct * val

                return (
                  <Card key={bet.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium">{bet.companyName}</h3>
                          {bet.notes && (
                            <p className="text-xs text-muted-foreground mt-0.5">{bet.notes}</p>
                          )}
                        </div>
                        <Badge
                          className={
                            bet.status === "active"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }
                        >
                          {bet.status}
                        </Badge>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-xs text-muted-foreground">Equity</p>
                          <p className="text-sm font-semibold">{(pct * 100).toFixed(2)}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Valuation</p>
                          <p className="text-sm font-semibold">
                            {val > 0 ? `$${(val / 1000).toFixed(0)}k` : "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Your Value</p>
                          <p className="text-sm font-semibold text-[#28A745]">
                            {yourValue > 0 ? `$${Math.round(yourValue / 1000)}k` : "—"}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
