@echo off
title Matacos Deportes - Actualizador de Sistema
color 0B

echo =======================================================================
echo     MATACOS DEPORTES - ACTUALIZACION DE SISTEMA EN MOSTRADOR
echo =======================================================================
echo.

set DESTINO=C:\Matacos-POS
set ORIGEN=%~dp0

echo [1/3] Importando nueva version de la aplicacion (matacos-app.tar)...
if not exist "%ORIGEN%matacos-app.tar" (
    echo.
    echo [ERROR] No se encontro matacos-app.tar en el pendrive.
    echo Asegurese de haber copiado matacos-app.tar a la raiz del pendrive.
    echo.
    pause
    exit /b 1
)
docker load -i "%ORIGEN%matacos-app.tar"

echo.
echo [2/3] Reiniciando contenedor con la nueva version...
cd /d "%DESTINO%"
docker compose up -d --no-deps app

echo.
echo [3/3] Aplicando migraciones de base de datos...
timeout /t 3 /nobreak >nul
docker compose exec -T app prisma migrate deploy

echo.
echo =======================================================================
echo  SISTEMA ACTUALIZADO CON EXITO.
echo =======================================================================
pause
