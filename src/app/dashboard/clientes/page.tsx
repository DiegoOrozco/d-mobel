'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

interface Client {
  id: string
  nombre: string
  telefono: string
  direccion: string
  email: string
  created_at: string
}

export default function ClientesPage() {
  const supabase = createClient()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchClients() {
      setLoading(true)
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('nombre')

      if (error) {
        console.error(error)
      } else if (data) {
        setClients(data)
      }
      setLoading(false)
    }
    fetchClients()
  }, [])

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Directorio de Clientes</h1>
        <p className="text-gray-500 mt-1">Administra los contactos de los clientes guardados en el sistema.</p>
      </header>

      <div className="bg-white rounded-xl border border-border-color shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border-color">
          <h2 className="font-semibold text-gray-900">Clientes Guardados</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Cargando directorio...</div>
        ) : clients.length === 0 ? (
          <div className="p-12 text-center text-gray-500">Aún no hay clientes guardados en el sistema.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs text-gray-700 uppercase border-b border-border-color font-semibold">
                <tr>
                  <th className="px-6 py-3">Nombre</th>
                  <th className="px-6 py-3">Teléfono</th>
                  <th className="px-6 py-3">Correo Electrónico</th>
                  <th className="px-6 py-3">Dirección por Defecto</th>
                  <th className="px-6 py-3">Fecha de Registro</th>
                </tr>
              </thead>
              <tbody>
                {clients.map(client => (
                  <tr key={client.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-900">{client.nombre}</td>
                    <td className="px-6 py-4">{client.telefono || '—'}</td>
                    <td className="px-6 py-4">{client.email || '—'}</td>
                    <td className="px-6 py-4">{client.direccion || '—'}</td>
                    <td className="px-6 py-4">{new Date(client.created_at).toLocaleDateString('es-CR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
