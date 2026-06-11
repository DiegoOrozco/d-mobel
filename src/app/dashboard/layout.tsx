import Link from 'next/link'
import Image from 'next/image'
import { logout } from '@/app/login/actions'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

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
    <div className="flex h-screen bg-secondary">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-border-color flex flex-col shadow-sm">
        <div className="h-20 flex items-center px-6 border-b border-border-color">
          <div className="flex items-center gap-3">
            <Image 
              src="/logo.png" 
              alt="D'Mobel Logo" 
              width={35} 
              height={35} 
              className="object-contain rounded-full" 
            />
            <span className="font-semibold text-lg tracking-wide text-primary">MOBEL</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 flex flex-col gap-2 overflow-y-auto">
          <span className="text-[10px] font-bold text-gray-400 px-4 uppercase tracking-wider mb-2">Facturación</span>
          <Link href="/dashboard" className="px-4 py-2 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
            Generar Factura
          </Link>
          <Link href="/dashboard/historial" className="px-4 py-2 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
            Historial de Facturas
          </Link>
          <Link href="/dashboard/clientes" className="px-4 py-2 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
            Directorio Clientes
          </Link>

          <span className="text-[10px] font-bold text-gray-400 px-4 uppercase tracking-wider mt-6 mb-2">Página Web</span>
          <Link href="/dashboard/landing" className="px-4 py-2 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
            Editar Landing Page
          </Link>

          <span className="text-[10px] font-bold text-gray-400 px-4 uppercase tracking-wider mt-6 mb-2">Sistema</span>
          <Link href="/dashboard/admins" className="px-4 py-2 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
            Administradores
          </Link>
        </nav>

        <div className="p-4 border-t border-border-color">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
              👤
            </div>
            <div className="text-xs overflow-hidden">
              <p className="font-medium text-gray-900 truncate">Administrador</p>
              <p className="text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
          <form action={logout}>
            <button className="w-full px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors text-left">
              Cerrar Sesión
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow overflow-auto bg-gray-50">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
