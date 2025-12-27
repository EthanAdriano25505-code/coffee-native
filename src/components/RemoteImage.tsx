// src/components/RemoteImage.tsx
import React, { useState } from 'react';
import { Image, View, Text, StyleSheet, ImageStyle, StyleProp, ViewStyle } from 'react-native';
import { getColors, radii } from '../theme/designTokens';

type RemoteImageProps = {
  uri: string;
  width?: number;
  height?: number;
  style?: StyleProp<ImageStyle>;
  placeholderText?: string;
  isDark?: boolean;
};

/**
 * RemoteImage component that handles loading and error states for remote images
 * Provides a placeholder view when image is loading, fails to load, or uri is not provided
 */
export default function RemoteImage({
  uri,
  width = 100,
  height = 100,
  style,
  placeholderText = '?',
  isDark = false,
}: RemoteImageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const colors = getColors(isDark);

  const handleLoadStart = () => {
    setLoading(true);
    setError(false);
  };

  const handleLoadEnd = () => {
    setLoading(false);
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
  };

  const imageStyle = [{ width, height }, style];
  const placeholderStyle: StyleProp<ViewStyle> = [
    { 
      width, 
      height,
      backgroundColor: colors.surfaceAlt,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: radii.md,
    }, 
    style
  ];

  // Show placeholder while loading or on error
  if (loading || error || !uri) {
    return (
      <View style={placeholderStyle}>
        <Text style={[styles.placeholderText, { color: colors.muted }]}>{placeholderText}</Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={imageStyle}
      onLoadStart={handleLoadStart}
      onLoadEnd={handleLoadEnd}
      onError={handleError}
      resizeMode="cover"
    />
  );
}

const styles = StyleSheet.create({
  placeholderText: {
    fontSize: 24,
    fontWeight: '600',
  },
});
