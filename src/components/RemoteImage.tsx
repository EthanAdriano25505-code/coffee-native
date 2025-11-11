import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  ImageProps,
  ImageStyle,
  ViewStyle,
} from 'react-native';

type Props = {
  uri?: string | null;
  width?: number; // optional fixed width
  height?: number; // optional fixed height
  aspectRatio?: number; // width / height, default 1 (square)
  style?: ImageStyle | ViewStyle;
  imageProps?: Omit<ImageProps, 'source'>;
  placeholderText?: string;
};

export default function RemoteImage({
  uri,
  width,
  height,
  aspectRatio = 1,
  style,
  imageProps,
  placeholderText = 'Image',
}: Props) {
  // initialize error/loading sensibly from incoming props to avoid flicker
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState<boolean>(!!uri && !error);

  // reset error/loading when uri changes so a previously failed image doesn't block a new one
  useEffect(() => {
    setError(false);
    setLoading(!!uri);
  }, [uri]);

  // compute container style with either explicit width/height or aspect ratio
  const containerStyle: ViewStyle = {
    width: width ?? '100%',
    height: height ?? undefined,
    // Apply aspectRatio when an explicit height is NOT provided. If height is present,
    // allow the caller to control the height directly and disable aspectRatio.
    aspectRatio: height ? undefined : aspectRatio,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  };

  return (
    <View style={[containerStyle, styles.container, style as any]}>
      {uri && !error ? (
        <>
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="small" color="#999" />
            </View>
          )}
          <Image
            source={{ uri }}
            style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]}
            resizeMode="cover"
            onLoadStart={() => {
              setLoading(true);
              setError(false);
            }}
            onLoadEnd={() => setLoading(false)}
            onError={() => {
              setError(true);
              setLoading(false);
            }}
            {...imageProps}
          />
        </>
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>{placeholderText}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#e6e6e6',
    borderRadius: 8,
    overflow: 'hidden',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  placeholderText: {
    color: '#666',
    fontWeight: '600',
  },
});