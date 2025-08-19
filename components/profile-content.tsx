"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  User, 
  Target, 
  Heart, 
  Globe, 
  MapPin, 
  Calendar, 
  CheckCircle, 
  LogOut, 
  Edit,
  Trophy,
  BarChart3,
  Clock
} from "lucide-react"
import { SignOutButton } from "@clerk/nextjs"
import { updateUser } from "@/app/actions/user"

interface ProfileContentProps {
  user: {
    userId: string
    name: string | null
    mission: string | null
    worldVision: string | null
    focusAreas: string | null
    onboarded: boolean
    createdAt: Date
    updatedAt: Date
  }
  goals: Array<{
    id: number
    title: string
    description: string | null
    category: string | null
    current_value: number
    target_value: number | null
    unit: string | null
    deadline: Date | null
    archived: boolean
    created_at: Date
    updated_at: Date
  }>
  tasks: Array<{
    id: number
    title: string
    description: string | null
    completed: boolean
    completed_at: Date | null
    createdAt: Date
    updatedAt: Date
  }>
}

export default function ProfileContent({ user, goals, tasks }: ProfileContentProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: user.name || "",
    mission: user.mission || "",
    worldVision: user.worldVision || "",
    focusAreas: user.focusAreas || ""
  })

  const handleUpdate = async (formDataObj: FormData) => {
    const result = await updateUser(formDataObj)
    if (result.success) {
      setIsEditing(false)
      window.location.reload() // Refresh to show updated data
    }
  }

  const completedGoals = goals.filter(goal => 
    goal.target_value ? goal.current_value >= goal.target_value : false
  )
  const activeGoals = goals.filter(goal => 
    goal.target_value ? goal.current_value < goal.target_value : true
  )
  const completedTasks = tasks.filter(task => task.completed)
  const activeTasks = tasks.filter(task => !task.completed)

  const focusAreasArray = user.focusAreas ? user.focusAreas.split(',').map(area => area.trim()) : []

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header with Profile Info and Logout */}
        <div className="mb-8">
          <Card className="border-l-4 border-l-[#28A745]">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-[#28A745] text-white rounded-full p-3">
                    <User className="h-8 w-8" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl text-gray-900">
                      {user.name || "Welcome, Founder!"}
                    </CardTitle>
                    <p className="text-gray-600 mt-1">
                      Member since {user.createdAt.toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Dialog open={isEditing} onOpenChange={setIsEditing}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="text-[#28A745] border-[#28A745]">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Edit Profile</DialogTitle>
                      </DialogHeader>
                      <form action={handleUpdate} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Name</Label>
                          <Input
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Your name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="mission">Mission</Label>
                          <Textarea
                            id="mission"
                            name="mission"
                            value={formData.mission}
                            onChange={(e) => setFormData(prev => ({ ...prev, mission: e.target.value }))}
                            placeholder="Your personal mission"
                            rows={3}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="worldVision">World Vision</Label>
                          <Textarea
                            id="worldVision"
                            name="worldVision"
                            value={formData.worldVision}
                            onChange={(e) => setFormData(prev => ({ ...prev, worldVision: e.target.value }))}
                            placeholder="Your vision for the world"
                            rows={3}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="focusAreas">Focus Areas</Label>
                          <Input
                            id="focusAreas"
                            name="focusAreas"
                            value={formData.focusAreas}
                            onChange={(e) => setFormData(prev => ({ ...prev, focusAreas: e.target.value }))}
                            placeholder="customer acquisition, product development, etc."
                          />
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                          <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                            Cancel
                          </Button>
                          <Button type="submit" className="bg-[#28A745] hover:bg-[#23923d]">
                            Save Changes
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                  <SignOutButton>
                    <Button variant="destructive">
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </SignOutButton>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Profile Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Mission & Vision */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                Personal Mission
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">
                {user.mission || "No mission statement provided yet. Click 'Edit Profile' to add one."}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-500" />
                World Vision
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">
                {user.worldVision || "No world vision provided yet. Click 'Edit Profile' to add one."}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Focus Areas */}
        {focusAreasArray.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-purple-500" />
                Focus Areas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {focusAreasArray.map((area, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary" 
                    className="bg-[#28A745] text-white hover:bg-[#23923d]"
                  >
                    {area}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Trophy className="h-8 w-8 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{completedGoals.length}</p>
                  <p className="text-sm text-gray-600">Goals Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Target className="h-8 w-8 text-[#28A745]" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{activeGoals.length}</p>
                  <p className="text-sm text-gray-600">Active Goals</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{completedTasks.length}</p>
                  <p className="text-sm text-gray-600">Tasks Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{activeTasks.length}</p>
                  <p className="text-sm text-gray-600">Active Tasks</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Goals and Tasks Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Goals */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-[#28A745]" />
                Recent Goals
              </CardTitle>
            </CardHeader>
            <CardContent>
              {goals.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No goals created yet</p>
              ) : (
                <div className="space-y-3">
                  {goals.slice(0, 5).map((goal) => {
                    const progress = goal.target_value ? (goal.current_value / goal.target_value) * 100 : 0
                    const isCompleted = goal.target_value ? goal.current_value >= goal.target_value : false
                    
                    return (
                      <div key={goal.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {isCompleted ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <Target className="h-4 w-4 text-[#28A745]" />
                          )}
                          <div>
                            <p className={`font-medium ${isCompleted ? "text-green-700" : ""}`}>
                              {goal.title}
                            </p>
                            <p className="text-xs text-gray-500">
                              {goal.current_value.toLocaleString()} / {goal.target_value?.toLocaleString()} {goal.unit}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{Math.round(progress)}%</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Tasks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-blue-500" />
                Recent Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No tasks created yet</p>
              ) : (
                <div className="space-y-3">
                  {tasks.slice(0, 5).map((task) => (
                    <div key={task.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      {task.completed ? (
                        <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      ) : (
                        <div className="h-4 w-4 border border-gray-300 rounded flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className={`font-medium ${task.completed ? "line-through text-gray-500" : ""}`}>
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="text-xs text-gray-500">{task.description}</p>
                        )}
                        {task.completed && task.completed_at && (
                          <p className="text-xs text-green-600">
                            Completed: {new Date(task.completed_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Navigation Links */}
        <div className="mt-8 flex justify-center gap-4">
          <Button asChild variant="outline">
            <a href="/dashboard">Return to Dashboard</a>
          </Button>
          <Button asChild variant="outline">
            <a href="/impact">View Impact</a>
          </Button>
          <Button asChild variant="outline">
            <a href="/analytics">View Analytics</a>
          </Button>
        </div>
      </div>
    </div>
  )
}