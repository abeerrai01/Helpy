' Instant Silent Kill Switch for Helpy
' Terminates all electron processes instantly with ZERO window or prompt.
Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "taskkill /F /IM electron.exe /T", 0, True
Set WshShell = Nothing
