import React, { useState } from 'react';
import { Image, View, Text, StyleSheet, ImageStyle, StyleProp } from 'react-native';

type Props = {
  uri?: string | null;
  width?: number;
  height?: number;
  style?: StyleProp<ImageStyle>;
  placeholderText?: string;
};

export default function RemoteImage({ uri, width, height, style, placeholderText = 'IMG' }: Props) {
  const [error, setError] = useState(false);

  if (!uri || error) {
    return (
      <View style={[styles.placeholder, { width, height }, style]}>
        <Text style={styles.placeholderText}>{placeholderText}</Text>
      </View>
    );
  }
  return (
    <Image
      source={{ uri }}
      style={[{ width, height }, style]}
      onError={() => setError(true)}
    />
  );
}

const styles = StyleSheet.create({
  placeholder: { backgroundColor: '#333', alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  placeholderText: { color: '#aaa', fontSize: 10 },
});
