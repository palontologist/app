"use client"

import * as React from "react"
import { useOrganization } from "@clerk/nextjs"
import { Building2, Clock, Target, TrendingUp, Plus, ArrowRight } from "lucide-react"
import Link from "next/link"

const SDG_LABELS: Record<string, string> = {
  "1": "No Poverty",
  "2": "Zero Hunger",
  "3": "Good Health",
  "4": "Quality Education",
  "5": "Gender Equality",
  "6": "Clean Water",
  "7": "Clean Energy",
  "8": "Decent Work",
  "9": "Industry & Innovation",
  "10": "Reduced Inequalities",
  "11": "Sustainable Cities",
  "12": "Responsible Consumption",
  "13": "Climate Action",
  "14": "Life Below Water",
  "15": "Life on Land",
  "16": "Peace & Justice",
  "17": "Partnerships",
}

interface Company {
  id: number
  name: string
  sector: string | null
  sdgAlignment: number
}

interface Summary {
  companies: Company[]
  totalHours: number
  sdgBreakdown: Record<string, number>
  byCompany: Record<number, number>
}

async function getFundData(orgId: string) {
  const res = await fetch(`/api/funds?orgId=${orgId}`)
  if (!res.ok) return null
  return res.json()
}

export default function FundDashboardPage() {
  const { organization } = useOrganization()
  const [summary, setSummary] = React.useState<Summary | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (!organization?.id) return
    getFundData(organization.id).then(data => {
      setSummary(data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [organization?.id])

  if (!organization) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Building2 className="w-12 h-12 mx-auto text-slate-300 mb-4" />
          <h2 className="text-lg font-semibold text-slate-700">No organization selected</h2>
          <p className="text-slate-500 mt-1">Switch to your fund's organization to view the portfolio</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-slate-200 rounded-xl" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-24 bg-slate-200 rounded-xl" />
            <div className="h-24 bg-slate-200 rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  const totalHours = summary?.totalHours || 0
  const sdgBreakdown = summary?.sdgBreakdown || {}
  const companies = summary?.companies || []

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">{organization.name}</h1>
          <p className="text-slate-500 text-sm">Impact OS Portfolio</p>
        </div>
        <Link href="/fund/companies" className="flex items-center gap-2 text-green-600 font-medium text-sm">
          <Plus className="w-4 h-4" />
          Add Company
        </Link>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-medium text-slate-500">Total Hours</span>
          </div>
          <p className="text-2xl font-semibold text-slate-800">{totalHours}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-medium text-slate-500">Companies</span>
          </div>
          <p className="text-2xl font-semibold text-slate-800">{companies.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-medium text-slate-500">Avg SDG</span>
          </div>
          <p className="text-2xl font-semibold text-slate-800">
            {companies.length > 0 ? Math.round(companies.reduce((s, c) => s + (c.sdgAlignment || 0), 0) / companies.length) : 0}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-medium text-slate-500">Active SDGs</span>
          </div>
          <p className="text-2xl font-semibold text-slate-800">{Object.keys(sdgBreakdown).length}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-800 mb-4">SDG Breakdown</h3>
          {Object.keys(sdgBreakdown).length === 0 ? (
            <p className="text-slate-400 text-sm">No activities logged yet. Upload a CSV to see SDG breakdown.</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(sdgBreakdown).sort((a, b) => b[1] - a[1]).map(([sdg, hours]) => (
                <div key={sdg} className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">SDG {sdg}: {SDG_LABELS[sdg] || "Unknown"}</span>
                  <span className="font-medium text-slate-800">{hours}h</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800">Portfolio</h3>
            <Link href="/fund/upload" className="text-green-600 text-sm font-medium flex items-center gap-1">
              Upload <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {companies.length === 0 ? (
            <p className="text-slate-400 text-sm">No companies in portfolio. Add your first portfolio company.</p>
          ) : (
            <div className="space-y-3">
              {companies.slice(0, 5).map((company) => (
                <div key={company.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-800 text-sm">{company.name}</p>
                    <p className="text-xs text-slate-500">{company.sector || "No sector"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-800">{company.sdgAlignment}%</p>
                    <p className="text-xs text-slate-500">SDG aligned</p>
                  </div>
                </div>
              ))}
              {companies.length > 5 && (
                <Link href="/fund/companies" className="text-green-600 text-sm font-medium">
                  +{companies.length - 5} more
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}