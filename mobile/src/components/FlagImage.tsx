import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { colors, radius } from '../theme';

interface Props {
  code: string;
  size?: number;
  rounded?: boolean;
}

export function FlagImage({ code, size = 40, rounded = false }: Props) {
  const uri = code
    ? `https://flagcdn.com/w160/${code.toLowerCase()}.png`
    : `https://flagcdn.com/w160/un.png`;

  return (
    <View
      style={[
        styles.container,
        { width: size, height: size * 0.7, borderRadius: rounded ? radius.sm : 4 },
      ]}
    >
      <Image
        source={{ uri }}
        style={[styles.image, { width: size, height: size * 0.7, borderRadius: rounded ? radius.sm : 4 }]}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: colors.borderLight,
  },
  image: {
    backgroundColor: colors.borderLight,
  },
});
