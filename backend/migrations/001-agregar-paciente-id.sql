-- Migración 001: relación Paciente 1:N Visita
-- Ejecutar UNA vez en el SQL Editor de Neon (o en pgAdmin) sobre la base existente.
-- En una base nueva no hace falta: sequelize.sync() ya crea la columna y la clave foránea.

BEGIN;

ALTER TABLE visitas
  ADD COLUMN IF NOT EXISTS paciente_id INTEGER
  REFERENCES pacientes(id) ON DELETE SET NULL;

UPDATE visitas v
SET paciente_id = p.id
FROM pacientes p
WHERE p.nombre = v.paciente_nombre
  AND v.paciente_id IS NULL;

-- Control: debería dar 0
SELECT COUNT(*) AS visitas_sin_paciente FROM visitas WHERE paciente_id IS NULL;

COMMIT;

-- Rollback (deshacer la migración):
-- ALTER TABLE visitas DROP COLUMN paciente_id;
