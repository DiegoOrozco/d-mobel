'use client'

import { useState, useEffect } from 'react'

interface Project {
  titulo: string
  descripcion?: string
  imagen_url: string
}

const DEFAULT_PROJECTS: Project[] = [
  {
    titulo: "Cocina de Lujo en Roble",
    descripcion: "Proyecto residencial con gabinetes empotrados y acabados poliuretánicos.",
    imagen_url: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80"
  },
  {
    titulo: "Juego de Sala Minimalista",
    descripcion: "Sofá modular y mesas auxiliares en madera maciza de Guanacaste.",
    imagen_url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=80"
  },
  {
    titulo: "Dormitorio Principal",
    descripcion: "Respaldo de cama flotante iluminado y mesas de noche integradas.",
    imagen_url: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80"
  }
]

export default function ProjectCarousel({ dbProjects }: { dbProjects: Project[] }) {
  const projects = dbProjects.length > 0 ? dbProjects : DEFAULT_PROJECTS
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % projects.length)
    }, 4500) // Change slide every 4.5 seconds

    return () => clearInterval(timer)
  }, [projects.length])

  return (
    <div className="relative w-full h-[500px] md:h-[600px] rounded-3xl overflow-hidden shadow-2xl border border-gray-100 bg-gray-100 group">
      {/* Slide Container */}
      <div className="w-full h-full relative">
        {projects.map((project, index) => (
          <div
            key={index}
            className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
              index === activeIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            {/* Dark gradient overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-20" />
            
            {/* Project Image */}
            <img
              src={project.imagen_url}
              alt={project.titulo}
              className="w-full h-full object-cover transform scale-105 group-hover:scale-100 transition-transform duration-[4500ms] ease-out"
            />

            {/* Project Details Overlay */}
            <div className="absolute bottom-0 left-0 w-full p-8 md:p-12 z-30 text-white flex flex-col gap-2">
              <span className="text-xs font-bold tracking-widest text-primary/40 uppercase bg-white/10 backdrop-blur-md px-3 py-1 rounded-full w-fit">
                Proyecto Reciente
              </span>
              <h3 className="text-3xl md:text-5xl font-bold tracking-tight mt-2">{project.titulo}</h3>
              {project.descripcion && (
                <p className="text-sm md:text-lg text-gray-200 font-light max-w-xl">{project.descripcion}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Dots */}
      <div className="absolute bottom-6 right-8 z-40 flex gap-2">
        {projects.map((_, index) => (
          <button
            key={index}
            onClick={() => setActiveIndex(index)}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              index === activeIndex ? 'bg-white w-6' : 'bg-white/40 hover:bg-white/70'
            }`}
            aria-label={`Ir al proyecto ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
