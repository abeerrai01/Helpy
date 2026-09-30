Add-Type -AssemblyName System.IO.Compression.FileSystem
$sourceDir = "d:\natively-cluely-ai-assistant\assets"
$zipFile = "C:\Users\lenovo\Downloads\test-dotnet.zip"
if (Test-Path $zipFile) { Remove-Item $zipFile }

Write-Host "Creating zip with .NET ZipFile..."
[System.IO.Compression.ZipFile]::CreateFromDirectory($sourceDir, $zipFile)

$shell = New-Object -ComObject Shell.Application
$zip = $shell.NameSpace($zipFile)
if ($zip -eq $null) {
    Write-Host "RESULT: FAILED (Windows Shell rejected it)"
} else {
    Write-Host "RESULT: SUCCESS! Windows Shell accepted it with items:" $($zip.Items().Count)
}
Remove-Item $zipFile