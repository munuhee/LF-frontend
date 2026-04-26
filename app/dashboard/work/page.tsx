'use client'

import { useAuth } from '@/lib/auth-context'
import AnnotatorWork from './_annotator'
import ReviewerWork from './_reviewer'
import AdminWork from './_admin'

export default function WorkPage() {
  const { user } = useAuth()
  if (!user) return null
  if (user.role === 'annotator') return <AnnotatorWork />
  if (user.role === 'reviewer') return <ReviewerWork />
  return <AdminWork />
}
