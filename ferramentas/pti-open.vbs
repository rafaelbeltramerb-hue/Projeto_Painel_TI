' ============================================================
'  pti-open.vbs
'  Handler do protocolo customizado "pti-open:" usado pelo
'  Portal TI pra abrir pastas e arquivos (PDF, TXT, etc.) direto
'  no Explorador do Windows, a partir de um site https://.
'
'  Não execute este arquivo manualmente — ele é chamado
'  automaticamente pelo Windows quando o protocolo "pti-open:"
'  está registrado (veja instalar-protocolo-pti-open.reg) e o
'  usuário clica num atalho do portal.
' ============================================================

Option Explicit

Dim raw, s, q, shell

If WScript.Arguments.Count < 1 Then
  WScript.Quit
End If

raw = WScript.Arguments(0)
s = raw

' Remove o prefixo "pti-open:" (não diferencia maiúsc./minúsc.)
If LCase(Left(s, 9)) = "pti-open:" Then
  s = Mid(s, 10)
End If

' Decodifica %20 etc.
s = URLDecode(s)

' Remove o prefixo file:// ou file:///
If LCase(Left(s, 8)) = "file:///" Then
  s = Mid(s, 9)
ElseIf LCase(Left(s, 7)) = "file://" Then
  s = Mid(s, 8)
End If

' Barras -> contrabarras (estilo Windows)
s = Replace(s, "/", "\")

' Se não começar com letra de unidade (C:\...), é caminho de
' rede -> garante o prefixo \\
If Not (Len(s) >= 2 And Mid(s, 2, 1) = ":") Then
  If Left(s, 2) <> "\\" Then
    s = "\\" & s
  End If
End If

If Len(Trim(s)) = 0 Then
  WScript.Quit
End If

q = Chr(34)

On Error Resume Next

Set shell = CreateObject("WScript.Shell")

' Roda o caminho diretamente: se for pasta, abre no Explorador;
' se for arquivo, abre com o aplicativo padrão (igual duplo-clique).
shell.Run q & s & q, 1, False

If Err.Number <> 0 Then

  MsgBox _
    "Não foi possível abrir automaticamente:" & vbCrLf & vbCrLf & _
    s & vbCrLf & vbCrLf & _
    "O caminho já foi copiado — cole no Explorador (Ctrl+V).", _
    vbExclamation, _
    "Portal TI"

End If


' ------------------------------------------------------------
'  Função auxiliar: decodifica %XX e "+" de uma string vinda de URL
' ------------------------------------------------------------
Function URLDecode(txt)

  Dim i, c, hex, result

  result = ""
  i = 1

  Do While i <= Len(txt)

    c = Mid(txt, i, 1)

    If c = "%" And i + 2 <= Len(txt) Then

      hex = Mid(txt, i + 1, 2)
      result = result & Chr(CLng("&H" & hex))
      i = i + 3

    ElseIf c = "+" Then

      result = result & " "
      i = i + 1

    Else

      result = result & c
      i = i + 1

    End If

  Loop

  URLDecode = result

End Function
