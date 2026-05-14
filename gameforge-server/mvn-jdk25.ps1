param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]] $MavenArgs
)

$root = $PSScriptRoot
$jdk = if ($env:GAMEFORGE_JDK_HOME) { $env:GAMEFORGE_JDK_HOME } else { 'C:\Users\Administrator\.jdks\openjdk-25.0.1' }

$javaExe = Join-Path $jdk 'bin\java.exe'
if (-not (Test-Path -LiteralPath $javaExe)) {
  Write-Error "JDK not found: $jdk (set GAMEFORGE_JDK_HOME to override)"
  exit 1
}

$env:JAVA_HOME = $jdk
$bin = Join-Path $jdk 'bin'
$env:Path = $bin + ';' + $env:Path

Push-Location $root
try {
  & mvn @MavenArgs
  exit $LASTEXITCODE
} finally {
  Pop-Location
}
