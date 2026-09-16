@echo off
title Matacos Deportes - Cerrando Sistema
color 0C

echo =======================================================================
echo          MATACOS DEPORTES - DETENIENDO SISTEMA
echo =======================================================================
echo.

cd /d "%~dp0"

echo Deteniendo contenedores de base de datos...
call pnpm db:down >nul 2>&1

echo.
echo =======================================================================
echo   El sistema y la base de datos se han detenido correctamente.
echo =======================================================================
echo.
timeout /t 3
