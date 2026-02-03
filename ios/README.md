IOS Development Folder Structure (Skeleton)

- ios/
  - MetaOdds/ # Main app source folder (SwiftUI-based starter)
    - Info.plist # App metadata
    - MetaOddsApp.swift # App entry point (SwiftUI)
    - ContentView.swift # Default starting view
    - Views/ # UI components (optional subviews)
    - Models/ # Data models
    - Networking/ # Networking layer (API clients)
    - Resources/ # Assets and resources
      - Assets.xcassets/ # Asset catalog (images, colors, etc.)
      - Localizable.strings? # (localization files if needed)
  - Podfile # CocoaPods dependencies (if used)

Notes:

- This is a project skeleton. It does not include a generated Xcode project file (.xcodeproj) or workspace (.xcworkspace). You should generate an Xcode project from this structure or initialize a new Xcode project and adapt the folders to fit this layout.
- You can switch to a UIKit lifecycle or add SwiftUI lifecycle extensions as needed.
