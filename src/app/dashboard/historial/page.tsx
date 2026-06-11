'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

interface Invoice {
  id: string
  numero: string
  fecha: string
  total: number
  adelanto: number
  saldo: number
  clientes: {
    nombre: string
    email: string
  } | null
}

export default function HistorialPage() {
  const supabase = createClient()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)

  // Report Metrics
  const [metrics, setMetrics] = useState({
    weeklyTotal: 0,
    monthlyTotal: 0,
    pendingBalance: 0,
    totalSales: 0
  })

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      // Fetch invoices with client details
      const { data, error } = await supabase
        .from('facturas')
        .select(`
          id,
          numero,
          fecha,
          total,
          adelanto,
          saldo,
          clientes (
            nombre,
            email
          )
        `)
        .order('fecha', { ascending: false })

      if (error) {
        console.error(error)
      } else if (data) {
        // cast because of potential array type from joins
        const formattedData = data as unknown as Invoice[]
        setInvoices(formattedData)
        calculateReports(formattedData)
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  const calculateReports = (data: Invoice[]) => {
    const now = new Date()
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(now.getDate() - 7)

    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(now.getMonth() - 1)

    let weekly = 0
    let monthly = 0
    let pending = 0
    let total = 0

    data.forEach(inv => {
      const invDate = new Date(inv.fecha)
      total += Number(inv.total)
      pending += Number(inv.saldo)

      if (invDate >= oneWeekAgo) {
        weekly += Number(inv.total)
      }
      if (invDate >= oneMonthAgo) {
        monthly += Number(inv.total)
      }
    })

    setMetrics({
      weeklyTotal: weekly,
      monthlyTotal: monthly,
      pendingBalance: pending,
      totalSales: total
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount).replace('CRC', '₡')
  }

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Historial y Reportes</h1>
        <p className="text-gray-500 mt-1">Monitorea tus ventas y el historial de facturación de la tienda.</p>
      </header>

      {/* Report Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="bg-white p-6 rounded-xl border border-border-color shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Ventas Semanales</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.weeklyTotal)}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-border-color shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Ventas Mensuales</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.monthlyTotal)}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-border-color shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Saldos por Cobrar</p>
          <p className="text-2xl font-bold text-amber-600">{formatCurrency(metrics.pendingBalance)}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-border-color shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Ventas Totales</p>
          <p className="text-2xl font-bold text-primary">{formatCurrency(metrics.totalSales)}</p>
        </div>
      </div>

      {/* Invoice Table */}
      <div className="bg-white rounded-xl border border-border-color shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border-color">
          <h2 className="font-semibold text-gray-900">Historial de Facturas Emitidas</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Cargando facturas...</div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No se han emitido facturas aún.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs text-gray-700 uppercase border-b border-border-color font-semibold">
                <tr>
                  <th className="px-6 py-3">Número</th>
                  <th className="px-6 py-3">Fecha</th>
                  <th className="px-6 py-3">Cliente</th>
                  <th className="px-6 py-3 text-right">Adelanto</th>
                  <th className="px-6 py-3 text-right">Saldo</th>
                  <th className="px-6 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(invoice => (
                  <tr key={invoice.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-900">{invoice.numero}</td>
                    <td className="px-6 py-4">{new Date(invoice.fecha).toLocaleDateString('es-CR')}</td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{invoice.clientes?.nombre || '—'}</p>
                        <p className="text-xs text-gray-500">{invoice.clientes?.email || ''}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">{formatCurrency(invoice.adelanto)}</td>
                    <td className="px-6 py-4 text-right text-amber-600 font-medium">{formatCurrency(invoice.saldo)}</td>
                    <td className="px-6 py-4 text-right font-bold text-gray-900">{formatCurrency(invoice.total)}</td>
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
