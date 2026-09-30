' ====================================================================
' Helpy - Desktop & Downloads Shortcut Installer
' Creates 1-click shortcuts for starting and stopping Helpy.
' ====================================================================

Dim WshShell, FSO, DesktopPath, DownloadsPath, Link, ScriptDir, IconPath, TargetFolders, FolderPath, IsSilent

Set WshShell = CreateObject("WScript.Shell")
Set FSO = CreateObject("Scripting.FileSystemObject")
ScriptDir = FSO.GetParentFolderName(WScript.ScriptFullName)
DesktopPath = WshShell.SpecialFolders("Desktop")
DownloadsPath = WshShell.ExpandEnvironmentStrings("%USERPROFILE%\Downloads")

IconPath = ScriptDir & "\assets\icons\win\icon.ico"
If Not FSO.FileExists(IconPath) Then
    If FSO.FileExists(ScriptDir & "\node_modules\electron\dist\electron.exe") Then
        IconPath = ScriptDir & "\node_modules\electron\dist\electron.exe"
    End If
End If

TargetFolders = Array(DesktopPath, DownloadsPath)

For Each FolderPath In TargetFolders
    If FolderPath <> "" And FSO.FolderExists(FolderPath) Then
        ' 1. Create "Helpy" shortcut
        Set Link = WshShell.CreateShortcut(FolderPath & "\Helpy.lnk")
        Link.TargetPath = "wscript.exe"
        Link.Arguments = """" & ScriptDir & "\start-helpy.vbs"""
        Link.WorkingDirectory = ScriptDir
        Link.Description = "Helpy - AI Interview & Productivity Assistant"
        If FSO.FileExists(IconPath) Then
            Link.IconLocation = IconPath & ", 0"
        End If
        Link.Save

        ' 2. Create "Stop Helpy" shortcut
        Set Link = WshShell.CreateShortcut(FolderPath & "\Stop Helpy.lnk")
        Link.TargetPath = "wscript.exe"
        Link.Arguments = """" & ScriptDir & "\emergency-stop.vbs"""
        Link.WorkingDirectory = ScriptDir
        Link.Description = "Stop all background Helpy processes"
        Link.IconLocation = "%SystemRoot%\System32\shell32.dll, 131"
        Link.Save
    End If
Next

IsSilent = False
If WScript.Arguments.Count > 0 Then
    If LCase(WScript.Arguments(0)) = "silent" Then
        IsSilent = True
    End If
End If

If Not IsSilent Then
    MsgBox "Helpy shortcuts created on your Desktop and Downloads folder!" & vbCrLf & vbCrLf & _
           "- Double-click 'Helpy' to start the assistant silently." & vbCrLf & _
           "- Double-click 'Stop Helpy' if you ever need to stop it." & vbCrLf & vbCrLf & _
           "All API keys are already pre-loaded. No setup or install needed!", vbInformation, "Helpy Ready"
End If
