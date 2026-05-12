@echo off
setlocal
set "GF_JDK=C:\Users\Administrator\.jdks\openjdk-25.0.1"
if defined GAMEFORGE_JDK_HOME set "GF_JDK=%GAMEFORGE_JDK_HOME%"
set "JAVA_HOME=%GF_JDK%"
set "PATH=%JAVA_HOME%\bin;%PATH%"
cd /d "%~dp0"
mvn %*
