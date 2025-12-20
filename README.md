# Coffee Native - Music Streaming App

A React Native music streaming app built with Expo, featuring beautiful glass/blur UI effects and Supabase integration.

## Features

- 🎵 Music playback with play, pause, skip controls
- 🎨 Glass/blur UI design with rounded icy buttons
- 📱 Mini player overlay with native blur effects
- 🔍 Filter pills for easy navigation (All, Playlists, Liked Songs, Downloaded)
- 🌓 Dark mode support
- 💾 Supabase backend integration
- 🎭 Fallback UI for Expo Go compatibility

## Tech Stack

- **React Native** 0.81.5
- **React** 19.1.0
- **Expo SDK** 54
- **TypeScript** 5.9.2
- **Supabase** for backend
- **expo-blur** for glass effects
- **expo-av** for audio playback

## Getting Started

### Prerequisites

- Node.js 20.x (recommended, see `.nvmrc`)
- npm or yarn
- Expo Go app (for quick testing) or development build (for full features)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd coffee-native
   ```

2. Install dependencies (use `npm ci` to ensure consistent versions):
   ```bash
   npm ci
   ```

3. Start the development server:
   ```bash
   npm start
   # or
   npx expo start
   ```

### Running the App

#### Quick Testing with Expo Go
```bash
npx expo start
```
Scan the QR code with Expo Go app. Note: Native blur effects will show fallback styling on Android.

#### Full Experience with Development Build
For native blur effects on Android, create a development build:
```bash
npx expo run:android
# or for iOS
npx expo run:ios
```

See [scripts/dev-build.md](scripts/dev-build.md) for detailed instructions.

## Glass/Blur UI Features

### Why Blur Disappeared in Expo Go

Native blur effects require platform-specific modules that are not fully available in Expo Go on Android. The app now includes:

1. **Intelligent Detection**: Automatically detects if native blur is available
2. **Graceful Fallback**: Shows semi-transparent backgrounds when blur is unavailable
3. **Development Build Support**: Full blur effects in production-ready builds

### Glass UI Components

- **GlassView**: Reusable blur wrapper component with fallback support
- **CenterMiniPill**: Horizontal filter pills with glass backgrounds
- **MiniPlayerOverlay**: Floating glass mini-player control
- **GlassDrawer**: Side navigation with blur and gradient effects

### Platform-Specific Behavior

| Platform | Expo Go | Development Build |
|----------|---------|-------------------|
| iOS | ✅ Full blur | ✅ Full blur |
| Android | ⚠️ Fallback | ✅ Full blur |
| Web | ⚠️ Fallback | ⚠️ Fallback |

## Project Structure

```
coffee-native/
├── src/
│   ├── assets/          # Images, icons
│   ├── components/      # Reusable UI components
│   │   ├── GlassView.tsx
│   │   ├── CenterMiniPill.tsx
│   │   ├── MiniPlayerOverlay.tsx
│   │   └── ...
│   ├── contexts/        # React contexts (PlaybackContext)
│   ├── navigation/      # Navigation setup
│   ├── screens/         # Screen components
│   ├── theme/           # Design tokens, colors
│   │   └── designTokens.ts
│   └── utils/           # Utilities, Supabase client
├── scripts/             # Documentation and scripts
│   └── dev-build.md     # Development build guide
├── .nvmrc              # Node version specification
└── package.json
```

## Design Tokens

The app uses a centralized design system defined in `src/theme/designTokens.ts`:

- **Spacing**: Consistent padding/margins (xs, sm, md, lg, xl)
- **Radii**: Border radius values (small, normal, round, pill)
- **Glass**: Blur intensity, colors, and dimensions
- **Elevation**: Shadow configurations
- **Colors**: Light/dark theme colors

## Recovery from Dependency Issues

### What Happened

Previous `npm install` commands inflated dependency versions (React 19, etc.), but the project was reset using `npm ci` to restore locked versions from `package-lock.json`.

### Best Practices to Avoid Drift

1. **Use `npm ci` for CI/clean installs**: Ensures exact versions from lockfile
2. **Commit lockfile**: Always commit `package-lock.json` changes
3. **Version consistency**: Check `.nvmrc` for Node version
4. **Review before updating**: Be cautious with `npm install <package>` without version pins

### Current State

- ✅ React 19.1.0 (matches Expo SDK 54 bundled version)
- ✅ All dependencies locked in package-lock.json
- ✅ TypeScript compiles without errors
- ✅ expo-constants installed for platform detection

## Supabase Integration

The app integrates with Supabase for song data, filtering by `access_level`:

- **free**: Free songs available to all users
- **premium**: Paid/subscription content
- **teaser**: Preview/teaser tracks

Songs are filtered in `FullSongsScreen` based on navigation params and titles, ensuring correct content is displayed for each category.

## Development Guidelines

### Code Style
- TypeScript for type safety
- Functional components with hooks
- Memoization for performance (React.memo, useMemo, useCallback)
- Consistent naming (PascalCase for components, camelCase for functions)

### Performance
- Avoid nested BlurViews in long FlatLists
- Use single glass backgrounds where feasible
- Optimize image loading with RemoteImage component
- Implement pagination for large lists

### Testing
- Run TypeScript checks: `npx tsc --noEmit`
- Test on both iOS and Android
- Verify blur fallback in Expo Go
- Validate performance on lower-end devices

## Troubleshooting

### TypeScript Errors
```bash
npx tsc --noEmit
```

### Clear Cache
```bash
npx expo start --clear
```

### Dependency Issues
```bash
rm -rf node_modules package-lock.json
npm ci
```

### Build Issues
See [scripts/dev-build.md](scripts/dev-build.md) for platform-specific troubleshooting.

## Contributing

1. Create a feature branch from `main`
2. Make minimal, focused changes
3. Ensure TypeScript compiles: `npx tsc --noEmit`
4. Test on both light/dark modes
5. Document any new design tokens or components
6. Submit PR with clear description

## License

[Add your license here]

## Credits

Developed by Saw K Za
