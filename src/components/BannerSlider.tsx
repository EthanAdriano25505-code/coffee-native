import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  FlatList,
  Dimensions,
  StyleSheet,
  AccessibilityInfo,
  Platform,
  useColorScheme,
} from 'react-native';
import type { ListRenderItem } from 'react-native';
import { radii, elevation, getColors } from '../theme/designTokens';

const WINDOW = Dimensions.get('window');

type Slide = {
  id: string;
  component: React.ReactNode; // banner content can be a <BannerIllustration/> or image
};

type Props = {
  slides: Slide[];
  autoAdvanceMs?: number; // default 3000
  height?: number;
};

export default function BannerSlider({ slides, autoAdvanceMs = 3000, height }: Props) {
  const listRef = useRef<FlatList>(null);
  const indexRef = useRef(0);
  const [isAuto, setIsAuto] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const autoTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = getColors(isDark);

  useEffect(() => {
    startTimer();
    return () => stopTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slides, autoAdvanceMs, isAuto]);

  const startTimer = () => {
    stopTimer();
    if (!isAuto || slides.length <= 1) return;
    autoTimer.current = setInterval(() => {
      const next = (indexRef.current + 1) % slides.length;
      scrollToIndex(next);
    }, autoAdvanceMs);
  };

  const stopTimer = () => {
    if (autoTimer.current) {
      clearInterval(autoTimer.current);
      autoTimer.current = null;
    }
  };

  const scrollToIndex = (i: number) => {
    indexRef.current = i;
    setCurrentIndex(i);
    listRef.current?.scrollToIndex({ index: i, animated: true });
    // Accessibility announcement
    const message = `Banner ${i + 1} of ${slides.length}`;
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      AccessibilityInfo.announceForAccessibility(message);
    }
  };

  const onScrollBeginDrag = () => {
    setIsAuto(false);
    stopTimer();
  };

  const onScrollEndDrag = () => {
    // Resume auto-advance after a short delay when user stops dragging
    setTimeout(() => {
      setIsAuto(true);
    }, 1000);
  };

  const onMomentumScrollEnd = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / WINDOW.width);
    indexRef.current = index;
    setCurrentIndex(index);
  };

  const renderItem: ListRenderItem<Slide> = ({ item }) => {
    return (
      <View style={[styles.slideContainer, height ? { height } : undefined]}>
        {item.component}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        onScrollBeginDrag={onScrollBeginDrag}
        onScrollEndDrag={onScrollEndDrag}
        onMomentumScrollEnd={onMomentumScrollEnd}
        initialNumToRender={1}
        windowSize={2}
        getItemLayout={(data, index) => ({
          length: WINDOW.width,
          offset: WINDOW.width * index,
          index,
        })}
      />
      {/* Pagination dots */}
      {slides.length > 1 && (
        <View style={styles.pagination}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor: index === currentIndex ? colors.primary : colors.muted,
                  opacity: index === currentIndex ? 1 : 0.3,
                },
              ]}
              accessibilityLabel={`Slide ${index + 1} of ${slides.length}${
                index === currentIndex ? ', current' : ''
              }`}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  slideContainer: {
    width: WINDOW.width,
  },
  pagination: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radii.round,
  },
});
