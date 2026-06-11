'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'

interface InvoiceItem {
  id: string
  description: string
  details?: string
  price: number
  quantity: number
}

interface ClientDB {
  id: string
  nombre: string
  telefono: string
  direccion: string
  email: string
}

export default function DashboardPage() {
  const supabase = createClient()

  // Fixed seller info
  const [seller, setSeller] = useState({
    name: "D'MOBEL CR",
    agent: "angel ortiz castillo",
    id: "113940958",
    address: "SAN JOSE",
    phone: "60485642"
  })

  // Buyer info
  const [buyer, setBuyer] = useState({
    name: "",
    address: "",
    phone: "",
    email: ""
  })

  // Invoice metadata
  const [invoiceNumber, setInvoiceNumber] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  // Items
  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: '1',
      description: 'Mueble de Bar',
      details: 'mueble de bar color blanco polar y aereo en green con luz en la parte interior y exterior Y puerta de vidrio con marco de aluminio Vidrio trasparente',
      price: 880000,
      quantity: 1
    }
  ])

  // Notes
  const [notes, setNotes] = useState(
    "Método de trabajo se da un adelanto del 60%\nAl iniciar y el otro 40% al finalizar la instalación\nDespués del primer pago se estimula 10 días para\nLa instalación"
  )

  // Financials
  const [advance, setAdvance] = useState<number>(528000)
  const [isCustomAdvance, setIsCustomAdvance] = useState(false)

  // Client suggestions
  const [savedClients, setSavedClients] = useState<ClientDB[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  // System states
  const [saveStatus, setSaveStatus] = useState<{ loading: boolean; success?: boolean; error?: string }>({
    loading: false
  })

  // Preview container reference for PDF generation
  const invoiceRef = useRef<HTMLDivElement>(null)

  // Calculations
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const balance = total - advance

  // Generate next logical invoice number and fetch clients
  useEffect(() => {
    async function initData() {
      // 1. Fetch saved clients for autocompletion
      const { data: clients } = await supabase.from('clientes').select('*')
      if (clients) setSavedClients(clients)

      // 2. Fetch invoice count to propose invoice number
      const { count, error } = await supabase.from('facturas').select('*', { count: 'exact', head: true })
      if (!error && count !== null) {
        setInvoiceNumber(`DM-${1001 + count}`)
      } else {
        setInvoiceNumber("DM-1001")
      }
    }
    initData()
  }, [])

  // Keep advance updated to 60% of total if not overridden by custom input
  useEffect(() => {
    if (!isCustomAdvance) {
      setAdvance(Math.round(total * 0.6))
    }
  }, [total, isCustomAdvance])

  const handleAddItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: '',
      details: '',
      price: 0,
      quantity: 1
    }
    setItems([...items, newItem])
  }

  const handleRemoveItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id))
    }
  }

  const handleItemChange = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value }
      }
      return item
    }))
  }

  // Format currency in Costa Rican Colones
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount).replace('CRC', '₡')
  }

  // PDF Generator helper
  const generatePDFBlobOrUrl = async (mode: 'download' | 'base64'): Promise<any> => {
    if (!invoiceRef.current) return null

    const html2canvas = (await import('html2canvas')).default
    const { jsPDF } = await import('jspdf')

    const canvas = await html2canvas(invoiceRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff'
    })

    const imgData = canvas.toDataURL('image/jpeg', 0.95)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()
    const canvasWidth = canvas.width
    const canvasHeight = canvas.height
    
    const ratio = Math.min(pdfWidth / (canvasWidth / 2.8), pdfHeight / (canvasHeight / 2.8))
    const imgWidth = (canvasWidth / 2.8) * ratio
    const imgHeight = (canvasHeight / 2.8) * ratio
    
    const marginX = (pdfWidth - imgWidth) / 2
    const marginY = 10

    pdf.addImage(imgData, 'JPEG', marginX, marginY, imgWidth, imgHeight)

    if (mode === 'download') {
      pdf.save(`Factura_${invoiceNumber}.pdf`)
      return null
    } else {
      return pdf.output('datauristring')
    }
  }

  const handleDownloadPDF = async () => {
    try {
      await generatePDFBlobOrUrl('download')
    } catch (err: any) {
      console.error("Error generating PDF:", err)
      alert("Error al generar el PDF: " + (err.message || err))
    }
  }

  // Save Invoice & Client details in Supabase
  const handleSaveInvoice = async () => {
    if (!buyer.name) {
      alert("Por favor ingresa el nombre del comprador.")
      return
    }

    setSaveStatus({ loading: true })

    try {
      // 1. Handle Client saving or retrieving
      let clientId = null
      
      const { data: existingClient } = await supabase
        .from('clientes')
        .select('id')
        .eq('nombre', buyer.name)
        .maybeSingle()

      if (existingClient) {
        clientId = existingClient.id
        // Update client info
        await supabase
          .from('clientes')
          .update({
            telefono: buyer.phone,
            direccion: buyer.address,
            email: buyer.email
          })
          .eq('id', clientId)
      } else {
        const { data: newClient, error: clientErr } = await supabase
          .from('clientes')
          .insert({
            nombre: buyer.name,
            telefono: buyer.phone,
            direccion: buyer.address,
            email: buyer.email
          })
          .select('id')
          .single()

        if (clientErr) throw clientErr
        clientId = newClient.id
      }

      // 2. Insert Invoice
      const { data: newInvoice, error: invoiceErr } = await supabase
        .from('facturas')
        .insert({
          numero: invoiceNumber,
          fecha: date,
          vendedor_nombre: seller.name,
          vendedor_cedula: seller.id,
          vendedor_direccion: seller.address,
          vendedor_telefono: seller.phone,
          vendedor_agente: seller.agent,
          cliente_id: clientId,
          notas: notes,
          adelanto: advance,
          saldo: balance,
          total: total
        })
        .select('id')
        .single()

      if (invoiceErr) {
        if (invoiceErr.code === '23505') {
          throw new Error(`El número de factura ${invoiceNumber} ya existe.`)
        }
        throw invoiceErr
      }

      // 3. Insert Invoice Items
      const itemsToInsert = items.map(item => ({
        factura_id: newInvoice.id,
        descripcion: item.description,
        detalles: item.details,
        precio: item.price,
        cantidad: item.quantity
      }))

      const { error: itemsErr } = await supabase.from('factura_items').insert(itemsToInsert)
      if (itemsErr) throw itemsErr

      setSaveStatus({ loading: false, success: true })
      alert("Factura guardada con éxito en la base de datos!")
      
      // Refresh client list
      const { data: updatedClients } = await supabase.from('clientes').select('*')
      if (updatedClients) setSavedClients(updatedClients)
    } catch (err: any) {
      console.error(err)
      setSaveStatus({ loading: false, error: err.message || 'Error al guardar la factura' })
    }
  }

  const selectClient = (client: ClientDB) => {
    setBuyer({
      name: client.nombre,
      address: client.direccion || '',
      phone: client.telefono || '',
      email: client.email || ''
    })
    setShowSuggestions(false)
  }

  return (
    <div className="max-w-7xl mx-auto pb-16">
      <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Generar Factura</h1>
          <p className="text-gray-500 mt-1">Completa los datos del cliente y los productos para la factura de D'Mobel.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Column */}
        <div className="lg:col-span-6 space-y-6">
          {/* Invoice Metadata */}
          <div className="bg-white rounded-xl border border-border-color p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 flex items-center gap-2">
              <span className="w-2 h-6 bg-primary rounded-full"></span>
              Datos de la Factura
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Número de Factura</label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Fecha de Emisión</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Seller Information */}
          <div className="bg-white rounded-xl border border-border-color p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 flex items-center gap-2">
              <span className="w-2 h-6 bg-primary rounded-full"></span>
              Información del Vendedor
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Vendedor</label>
                <input
                  type="text"
                  value={seller.agent}
                  onChange={(e) => setSeller({ ...seller, agent: e.target.value })}
                  className="w-full text-sm border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Nombre Comercial</label>
                <input
                  type="text"
                  value={seller.name}
                  onChange={(e) => setSeller({ ...seller, name: e.target.value })}
                  className="w-full text-sm border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Cédula</label>
                <input
                  type="text"
                  value={seller.id}
                  onChange={(e) => setSeller({ ...seller, id: e.target.value })}
                  className="w-full text-sm border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Teléfono</label>
                <input
                  type="text"
                  value={seller.phone}
                  onChange={(e) => setSeller({ ...seller, phone: e.target.value })}
                  className="w-full text-sm border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Dirección</label>
                <input
                  type="text"
                  value={seller.address}
                  onChange={(e) => setSeller({ ...seller, address: e.target.value })}
                  className="w-full text-sm border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Buyer Information (Autocompletable) */}
          <div className="bg-white rounded-xl border border-border-color p-6 shadow-sm relative">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 flex items-center gap-2">
              <span className="w-2 h-6 bg-primary rounded-full"></span>
              Información del Comprador
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 relative">
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Nombre Completo</label>
                <input
                  type="text"
                  value={buyer.name}
                  onChange={(e) => {
                    setBuyer({ ...buyer, name: e.target.value })
                    setShowSuggestions(true)
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="ej. Melissa Saborío"
                  className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-1 focus:ring-primary focus:outline-none"
                />
                {showSuggestions && buyer.name && (
                  <div className="absolute z-10 w-full bg-white border border-gray-200 mt-1 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {savedClients
                      .filter(c => c.nombre.toLowerCase().includes(buyer.name.toLowerCase()))
                      .map(client => (
                        <button
                          key={client.id}
                          type="button"
                          onClick={() => selectClient(client)}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors border-b border-gray-100 last:border-0"
                        >
                          <div className="font-semibold text-gray-800">{client.nombre}</div>
                          <div className="text-xs text-gray-500">{client.telefono} | {client.direccion}</div>
                        </button>
                      ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Teléfono</label>
                <input
                  type="text"
                  value={buyer.phone}
                  onChange={(e) => setBuyer({ ...buyer, phone: e.target.value })}
                  placeholder="ej. 88105918"
                  className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  value={buyer.email}
                  onChange={(e) => setBuyer({ ...buyer, email: e.target.value })}
                  placeholder="cliente@gmail.com"
                  className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Dirección de Entrega</label>
                <input
                  type="text"
                  value={buyer.address}
                  onChange={(e) => setBuyer({ ...buyer, address: e.target.value })}
                  placeholder="ej. Escazú, San José"
                  className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Items / Products Table */}
          <div className="bg-white rounded-xl border border-border-color p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-2 h-6 bg-primary rounded-full"></span>
                Detalle de la Factura (Tickets)
              </h2>
              <button
                type="button"
                onClick={handleAddItem}
                className="px-3 py-1.5 bg-blue-50 text-primary text-xs font-semibold rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors"
              >
                + Agregar Elemento
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={item.id} className="p-4 rounded-xl bg-gray-50 border border-gray-200 relative">
                  <div className="absolute top-2 right-2">
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-red-500 hover:text-red-700 text-sm font-semibold p-1"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-12 md:col-span-6">
                      <label className="block text-[10px] font-medium text-gray-500 uppercase mb-0.5">Título / Mueble</label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                        placeholder="ej. Mueble de Bar"
                        className="w-full text-sm border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-primary focus:outline-none bg-white"
                      />
                    </div>
                    <div className="col-span-6 md:col-span-3">
                      <label className="block text-[10px] font-medium text-gray-500 uppercase mb-0.5">Precio (₡)</label>
                      <input
                        type="number"
                        value={item.price || ''}
                        onChange={(e) => handleItemChange(item.id, 'price', Number(e.target.value))}
                        placeholder="0"
                        className="w-full text-sm border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-primary focus:outline-none bg-white"
                      />
                    </div>
                    <div className="col-span-6 md:col-span-3">
                      <label className="block text-[10px] font-medium text-gray-500 uppercase mb-0.5">Cantidad</label>
                      <input
                        type="number"
                        value={item.quantity || ''}
                        onChange={(e) => handleItemChange(item.id, 'quantity', Number(e.target.value))}
                        placeholder="1"
                        className="w-full text-sm border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-primary focus:outline-none bg-white"
                      />
                    </div>
                    <div className="col-span-12">
                      <label className="block text-[10px] font-medium text-gray-500 uppercase mb-0.5">Detalles del material / Acabados</label>
                      <textarea
                        value={item.details || ''}
                        onChange={(e) => handleItemChange(item.id, 'details', e.target.value)}
                        placeholder="Materiales, colores, instalación, etc."
                        rows={2}
                        className="w-full text-sm border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-primary focus:outline-none bg-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes and Advance Payments */}
          <div className="bg-white rounded-xl border border-border-color p-6 shadow-sm space-y-4">
            <div>
              <h2 className="text-lg font-semibold mb-3 text-gray-900 flex items-center gap-2">
                <span className="w-2 h-6 bg-primary rounded-full"></span>
                Notas Especiales
              </h2>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ingresa los términos de instalación o notas especiales..."
                rows={3}
                className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>

            <div className="border-t border-gray-100 pt-4">
              <h2 className="text-lg font-semibold mb-3 text-gray-900 flex items-center gap-2">
                <span className="w-2 h-6 bg-primary rounded-full"></span>
                Adelantos y Totales
              </h2>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    id="customAdvance"
                    checked={isCustomAdvance}
                    onChange={(e) => setIsCustomAdvance(e.target.checked)}
                    className="rounded text-primary focus:ring-primary"
                  />
                  <label htmlFor="customAdvance" className="text-sm text-gray-600">
                    Establecer adelanto personalizado (Desmarcado calcula 60%)
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Monto del Adelanto (₡)</label>
                  <input
                    type="number"
                    value={advance || ''}
                    onChange={(e) => {
                      setIsCustomAdvance(true)
                      setAdvance(Number(e.target.value))
                    }}
                    disabled={!isCustomAdvance}
                    className={`w-full text-sm border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-primary focus:outline-none ${!isCustomAdvance ? 'bg-gray-100 text-gray-500' : 'bg-white'}`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Preview Column */}
        <div className="lg:col-span-6">
          <div className="sticky top-6">
            <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
              <h2 className="text-lg font-semibold text-gray-900">Vista Previa de la Factura</h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSaveInvoice}
                  disabled={saveStatus.loading}
                  className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-hover shadow-sm disabled:opacity-50 transition-colors"
                >
                  {saveStatus.loading ? 'Guardando...' : 'Guardar Factura'}
                </button>
                <button
                  type="button"
                  onClick={handleDownloadPDF}
                  className="px-5 py-2.5 bg-white text-gray-700 text-sm font-semibold rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors shadow-sm"
                >
                  Descargar PDF
                </button>
              </div>
            </div>

            {/* Error/Success Feedbacks */}
            {saveStatus.error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 rounded-lg mb-4">
                <strong>Error al guardar:</strong> {saveStatus.error}
              </div>
            )}
            {saveStatus.success && (
              <div className="bg-green-50 border border-green-200 text-green-700 text-xs px-4 py-3 rounded-lg mb-4">
                ¡La factura se ha guardado exitosamente en la base de datos!
              </div>
            )}

            {/* Document Frame */}
            <div 
              ref={invoiceRef} 
              className="bg-white border border-gray-300 rounded-xl shadow-lg p-8 max-w-[600px] mx-auto text-gray-800 font-sans" 
              style={{ minHeight: '800px' }}
            >
              {/* Header */}
              <div className="flex justify-between items-start border-b-2 border-gray-900 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <img 
                    src="/logo.png" 
                    alt="D'Mobel Logo" 
                    className="w-14 h-14 object-contain rounded-full bg-white" 
                  />
                  <div className="flex flex-col">
                    <span className="text-lg font-bold tracking-tight text-gray-900">D'MOBEL CR</span>
                    <span className="text-[10px] text-gray-500 tracking-wider">Mueblería y Diseño</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-gray-900 block mb-1">FACTURA #{invoiceNumber}</span>
                  <div className="w-32 h-[1px] bg-gray-300 ml-auto mb-3"></div>
                  <span className="text-xs text-gray-500">Fecha {date.split('-').reverse().join('/')}</span>
                </div>
              </div>

              {/* Vendor & Buyer details */}
              <div className="grid grid-cols-2 gap-4 text-xs mb-6">
                <div className="border-r border-gray-200 pr-4">
                  <p className="font-bold uppercase tracking-wider mb-2 text-gray-900">VENDEDOR {seller.agent}</p>
                  <table className="w-full">
                    <tbody>
                      <tr>
                        <td className="text-gray-500 uppercase pr-2 py-0.5">CEDULA</td>
                        <td className="font-semibold">{seller.id}</td>
                      </tr>
                      <tr>
                        <td className="text-gray-500 uppercase pr-2 py-0.5">NOMBRE</td>
                        <td className="font-semibold">{seller.name}</td>
                      </tr>
                      <tr>
                        <td className="text-gray-500 uppercase pr-2 py-0.5">DIRECCION</td>
                        <td className="font-semibold">{seller.address}</td>
                      </tr>
                      <tr>
                        <td className="text-gray-500 uppercase pr-2 py-0.5">Tel.</td>
                        <td className="font-semibold">{seller.phone}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="pl-4">
                  <p className="font-bold uppercase tracking-wider mb-2 text-gray-900">COMPRADOR</p>
                  <table className="w-full">
                    <tbody>
                      <tr>
                        <td className="text-gray-500 uppercase pr-2 py-0.5">NOMBRE</td>
                        <td className="font-semibold min-h-[16px] inline-block">{buyer.name || '—'}</td>
                      </tr>
                      <tr>
                        <td className="text-gray-500 uppercase pr-2 py-0.5">DIRECCION</td>
                        <td className="font-semibold min-h-[16px] inline-block">{buyer.address || '—'}</td>
                      </tr>
                      <tr>
                        <td className="text-gray-500 uppercase pr-2 py-0.5">Tel.</td>
                        <td className="font-semibold min-h-[16px] inline-block">{buyer.phone || '—'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Separation line */}
              <div className="border-b-2 border-gray-900 mb-4"></div>

              {/* Items Table */}
              <div className="mb-6">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="font-bold uppercase tracking-wider border-b border-gray-300 text-gray-900">
                      <th className="py-2 w-10"></th>
                      <th className="py-2">DESCRIPCION</th>
                      <th className="py-2 text-right">PRECIO</th>
                      <th className="py-2 text-right">CANTIDAD</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={item.id} className="border-b border-gray-100 align-top">
                        <td className="py-3 text-gray-500">{index + 1}</td>
                        <td className="py-3 pr-4">
                          <p className="font-bold text-gray-900">{item.description || 'Sin descripción'}</p>
                          {item.details && (
                            <p className="text-[10px] text-gray-500 mt-1 whitespace-pre-line leading-relaxed">
                              {item.details}
                            </p>
                          )}
                        </td>
                        <td className="py-3 text-right">
                          {item.price > 0 ? formatCurrency(item.price) : '—'}
                        </td>
                        <td className="py-3 text-right">
                          {item.quantity ? item.quantity.toFixed(2).replace('.', ',') : '0,00'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Notes */}
              <div className="mb-8">
                <p className="text-xs font-bold uppercase tracking-wider border-b border-gray-300 pb-1 mb-2 text-gray-900">NOTA</p>
                <p className="text-[10px] text-gray-500 whitespace-pre-line leading-relaxed">
                  {notes || 'Sin notas especiales.'}
                </p>
              </div>

              {/* Totals Box */}
              <div className="w-72 ml-auto text-xs border-t-2 border-gray-900 pt-3 space-y-2">
                <div className="flex justify-between items-center font-bold">
                  <span className="uppercase text-gray-900">ADELANTO</span>
                  <span>{formatCurrency(advance)}</span>
                </div>
                <div className="flex justify-between items-center font-bold">
                  <span className="uppercase text-gray-900">SALDO</span>
                  <span>{formatCurrency(balance)}</span>
                </div>
                <div className="flex justify-between items-center bg-blue-100 text-primary p-2.5 rounded font-bold text-sm">
                  <span className="uppercase">TOTAL</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
