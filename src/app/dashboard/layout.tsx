import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import ResponsiveDashboardLayout from '@/app/components/ResponsiveDashboardLayout'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <ResponsiveDashboardLayout userEmail={user.email}>
      {children}
    </ResponsiveDashboardLayout>
  )
}
