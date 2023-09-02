; Administrator privileges required
!macro customInstall
  DeleteRegKey HKCR "pdftoimg"
  WriteRegStr HKCR "pdftoimg" "" "URL:pdftoimg"
  WriteRegStr HKCR "pdftoimg" "URL Protocol" ""
  WriteRegStr HKCR "pdftoimg\shell" "" ""
  WriteRegStr HKCR "pdftoimg\shell\Open" "" ""
  WriteRegStr HKCR "pdftoimg\shell\Open\command" "" "$INSTDIR\${APP_EXECUTABLE_FILENAME} %1"
!macroend
!macro customUnInstall
  DeleteRegKey HKCR "pdftoimg"
!macroend