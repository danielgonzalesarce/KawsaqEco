-- Esquema PostgreSQL para KawsaqEco
-- Ejecutar en Supabase SQL Editor

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE,
  nombre VARCHAR(100),
  distrito VARCHAR(50),
  escuela VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS eco_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(50) NOT NULL,
  points INTEGER NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(100),
  description TEXT,
  points_reward INTEGER,
  target_count INTEGER,
  residue_type VARCHAR(50),
  start_date DATE,
  end_date DATE,
  scope VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS user_challenges (
  user_id UUID REFERENCES users(id),
  challenge_id UUID REFERENCES challenges(id),
  progress INTEGER DEFAULT 0,
  completed_at TIMESTAMP,
  PRIMARY KEY (user_id, challenge_id)
);

CREATE TABLE IF NOT EXISTS acopio_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(100),
  distrito VARCHAR(50),
  direccion TEXT,
  tipos_residuo TEXT[],
  horario VARCHAR(50),
  lat DECIMAL(10, 7),
  lng DECIMAL(10, 7)
);

CREATE TABLE IF NOT EXISTS rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(100),
  descripcion TEXT,
  puntos_requeridos INTEGER,
  tipo VARCHAR(30),
  partner VARCHAR(50),
  valor_monetario DECIMAL(10, 2),
  stock INTEGER DEFAULT -1
);

CREATE TABLE IF NOT EXISTS user_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  reward_id UUID REFERENCES rewards(id),
  codigo_canje VARCHAR(20) UNIQUE,
  redeemed_at TIMESTAMP DEFAULT NOW(),
  used_at TIMESTAMP
);

-- Usuario demo para pruebas sin login
INSERT INTO users (id, nombre, distrito) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Usuario Demo KawsaqEco', 'Miraflores')
ON CONFLICT (id) DO NOTHING;

-- Datos iniciales de acopio Lima
INSERT INTO acopio_points (nombre, distrito, direccion, tipos_residuo, horario, lat, lng) VALUES
('EcoRed Miraflores', 'Miraflores', 'Av. Larco 1150', ARRAY['plástico','papel','vidrio'], 'L-S 8am-6pm', -12.1211, -77.0282),
('Punto Verde San Isidro', 'San Isidro', 'Calle Los Libertadores 250', ARRAY['plástico','metal','electrónico'], 'L-V 9am-5pm', -12.0964, -77.0365),
('Recíclame Surco', 'Santiago de Surco', 'Av. Primavera 2120', ARRAY['papel','cartón','vidrio'], 'L-S 7am-7pm', -12.1378, -76.9956);

-- Vistas de ranking
CREATE OR REPLACE VIEW ranking_distrital AS
SELECT
  u.distrito,
  SUM(ep.points) AS total_points,
  COUNT(DISTINCT ep.user_id) AS usuarios_activos,
  RANK() OVER (ORDER BY SUM(ep.points) DESC) AS posicion
FROM eco_points ep
JOIN users u ON ep.user_id = u.id
WHERE ep.created_at >= NOW() - INTERVAL '30 days'
GROUP BY u.distrito;

CREATE OR REPLACE VIEW ranking_escolar AS
SELECT
  u.escuela,
  SUM(ep.points) AS total_points,
  COUNT(DISTINCT ep.user_id) AS estudiantes_activos
FROM eco_points ep
JOIN users u ON ep.user_id = u.id
WHERE u.escuela IS NOT NULL
GROUP BY u.escuela
ORDER BY total_points DESC;
