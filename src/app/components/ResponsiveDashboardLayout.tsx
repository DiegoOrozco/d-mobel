'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/login/actions'

interface ResponsiveDashboardLayoutProps {
  children: React.ReactNode
  userEmail?: string
}

export default function ResponsiveDashboardLayout({
  children,
  userEmail,
}: ResponsiveDashboardLayoutProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const navItems = [
    { label: 'Generar Factura', href: '/dashboard', category: 'Facturación' },
    { label: 'Historial de Facturas', href: '/dashboard/historial', category: 'Facturación' },
    { label: 'Directorio Clientes', href: '/dashboard/clientes', category: 'Facturación' },
    { label: 'Editar Landing Page', href: '/dashboard/landing', category: 'Página Web' },
    { label: 'Administradores', href: '/dashboard/admins', category: 'Sistema' },
  ]

  const categories = ['Facturación', 'Página Web', 'Sistema']

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white">
      {/* Brand Header */}
      <div className="h-16 md:h-20 flex items-center justify-between px-6 border-b border-border-color">
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
        {/* Mobile close button */}
        <button 
          onClick={() => setIsOpen(false)}
          className="md:hidden p-2 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100"
          aria-label="Cerrar menú"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-4 py-6 flex flex-col gap-2 overflow-y-auto">
        {categories.map((cat) => (
          <div key={cat} className="flex flex-col gap-1 mb-4">
            <span className="text-[10px] font-bold text-gray-400 px-4 uppercase tracking-wider mb-1">{cat}</span>
            {navItems
              .filter((item) => item.category === cat)
              .map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-primary font-semibold'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              })}
          </div>
        ))}
      </nav>

      {/* User Info & Sign Out */}
      <div className="p-4 border-t border-border-color">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-sm">
            👤
          </div>
          <div className="text-xs overflow-hidden flex-1">
            <p className="font-medium text-gray-900 truncate">Administrador</p>
            <p className="text-gray-500 truncate" title={userEmail}>{userEmail}</p>
          </div>
        </div>
        <form action={logout}>
          <button className="w-full px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors text-left flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Cerrar Sesión
          </button>
        </form>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50 overflow-hidden">
      {/* Mobile Top Navbar */}
      <header className="md:hidden flex items-center justify-between px-6 h-16 bg-white border-b border-border-color z-30 shrink-0">
        <div className="flex items-center gap-3">
          <Image 
            src="/logo.png" 
            alt="D'Mobel Logo" 
            width={30} 
            height={30} 
            className="object-contain rounded-full" 
          />
          <span className="font-semibold text-base tracking-wide text-primary">D'MOBEL</span>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
          aria-label="Abrir menú"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </header>

      {/* Sidebar Drawer Backdrop for mobile overlay */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="md:hidden fixed inset-0 bg-black/40 z-40 transition-opacity"
        />
      )}

      {/* Mobile drawer container */}
      <aside 
        className={`md:hidden fixed top-0 bottom-0 left-0 w-64 bg-white z-50 transform transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:block w-64 bg-white border-r border-border-color shrink-0 shadow-sm z-20">
        {sidebarContent}
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow overflow-y-auto bg-gray-50 focus:outline-none">
        <div className="p-4 md:p-8 max-w-full">
          {children}
        </div>
      </main>
    </div>
  )
}
