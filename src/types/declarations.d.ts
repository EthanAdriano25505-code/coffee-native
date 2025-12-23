/**
 * Ambient Module Declarations
 * Provides TypeScript type declarations for RN-native libraries that may be missing types.
 * Prefer using properly typed packages (@types/*) when available.
 *
 * Note: @expo/vector-icons has proper types and doesn't need declarations here.
 */

// Expo LinearGradient
declare module 'expo-linear-gradient' {
  import type { ComponentType } from 'react';
  import type { ViewProps } from 'react-native';

  export interface LinearGradientProps extends ViewProps {
    colors: string[];
    start?: { x: number; y: number };
    end?: { x: number; y: number };
    locations?: number[];
  }

  export const LinearGradient: ComponentType<LinearGradientProps>;
  export default LinearGradient;
}

// Expo BlurView
declare module 'expo-blur' {
  import type { ComponentType } from 'react';
  import type { ViewProps } from 'react-native';

  export interface BlurViewProps extends ViewProps {
    intensity?: number;
    tint?: 'light' | 'dark' | 'default';
    experimentalBlurMethod?: 'none' | 'dimezisBlurView';
  }

  export const BlurView: ComponentType<BlurViewProps>;
  export default BlurView;
}

// react-native-svg (if not already typed)
// We intentionally include common props used in the project such as `fill` and `opacity`.
declare module 'react-native-svg' {
  import type { ComponentType } from 'react';
  import type { ViewProps } from 'react-native';

  export interface SvgProps extends ViewProps {
    width?: number | string;
    height?: number | string;
    viewBox?: string;
    preserveAspectRatio?: string;
    fill?: string | undefined;
    opacity?: number | string | undefined;
  }

  export interface PathProps {
    d?: string;
    fill?: string;
    stroke?: string;
    strokeWidth?: number | string;
    strokeLinecap?: 'butt' | 'round' | 'square';
    strokeLinejoin?: 'miter' | 'round' | 'bevel';
    opacity?: number | string;
  }

  export interface RectProps {
    x?: number | string;
    y?: number | string;
    width?: number | string;
    height?: number | string;
    rx?: number | string;
    ry?: number | string;
    fill?: string;
    stroke?: string;
    opacity?: number | string;
  }

  export interface CircleProps {
    cx?: number | string;
    cy?: number | string;
    r?: number | string;
    fill?: string;
    stroke?: string;
    opacity?: number | string;
  }

  export const Svg: ComponentType<SvgProps>;
  export const Path: ComponentType<PathProps>;
  export const Rect: ComponentType<RectProps>;
  export const Circle: ComponentType<CircleProps>;
  export const G: ComponentType<{ children?: React.ReactNode }>;
  export default Svg;
}