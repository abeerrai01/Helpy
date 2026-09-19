' ====================================================================
' Helpy - Desktop Shortcut Installer for Teammate
' Creates 1-click desktop shortcuts for starting and stopping Helpy.
' ====================================================================

Dim WshShell, FSO, DesktopPath, Link, ScriptDir, IconPath

Set WshShell = CreateObject("WScript.Shell")
Set FSO = CreateObject("Scripting.FileSystemObject")
ScriptDir = FSO.GetParentFolderName(WScript.ScriptFullName)
DesktopPath = WshShell.SpecialFolders("Desktop")
IconPath = ScriptDir & "\assets\icons\win\icon.ico"

' 1. Create "Helpy" shortcut on Desktop
Set Link = WshShell.CreateShortcut(DesktopPath & "\Helpy.lnk")
Link.TargetPath = "wscript.exe"
Link.Arguments = """" & ScriptDir & "\start-helpy.vbs"""
Link.WorkingDirectory = ScriptDir
Link.Description = "Helpy - AI Interview & Productivity Assistant"
If FSO.FileExists(IconPath) Then
    Link.IconLocation = IconPath & ", 0"
End If
Link.Save

' 2. Create "Stop Helpy" shortcut on Desktop
Set Link = WshShell.CreateShortcut(DesktopPath & "\Stop Helpy.lnk")
Link.TargetPath = "wscript.exe"
Link.Arguments = """" & ScriptDir & "\emergency-stop.vbs"""
Link.WorkingDirectory = ScriptDir
Link.Description = "Stop all background Helpy processes"
Link.IconLocation = "%SystemRoot%\System32\shell32.dll, 131"
Link.Save

MsgBox "Helpy shortcuts created on your Desktop!" & vbCrLf & vbCrLf & _
       "- Double-click 'Helpy' to start the assistant silently." & vbCrLf & _
       "- Double-click 'Stop Helpy' if you ever need to stop it." & vbCrLf & vbCrLf & _
       "All API keys are already pre-loaded. No setup or install needed!", vbInformation, "Helpy Ready"
