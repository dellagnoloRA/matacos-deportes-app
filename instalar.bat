@echo off
title Matacos Deportes - Instalador Inicial desde Pendrive
color 0B

echo =======================================================================
echo     MATACOS DEPORTES - INSTALACION INICIAL EN MOSTRADOR
echo =======================================================================
echo.

:: Define la ruta fija de instalacion en el disco C: de la notebook
set DESTINO=C:\Matacos-POS
:: Captura automaticamente la letra del pendrive desde donde se ejecuta el script (ej: E:\)
set ORIGEN=%~dp0

:: PASO 1: Creacion del directorio de trabajo en la maquina local
echo [1/4] Creando carpeta de trabajo en %DESTINO%...
if not exist "%DESTINO%" mkdir "%DESTINO%"

:: PASO 2: Copia de archivos de configuracion indispensables
echo [2/4] Copiando archivos de configuracion y scripts al equipo...
copy /y "%ORIGEN%docker-compose.yml" "%DESTINO%\" >nul
copy /y "%ORIGEN%.env" "%DESTINO%\" >nul
copy /y "%ORIGEN%iniciar-sistema.bat" "%DESTINO%\" >nul
copy /y "%ORIGEN%detener-sistema.bat" "%DESTINO%\" >nul
copy /y "%ORIGEN%iniciar-en-segundo-plano.vbs" "%DESTINO%\" >nul
echo       Archivos copiados con exito.

:: PASO 3: Importacion de la imagen Docker desde el pendrive
echo.
echo [3/4] Cargando imagen Docker (matacos-app.tar) al sistema...
if not exist "%ORIGEN%matacos-app.tar" (
    echo.
    echo [ADVERTENCIA] No se encontro matacos-app.tar en el pendrive.
    echo Asegurese de haber copiado matacos-app.tar a la raiz del pendrive.
    echo.
    pause
    exit /b 1
)
echo       Importando capas de la aplicacion (esto puede demorar unos minutos)...
docker load -i "%ORIGEN%matacos-app.tar"

:: PASO 4: Puesta en marcha de los contenedores
echo.
echo [4/4] Iniciando contenedores por primera vez...
cd /d "%DESTINO%"
docker compose up -d

echo.
echo Esperando inicializacion de la base de datos...
timeout /t 8 /nobreak >nul

:: PASO 5: Despliegue de estructura de tablas (Prisma Migrations)
echo Aplicando esquema y migraciones de base de datos...
docker compose exec -T app prisma migrate deploy

echo.
echo =======================================================================
echo  INSTALACION FINALIZADA CON EXITO.
echo =======================================================================
pause
