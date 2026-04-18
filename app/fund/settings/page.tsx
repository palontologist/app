"use client"

import * as React from "react"
import { useOrganization, useUser } from "@clerk/nextjs"
import { Settings, Save, Target, Users, Key, Shield, Copy, RefreshCw } from "lucide-react"

type Tab = "thesis" | "team" | "sso" | "api"

export default function SettingsPage() {
  const { organization } = useOrganization()
  const { user } = useUser()
  const [tab, setTab] = React.useState<Tab>("thesis")
  const [thesis, setThesis] = React.useState("")
  const [sdgTargets, setSdgTargets] = React.useState("7,13")
  const [seatsUsed, setSeatsUsed] = React.useState(0)
  const [seatLimit, setSeatLimit] = React.useState(10)
  const [ssoProvider, setSsoProvider] = React.useState("")
  const [ssoEntityId, setSsoEntityId] = React.useState("")
  const [ssoSsoUrl, setSsoSsoUrl] = React.useState("")
  const [apiKey, setApiKey] = React.useState("")
  const [apiKeyEnabled, setApiKeyEnabled] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [saved, setSaved] = React.useState(false)
  const [plan, setPlan] = React.useState("studio")

  React.useEffect(() => {
    if (!organization?.id) return
    fetch(`/api/funds/settings?orgId=${organization.id}`)
      .then(r => r.json())
      .then(data => {
        if (data) {
          setThesis(data.thesis || "")
          setSdgTargets(data.sdgTargets || "7,13")
          setSeatsUsed(data.seatsUsed || 0)
          setSeatLimit(data.seatLimit || 10)
          setSsoProvider(data.ssoProvider || "")
          setSsoEntityId(data.ssoEntityId || "")
          setSsoSsoUrl(data.ssoSsoUrl || "")
          setApiKey(data.apiKey || "")
          setApiKeyEnabled(data.apiKeyEnabled || false)
          setPlan(data.plan || "studio")
        }
      })
  }, [organization?.id])

  const handleSave = async () => {
    if (!organization?.id) return
    setSaving(true)
    await fetch(`/api/funds/settings?orgId=${organization.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        thesis,
        sdgTargets,
        seatLimit,
        seatsUsed,
        ssoProvider,
        ssoEntityId,
        ssoSsoUrl,
        apiKey,
        apiKeyEnabled,
      }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleGenerateApiKey = async () => {
    const newKey = `gka_${crypto.randomUUID().replace(/-/g, "")}`
    setApiKey(newKey)
    setApiKeyEnabled(true)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  if (!organization) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Settings className="w-12 h-12 mx-auto text-slate-300 mb-4" />
          <h2 className="text-lg font-semibold text-slate-700">No organization selected</h2>
        </div>
      </div>
    )
  }

  const isEnterprise = plan === "enterprise"

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-800">Fund Settings</h1>
        <p className="text-slate-500 text-sm">Configure your fund's impact thesis</p>
      </header>

      <div className="flex gap-1 border-b border-slate-200">
        {[
          { id: "thesis", label: "Thesis", icon: Target },
          { id: "team", label: "Team", icon: Users },
          isEnterprise && { id: "sso", label: "SSO", icon: Shield },
          isEnterprise && { id: "api", label: "API", icon: Key },
        ].filter(Boolean).map((t: any) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id
                ? "border-green-500 text-green-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "thesis" && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-6">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
              <Target className="w-4 h-4" />
              Investment Thesis
            </label>
            <textarea
              value={thesis}
              onChange={e => setThesis(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              rows={4}
              placeholder="e.g., Focused on SDG 7 (Clean Energy) and SDG 13 (Climate Action)..."
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
              <Target className="w-4 h-4" />
              SDG Targets
            </label>
            <input
              value={sdgTargets}
              onChange={e => setSdgTargets(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="7,13"
            />
            <p className="text-xs text-slate-500 mt-1">Comma-separated SDG numbers (e.g., "7,13" for Clean Energy and Climate)</p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : saved ? "Saved!" : "Save Settings"}
          </button>
        </div>
      )}

      {tab === "team" && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-6">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-slate-700">Team Seats</p>
              <p className="text-xs text-slate-500">Members invited to this fund workspace</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-slate-800">
                {seatsUsed} <span className="text-slate-400 font-normal text-sm">/ {seatLimit}</span>
              </p>
              <p className="text-xs text-slate-500">seats used</p>
            </div>
          </div>

          {isEnterprise ? (
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <Users className="w-4 h-4" />
                Seat Limit
              </label>
              <input
                type="number"
                value={seatLimit}
                onChange={e => setSeatLimit(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                min={1}
              />
            </div>
          ) : (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                Upgrade to Enterprise for unlimited seats and team management.
              </p>
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : saved ? "Saved!" : "Save Settings"}
          </button>
        </div>
      )}

      {tab === "sso" && isEnterprise && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-6">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
              <Shield className="w-4 h-4" />
              SSO Provider
            </label>
            <select
              value={ssoProvider}
              onChange={e => setSsoProvider(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="">Select provider...</option>
              <option value="okta">Okta</option>
              <option value="azure">Azure AD</option>
              <option value="google">Google Workspace</option>
              <option value="custom">Custom SAML</option>
            </select>
          </div>

          {ssoProvider && (
            <>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2">Entity ID</label>
                <input
                  value={ssoEntityId}
                  onChange={e => setSsoEntityId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder={ssoProvider === "okta" ? "https://your-domain.okta.com/app/abc..." : "https://..."}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-2">SSO URL</label>
                <input
                  value={ssoSsoUrl}
                  onChange={e => setSsoSsoUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="https://your-idp.com/sso/saml..."
                />
              </div>
            </>
          )}

          {!ssoProvider && (
            <div className="p-4 bg-slate-50 rounded-lg text-center">
              <Shield className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="text-sm text-slate-500">Select an SSO provider to configure SAML/OIDC authentication</p>
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : saved ? "Saved!" : "Save Settings"}
          </button>
        </div>
      )}

      {tab === "api" && isEnterprise && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-6">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-slate-700">API Access</p>
              <p className="text-xs text-slate-500">Integrate with your existing systems</p>
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={apiKeyEnabled}
                onChange={e => setApiKeyEnabled(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-green-600 focus:ring-green-500"
              />
              <span className="text-sm text-slate-600">Enabled</span>
            </label>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
              <Key className="w-4 h-4" />
              API Key
            </label>
            <div className="flex gap-2">
              <input
                value={apiKey}
                readOnly
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-600 font-mono text-sm"
                placeholder="Click Generate to create API key"
              />
              {apiKey ? (
                <button
                  onClick={() => copyToClipboard(apiKey)}
                  className="p-2 border border-slate-300 rounded-lg hover:bg-slate-100"
                  title="Copy to clipboard"
                >
                  <Copy className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleGenerateApiKey}
                  className="flex items-center gap-2 px-3 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900"
                >
                  <RefreshCw className="w-4 h-4" />
                  Generate
                </button>
              )}
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : saved ? "Saved!" : "Save Settings"}
          </button>
        </div>
      )}

      {tab === "sso" && !isEnterprise && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              Upgrade to Enterprise to enable SSO (SAML/OIDC) authentication.
            </p>
          </div>
        </div>
      )}

      {tab === "api" && !isEnterprise && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              Upgrade to Enterprise for API access and custom integrations.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}