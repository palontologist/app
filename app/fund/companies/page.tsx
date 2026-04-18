"use client"

import * as React from "react"
import { useOrganization } from "@clerk/nextjs"
import { Building2, Plus, Trash2, Edit2, X, Check } from "lucide-react"

const SECTOR_OPTIONS = [
  "Clean Energy",
  "Fintech",
  "Healthcare",
  "EdTech",
  "AgTech",
  "Climate",
  "Food & Agriculture",
  "Water & Sanitation",
  "Housing",
  "Transportation",
  "Other",
]

interface Company {
  id: number
  name: string
  sector: string | null
  sdgAlignment: number
  website: string | null
  notes: string | null
}

async function getCompanies(orgId: string) {
  const res = await fetch(`/api/funds/companies?orgId=${orgId}`)
  if (!res.ok) return []
  return res.json()
}

async function createCompany(orgId: string, data: Partial<Company>) {
  const res = await fetch(`/api/funds/companies?orgId=${orgId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  return res.json()
}

async function deleteCompany(id: number) {
  const res = await fetch(`/api/funds/companies?id=${id}`, { method: "DELETE" })
  return res.ok
}

export default function CompaniesPage() {
  const { organization } = useOrganization()
  const [companies, setCompanies] = React.useState<Company[]>([])
  const [loading, setLoading] = React.useState(true)
  const [showAdd, setShowAdd] = React.useState(false)
  const [editingId, setEditingId] = React.useState<number | null>(null)
  const [form, setForm] = React.useState({ name: "", sector: "", sdgAlignment: 0, website: "", notes: "" })

  const load = React.useCallback(() => {
    if (!organization?.id) return
    getCompanies(organization.id).then(data => {
      setCompanies(data)
      setLoading(false)
    })
  }, [organization?.id])

  React.useEffect(() => {
    load()
  }, [load])

  const handleAdd = async () => {
    if (!organization?.id || !form.name) return
    await createCompany(organization.id, form)
    setForm({ name: "", sector: "", sdgAlignment: 0, website: "", notes: "" })
    setShowAdd(false)
    load()
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this company?")) return
    await deleteCompany(id)
    load()
  }

  if (!organization) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Building2 className="w-12 h-12 mx-auto text-slate-300 mb-4" />
          <h2 className="text-lg font-semibold text-slate-700">No organization selected</h2>
          <p className="text-slate-500 mt-1">Switch to your fund's organization</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Portfolio Companies</h1>
          <p className="text-slate-500 text-sm">{companies.length} companies in portfolio</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-green-700">
          <Plus className="w-4 h-4" />
          Add Company
        </button>
      </header>

      {showAdd && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">Add Company</h3>
            <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Company Name *</label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Acme Corp"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Sector</label>
                <select
                  value={form.sector}
                  onChange={e => setForm(f => ({ ...f, sector: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Select sector</option>
                  {SECTOR_OPTIONS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">SDG Alignment</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={form.sdgAlignment}
                  onChange={e => setForm(f => ({ ...f, sdgAlignment: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Website</label>
              <input
                value={form.website}
                onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="https://acme.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
              <textarea
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                rows={3}
                placeholder="Investment thesis, key contacts..."
              />
            </div>
            <button onClick={handleAdd} disabled={!form.name} className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity50">
              Add Company
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-slate-200 rounded-xl" />
          ))}
        </div>
      ) : companies.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-xl">
          <Building2 className="w-12 h-12 mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500">No companies in portfolio yet</p>
          <button onClick={() => setShowAdd(true)} className="text-green-600 font-medium text-sm mt-2">
            Add your first company
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {companies.map(company => (
            <div key={company.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between">
              <div className="flex-1">
                <p className="font-semibold text-slate-800">{company.name}</p>
                <p className="text-sm text-slate-500">{company.sector || "No sector"} · {company.sdgAlignment}% SDG aligned</p>
                {company.website && (
                  <a href={company.website} target="_blank" rel="noopener" className="text-xs text-green-600 hover:underline">
                    {company.website}
                  </a>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleDelete(company.id)} className="p-2 text-slate-400 hover:text-red-500">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}