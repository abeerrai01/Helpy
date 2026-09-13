' ====================================================================
' Helpy - Silent Background Launcher
' Runs Helpy without opening any command prompt, PowerShell, or terminal window.
' ====================================================================

Dim FSO, WshShell, ScriptDir

Set FSO = CreateObject("Scripting.FileSystemObject")
ScriptDir = FSO.GetParentFolderName(WScript.ScriptFullName)

Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = ScriptDir

' Launch Electron completely hidden (0 = SW_HIDE, False = asynchronous)
WshShell.Run "cmd /c node_modules\.bin\electron.cmd .", 0, False

Set WshShell = Nothing
Set FSO = Nothing
