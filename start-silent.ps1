# Helpy - Silent Background Launcher (PowerShell)
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
Start-Process -FilePath "$ProjectRoot\node_modules\.bin\electron.cmd" -ArgumentList "." -WorkingDirectory $ProjectRoot -WindowStyle Hidden
