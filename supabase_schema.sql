-- Crear tabla de clientes
CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT UNIQUE NOT NULL,
  telefono TEXT,
  direccion TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear tabla de facturas
CREATE TABLE IF NOT EXISTS facturas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT UNIQUE NOT NULL,
  fecha DATE NOT NULL,
  vendedor_nombre TEXT,
  vendedor_cedula TEXT,
  vendedor_direccion TEXT,
  vendedor_telefono TEXT,
  vendedor_agente TEXT,
  cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  notas TEXT,
  adelanto NUMERIC NOT NULL DEFAULT 0,
  saldo NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear tabla de items de facturas
CREATE TABLE IF NOT EXISTS factura_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  factura_id UUID REFERENCES facturas(id) ON DELETE CASCADE,
  descripcion TEXT NOT NULL,
  detalles TEXT,
  precio NUMERIC NOT NULL DEFAULT 0,
  cantidad NUMERIC NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla para contenido general de la landing page
CREATE TABLE IF NOT EXISTS landing_content (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Tabla para servicios de la landing page
CREATE TABLE IF NOT EXISTS landing_servicios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  orden INT DEFAULT 0
);

-- Tabla para productos de la landing page
CREATE TABLE IF NOT EXISTS landing_productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  precio NUMERIC,
  imagen_url TEXT,
  orden INT DEFAULT 0
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE facturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE factura_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE landing_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE landing_servicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE landing_productos ENABLE ROW LEVEL SECURITY;

-- Crear políticas para permitir todas las operaciones a usuarios autenticados
CREATE POLICY "Permitir todo a usuarios autenticados en clientes" 
  ON clientes FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Permitir todo a usuarios autenticados en facturas" 
  ON facturas FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Permitir todo a usuarios autenticados en factura_items" 
  ON factura_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Políticas para la landing page (Lectura pública, edición autenticados)
CREATE POLICY "Lectura pública de landing_content" ON landing_content FOR SELECT USING (true);
CREATE POLICY "Escritura de landing_content para admins" ON landing_content FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Lectura pública de landing_servicios" ON landing_servicios FOR SELECT USING (true);
CREATE POLICY "Escritura de landing_servicios para admins" ON landing_servicios FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Lectura pública de landing_productos" ON landing_productos FOR SELECT USING (true);
CREATE POLICY "Escritura de landing_productos para admins" ON landing_productos FOR ALL TO authenticated USING (true) WITH CHECK (true);
