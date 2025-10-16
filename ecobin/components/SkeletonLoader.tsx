import React from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export default function SkeletonLoader({ 
  width = '100%', 
  height = 20, 
  borderRadius = 4,
  style 
}: SkeletonLoaderProps) {
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: false,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [animatedValue]);

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['#f0f0f0', '#e0e0e0'],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          backgroundColor,
        },
        style,
      ]}
    />
  );
}

// Predefined skeleton components for common use cases
export function SkeletonCard() {
  return (
    <View style={styles.cardContainer}>
      <View style={styles.cardHeader}>
        <SkeletonLoader width={60} height={16} />
        <SkeletonLoader width={40} height={16} />
      </View>
      <SkeletonLoader width="80%" height={14} style={styles.cardText} />
      <SkeletonLoader width="60%" height={14} style={styles.cardText} />
      <SkeletonLoader width="40%" height={12} style={styles.cardText} />
    </View>
  );
}

export function SkeletonList() {
  return (
    <View>
      {[...Array(5)].map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </View>
  );
}

export function SkeletonProfile() {
  return (
    <View style={styles.profileContainer}>
      <SkeletonLoader width={80} height={80} borderRadius={40} />
      <View style={styles.profileInfo}>
        <SkeletonLoader width={120} height={18} style={styles.profileText} />
        <SkeletonLoader width={100} height={14} style={styles.profileText} />
        <SkeletonLoader width={80} height={14} style={styles.profileText} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#f0f0f0',
  },
  cardContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardText: {
    marginBottom: 8,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  profileText: {
    marginBottom: 6,
  },
});
