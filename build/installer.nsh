!define APP_SCHEME "pdftoimg"
!macro customHeader
  !system "echo '' > ${BUILD_RESOURCES_DIR}/customHeader"
!macroend

!macro preInit
  ; This macro is inserted at the beginning of the NSIS .OnInit callback
  !system "echo '' > ${BUILD_RESOURCES_DIR}/preInit"
!macroend

!macro customInit
  !system "echo '' > ${BUILD_RESOURCES_DIR}/customInit"
!macroend

!macro customInstall
  !system "echo '' > ${BUILD_RESOURCES_DIR}/customInstall"
  DetailPrint "Register ${APP_SCHEME} URI Handler"
  DeleteRegKey HKCR "${APP_SCHEME}"
  WriteRegStr HKCR "${APP_SCHEME}" "" "URL:${APP_SCHEME}"
  WriteRegStr HKCR "${APP_SCHEME}" "URL Protocol" ""
  WriteRegStr HKCR "${APP_SCHEME}\shell" "" ""
  WriteRegStr HKCR "${APP_SCHEME}\shell\Open" "" ""
  WriteRegStr HKCR "${APP_SCHEME}\shell\Open\command" "" "$INSTDIR\${APP_EXECUTABLE_FILENAME} %1"
!macroend

!macro customUnInstall
  DeleteRegKey HKCR "${APP_SCHEME}"
!macroend

!macro customInstallMode
  # set $isForceMachineInstall or $isForceCurrentInstall
  # to enforce one or the other modes.
!macroend

!macro customWelcomePage
  # Welcome Page is not added by default for installer.
  !insertMacro MUI_PAGE_WELCOME
!macroend