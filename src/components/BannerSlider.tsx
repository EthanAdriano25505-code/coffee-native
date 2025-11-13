import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
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
import { radii, getColors, spacing } from '../theme/designTokens';

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

function BannerSlider({ slides, autoAdvanceMs = 5000, height }: Props) {
  const listRef = useRef<FlatList<Slide> | null>(null);
  // For looped data we'll work with 'looped' which may be [last, ...slides, first]
  const looped = useMemo(() => {
    if (!slides || slides.length <= 1) return slides;
    return [slides[slides.length - 1], ...slides, slides[0]];
  }, [slides]);

  // indexRef points into the looped array
  const indexRef = useRef<number>(looped && looped.length > 1 ? 1 : 0);
  const [currentLoopIndex, setCurrentLoopIndex] = useState<number>(indexRef.current);

  // Expose a "real" index (0..N-1) for UI (dots)
  const realCount = slides ? slides.length : 0;
  const getRealIndex = (loopIndex: number) => {
    if (realCount <= 1) return loopIndex;
    // loopIndex 1..N maps to 0..N-1
    return ((loopIndex - 1) % realCount + realCount) % realCount;
  };

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = getColors(isDark);

  const [itemWidth, setItemWidth] = useState<number>(Math.round(WINDOW.width - spacing.md * 2)); // match HomeScreen padding

  // timers and interaction tracking
  const autoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInteractingRef = useRef(false);
  const resumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAutoTimer = () => {
    if (autoTimer.current) {
      clearTimeout(autoTimer.current as any);
      autoTimer.current = null;
    }
  };

  // Schedule auto-advance to always move right (looping)
  const scheduleNext = useCallback(
    (delay = autoAdvanceMs) => {
      clearAutoTimer();
      if (!autoAdvanceMs || autoAdvanceMs <= 0) return;
      if (!looped || looped.length <= 1) return;

      InteractionManager.runAfterInteractions(() => {
        if (!autoAdvanceMs || autoAdvanceMs <= 0) return;
        autoTimer.current = setTimeout(function tick() {
          // If user interacting, retry shortly
          if (isInteractingRef.current) {
            autoTimer.current = setTimeout(tick, 300);
            return;
          }
          const next = indexRef.current + 1;
          // animate to next in looped dataset
          try {
            listRef.current?.scrollToOffset({ offset: next * itemWidth, animated: true });
            // optimistic update
            indexRef.current = next;
            setCurrentLoopIndex(next);
          } catch {
            // ignore
          }
          // schedule next after this tick
          autoTimer.current = setTimeout(tick, autoAdvanceMs);
        }, delay);
      });
    },
    [autoAdvanceMs, looped, itemWidth]
  );

  // clear on unmount
  useEffect(() => {
    return () => {
      clearAutoTimer();
      if (resumeTimeoutRef.current) {
        clearTimeout(resumeTimeoutRef.current as any);
        resumeTimeoutRef.current = null;
      }
    };
  }, []);

  // Start/Restart timer when slides or widths change
  useEffect(() => {
    // Position to the initial loop index (1) when we have multiple slides
    if (listRef.current && looped && looped.length > 1) {
      // ensure layout exists before non-animated jump
      setTimeout(() => {
        try {
          listRef.current?.scrollToOffset({ offset: indexRef.current * itemWidth, animated: false });
        } catch {}
      }, 0);
    } else if (listRef.current && looped && looped.length === 1) {
      setTimeout(() => {
        try {
          listRef.current?.scrollToOffset({ offset: 0, animated: false });
        } catch {}
      }, 0);
    }
    // Reset timer
    clearAutoTimer();
    scheduleNext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [looped, itemWidth, scheduleNext]);

  const stopAuto = useCallback(() => {
    clearAutoTimer();
  }, []);

  const resumeAuto = useCallback(
    (delay = Math.min(autoAdvanceMs || 500, 800)) => {
      if (resumeTimeoutRef.current) {
        clearTimeout(resumeTimeoutRef.current as any);
        resumeTimeoutRef.current = null;
      }
      resumeTimeoutRef.current = setTimeout(() => {
        scheduleNext();
        resumeTimeoutRef.current = null;
      }, delay);
    },
    [autoAdvanceMs, scheduleNext]
  );

  // Safe scroll to an index in the looped dataset
  const scrollToLoopIndex = useCallback(
    (loopIndex: number) => {
      const max = Math.max(0, (looped || []).length - 1);
      const target = Math.min(Math.max(0, loopIndex), max);
      indexRef.current = target;
      setCurrentLoopIndex(target);
      try {
        listRef.current?.scrollToOffset({ offset: target * itemWidth, animated: true });
      } catch {
        // ignore
      }
      // announce
      const real = getRealIndex(target);
      const message = `Banner ${real + 1} of ${realCount}`;
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        AccessibilityInfo.announceForAccessibility(message);
      }
      // reset timer
      clearAutoTimer();
      InteractionManager.runAfterInteractions(() => {
        scheduleNext();
      });
    },
    [itemWidth, looped, realCount, scheduleNext]
  );

  // Handlers for user interaction
  const onScrollBeginDrag = () => {
    isInteractingRef.current = true;
    stopAuto();
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current as any);
      resumeTimeoutRef.current = null;
    }
  };

  const onMomentumScrollBegin = () => {
    isInteractingRef.current = true;
    stopAuto();
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current as any);
      resumeTimeoutRef.current = null;
    }
  };

  const onScrollEndDrag = () => {
    // don't clear interacting here; momentum may follow
    stopAuto();
  };

  const onMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const rawIndex = Math.round(offsetX / itemWidth);

    if (!looped || looped.length <= 1) {
      indexRef.current = rawIndex;
      setCurrentLoopIndex(rawIndex);
      resumeAuto();
      isInteractingRef.current = false;
      return;
    }

    // If reached cloned first (at looped.length - 1), jump to real first (index 1)
    if (rawIndex === looped.length - 1) {
      const jumpTo = 1;
      // immediate jump without animation
      try {
        listRef.current?.scrollToOffset({ offset: jumpTo * itemWidth, animated: false });
      } catch {}
      indexRef.current = jumpTo;
      setCurrentLoopIndex(jumpTo);
    }
    // If reached cloned last (index 0), jump to real last (looped.length - 2)
    else if (rawIndex === 0) {
      const jumpTo = looped.length - 2;
      try {
        listRef.current?.scrollToOffset({ offset: jumpTo * itemWidth, animated: false });
      } catch {}
      indexRef.current = jumpTo;
      setCurrentLoopIndex(jumpTo);
    } else {
      indexRef.current = rawIndex;
      setCurrentLoopIndex(rawIndex);
    }

    // Schedule next auto and resume after short delay
    isInteractingRef.current = false;
    resumeAuto(Math.min(autoAdvanceMs || 500, 500));
  };

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const floatIndex = offsetX / itemWidth;
    const rounded = Math.round(floatIndex);
    if (rounded !== indexRef.current) {
      indexRef.current = rounded;
      setCurrentLoopIndex(rounded);
    }
  };

  const onContainerLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w && Math.abs(w - itemWidth) > 1) {
      setItemWidth(w);
      // reposition to current index immediately to avoid visual jump
      setTimeout(() => {
        try {
          listRef.current?.scrollToOffset({ offset: indexRef.current * w, animated: false });
        } catch {}
      }, 0);
    }
  };

  // renderItem uses MemoSlide
  const renderItem = useCallback<ListRenderItem<Slide>>(
    ({ item }) => <MemoSlide component={item.component} width={itemWidth} height={height} />,
    [itemWidth, height]
  );

  // pagination real index for UI
  const currentReal = getRealIndex(currentLoopIndex);

  // handle dot press (go to a real index -> loopIndex = real + 1)
  const onDotPress = (realIdx: number) => {
    const loopIdx = realIdx + (looped && looped.length > 1 ? 1 : 0);
    scrollToLoopIndex(loopIdx);
  };

  // getItemLayout uses itemWidth
  const getItemLayout = (_: any, index: number) => ({
    length: itemWidth,
    offset: itemWidth * index,
    index,
  });

  // key extractor must include index because looped clones may share ids
  const keyExtractor = (_: Slide, idx: number) => `${(looped && looped[idx] ? looped[idx].id : idx)}-${idx}`;

  return (
    <View style={[styles.container, height ? { height } : undefined]} onLayout={onContainerLayout}>
      <FlatList
        ref={(r) => {
          listRef.current = r;
        }}
        data={looped}
        horizontal
        pagingEnabled
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        onScrollBeginDrag={onScrollBeginDrag}
        onScrollEndDrag={onScrollEndDrag}
        onMomentumScrollBegin={onMomentumScrollBegin}
        onMomentumScrollEnd={onMomentumScrollEnd}
        onScroll={onScroll}
        scrollEventThrottle={16}
        initialNumToRender={Math.min(looped.length, 3)}
        maxToRenderPerBatch={3}
        windowSize={3}
        removeClippedSubviews={false}
        getItemLayout={getItemLayout}
        // maintain current position if content size changes
        onContentSizeChange={() => {
          // ensure we're aligned (useful after images load)
          setTimeout(() => {
            try {
              listRef.current?.scrollToOffset({ offset: indexRef.current * itemWidth, animated: false });
            } catch {}
          }, 0);
        }}
      />
      {/* Pagination dots based on real slides count */}
      {realCount > 1 && (
        <View style={styles.pagination}>
          {Array.from({ length: realCount }).map((_, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => onDotPress(index)}
              accessibilityRole="button"
              accessibilityLabel={`Slide ${index + 1} of ${realCount}${index === currentReal ? ', current' : ''}`}
              style={[
                styles.dot,
                {
                  backgroundColor: index === currentReal ? colors.primary : colors.muted,
                  opacity: index === currentReal ? 1 : 0.5,
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
    marginHorizontal: 4,
  },
});

export default React.memo(BannerSlider);