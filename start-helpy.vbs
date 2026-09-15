' ====================================================================
' Helpy - Silent Background Launcher
' Runs Helpy without opening any command prompt, PowerShell, or terminal window.
' ====================================================================

Dim FSO, WshShell, ScriptDir

Set FSO = CreateObject("Scripting.FileSystemObject")
ScriptDir = FSO.GetParentFolderName(WScript.ScriptFullName)

Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = ScriptDir

On Error Resume Next

' Terminate any existing stale or frozen electron instance to guarantee a clean launch
WshShell.Run "cmd /c taskkill /F /IM electron.exe /T 2>nul", 0, True
WScript.Sleep 300

' Ensure build artifacts exist if running after clean
If Not FSO.FileExists(ScriptDir & "\dist-electron\electron\main.js") Then
    WshShell.Run "cmd /c npm run build:electron", 0, True
End If
If Not FSO.FileExists(ScriptDir & "\dist\index.html") Then
    WshShell.Run "cmd /c npm run build", 0, True
End If

' Launch Electron completely hidden (0 = SW_HIDE, False = asynchronous)
WshShell.Run "cmd /c """ & ScriptDir & "\node_modules\.bin\electron.cmd"" .", 0, False

Set WshShell = Nothing
Set FSO = Nothing
