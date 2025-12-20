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

// Memoized slide child — avoids re-rendering slide content during scrolling
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

  // For looping we use a cloned array [last, ...slides, first]
  const looped = useMemo(() => {
    if (!slides || slides.length <= 1) return slides;
    return [slides[slides.length - 1], ...slides, slides[0]];
  }, [slides]);

  const indexRef = useRef<number>(looped && looped.length > 1 ? 1 : 0);
  const [currentLoopIndex, setCurrentLoopIndex] = useState<number>(indexRef.current);

  // real slide count (0..N-1)
  const realCount = slides ? slides.length : 0;
  const getRealIndex = (loopIndex: number) => {
    if (realCount <= 1) return loopIndex;
    return ((loopIndex - 1) % realCount + realCount) % realCount;
  };

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = getColors(isDark);

  // itemWidth should match the slide width used by HomeScreen; default to window minus padding
  const [itemWidth, setItemWidth] = useState<number>(Math.round(WINDOW.width - spacing.md * 2));

  // timers & interaction flags
  const autoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInteractingRef = useRef(false);
  const resumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAutoTimer = () => {
    if (autoTimer.current) {
      clearTimeout(autoTimer.current as any);
      autoTimer.current = null;
    }
  };

  const scheduleNext = useCallback(
    (delay = autoAdvanceMs) => {
      clearAutoTimer();
      if (!autoAdvanceMs || autoAdvanceMs <= 0) return;
      if (!looped || looped.length <= 1) return;

      InteractionManager.runAfterInteractions(() => {
        if (!autoAdvanceMs || autoAdvanceMs <= 0) return;
        autoTimer.current = setTimeout(function tick() {
          if (isInteractingRef.current) {
            autoTimer.current = setTimeout(tick, 300);
            return;
          }
          const next = indexRef.current + 1;
          try {
            listRef.current?.scrollToOffset({ offset: next * itemWidth, animated: true });
            indexRef.current = next;
            setCurrentLoopIndex(next);
          } catch {
            // ignore
          }
          autoTimer.current = setTimeout(tick, autoAdvanceMs);
        }, delay);
      });
    },
    [autoAdvanceMs, looped, itemWidth]
  );

  useEffect(() => {
    return () => {
      clearAutoTimer();
      if (resumeTimeoutRef.current) {
        clearTimeout(resumeTimeoutRef.current as any);
        resumeTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    // position to initial loop index after layout
    if (listRef.current && looped && looped.length > 1) {
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

  const scrollToLoopIndex = useCallback(
    (loopIndex: number) => {
      const max = Math.max(0, (looped || []).length - 1);
      const target = Math.min(Math.max(0, loopIndex), max);
      indexRef.current = target;
      setCurrentLoopIndex(target);
      try {
        listRef.current?.scrollToOffset({ offset: target * itemWidth, animated: true });
      } catch {}
      const real = getRealIndex(target);
      const message = `Banner ${real + 1} of ${realCount}`;
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        AccessibilityInfo.announceForAccessibility(message);
      }
      clearAutoTimer();
      InteractionManager.runAfterInteractions(() => {
        scheduleNext();
      });
    },
    [itemWidth, looped, realCount, scheduleNext]
  );

  // interaction handlers
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

    if (rawIndex === looped.length - 1) {
      const jumpTo = 1;
      try {
        listRef.current?.scrollToOffset({ offset: jumpTo * itemWidth, animated: false });
      } catch {}
      indexRef.current = jumpTo;
      setCurrentLoopIndex(jumpTo);
    } else if (rawIndex === 0) {
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
      setTimeout(() => {
        try {
          listRef.current?.scrollToOffset({ offset: indexRef.current * w, animated: false });
        } catch {}
      }, 0);
    }
  };

  const renderItem = useCallback<ListRenderItem<Slide>>(
    ({ item }) => <MemoSlide component={item.component} width={itemWidth} height={height} />,
    [itemWidth, height]
  );

  // Map currentLoopIndex -> current real slide
  const currentReal = getRealIndex(currentLoopIndex);

  // --- Pagination: always show up to 3 dots (1..3) even when there are more slides ---
  const dotCount = Math.max(1, Math.min(3, realCount)); // 1..3
  // map real index into 0..(dotCount-1)
  const currentDot = realCount <= 1 ? 0 : Math.floor((currentReal * dotCount) / realCount);

  const onDotPress = (dotIdx: number) => {
    if (realCount <= 0) return;
    if (dotCount === 1) {
      // go to first real slide
      const loopIdx = looped && looped.length > 1 ? 1 : 0;
      scrollToLoopIndex(loopIdx);
      return;
    }
    // map dot to a target real index (start/mid/end mapping)
    const realTarget = Math.round((dotIdx / Math.max(1, dotCount - 1)) * (realCount - 1));
    const loopIndex = Math.min(
      Math.max(0, realTarget + (looped && looped.length > 1 ? 1 : 0)),
      (looped || []).length - 1
    );
    scrollToLoopIndex(loopIndex);
  };

  const getItemLayout = (_: any, index: number) => ({
    length: itemWidth,
    offset: itemWidth * index,
    index,
  });

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
        onContentSizeChange={() => {
          setTimeout(() => {
            try {
              listRef.current?.scrollToOffset({ offset: indexRef.current * itemWidth, animated: false });
            } catch {}
          }, 0);
        }}
      />

      {/* Compact fixed 3-dot pagination (or fewer if slides < 3) */}
      {realCount > 0 && (
        <View style={styles.pagination}>
          {Array.from({ length: dotCount }).map((_, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => onDotPress(i)}
              accessibilityRole="button"
              accessibilityLabel={`Banner group ${i + 1} of ${dotCount}${i === currentDot ? ', current' : ''}`}
              style={[
                styles.dot,
                {
                  backgroundColor: i === currentDot ? colors.primary : colors.muted,
                  opacity: i === currentDot ? 1 : 0.7,
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
    overflow: 'hidden',
  },
  pagination: {
    position: 'absolute',
    bottom: 12, // slightly closer to the banner
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
    marginHorizontal: 6,
  },
});

export default React.memo(BannerSlider);