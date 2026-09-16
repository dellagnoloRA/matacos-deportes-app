Set WshShell = CreateObject("WScript.Shell")
scriptPath = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
WshShell.CurrentDirectory = scriptPath
WshShell.Run "cmd /c """ & scriptPath & "\iniciar-sistema.bat""", 0, False
Set WshShell = Nothing
