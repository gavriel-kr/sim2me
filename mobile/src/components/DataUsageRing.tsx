import React from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '../theme';

const DEFAULT_SIZE = 56;
const STROKE = 5;
const R = (DEFAULT_SIZE - STROKE) / 2;
const CX = DEFAULT_SIZE / 2;
const CY = DEFAULT_SIZE / 2;

type DataUsageRingProps = {
  /** Used bytes */
  used: number;
  /** Total bytes (order volume). Use 1 if 0 to avoid div by zero */
  total: number;
  size?: number;
  strokeWidth?: number;
  /** Ring color when used */
  usedColor?: string;
  /** Background ring color */
  trackColor?: string;
};

/**
 * SVG ring showing data consumption (used / total).
 * Premium Airalo-style usage indicator.
 */
export function DataUsageRing({
  used,
  total,
  size = DEFAULT_SIZE,
  strokeWidth = STROKE,
  usedColor = colors.primary,
  trackColor = colors.borderLight,
}: DataUsageRingProps) {
  const safeTotal = total > 0 ? total : 1;
  const ratio = Math.min(1, Math.max(0, used / safeTotal));
  const circumference = 2 * Math.PI * R;
  const strokeDashoffset = circumference * (1 - ratio);

  const scale = size / DEFAULT_SIZE;
  const viewBox = `0 0 ${DEFAULT_SIZE} ${DEFAULT_SIZE}`;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={viewBox}>
        {/* Background ring */}
        <Circle
          cx={CX}
          cy={CY}
          r={R}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Used segment */}
        <Circle
          cx={CX}
          cy={CY}
          r={R}
          stroke={usedColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          transform={`rotate(-90 ${CX} ${CY})`}
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}
