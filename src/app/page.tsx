import Image from "next/image";
import Link from "next/link";
import { createClient } from '@/utils/supabase/server'
import ProjectCarousel from './components/ProjectCarousel'

// Default hardcoded fallbacks
const DEFAULT_HERO_TITLE = "Muebles que inspiran tu espacio."
const DEFAULT_HERO_SUBTITLE = "Transformamos la madera en obras de arte funcionales. Calidad, diseño y confort en cada detalle para tu hogar u oficina."

const DEFAULT_SERVICES = [
  { titulo: "Diseño a Medida", descripcion: "Creamos muebles que se adaptan perfectamente a las dimensiones y estilo de tus espacios." },
  { titulo: "Materiales Premium", descripcion: "Seleccionamos cuidadosamente maderas y acabados de la más alta calidad para asegurar durabilidad." },
  { titulo: "Instalación Experta", descripcion: "Nuestro equipo se encarga de que todo quede perfecto, cuidando cada detalle en tu hogar." }
]

export default async function Home() {
  let heroTitle = DEFAULT_HERO_TITLE
  let heroSubtitle = DEFAULT_HERO_SUBTITLE
  let services = DEFAULT_SERVICES
  let products: any[] = []
  let projects: any[] = []

  try {
    const supabase = await createClient()

    // 1. Fetch contents
    const { data: contents } = await supabase.from('landing_content').select('*')
    if (contents && contents.length > 0) {
      const title = contents.find(c => c.key === 'hero_title')?.value
      const subtitle = contents.find(c => c.key === 'hero_subtitle')?.value
      if (title) heroTitle = title
      if (subtitle) heroSubtitle = subtitle
    }

    // 2. Fetch services
    const { data: dbServices } = await supabase.from('landing_servicios').select('*').order('orden')
    if (dbServices && dbServices.length > 0) {
      services = dbServices
    }

    // 3. Fetch products
    const { data: dbProducts } = await supabase.from('landing_productos').select('*').order('orden')
    if (dbProducts) {
      products = dbProducts
    }

    // 4. Fetch projects
    const { data: dbProjects } = await supabase.from('landing_proyectos').select('*').order('orden')
    if (dbProjects) {
      projects = dbProjects
    }
  } catch (err) {
    console.error("Error fetching dynamic landing page data:", err)
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Navigation */}
      <header className="fixed w-full z-50 glass-panel border-b border-border-color">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image 
              src="/logo.png" 
              alt="D'Mobel Logo" 
              width={45} 
              height={45} 
              className="object-contain rounded-full" 
            />
            <span className="font-semibold text-xl tracking-wide text-primary">MOBEL</span>
          </div>
          <nav className="hidden md:flex gap-8 text-sm font-medium">
            <Link href="#servicios" className="hover:text-primary transition-colors">Servicios</Link>
            <Link href="#proyectos" className="hover:text-primary transition-colors">Galería</Link>
            {products.length > 0 && (
              <Link href="#productos" className="hover:text-primary transition-colors">Productos</Link>
            )}
            <Link href="#contacto" className="hover:text-primary transition-colors">Contacto</Link>
          </nav>
          <div className="flex gap-4">
            <Link 
              href="/login" 
              className="px-5 py-2 text-sm font-medium border border-primary text-primary rounded-full hover:bg-primary hover:text-white transition-all"
            >
              Portal Interno
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-grow pt-20">
        {/* Hero Section */}
        <section className="relative h-[80vh] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-gray-50 z-0" />
          <div className="relative z-10 text-center px-6 max-w-3xl mx-auto flex flex-col items-center gap-6">
            <span className="px-4 py-1.5 rounded-full bg-blue-50 text-primary text-xs font-semibold tracking-widest uppercase border border-blue-100 shadow-sm">
              Diseño de Interiores Premium
            </span>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-gray-900 leading-tight">
              {heroTitle}
            </h1>
            <p className="text-lg md:text-xl text-gray-600 font-light mt-2">
              {heroSubtitle}
            </p>
            <div className="mt-8 flex gap-4">
              <a 
                href="https://wa.me/50660485642?text=Hola%2C%20me%20gustar%C3%ADa%20cotizar%20un%20proyecto%20con%20D%27Mobel" 
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 bg-primary text-white rounded-full font-medium hover:bg-primary-hover shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
              >
                Cotizar Proyecto
              </a>
              {products.length > 0 && (
                <Link 
                  href="#productos" 
                  className="px-8 py-4 bg-white text-gray-800 rounded-full font-medium border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all"
                >
                  Ver Catálogo
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* Services */}
        <section id="servicios" className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Nuestra Experiencia</h2>
              <div className="w-24 h-1 bg-primary mx-auto mt-6 opacity-80" />
            </div>
            
            <div className="grid md:grid-cols-3 gap-12">
              {services.map((service, i) => (
                <div key={i} className="p-8 rounded-2xl bg-gray-50 border border-gray-100 hover:shadow-xl transition-shadow group">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                    <span className="text-2xl font-bold text-primary group-hover:text-white">{i + 1}</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{service.titulo}</h3>
                  <p className="text-gray-600 leading-relaxed font-light">{service.descripcion}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Proyectos Recientes (Galería Slider) */}
        <section id="proyectos" className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Proyectos Recientes</h2>
              <p className="text-gray-500 mt-2 font-light">Echa un vistazo a nuestros últimos trabajos terminados.</p>
              <div className="w-24 h-1 bg-primary mx-auto mt-6 opacity-80" />
            </div>
            
            <ProjectCarousel dbProjects={projects} />
          </div>
        </section>

        {/* Products (If added from admin) */}
        {products.length > 0 && (
          <section id="productos" className="py-24 bg-gray-50 border-t border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-6">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Catálogo Destacado</h2>
                <p className="text-gray-500 mt-2 font-light">Explora nuestros productos de alta gama y diseños exclusivos.</p>
                <div className="w-24 h-1 bg-primary mx-auto mt-6 opacity-80" />
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                {products.map((product, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
                    <div className="p-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-2">{product.nombre}</h3>
                      <p className="text-gray-600 text-sm font-light mb-4 min-h-[48px]">{product.descripcion || 'Sin descripción disponible.'}</p>
                      {product.precio > 0 && (
                        <div className="flex justify-between items-center border-t border-gray-100 pt-4">
                          <span className="text-xs text-gray-400 font-medium">PRECIO REF.</span>
                          <span className="text-lg font-bold text-primary">
                            {new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(product.precio).replace('CRC', '₡')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Contact Section */}
        <section id="contacto" className="py-24 bg-white">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">¿Listo para transformar tu espacio?</h2>
            <p className="text-gray-600 font-light mb-8 max-w-xl mx-auto">
              Contáctanos hoy mismo para obtener una cotización a tu medida o visítanos en nuestro taller.
            </p>
            <div className="inline-flex flex-col sm:flex-row gap-6 justify-center items-center bg-gray-50 border border-gray-100 rounded-2xl p-8 shadow-sm">
              <div className="text-center sm:text-left">
                <span className="text-xs font-semibold text-gray-400 block mb-1">TELÉFONO</span>
                <span className="text-lg font-bold text-gray-900">+(506) 6048-5642</span>
              </div>
              <div className="w-[1px] h-10 bg-gray-200 hidden sm:block"></div>
              <div className="text-center sm:text-left">
                <span className="text-xs font-semibold text-gray-400 block mb-1">UBICACIÓN</span>
                <span className="text-lg font-bold text-gray-900">San José, Costa Rica</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h4 className="text-2xl font-semibold mb-2">D'MOBEL</h4>
            <p className="text-gray-400 font-light">Diseño e Innovación en Muebles.</p>
          </div>
          <div className="md:text-right text-gray-400 font-light text-sm">
            <p>&copy; {new Date().getFullYear()} D'Mobel CR. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
