# Coffee Native

A React Native music player app built with Expo SDK 54.

## Prerequisites

- Node.js (v18+)
- npm or yarn
- Android Studio with Android SDK (for Android development)
- Xcode (for iOS development, macOS only)
- Java JDK 17 (for Android builds)

## Installation

### 1. Install Dependencies

```bash
npm install
```

All dependencies are managed via `expo install` to ensure SDK compatibility. Do not manually pin versions.

### 2. Prebuild Native Folders (Required for bare/dev-client mode)

This project runs in **bare/prebuild/custom dev client mode**, not Expo Go.

```bash
# Generate native android/ and ios/ folders
npx expo prebuild

# For a clean rebuild (clears and regenerates native folders)
npx expo prebuild --clean
```

### 3. Install iOS Pods (macOS only)

```bash
cd ios && pod install && cd ..
```

## Running the App

### Android (Development)

```bash
# Start Metro bundler and build the app
npx expo run:android

# Or using native Android command
cd android && ./gradlew assembleDebug
```

### iOS (Development, macOS only)

```bash
npx expo run:ios
```

### With Custom Dev Client

If you've built a custom dev client:

```bash
npx expo start --dev-client
```

## Troubleshooting

### Metro Cache Issues

If you encounter bundling errors or stale cache:

```bash
# Clear Metro cache and restart
npx expo start --clear

# Or manually clear caches
rm -rf node_modules/.cache
watchman watch-del-all  # if using watchman
```

### React Native Reanimated Runtime Mismatch

If you see "Reanimated runtime mismatch" or worklet errors:

1. Ensure `babel.config.js` has the reanimated plugin **last**:

```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin', // MUST be last
    ],
  };
};
```

2. Clear all caches and rebuild:

```bash
# Clear everything
rm -rf node_modules
npm install
npx expo prebuild --clean
npx expo start --clear
```

3. On Android, uninstall the app from device/emulator and reinstall:

```bash
adb uninstall com.coffee.native  # Replace with your app ID
npx expo run:android
```

### Gesture Handler Issues

Ensure `react-native-gesture-handler` is imported at the very top of `index.ts`:

```typescript
import 'react-native-gesture-handler';
// ... rest of imports
```

### Build Failures

1. Clean and rebuild native projects:

```bash
# Android
cd android && ./gradlew clean && cd ..
npx expo run:android

# iOS
cd ios && pod deintegrate && pod install && cd ..
npx expo run:ios
```

2. Ensure compatible versions by running:

```bash
npx expo install --check
```

This will detect and fix any mismatched dependency versions.

## Architecture

```
coffee-native/
├── App.tsx              # Root component with navigation
├── index.ts             # Entry point (gesture-handler import first!)
├── babel.config.js      # Babel config with reanimated plugin
├── src/
│   ├── components/      # Reusable UI components
│   │   ├── PlayButton.tsx      # Animated play/pause button
│   │   ├── ProgressBar.tsx     # Animated progress bar
│   │   ├── Waveform.tsx        # Audio visualization
│   │   ├── AppBackground.tsx   # Gradient background
│   │   ├── GlassCard.tsx       # Glass-morphism card
│   │   ├── MiniPlayer.tsx      # Compact player bar
│   │   ├── SongCard.tsx        # Song list item
│   │   └── SongListPreview.tsx # Song list container
│   ├── contexts/
│   │   └── PlaybackContext.tsx # Audio playback state management
│   ├── navigation/
│   │   └── types.ts            # Navigation type definitions
│   ├── screens/
│   │   ├── PlayerScreen.tsx    # Full-screen player
│   │   ├── HomeScreen.tsx      # Home/library screen
│   │   └── ...
│   ├── types/
│   │   └── declarations.d.ts   # Ambient module declarations
│   └── utils/
│       ├── tokens.ts           # Design tokens (colors, spacing, motion)
│       └── supabase.ts         # Supabase client configuration
└── ...
```

## Key Dependencies

| Package | Purpose |
|---------|---------|
| `expo` ~54.0.18 | Expo SDK |
| `react-native-reanimated` ^4.x | Animations (requires babel plugin) |
| `react-native-gesture-handler` ~2.28.x | Touch gestures |
| `@expo/vector-icons` | Icon library |
| `expo-linear-gradient` | Gradient backgrounds |
| `expo-blur` | Glass/blur effects |
| `expo-av` | Audio playback |
| `@supabase/supabase-js` | Backend integration |

## TODO: Supabase Integration

The following integration points are marked with `TODO` comments in the code:

- [ ] Load track metadata from Supabase database
- [ ] Stream audio files from Supabase storage
- [ ] Sync playback progress to real audio engine
- [ ] Implement real-time waveform visualization with FFT data

## License

Private project - All rights reserved.
