"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { addFounder } from "@/app/actions/founders"
import { Users, Loader2 } from "lucide-react"

type FounderTrackingDialogProps = {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onFounderAdded?: () => void
}

export default function FounderTrackingDialog({
  open = false,
  onOpenChange,
  onFounderAdded,
}: FounderTrackingDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true)
    try {
      const result = await addFounder(formData)
      if (result.success) {
        onOpenChange?.(false)
        onFounderAdded?.()
      }
    } catch (error) {
      console.error("Failed to add founder:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-4 w-4 text-[#28A745]" />
            Onboard New Founder
          </DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="founder-name">Founder Name</Label>
            <Input
              id="founder-name"
              name="founderName"
              placeholder="e.g., Sarah Johnson"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="founder-email">Email (Optional)</Label>
            <Input
              id="founder-email"
              name="founderEmail"
              type="email"
              placeholder="sarah@startup.com"
              disabled={isSubmitting}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="workspace-name">Workspace Name</Label>
            <Input
              id="workspace-name"
              name="workspaceName"
              placeholder="e.g., Greta Startup Workspace"
              disabled={isSubmitting}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="organization-id">Use existing workspace (Organization ID) — optional</Label>
            <Input
              id="organization-id"
              name="organizationId"
              placeholder="org_... (leave empty to create new)"
              disabled={isSubmitting}
            />
          </div>

          <div className="flex items-center gap-2">
            <input id="send-invite" name="sendInvite" type="checkbox" defaultChecked className="h-4 w-4" />
            <Label htmlFor="send-invite">Send email invite (requires email)</Label>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="company-name">Company Name (Optional)</Label>
            <Input id="company-name" name="companyName" placeholder="Startup Inc." disabled={isSubmitting} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="How did you help them? What was their main challenge?"
              rows={2}
              disabled={isSubmitting}
            />
          </div>

          <div className="rounded-lg bg-[#28A745]/5 p-3 border border-[#28A745]/20">
            <p className="text-xs text-[#28A745] font-medium mb-1">📈 Impact Tracking</p>
            <p className="text-xs text-[#6B7280]">Invite collaborators to a shared workspace; they will receive an email to join, create their account, and start contributing.</p>
          </div>

          <Button type="submit" className="w-full text-white bg-[#28A745] hover:bg-[#23923d]" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding Founder...
              </>
            ) : (
              "Add Founder"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
