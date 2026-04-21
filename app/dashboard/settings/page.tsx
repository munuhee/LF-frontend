'use client'

import { useState } from 'react'
import { Bell, User, Shield, Palette, Globe, Download, Moon, Sun, Monitor, Save } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TopBar } from '@/components/top-bar'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { useAuth } from '@/lib/auth-context'
import { api } from '@/lib/api'
import { useTheme } from 'next-themes'

export default function SettingsPage() {
  const { user, setUser } = useAuth()
  const { theme, setTheme } = useTheme()
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(true)
  const [taskReminders, setTaskReminders] = useState(true)
  const [reviewAlerts, setReviewAlerts] = useState(true)
  const [name, setName] = useState(user?.name || '')
  const [department, setDepartment] = useState(user?.department || '')
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleSaveProfile = async () => {
    if (!user) return
    setIsSaving(true)
    try {
      const updated = await api.users.update(user.id, { name, department })
      setUser({ ...user, name: updated.name, department: updated.department })
      setSaveMessage('Profile updated successfully')
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (e: unknown) {
      setSaveMessage(e instanceof Error ? e.message : 'Failed to update')
    } finally {
      setIsSaving(false)
    }
  }

  if (!user) return null

  return (
    <>
      <TopBar title="Settings" subtitle="Manage your account and preferences" />
      <main className="flex-1 overflow-y-auto p-4 lg:p-6">
        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList className="bg-card border border-border h-9">
            <TabsTrigger value="profile" className="flex items-center gap-1.5 text-xs"><User className="h-3.5 w-3.5" />Profile</TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-1.5 text-xs"><Bell className="h-3.5 w-3.5" />Notifications</TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-1.5 text-xs"><Palette className="h-3.5 w-3.5" />Preferences</TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-1.5 text-xs"><Shield className="h-3.5 w-3.5" />Security</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card className="border-border bg-card">
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Profile Information</CardTitle>
                <CardDescription className="text-xs">Update your account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel className="text-xs">Name</FieldLabel>
                    <Input value={name} onChange={e => setName(e.target.value)} className="bg-secondary/30 h-9" />
                  </Field>
                  <Field>
                    <FieldLabel className="text-xs">Email</FieldLabel>
                    <Input value={user.email} className="bg-secondary/30 h-9" disabled />
                  </Field>
                  <Field>
                    <FieldLabel className="text-xs">Department</FieldLabel>
                    <Input value={department} onChange={e => setDepartment(e.target.value)} className="bg-secondary/30 h-9" />
                  </Field>
                  <Field>
                    <FieldLabel className="text-xs">Role</FieldLabel>
                    <Input value={user.role} className="bg-secondary/30 h-9 capitalize" disabled />
                  </Field>
                </div>
                {saveMessage && <p className="text-xs text-success">{saveMessage}</p>}
                <Button size="sm" className="h-8 text-xs gap-1.5" onClick={handleSaveProfile} disabled={isSaving}>
                  <Save className="h-3.5 w-3.5" />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardContent>
            </Card>

            {/* Badges */}
            {user.badges && user.badges.length > 0 && (
              <Card className="border-border bg-card mt-4">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">Your Badges</CardTitle>
                  <CardDescription className="text-xs">Earned credentials and certifications</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {user.badges.map((badge, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                        <span className="text-xs font-medium text-primary">{badge.name}</span>
                        <span className="text-[10px] text-muted-foreground capitalize">{badge.type}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="notifications">
            <Card className="border-border bg-card">
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Notification Settings</CardTitle>
                <CardDescription className="text-xs">Configure how you receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: 'Email Notifications', desc: 'Receive notifications via email', value: emailNotifications, onChange: setEmailNotifications },
                  { label: 'Push Notifications', desc: 'Receive browser push notifications', value: pushNotifications, onChange: setPushNotifications },
                  { label: 'Task Reminders', desc: 'Get reminders for upcoming deadlines', value: taskReminders, onChange: setTaskReminders },
                  { label: 'Review Alerts', desc: 'Notifications when reviews are completed', value: reviewAlerts, onChange: setReviewAlerts },
                ].map((item, i) => (
                  <div key={i}>
                    {i > 0 && <Separator className="mb-4" />}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                      <Switch checked={item.value} onCheckedChange={item.onChange} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences">
            <Card className="border-border bg-card">
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Preferences</CardTitle>
                <CardDescription className="text-xs">Customize your experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Field>
                  <FieldLabel className="text-xs flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" />Language</FieldLabel>
                  <Select defaultValue="en">
                    <SelectTrigger className="w-[180px] bg-secondary/30 h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Separator />
                <div>
                  <FieldLabel className="text-xs flex items-center gap-1.5 mb-3"><Palette className="h-3.5 w-3.5" />Theme</FieldLabel>
                  <div className="flex gap-2">
                    {[
                      { value: 'light', icon: Sun, label: 'Light' },
                      { value: 'dark', icon: Moon, label: 'Dark' },
                      { value: 'system', icon: Monitor, label: 'System' },
                    ].map(t => (
                      <Button key={t.value} variant={theme === t.value ? 'default' : 'outline'} size="sm"
                        onClick={() => setTheme(t.value)} className="h-8 text-xs">
                        <t.icon className="h-3.5 w-3.5 mr-1.5" />{t.label}
                      </Button>
                    ))}
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="text-sm font-medium mb-1 flex items-center gap-1.5"><Download className="h-3.5 w-3.5" />LabelForge Extension</p>
                  <p className="text-xs text-muted-foreground mb-3">Install to track activity during Agentic AI tasks.</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="h-8 text-xs">Chrome</Button>
                    <Button variant="outline" size="sm" className="h-8 text-xs">Firefox</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card className="border-border bg-card">
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Security Settings</CardTitle>
                <CardDescription className="text-xs">Manage your account security</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-3">Change Password</h4>
                  <FieldGroup className="gap-3 max-w-sm">
                    <Field>
                      <FieldLabel className="text-xs">Current Password</FieldLabel>
                      <Input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="bg-secondary/30 h-9" />
                    </Field>
                    <Field>
                      <FieldLabel className="text-xs">New Password</FieldLabel>
                      <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="bg-secondary/30 h-9" />
                    </Field>
                    <Field>
                      <FieldLabel className="text-xs">Confirm New Password</FieldLabel>
                      <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="bg-secondary/30 h-9" />
                    </Field>
                    <Button size="sm" className="w-fit h-8 text-xs">Update Password</Button>
                  </FieldGroup>
                </div>
                <Separator />
                <div>
                  <h4 className="text-sm font-medium mb-2">Two-Factor Authentication</h4>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-success/10 border border-success/20">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-success" />
                      <div>
                        <p className="text-sm font-medium">2FA Enabled</p>
                        <p className="text-xs text-muted-foreground">Protected with email-based OTP</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="h-7 text-xs">Manage</Button>
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
