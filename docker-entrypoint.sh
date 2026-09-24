#!/bin/sh
set -e

echo "==> [Matacos POS] Verificando migraciones de base de datos..."
for i in 1 2 3 4 5; do
  if prisma migrate deploy; then
    echo "==> [Matacos POS] Migraciones de base de datos aplicadas correctamente."
    break
  fi
  echo "==> [Matacos POS] Reintentando conexion a base de datos en 2 segundos (intento $i/5)..."
  sleep 2
done

echo "==> [Matacos POS] Iniciando servidor Next.js..."
exec node server.js
