import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  FlatList,
  Dimensions,
  StyleSheet,
  AccessibilityInfo,
  Platform,
  useColorScheme,
  TouchableOpacity,
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
    return () => {
      stopTimer();
      // clear any pending resume timeout when unmounting
      if (resumeTimeoutRef.current) {
        clearTimeout(resumeTimeoutRef.current as any);
        resumeTimeoutRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slides, autoAdvanceMs, isAuto]);

  const startTimer = () => {
    // Be idempotent: clear any existing timer directly (don't call stopTimer to avoid implicit behavior)
    if (autoTimer.current) {
      clearInterval(autoTimer.current as any);
      autoTimer.current = null;
    }
    if (!isAuto || slides.length <= 1) return;
    autoTimer.current = setInterval(() => {
      const next = (indexRef.current + 1) % slides.length;
      scrollToIndex(next);
    }, autoAdvanceMs);
  };

  const stopTimer = () => {
    if (autoTimer.current) {
      clearInterval(autoTimer.current as any);
      autoTimer.current = null;
    }
  };

  // Safely scroll to an index: clamp desired index and gracefully handle FlatList layout errors
  const scrollToIndex = (i: number) => {
    const maxIndex = Math.max(0, slides.length - 1);
    const target = Math.min(Math.max(0, i), maxIndex);
    indexRef.current = target;
    setCurrentIndex(target);

    if (!listRef.current) {
      // If the list isn't ready, bail; the effect will restart when layout/data changes
      // Accessibility announcement still happens below
    } else {
      try {
        listRef.current.scrollToIndex({ index: target, animated: true });
      } catch (err) {
        // Fallback: try scrollToOffset to a computed position or reset to 0
        try {
          const offset = WINDOW.width * target;
          listRef.current.scrollToOffset({ offset, animated: true });
        } catch (_err) {
          // Last resort: try index 0
          try {
            listRef.current.scrollToIndex({ index: 0, animated: false });
            indexRef.current = 0;
            setCurrentIndex(0);
          } catch (finalErr) {
            // give up silently; avoid throwing to keep UI responsive
          }
        }
      }
    }

    // Accessibility announcement
    const message = `Banner ${target + 1} of ${slides.length}`;
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      AccessibilityInfo.announceForAccessibility(message);
    }
  };

  const resumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onScrollBeginDrag = () => {
    setIsAuto(false);
    stopTimer();
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current as any);
      resumeTimeoutRef.current = null;
    }
  };

  const onScrollEndDrag = () => {
    // Resume auto-advance after a delay derived from autoAdvanceMs so timing scales with config
    const resumeDelayMs = Math.min(autoAdvanceMs, 1000);
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current as any);
      resumeTimeoutRef.current = null;
    }
    resumeTimeoutRef.current = setTimeout(() => {
      setIsAuto(true);
      resumeTimeoutRef.current = null;
    }, resumeDelayMs);
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
            <TouchableOpacity
              key={index}
              onPress={() => scrollToIndex(index)}
              accessibilityRole="button"
              accessibilityLabel={`Slide ${index + 1} of ${slides.length}${
                index === currentIndex ? ', current' : ''
              }`}
              style={[
                styles.dot,
                {
                  // 3-dot pagination: primary color for active, muted for inactive
                  backgroundColor: index === currentIndex ? colors.primary : colors.muted,
                  opacity: index === currentIndex ? 1 : 0.4, // slightly increased opacity for better visibility
                },
              ]}
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
    bottom: 16, // increased from 12 for better visibility
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8, // increased from 6 for better spacing
  },
  dot: {
    width: 8, // dot size for 3-dot pagination indicator
    height: 8,
    borderRadius: radii.round,
  },
});
