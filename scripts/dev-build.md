# Development Build Guide

## Why a Development Build?

Native blur effects (using `expo-blur`) are not fully functional in Expo Go on Android. To see the complete glass/blur UI effects, you need to create a development build.

## Prerequisites

- Node.js 20.x (use `nvm use` if you have nvm installed)
- Android Studio (for Android builds)
- Xcode (for iOS builds on macOS)

## Creating a Development Build for Android

1. **Install EAS CLI** (if not already installed):
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo**:
   ```bash
   eas login
   ```

3. **Configure the project**:
   ```bash
   eas build:configure
   ```

4. **Create a local development build**:
   ```bash
   npx expo run:android
   ```
   
   This will:
   - Generate native Android code
   - Install dependencies
   - Build and run the app on your connected device/emulator

5. **Start the development server**:
   ```bash
   npx expo start --dev-client
   ```

## Creating a Development Build for iOS

1. **Run on iOS simulator/device**:
   ```bash
   npx expo run:ios
   ```

2. **Start the development server**:
   ```bash
   npx expo start --dev-client
   ```

## Differences from Expo Go

### Expo Go (Limited Blur Support)
- ✅ Quick to test basic functionality
- ❌ Limited native module support on Android
- ❌ Blur effects show fallback semi-transparent backgrounds
- ⚠️ Only works with modules included in Expo Go

### Development Build (Full Blur Support)
- ✅ Full native blur effects on Android
- ✅ All native modules work as expected
- ✅ Glass/frosted UI components render properly
- ✅ Better performance for production-like testing
- ⚠️ Requires rebuild when native dependencies change

## Testing the Glass UI

After creating a development build, you should see:

1. **Glass Pill Filter Bar**: Rounded frosted pills with blur background
2. **Mini Player Overlay**: Floating glass control bar with native blur
3. **Glass Drawer**: Side menu with blur and gradient overlay

## Fallback Behavior

When native blur is not available (Expo Go, web), the components automatically fall back to:
- Semi-transparent backgrounds
- Subtle borders and shadows
- Graceful degradation without breaking functionality

## Troubleshooting

### Build fails
- Ensure all dependencies are installed: `npm ci`
- Clear cache: `npx expo start --clear`
- Clean Android build: `cd android && ./gradlew clean`

### Blur still not working
- Verify you're NOT running Expo Go (check app icon)
- Confirm app ownership in code: `Constants.appOwnership !== 'expo'`
- Check logs for blur view warnings

## Performance Considerations

For optimal performance:
- Avoid nested BlurViews in FlatLists
- Use a single glass background where possible
- Reduce blur intensity on lower-end devices
- Test on actual devices, not just simulators
