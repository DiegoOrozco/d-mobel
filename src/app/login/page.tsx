import { login } from './actions'
import Link from 'next/link'
import Image from 'next/image'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const resolvedParams = await searchParams;
  return (
    <div className="flex flex-col min-h-screen bg-background items-center justify-center p-6">
      <div className="w-full max-w-md glass-panel p-8 rounded-2xl shadow-xl border border-border-color">
        <div className="text-center mb-8">
          <Image 
            src="/logo.png" 
            alt="D'Mobel Logo" 
            width={60} 
            height={60} 
            className="mx-auto object-contain rounded-full mb-4" 
          />
          <h1 className="text-2xl font-bold text-gray-900">Portal Interno</h1>
          <p className="text-gray-500 mt-2 text-sm">Accede al panel de administración de D'Mobel</p>
        </div>

        <form className="flex flex-col gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">
              Correo Electrónico
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="tu@correo.com"
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>

          {resolvedParams?.error && (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md text-center">
              {resolvedParams.error}
            </p>
          )}

          <button
            formAction={login}
            className="w-full bg-primary text-white font-medium py-3 rounded-lg hover:bg-primary-hover transition-colors shadow-md mt-2"
          >
            Iniciar Sesión
          </button>
        </form>

        <div className="mt-8 text-center">
          <Link href="/" className="text-sm text-gray-500 hover:text-primary transition-colors">
            &larr; Volver a la página principal
          </Link>
        </div>
      </div>
    </div>
  )
}
