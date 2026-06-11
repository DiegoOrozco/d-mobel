'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

interface ServiceItem {
  id?: string
  titulo: string
  descripcion: string
}

interface ProductItem {
  id?: string
  nombre: string
  descripcion: string
  precio?: number
  imagen_url?: string
}

interface ProjectItem {
  id?: string
  titulo: string
  descripcion: string
  imagen_url: string
}

export default function LandingEditorPage() {
  const supabase = createClient()

  // Hero section and general configs
  const [heroTitle, setHeroTitle] = useState("Muebles que inspiran tu espacio.")
  const [heroSubtitle, setHeroSubtitle] = useState("Transformamos la madera en obras de arte funcionales. Calidad, diseño y confort en cada detalle para tu hogar u oficina.")
  
  // Services
  const [services, setServices] = useState<ServiceItem[]>([
    { titulo: "Diseño a Medida", descripcion: "Creamos muebles que se adaptan perfectamente a las dimensiones y estilo de tus espacios." },
    { titulo: "Materiales Premium", descripcion: "Seleccionamos cuidadosamente maderas y acabados de la más alta calidad para asegurar durabilidad." },
    { titulo: "Instalación Experta", descripcion: "Nuestro equipo se encarga de que todo quede perfecto, cuidando cada detalle en tu hogar." }
  ])

  // Products
  const [products, setProducts] = useState<ProductItem[]>([])

  // Projects (Galería Slider)
  const [projects, setProjects] = useState<ProjectItem[]>([])

  const [loading, setLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<{ success?: boolean; error?: string }>({})

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        // 1. Load general content
        const { data: contents } = await supabase.from('landing_content').select('*')
        if (contents && contents.length > 0) {
          const title = contents.find(c => c.key === 'hero_title')?.value
          const subtitle = contents.find(c => c.key === 'hero_subtitle')?.value
          if (title) setHeroTitle(title)
          if (subtitle) setHeroSubtitle(subtitle)
        }

        // 2. Load services
        const { data: dbServices } = await supabase.from('landing_servicios').select('*').order('orden')
        if (dbServices && dbServices.length > 0) {
          setServices(dbServices.map(s => ({ id: s.id, titulo: s.titulo, descripcion: s.descripcion })))
        }

        // 3. Load products
        const { data: dbProducts } = await supabase.from('landing_productos').select('*').order('orden')
        if (dbProducts) {
          setProducts(dbProducts.map(p => ({ id: p.id, nombre: p.nombre, descripcion: p.descripcion || '', precio: p.precio, imagen_url: p.imagen_url || '' })))
        }

        // 4. Load projects
        const { data: dbProjects } = await supabase.from('landing_proyectos').select('*').order('orden')
        if (dbProjects) {
          setProjects(dbProjects.map(pr => ({ id: pr.id, titulo: pr.titulo, descripcion: pr.descripcion || '', imagen_url: pr.imagen_url })))
        }
      } catch (err) {
        console.error("Error loading landing page config:", err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Services Helpers
  const handleAddService = () => {
    setServices([...services, { titulo: "", descripcion: "" }])
  }

  const handleRemoveService = (index: number) => {
    setServices(services.filter((_, i) => i !== index))
  }

  const handleServiceChange = (index: number, field: keyof ServiceItem, value: string) => {
    setServices(services.map((s, i) => i === index ? { ...s, [field]: value } : s))
  }

  // Products Helpers
  const handleAddProduct = () => {
    setProducts([...products, { nombre: "", descripcion: "", precio: 0, imagen_url: "" }])
  }

  const handleRemoveProduct = (index: number) => {
    setProducts(products.filter((_, i) => i !== index))
  }

  const handleProductChange = (index: number, field: keyof ProductItem, value: any) => {
    setProducts(products.map((p, i) => i === index ? { ...p, [field]: value } : p))
  }

  // Projects Helpers
  const handleAddProject = () => {
    setProjects([...projects, { titulo: "", descripcion: "", imagen_url: "" }])
  }

  const handleRemoveProject = (index: number) => {
    setProjects(projects.filter((_, i) => i !== index))
  }

  const handleProjectChange = (index: number, field: keyof ProjectItem, value: string) => {
    setProjects(projects.map((p, i) => i === index ? { ...p, [field]: value } : p))
  }

  // Image upload helper for Supabase Storage
  const handleImageUpload = async (index: number, type: 'project' | 'product', file: File) => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`
      const folder = type === 'project' ? 'gallery' : 'products'
      const filePath = `${folder}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('proyectos')
        .upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      const { data } = supabase.storage
        .from('proyectos')
        .getPublicUrl(filePath)

      if (data) {
        if (type === 'project') {
          handleProjectChange(index, 'imagen_url', data.publicUrl)
        } else {
          handleProductChange(index, 'imagen_url', data.publicUrl)
        }
        alert("¡Imagen subida con éxito y enlazada automáticamente!")
      }
    } catch (err: any) {
      console.error(err)
      alert("Error al subir la imagen. Por favor asegúrate de haber creado el bucket público 'proyectos' en Supabase.")
    }
  }

  // Save changes to Supabase
  const handleSaveConfig = async () => {
    setSaveStatus({})
    try {
      // 1. Save general content
      await supabase.from('landing_content').upsert([
        { key: 'hero_title', value: heroTitle },
        { key: 'hero_subtitle', value: heroSubtitle }
      ])

      // 2. Sync services
      const { data: currentServices } = await supabase.from('landing_servicios').select('id')
      if (currentServices && currentServices.length > 0) {
        await supabase.from('landing_servicios').delete().in('id', currentServices.map(s => s.id))
      }
      
      if (services.length > 0) {
        const servicesToInsert = services.map((s, index) => ({
          titulo: s.titulo,
          descripcion: s.descripcion,
          orden: index
        }))
        const { error: servErr } = await supabase.from('landing_servicios').insert(servicesToInsert)
        if (servErr) throw servErr
      }

      // 3. Sync products
      const { data: currentProducts } = await supabase.from('landing_productos').select('id')
      if (currentProducts && currentProducts.length > 0) {
        await supabase.from('landing_productos').delete().in('id', currentProducts.map(p => p.id))
      }

      if (products.length > 0) {
        const productsToInsert = products.map((p, index) => ({
          nombre: p.nombre,
          descripcion: p.descripcion,
          precio: p.precio || 0,
          imagen_url: p.imagen_url || '',
          orden: index
        }))
        const { error: prodErr } = await supabase.from('landing_productos').insert(productsToInsert)
        if (prodErr) throw prodErr
      }

      // 4. Sync projects
      const { data: currentProjects } = await supabase.from('landing_proyectos').select('id')
      if (currentProjects && currentProjects.length > 0) {
        await supabase.from('landing_proyectos').delete().in('id', currentProjects.map(p => p.id))
      }

      if (projects.length > 0) {
        const projectsToInsert = projects.map((p, index) => ({
          titulo: p.titulo,
          descripcion: p.descripcion,
          imagen_url: p.imagen_url,
          orden: index
        }))
        const { error: projErr } = await supabase.from('landing_proyectos').insert(projectsToInsert)
        if (projErr) throw projErr
      }

      setSaveStatus({ success: true })
      alert("Landing page actualizada correctamente!")
    } catch (err: any) {
      console.error(err)
      setSaveStatus({ error: err.message || 'Error al guardar los cambios' })
    }
  }

  if (loading) {
    return <div className="text-center py-12">Cargando editor de página...</div>
  }

  return (
    <div className="max-w-4xl mx-auto pb-16">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Editar Landing Page</h1>
          <p className="text-gray-500 mt-1">Modifica el contenido público de la página de inicio de D'Mobel.</p>
        </div>
        <button
          onClick={handleSaveConfig}
          className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-hover shadow-md transition-colors"
        >
          Guardar Cambios
        </button>
      </header>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-xs text-amber-800 leading-relaxed shadow-sm">
        <h3 className="font-semibold uppercase tracking-wider mb-1">Para habilitar la subida directa de imágenes:</h3>
        <p>
          Debes ir a tu consola de Supabase, entrar a la sección de Storage, crear un nuevo Bucket llamado **proyectos** y configurarlo como **Público (Public)**. Esto te permitirá seleccionar archivos de tu computadora y subirlos directamente aquí.
        </p>
      </div>

      {saveStatus.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          <strong>Error al guardar:</strong> {saveStatus.error}
        </div>
      )}

      {saveStatus.success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
          ¡Cambios guardados con éxito en la base de datos!
        </div>
      )}

      <div className="space-y-8">
        {/* Hero Section */}
        <div className="bg-white rounded-xl border border-border-color p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 flex items-center gap-2">
            <span className="w-2 h-6 bg-primary rounded-full"></span>
            Sección Principal (Hero)
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título de Bienvenida</label>
              <input
                type="text"
                value={heroTitle}
                onChange={(e) => setHeroTitle(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción del Negocio</label>
              <textarea
                value={heroSubtitle}
                onChange={(e) => setHeroSubtitle(e.target.value)}
                rows={3}
                className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Services Editing */}
        <div className="bg-white rounded-xl border border-border-color p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <span className="w-2 h-6 bg-primary rounded-full"></span>
              Nuestros Servicios
            </h2>
            <button
              onClick={handleAddService}
              className="text-xs font-semibold text-primary bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
            >
              + Agregar Servicio
            </button>
          </div>

          <div className="space-y-4">
            {services.map((service, index) => (
              <div key={index} className="p-4 rounded-lg bg-gray-50 border border-gray-200 relative">
                <button
                  onClick={() => handleRemoveService(index)}
                  className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-xs font-bold"
                >
                  Eliminar
                </button>
                <div className="grid grid-cols-12 gap-3">
                  <div className="col-span-12">
                    <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-0.5">Título del Servicio</label>
                    <input
                      type="text"
                      value={service.titulo}
                      onChange={(e) => handleServiceChange(index, 'titulo', e.target.value)}
                      placeholder="ej. Diseño a Medida"
                      className="w-full text-sm border border-gray-300 rounded-lg p-2 bg-white focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                  </div>
                  <div className="col-span-12">
                    <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-0.5">Descripción</label>
                    <textarea
                      value={service.descripcion}
                      onChange={(e) => handleServiceChange(index, 'descripcion', e.target.value)}
                      placeholder="Explica qué incluye este servicio..."
                      rows={2}
                      className="w-full text-sm border border-gray-300 rounded-lg p-2 bg-white focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Gallery / Recent Projects Slider */}
        <div className="bg-white rounded-xl border border-border-color p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <span className="w-2 h-6 bg-primary rounded-full"></span>
              Proyectos Recientes (Galería Carrusel)
            </h2>
            <button
              onClick={handleAddProject}
              className="text-xs font-semibold text-primary bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
            >
              + Agregar Proyecto
            </button>
          </div>

          <div className="space-y-4">
            {projects.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-sm">
                No hay proyectos en la galería. Se mostrarán imágenes de ejemplo hasta que agregues alguno aquí.
              </div>
            ) : (
              projects.map((project, index) => (
                <div key={index} className="p-4 rounded-lg bg-gray-50 border border-gray-200 relative">
                  <button
                    onClick={() => handleRemoveProject(index)}
                    className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-xs font-bold"
                  >
                    Eliminar
                  </button>
                  <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-12 md:col-span-6">
                      <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-0.5">Título del Proyecto</label>
                      <input
                        type="text"
                        value={project.titulo}
                        onChange={(e) => handleProjectChange(index, 'titulo', e.target.value)}
                        placeholder="ej. Cocina Modular Moderna"
                        className="w-full text-sm border border-gray-300 rounded-lg p-2 bg-white focus:ring-1 focus:ring-primary focus:outline-none"
                      />
                    </div>
                    <div className="col-span-12 md:col-span-6">
                      <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-0.5">Imagen del Proyecto</label>
                      <div className="flex flex-col gap-2 mt-1">
                        <input
                          type="text"
                          value={project.imagen_url}
                          onChange={(e) => handleProjectChange(index, 'imagen_url', e.target.value)}
                          placeholder="Ingresa URL o sube una imagen abajo"
                          className="w-full text-sm border border-gray-300 rounded-lg p-2 bg-white focus:ring-1 focus:ring-primary focus:outline-none"
                        />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleImageUpload(index, 'project', e.target.files[0])
                            }
                          }}
                          className="text-xs text-gray-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                        />
                      </div>
                    </div>
                    <div className="col-span-12">
                      <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-0.5">Descripción Corta</label>
                      <textarea
                        value={project.descripcion}
                        onChange={(e) => handleProjectChange(index, 'descripcion', e.target.value)}
                        placeholder="Acabados, materiales, ubicación, etc..."
                        rows={2}
                        className="w-full text-sm border border-gray-300 rounded-lg p-2 bg-white focus:ring-1 focus:ring-primary focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Products / Portfolio Editing */}
        <div className="bg-white rounded-xl border border-border-color p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <span className="w-2 h-6 bg-primary rounded-full"></span>
              Productos / Catálogo Destacado
            </h2>
            <button
              onClick={handleAddProduct}
              className="text-xs font-semibold text-primary bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
            >
              + Agregar Producto
            </button>
          </div>

          <div className="space-y-4">
            {products.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-sm">No hay productos destacados guardados. Añade el catálogo aquí.</div>
            ) : (
              products.map((product, index) => (
                <div key={index} className="p-4 rounded-lg bg-gray-50 border border-gray-200 relative">
                  <button
                    onClick={() => handleRemoveProduct(index)}
                    className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-xs font-bold"
                  >
                    Eliminar
                  </button>
                  <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-8">
                      <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-0.5">Nombre del Producto</label>
                      <input
                        type="text"
                        value={product.nombre}
                        onChange={(e) => handleProductChange(index, 'nombre', e.target.value)}
                        placeholder="ej. Sillón Escandinavo"
                        className="w-full text-sm border border-gray-300 rounded-lg p-2 bg-white focus:ring-1 focus:ring-primary focus:outline-none"
                      />
                    </div>
                    <div className="col-span-4">
                      <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-0.5">Precio Ref (₡)</label>
                      <input
                        type="number"
                        value={product.precio || ''}
                        onChange={(e) => handleProductChange(index, 'precio', Number(e.target.value))}
                        placeholder="0"
                        className="w-full text-sm border border-gray-300 rounded-lg p-2 bg-white focus:ring-1 focus:ring-primary focus:outline-none"
                      />
                    </div>
                    <div className="col-span-12">
                      <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-0.5">Imagen del Producto (Opcional)</label>
                      <div className="flex flex-col gap-2 mt-1">
                        <input
                          type="text"
                          value={product.imagen_url || ''}
                          onChange={(e) => handleProductChange(index, 'imagen_url', e.target.value)}
                          placeholder="Ingresa URL o sube una imagen abajo"
                          className="w-full text-sm border border-gray-300 rounded-lg p-2 bg-white focus:ring-1 focus:ring-primary focus:outline-none"
                        />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleImageUpload(index, 'product', e.target.files[0])
                            }
                          }}
                          className="text-xs text-gray-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                        />
                      </div>
                    </div>
                    <div className="col-span-12">
                      <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-0.5">Descripción / Materiales</label>
                      <textarea
                        value={product.descripcion}
                        onChange={(e) => handleProductChange(index, 'descripcion', e.target.value)}
                        placeholder="Material, dimensiones y acabados..."
                        rows={2}
                        className="w-full text-sm border border-gray-300 rounded-lg p-2 bg-white focus:ring-1 focus:ring-primary focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
