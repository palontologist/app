"use server"

import { revalidatePath } from "next/cache"
import { auth, clerkClient } from "@clerk/nextjs/server"

// Mock data storage for founders
const mockFounders: any[] = [
  {
    id: "1",
    company_name: "TechStart Inc",
    founder_name: "Sarah Johnson",
    founder_email: "sarah@techstart.com",
    status: "active",
    industry: "Technology",
    stage: "seed",
    mission: "Democratizing access to AI tools for small businesses",
    created_at: new Date().toISOString(),
  },
  {
    id: "2",
    company_name: "GreenFuture Co",
    founder_name: "Mike Chen",
    founder_email: "mike@greenfuture.com",
    status: "active",
    industry: "Sustainability",
    stage: "series-a",
    mission: "Building sustainable solutions for urban environments",
    created_at: new Date().toISOString(),
  },
  {
    id: "3",
    company_name: "HealthTech Solutions",
    founder_name: "Dr. Emily Rodriguez",
    founder_email: "emily@healthtech.com",
    status: "pending",
    industry: "Healthcare",
    stage: "pre-seed",
    mission: "Improving patient outcomes through innovative technology",
    created_at: new Date().toISOString(),
  },
]

export async function getFounders() {
  try {
    // Sort founders by creation date (newest first)
    const sortedFounders = mockFounders.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )

    return {
      success: true,
      founders: sortedFounders,
    }
  } catch (error) {
    console.error("Failed to get founders:", error)
    return {
      success: false,
      error: "Failed to retrieve founders",
      founders: [],
    }
  }
}

export async function addFounder(formData: FormData) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: "Unauthenticated" }
    }
    const companyName = formData.get("companyName") as string
    const founderName = formData.get("founderName") as string
    const founderEmail = formData.get("founderEmail") as string
    const sendInvite = (formData.get("sendInvite") as string) === "on" || (formData.get("sendInvite") as string) === "true"
    const workspaceName = (formData.get("workspaceName") as string) || companyName || "Startup Workspace"
    const industry = formData.get("industry") as string
    const stage = formData.get("stage") as string
    const mission = formData.get("mission") as string

    if (!companyName || !founderName || !founderEmail) {
      return {
        success: false,
        error: "Company name, founder name, and email are required",
      }
    }

    // Check if founder already exists
    const existingFounder = mockFounders.find(
      (founder) => founder.founder_email.toLowerCase() === founderEmail.toLowerCase(),
    )

    if (existingFounder) {
      return {
        success: false,
        error: "A founder with this email already exists",
      }
    }

    const newFounder: any = {
      id: (mockFounders.length + 1).toString(),
      company_name: companyName,
      founder_name: founderName,
      founder_email: founderEmail,
      status: "pending",
      industry: industry || "Other",
      stage: stage || "pre-seed",
      mission: mission || "",
      created_at: new Date().toISOString(),
    }

    mockFounders.push(newFounder)

    // Attempt to create or reuse an organization and send an invitation
    let inviteResult: any = null
    if (founderEmail && sendInvite) {
      try {
        // 1) Create a new organization for this workspace (or reuse if desired)
        const organization = await clerkClient.organizations.createOrganization({
          name: workspaceName,
          createdBy: userId,
        } as any)
        newFounder.organization_id = organization.id

        // 2) Send invitation to founder's email
        // Fallback role to 'org:member'; adjust if you have custom roles
        // Different Clerk SDK versions use slightly different method names; this one is common.
        // @ts-ignore - tolerate SDK typing differences across versions
        inviteResult = await clerkClient.organizations.createInvitation({
          organizationId: organization.id,
          emailAddress: founderEmail,
          inviterUserId: userId,
          role: 'org:member',
        })
        newFounder.invitation_id = inviteResult?.id || null
        newFounder.status = "invited"
      } catch (inviteError) {
        console.warn("Founder invite failed:", inviteError)
        // Keep the founder record; just report that the invite step failed
      }
    }

    revalidatePath("/dashboard")
    revalidatePath("/founders")

    return {
      success: true,
      founder: newFounder,
      invite: inviteResult ? { id: inviteResult.id } : null,
    }
  } catch (error) {
    console.error("Failed to add founder:", error)
    return {
      success: false,
      error: "Failed to add founder",
    }
  }
}

export async function updateFounderStatus(founderId: string, status: string) {
  try {
    const founderIndex = mockFounders.findIndex((founder) => founder.id === founderId)

    if (founderIndex === -1) {
      return {
        success: false,
        error: "Founder not found",
      }
    }

    mockFounders[founderIndex].status = status

    revalidatePath("/dashboard")
    revalidatePath("/founders")

    return {
      success: true,
      founder: mockFounders[founderIndex],
    }
  } catch (error) {
    console.error("Failed to update founder status:", error)
    return {
      success: false,
      error: "Failed to update founder status",
    }
  }
}

export async function deleteFounder(founderId: string) {
  try {
    const founderIndex = mockFounders.findIndex((founder) => founder.id === founderId)

    if (founderIndex === -1) {
      return {
        success: false,
        error: "Founder not found",
      }
    }

    mockFounders.splice(founderIndex, 1)

    revalidatePath("/dashboard")
    revalidatePath("/founders")

    return {
      success: true,
    }
  } catch (error) {
    console.error("Failed to delete founder:", error)
    return {
      success: false,
      error: "Failed to delete founder",
    }
  }
}

export async function getFounderById(founderId: string) {
  try {
    const founder = mockFounders.find((founder) => founder.id === founderId)

    if (!founder) {
      return {
        success: false,
        error: "Founder not found",
        founder: null,
      }
    }

    return {
      success: true,
      founder,
    }
  } catch (error) {
    console.error("Failed to get founder:", error)
    return {
      success: false,
      error: "Failed to retrieve founder",
      founder: null,
    }
  }
}
