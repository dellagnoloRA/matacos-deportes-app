@echo off
title Matacos Deportes - Sistema de Gestion
color 0A

echo =======================================================================
echo          MATACOS DEPORTES - SISTEMA DE GESTION Y STOCK
echo =======================================================================
echo.

cd /d "%~dp0"

:: 1. Comprobar si Docker esta corriendo
echo [1/3] Verificando servicio de Base de Datos...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo     Iniciando Docker Desktop, aguarde unos segundos...
    if exist "%LOCALAPPDATA%\Programs\DockerDesktop\Docker Desktop.exe" (
        start "" "%LOCALAPPDATA%\Programs\DockerDesktop\Docker Desktop.exe"
    ) else if exist "%ProgramFiles%\Docker\Docker\Docker Desktop.exe" (
        start "" "%ProgramFiles%\Docker\Docker\Docker Desktop.exe"
    ) else (
        echo [!] No se encontro el ejecutable de Docker Desktop.
        echo     Asegurese de abrir Docker Desktop manualmente.
    )

    :esperar_docker
    timeout /t 3 /nobreak >nul
    docker info >nul 2>&1
    if %errorlevel% neq 0 goto esperar_docker
    echo     Base de datos conectada con exito.
)

:: 2. Levantar el contenedor de PostgreSQL
echo [2/3] Levantando base de datos PostgreSQL...
call pnpm db:up >nul 2>&1

:: 3. Lanzar apertura automatica del navegador en modo aplicacion limpia
echo [3/3] Iniciando servidor web y abriendo navegador...
start "" cmd /c "timeout /t 4 /nobreak >nul & if exist \"%ProgramFiles%\Google\Chrome\Application\chrome.exe\" (start \"\" \"%ProgramFiles%\Google\Chrome\Application\chrome.exe\" --app=http://localhost:3000 --start-maximized) else if exist \"%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe\" (start \"\" \"%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe\" --app=http://localhost:3000 --start-maximized) else (start http://localhost:3000)"


echo.
echo =======================================================================
echo   SISTEMA ACTIVO Y OPERANDO EN RED
echo   - Terminal Local: http://localhost:3000
echo   - Por favor mantenga esta ventana minimizada mientras use el sistema.
echo =======================================================================
echo.

:: Iniciar aplicacion Next.js en red local
call pnpm start:lan
