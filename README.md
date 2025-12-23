# Coffee Native

A React Native/Expo music player app with a liquid glass UI design.

## Getting Started

```bash
# Install dependencies
npm install

# Start the Expo development server
npm start

# Run on specific platform
npm run ios
npm run android
npm run web
```

## Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── AppBackground.tsx    # Gradient background (white→blue)
│   ├── GlassCard.tsx        # Frosted glass effect card
│   ├── MiniPlayer.tsx       # Minimized player bar
│   ├── PlayButton.tsx       # Animated play/pause button
│   ├── ProgressBar.tsx      # Styled progress indicator
│   ├── SongCard.tsx         # Song list item
│   ├── SongListPreview.tsx  # Song list component
│   └── Waveform.tsx         # Audio waveform visualization
├── contexts/
│   └── PlaybackContext.tsx  # Audio playback state management
├── navigation/
│   ├── AppNavigator.tsx     # Stack navigator setup
│   ├── index.ts             # Navigation exports
│   └── types.ts             # Navigation type definitions
├── screens/
│   ├── FullSongsScreen.tsx  # Full song library screen
│   ├── HomeScreen.tsx       # Main home screen
│   ├── MusicDetail.tsx      # Song detail screen
│   └── PlayerScreen.tsx     # Full player screen (glass UI)
└── utils/
    ├── supabase.ts          # Supabase client configuration
    └── tokens.ts            # Design tokens (colors, spacing, etc.)
```

## PlayerScreen Architecture

The PlayerScreen implements a "liquid glass" UI design with the following features:

### Design Tokens (`src/utils/tokens.ts`)

Centralized design values used across all glass UI components:

- **Colors**: Background gradients, glass effects, text, controls
- **Gradients**: Pre-defined color arrays for LinearGradient
- **Spacing**: Consistent spacing scale (xs to xxxl)
- **Radii**: Border radius values
- **Blur**: Blur intensity values for glass effects
- **Shadows**: Card and button shadow configurations
- **Typography**: Font size and weight presets
- **Animation**: Duration and spring physics values

### Components

#### AppBackground
- Renders a vertical gradient background (#FFFFFF → #E9F7FF → #D0ECFF)
- Uses `expo-linear-gradient`

#### GlassCard
- Frosted glass effect using `expo-blur` (iOS) or semi-transparent fallback (Android)
- Semi-transparent borders and inner highlight strip
- Supports light (default) and dark variants

#### PlayButton
- Gradient-filled circular button (#2F80ED → #0AA1FF)
- Pulsing glow animation when playing (using react-native-reanimated)
- Press scale feedback animation
- CSS triangle for play icon, bars for pause icon

#### Waveform
- 40-bar audio visualization
- Deterministic pseudo-random bar heights
- Gradient fill for played portion
- Subtle animation near progress point

#### ProgressBar
- Display-only progress visualization
- Gradient progress track
- Animated thumb with blue halo

### Animation Notes

The PlayerScreen uses `react-native-reanimated` for smooth 60fps animations:

1. **Entry Animations**: Cards and controls animate in with `FadeInDown`/`FadeInUp`
2. **Play Button Glow**: Continuous pulsing loop when `isPlaying` is true
3. **Progress Interpolation**: Smooth slider position updates using RAF loop
4. **Press Feedback**: Scale animations on button press

### Reanimated Setup

For react-native-reanimated to work properly:

1. `babel.config.js` includes `'react-native-reanimated/plugin'` as the **last** plugin
2. `index.ts` imports `'react-native-reanimated'` **before** any other imports
3. The app uses Hermes engine (default in Expo SDK 54+)

### Navigation

The PlayerScreen receives song data via navigation params:

```typescript
navigation.navigate('Player', { song: songObject });
```

It also syncs with `PlaybackContext` for playback state and controls.

## Dependencies

Key dependencies for the glass UI:

- `react-native-reanimated`: Smooth animations and gestures
- `expo-blur`: Glass blur effect (iOS)
- `expo-linear-gradient`: Gradient backgrounds and fills
- `react-native-gesture-handler`: Touch handling
- `expo-av`: Audio playback

## License

Private
