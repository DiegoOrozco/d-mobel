'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'

export default function AdminsPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{ success?: boolean; error?: string }>({})

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setStatus({})

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
        }
      })

      if (error) throw error

      setStatus({ success: true })
      setEmail('')
      setPassword('')
      alert("Usuario administrador registrado exitosamente! Si tienes habilitada la confirmación por correo, el nuevo administrador deberá verificar su casilla antes de poder ingresar.")
    } catch (err: any) {
      console.error(err)
      setStatus({ error: err.message || 'Error al crear el administrador' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto pb-16">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Administradores</h1>
        <p className="text-gray-500 mt-1">Crea nuevas cuentas de administrador para gestionar D'Mobel.</p>
      </header>

      <div className="bg-white rounded-xl border border-border-color p-8 shadow-sm">
        <h2 className="text-lg font-semibold mb-6 text-gray-900 flex items-center gap-2">
          <span className="w-2 h-6 bg-primary rounded-full"></span>
          Registrar Administrador
        </h2>

        {status.error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4 text-sm">
            <strong>Error:</strong> {status.error}
          </div>
        )}

        {status.success && (
          <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg mb-4 text-sm">
            Administrador creado con éxito.
          </div>
        )}

        <form onSubmit={handleCreateAdmin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
              Correo Electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@correo.com"
              required
              className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-1 focus:ring-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
              Contraseña Temporal
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña del nuevo admin"
              required
              minLength={6}
              className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-1 focus:ring-primary focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white font-semibold py-3 rounded-lg hover:bg-primary-hover shadow transition-colors disabled:opacity-50 mt-4"
          >
            {loading ? 'Creando...' : 'Crear Administrador'}
          </button>
        </form>
      </div>
    </div>
  )
}
