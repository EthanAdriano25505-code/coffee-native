import React, { useEffect, useRef, useState, useCallback } from 'react';
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
  LayoutChangeEvent,
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

// New memoized slide child — avoids re-rendering slide content during scrolling
const MemoSlide = React.memo(function MemoSlide({
  component,
  width,
  height,
}: {
  component: React.ReactNode;
  width: number;
  height?: number;
}) {
  return (
    <View style={[styles.slideContainer, { width }, height ? { height } : undefined]}>
      {component}
    </View>
  );
});

// replace component declaration to be plain function (will be memoized at export)
function BannerSlider({ slides, autoAdvanceMs = 5000, height }: Props) {
  const listRef = useRef<FlatList<Slide> | null>(null);
  const indexRef = useRef(0);
  const [isAuto, setIsAuto] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const autoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // track whether the list is currently being interacted with (dragging/momentum)
  const isInteractingRef = useRef(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = getColors(isDark);

  // NEW: measured width of one slide (may differ from WINDOW.width if container has margins/padding)
  const [itemWidth, setItemWidth] = useState<number>(WINDOW.width);

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

    // Use InteractionManager to avoid scheduling during active transitions.
    // When the timeout fires, if the user is interacting we retry shortly rather
    // than performing an animated programmatic scroll that could fight native momentum.
    InteractionManager.runAfterInteractions(() => {
      if (!isAuto || slides.length <= 1) return;
      autoTimer.current = setTimeout(function tick() {
        if (!isAuto || slides.length <= 1) return;
        // If user is interacting (dragging or momentum), postpone the auto-advance
        if (isInteractingRef.current) {
          // retry after a short backoff
          autoTimer.current = setTimeout(tick, 300);
          return;
        }
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
  }, [slides, autoAdvanceMs, isAuto, itemWidth]);

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
        const offset = itemWidth * target;
        // Avoid animated programmatic scrolls while native momentum/interaction is active
        const animated = !isInteractingRef.current;
        listRef.current.scrollToOffset({ offset, animated });
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

  // Add / replace these handlers in the file

  // Add onScrollBeginDrag to stop auto when the user starts interacting
  const onScrollBeginDrag = () => {
    // Stop auto and clear any pending resume timeout so we don't resume during drag
    stopAuto();
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current as any);
      resumeTimeoutRef.current = null;
    }
    isInteractingRef.current = true;
  };

  // Replace onScrollEndDrag with:
  const onScrollEndDrag = () => {
    // Stop auto and wait for momentum end to resume to avoid conflicts
    stopAuto();
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current as any);
      resumeTimeoutRef.current = null;
    }
    // do NOT clear isInteractingRef here since momentum may start after drag
  };

  // Add onScroll to update the visible dot (rounded) but only when it changes
  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const floatIndex = offsetX / itemWidth;
    const rounded = Math.round(floatIndex);
    // Update only when the rounded index changes to avoid excess renders
    if (rounded !== indexRef.current) {
      indexRef.current = rounded;
      setCurrentIndex(rounded);
    }
  };

  // Replace onMomentumScrollEnd with this snapping + resume logic:
  const onMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / itemWidth);

    // Just update index state — do NOT trigger another programmatic scroll here.
    indexRef.current = index;
    setCurrentIndex(index);

    // Schedule next auto advance now that the user interaction finished.
    scheduleNext();

    // Resume auto after a short delay so auto doesn't fight immediate interactions.
    // clear interaction flag and then resume
    isInteractingRef.current = false;
    resumeAuto(Math.min(autoAdvanceMs, 500));
  };

  // Add momentum begin to ensure we stop timers early
  const onMomentumScrollBegin = () => {
    stopAuto();
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current as any);
      resumeTimeoutRef.current = null;
    }
    isInteractingRef.current = true;
  };

  // NEW: measure actual width of the FlatList container
  const onContainerLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w && Math.abs(w - itemWidth) > 1) {
      setItemWidth(w);
      // if the layout changed, ensure the list aligned to the current index
      // perform a non-animated jump to the correct offset to avoid flicker
      if (listRef.current) {
        try {
          listRef.current.scrollToOffset({ offset: indexRef.current * w, animated: false });
        } catch {}
      }
    }
  };

  // Replace current renderItem with a memoized callback that returns MemoSlide
  const renderItem = useCallback<ListRenderItem<Slide>>(({ item }) => {
    return <MemoSlide component={item.component} width={itemWidth} height={height} />;
  }, [itemWidth, height]);

  return (
    <View style={styles.container} onLayout={onContainerLayout}>
      <FlatList
        ref={(r) => { listRef.current = r; }}
        data={slides}
        horizontal
        pagingEnabled
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        onScrollBeginDrag={onScrollBeginDrag}
        onScrollEndDrag={onScrollEndDrag}
        onMomentumScrollBegin={onMomentumScrollBegin}
        onMomentumScrollEnd={onMomentumScrollEnd}
        onScroll={onScroll}
        scrollEventThrottle={16}
        initialNumToRender={1}
        maxToRenderPerBatch={3}
        windowSize={3}
        removeClippedSubviews={false}
        getItemLayout={(_, index) => ({
          length: itemWidth,
          offset: itemWidth * index,
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
              accessibilityLabel={`Slide ${index + 1} of ${slides.length}${index === currentIndex ? ', current' : ''}`}
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
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  slideContainer: {
    // width is now set dynamically from itemWidth
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

export default React.memo(BannerSlider);