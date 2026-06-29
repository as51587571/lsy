Set args = WScript.Arguments
full = args(0)
cmd = Mid(full, InStr(full, ":") + 1)
colon1 = InStr(cmd, ":")
action = Left(cmd, colon1 - 1)
rest = Mid(cmd, colon1 + 1)

Set shell = CreateObject("WScript.Shell")
repo = "\\??\??\??\lsy"

If action = "run" Then
    shell.Run "cmd.exe /c pushd """ & repo & """ && """ & rest & """", 1, False
ElseIf action = "save" Then
    colon2 = InStr(rest, ":")
    filename = Left(rest, colon2 - 1)
    data = Mid(rest, colon2 + 1)
    Set fso = CreateObject("Scripting.FileSystemObject")
    Set f = fso.CreateTextFile(repo & "\" & filename, True, True)
    f.Write data
    f.Close
End If
