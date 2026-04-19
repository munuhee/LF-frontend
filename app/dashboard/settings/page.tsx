"use client"

import { useState } from "react"
import { Bell, User, Shield, Palette, Globe, Download, Moon, Sun, Monitor } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TopBar } from "@/components/top-bar"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { defaultUser } from "@/lib/dummy-data"
import { useAuth } from "@/lib/auth-context"
import { useTheme } from "next-themes"

export default function SettingsPage() {
  const { user } = useAuth()
  const currentUser = user || defaultUser
  const { theme, setTheme } = useTheme()
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(true)
  const [taskReminders, setTaskReminders] = useState(true)
  const [reviewAlerts, setReviewAlerts] = useState(true)

  return (
    <>
      <TopBar title="Settings" subtitle="Manage your account and preferences" />
      
      <main className="flex-1 overflow-y-auto p-4 lg:p-6">
        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList className="bg-card border border-border h-9">
            <TabsTrigger value="profile" className="flex items-center gap-1.5 text-xs">
              <User className="h-3.5 w-3.5" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-1.5 text-xs">
              <Bell className="h-3.5 w-3.5" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-1.5 text-xs">
              <Palette className="h-3.5 w-3.5" />
              Preferences
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-1.5 text-xs">
              <Shield className="h-3.5 w-3.5" />
              Security
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card className="border-border bg-card">
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Profile Information</CardTitle>
                <CardDescription className="text-xs">Your account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel className="text-xs">Name</FieldLabel>
                    <Input value={currentUser.name} className="bg-secondary/30 h-9" disabled />
                  </Field>
                  <Field>
                    <FieldLabel className="text-xs">Email</FieldLabel>
                    <Input value={currentUser.email} className="bg-secondary/30 h-9" disabled />
                  </Field>
                  <Field>
                    <FieldLabel className="text-xs">Department</FieldLabel>
                    <Input value={currentUser.department || ""} className="bg-secondary/30 h-9" disabled />
                  </Field>
                  <Field>
                    <FieldLabel className="text-xs">Role</FieldLabel>
                    <Input value={currentUser.role} className="bg-secondary/30 h-9 capitalize" disabled />
                  </Field>
                </div>
                <p className="text-xs text-muted-foreground">
                  Contact your administrator to update profile information.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card className="border-border bg-card">
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Notification Settings</CardTitle>
                <CardDescription className="text-xs">Configure how you receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Email Notifications</p>
                    <p className="text-xs text-muted-foreground">Receive notifications via email</p>
                  </div>
                  <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Push Notifications</p>
                    <p className="text-xs text-muted-foreground">Receive browser push notifications</p>
                  </div>
                  <Switch checked={pushNotifications} onCheckedChange={setPushNotifications} />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Task Reminders</p>
                    <p className="text-xs text-muted-foreground">Get reminders for upcoming deadlines</p>
                  </div>
                  <Switch checked={taskReminders} onCheckedChange={setTaskReminders} />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Review Alerts</p>
                    <p className="text-xs text-muted-foreground">Notifications when reviews are completed</p>
                  </div>
                  <Switch checked={reviewAlerts} onCheckedChange={setReviewAlerts} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences">
            <Card className="border-border bg-card">
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Preferences</CardTitle>
                <CardDescription className="text-xs">Customize your experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Field>
                  <FieldLabel className="text-xs flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5" />
                    Language
                  </FieldLabel>
                  <Select defaultValue="en">
                    <SelectTrigger className="w-[180px] bg-secondary/30 h-9">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>

                <Separator />

                <div>
                  <FieldLabel className="text-xs flex items-center gap-1.5 mb-3">
                    <Palette className="h-3.5 w-3.5" />
                    Theme
                  </FieldLabel>
                  <div className="flex gap-2">
                    <Button
                      variant={theme === "light" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTheme("light")}
                      className="h-8 text-xs"
                    >
                      <Sun className="h-3.5 w-3.5 mr-1.5" />
                      Light
                    </Button>
                    <Button
                      variant={theme === "dark" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTheme("dark")}
                      className="h-8 text-xs"
                    >
                      <Moon className="h-3.5 w-3.5 mr-1.5" />
                      Dark
                    </Button>
                    <Button
                      variant={theme === "system" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTheme("system")}
                      className="h-8 text-xs"
                    >
                      <Monitor className="h-3.5 w-3.5 mr-1.5" />
                      System
                    </Button>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-sm font-medium text-foreground mb-1 flex items-center gap-1.5">
                    <Download className="h-3.5 w-3.5" />
                    LabelForge Extension
                  </p>
                  <p className="text-xs text-muted-foreground mb-3">
                    Install the browser extension to track activity during Agentic AI tasks.
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="h-8 text-xs">Chrome</Button>
                    <Button variant="outline" size="sm" className="h-8 text-xs">Firefox</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card className="border-border bg-card">
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Security Settings</CardTitle>
                <CardDescription className="text-xs">Manage your account security</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-3">Change Password</h4>
                  <FieldGroup className="gap-3 max-w-sm">
                    <Field>
                      <FieldLabel className="text-xs">Current Password</FieldLabel>
                      <Input type="password" className="bg-secondary/30 h-9" />
                    </Field>
                    <Field>
                      <FieldLabel className="text-xs">New Password</FieldLabel>
                      <Input type="password" className="bg-secondary/30 h-9" />
                    </Field>
                    <Field>
                      <FieldLabel className="text-xs">Confirm New Password</FieldLabel>
                      <Input type="password" className="bg-secondary/30 h-9" />
                    </Field>
                    <Button size="sm" className="w-fit h-8 text-xs">Update Password</Button>
                  </FieldGroup>
                </div>

                <Separator />

                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2">Two-Factor Authentication</h4>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-success/10 border border-success/20">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-success" />
                      <div>
                        <p className="text-sm font-medium text-foreground">2FA Enabled</p>
                        <p className="text-xs text-muted-foreground">Protected with email-based 2FA</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="h-7 text-xs">Manage</Button>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2">Active Sessions</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/30">
                      <div>
                        <p className="text-sm font-medium text-foreground">Chrome on MacOS</p>
                        <p className="text-[10px] text-muted-foreground">Current session</p>
                      </div>
                      <span className="text-[10px] text-success">Active now</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </>
  )
}
