"use client"

import * as React from "react"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { getClients, createClient, deleteClient } from "@/app/actions/value"

export default function ClientsList() {
  const [clients, setClients] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [openAdd, setOpenAdd] = React.useState(false)

  React.useEffect(() => {
    loadClients()
  }, [])

  const loadClients = async () => {
    setLoading(true)
    const result = await getClients()
    if (result.success) {
      setClients(result.clients || [])
    }
    setLoading(false)
  }

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const result = await createClient(fd)
    if (result.success) {
      setOpenAdd(false)
      loadClients()
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this client?")) return
    await deleteClient(id)
    loadClients()
  }

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-slate-900">Clients</h1>
        <Dialog open={openAdd} onOpenChange={setOpenAdd}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-1" /> Add
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Client</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input id="name" name="name" required placeholder="Acme Corp" />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="client@company.com" />
              </div>
              <div>
                <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
                <Input id="hourlyRate" name="hourlyRate" type="number" placeholder="150" />
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Input id="notes" name="notes" placeholder="Project details..." />
              </div>
              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
                Add Client
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {clients.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-slate-500 mb-4">No clients yet. Add your first client.</p>
            <Button onClick={() => setOpenAdd(true)} className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-1" /> Add Client
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {clients.map((client) => (
            <Card key={client.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">{client.name}</p>
                  {client.email && (
                    <p className="text-sm text-slate-400">{client.email}</p>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">
                      ${(client.hourlyRate || 0) / 100}/hr
                    </p>
                    <p className="text-xs text-slate-400">billed</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(client.id)}
                    className="text-slate-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}