$definition = @"
using System;
using System.Runtime.InteropServices;
public class Win32Drag {
    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool SystemParametersInfo(uint uiAction, uint uiParam, IntPtr pvParam, uint fWinIni);
}
"@
Add-Type -TypeDefinition $definition
# SPI_SETDRAGFULLWINDOWS = 0x0025 (37), SPIF_UPDATEINIFILE = 1, SPIF_SENDCHANGE = 2 (1|2 = 3)
$success = [Win32Drag]::SystemParametersInfo(37, 1, [IntPtr]::Zero, 3)
Write-Host "SPI_SETDRAGFULLWINDOWS result: $success"
Set-ItemProperty -Path 'HKCU:\Control Panel\Desktop' -Name 'DragFullWindows' -Value '1'
Write-Host "Registry DragFullWindows: $((Get-ItemProperty -Path 'HKCU:\Control Panel\Desktop' -Name 'DragFullWindows').DragFullWindows)"
