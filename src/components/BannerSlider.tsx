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
  InteractionManager,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import type { ListRenderItem } from 'react-native';
import { radii, getColors } from '../theme/designTokens';

const WINDOW = Dimensions.get('window');

type Slide = {
  id: string;
  component: React.ReactNode; // banner content can be a <BannerIllustration/> or image
};

type Props = {
  slides: Slide[];
  autoAdvanceMs?: number; // default 5000 (5 seconds)
  height?: number;
};

// Memoize component to prevent re-renders when parent re-renders during audio playback
const BannerSlider = React.memo(function BannerSlider({ slides, autoAdvanceMs = 5000, height }: Props) {
  const listRef = useRef<FlatList<Slide> | null>(null);
  const indexRef = useRef(0);
  const [isAuto, setIsAuto] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const autoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = getColors(isDark);

  // Clear any scheduled timer
  const clearTimer = () => {
    if (autoTimer.current) {
      clearTimeout(autoTimer.current as any);
      autoTimer.current = null;
    }
  };

  // Schedule the next auto-advance using setTimeout (avoids overlapping intervals)
  const scheduleNext = () => {
    clearTimer();
    if (!isAuto || slides.length <= 1) return;

    // Use InteractionManager to avoid scheduling during active transitions
    InteractionManager.runAfterInteractions(() => {
      if (!isAuto || slides.length <= 1) return;
      autoTimer.current = setTimeout(() => {
        const next = (indexRef.current + 1) % slides.length;
        scrollToIndex(next);
      }, autoAdvanceMs);
    });
  };

  useEffect(() => {
    // schedule when component mounts/updates
    scheduleNext();
    return () => {
      clearTimer();
      if (resumeTimeoutRef.current) {
        clearTimeout(resumeTimeoutRef.current as any);
        resumeTimeoutRef.current = null;
      }
    };
    // deliberately include slides and isAuto so scheduling restarts when needed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slides, autoAdvanceMs, isAuto]);

  const stopAuto = () => {
    setIsAuto(false);
    clearTimer();
  };

  const resumeAuto = (delay = Math.min(autoAdvanceMs, 800)) => {
    // Small resume delay so user-initiated interactions feel natural
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current as any);
      resumeTimeoutRef.current = null;
    }
    resumeTimeoutRef.current = setTimeout(() => {
      setIsAuto(true);
      resumeTimeoutRef.current = null;
    }, delay);
  };

  // Safely scroll to an index: clamp desired index and gracefully handle FlatList layout errors
  const scrollToIndex = (i: number) => {
    const maxIndex = Math.max(0, slides.length - 1);
    const target = Math.min(Math.max(0, i), maxIndex);
    indexRef.current = target;
    setCurrentIndex(target);

    if (!listRef.current) {
      // If the list isn't ready, bail; the effect will restart when layout/data changes
    } else {
      try {
        // Use scrollToOffset instead of scrollToIndex where possible since we provide getItemLayout
        const offset = WINDOW.width * target;
        listRef.current.scrollToOffset({ offset, animated: true });
      } catch (err) {
        // If that fails, fallback to scrollToIndex
        try {
          listRef.current.scrollToIndex({ index: target, animated: true, viewPosition: 0.5 });
        } catch (_err) {
          // Last resort: go to 0
          try {
            listRef.current.scrollToIndex({ index: 0, animated: false });
            indexRef.current = 0;
            setCurrentIndex(0);
          } catch (finalErr) {
            // Give up silently to avoid crashes
          }
        }
      }
    }

    // Accessibility announcement
    const message = `Banner ${target + 1} of ${slides.length}`;
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      AccessibilityInfo.announceForAccessibility(message);
    }

    // Reset the auto timer so the next advance is scheduled relative to this programmatic scroll
    clearTimer();
    // Small defer to ensure scrolling animation starts before scheduling next
    InteractionManager.runAfterInteractions(() => {
      scheduleNext();
    });
  };

  const onScrollBeginDrag = () => {
    stopAuto();
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current as any);
      resumeTimeoutRef.current = null;
    }
  };

  const onScrollEndDrag = () => {
    // Resume auto-advance after a short delay derived from autoAdvanceMs so timing scales
    resumeAuto();
  };

  const onMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / WINDOW.width);
    indexRef.current = index;
    setCurrentIndex(index);

    // Ensure we schedule next only after momentum ended
    scheduleNext();
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
        ref={(r) => { listRef.current = r; }}
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
        maxToRenderPerBatch={1}
        windowSize={2}
        removeClippedSubviews={false}
        scrollEventThrottle={16}
        getItemLayout={(data, index) => ({
          length: WINDOW.width,
          offset: WINDOW.width * index,
          index,
        })}
        // prevent unnecessary re-renders by avoiding changing inline props
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
                  backgroundColor: index === currentIndex ? colors.primary : colors.muted,
                  opacity: index === currentIndex ? 1 : 0.4,
                },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
});

// Export the memoized component
export default BannerSlider;

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  slideContainer: {
    width: WINDOW.width,
    overflow: 'hidden',
  },
  pagination: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radii.round,
  },
});