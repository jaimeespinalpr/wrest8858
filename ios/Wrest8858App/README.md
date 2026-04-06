# Wrest8858 iOS App (SwiftUI)

App iOS nativa que envuelve `https://jaimeespinalpr.github.io/wrest8858/` en `WKWebView` con controles y feedback nativo.

## Requisitos

- Xcode 16+
- iOS deployment target: 18.0

## Abrir en Xcode

1. Abre `ios/Wrest8858App/Wrest8858App.xcodeproj`.
2. Selecciona el scheme `Wrest8858App`.
3. Ejecuta en un simulador iPhone o en dispositivo.

## Build por terminal

```bash
xcodebuild -project ios/Wrest8858App/Wrest8858App.xcodeproj \
  -scheme Wrest8858App \
  -destination 'generic/platform=iOS Simulator' \
  build CODE_SIGNING_ALLOWED=NO
```

## Regenerar proyecto

Si agregas archivos Swift nuevos en `Sources/`:

```bash
ruby ios/Wrest8858App/scripts/generate_project.rb
```

## Publicacion (App Store readiness)

- `AppIcon` completo incluido en `Resources/Assets.xcassets/AppIcon.appiconset`.
- Launch screen incluido en `Resources/LaunchScreen.storyboard`.
- Privacy manifest incluido en `Resources/PrivacyInfo.xcprivacy`.

## Mapa de datos backend

Ver `BACKEND_STORAGE.md` para la ubicacion actual de usuarios, mensajes, entrenamientos y media.
