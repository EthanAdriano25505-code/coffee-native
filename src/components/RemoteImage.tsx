// src/components/RemoteImage.tsx
import React, { useState } from 'react';
import { Image, View, Text, StyleSheet, ImageStyle, StyleProp, ViewStyle } from 'react-native';

type RemoteImageProps = {
  uri: string;
  width?: number;
  height?: number;
  style?: StyleProp<ImageStyle>;
  placeholderText?: string;
};

/**
 * RemoteImage component that handles loading and error states for remote images
 * Provides a placeholder view when image is loading or fails to load
 */
export default function RemoteImage({
  uri,
  width = 100,
  height = 100,
  style,
  placeholderText = '?',
}: RemoteImageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

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
  const placeholderStyle = [styles.placeholder, { width, height }, style];

  // Show placeholder while loading or on error
  if (loading || error || !uri) {
    return (
      <View style={placeholderStyle}>
        <Text style={styles.placeholderText}>{placeholderText}</Text>
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
  placeholder: {
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  placeholderText: {
    fontSize: 24,
    color: '#999',
    fontWeight: '600',
  },
});
