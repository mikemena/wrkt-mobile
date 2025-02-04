import React, { useState, useRef, forwardRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../src/styles/globalStyles';
import { useTheme } from '../src/hooks/useTheme';
import { getThemedStyles } from '../src/utils/themeUtils';

const SwipeableItemDeletion = forwardRef(
  (
    {
      onDelete,
      children,
      isLast,
      swipeableType,
      enabled = true,
      onSwipeChange,
      variant
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const swipeableRef = useRef(null);

    // Create an animated value for border radius
    const animatedTopRightRadius = useRef(new Animated.Value(0)).current;
    const animatedBottomRightRadius = useRef(
      new Animated.Value(isLast && swipeableType === 'set' ? 10 : 0)
    ).current;

    const { state: themeState } = useTheme();
    const themedStyles = getThemedStyles(
      themeState.theme,
      themeState.accentColor
    );

    // Expose close method to parent
    React.useImperativeHandle(ref, () => ({
      close: () => {
        swipeableRef.current?.close();
      }
    }));

    const renderRightActions = progress => {
      const dragProgress = progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1]
      });

      // Add extra spacing for program details or edit-program variant
      const shouldApplySpacing =
        variant === 'program-details' || variant === 'edit-program';

      const deleteStyles = [
        styles.deleteActionContainer,
        shouldApplySpacing && styles.deleteActionContainerSpacing
      ];

      return (
        <Animated.View
          style={[
            styles.deleteActionContainer,
            { opacity: dragProgress },
            deleteStyles
          ]}
        >
          <TouchableOpacity onPress={onDelete} style={{ flex: 1 }}>
            <View style={styles.deleteAction}>
              <View style={styles.deleteActionContent}>
                <Ionicons
                  name='trash-outline'
                  size={24}
                  color={colors.eggShell}
                />
              </View>
              {/* Overlay the gradient on top */}
              <LinearGradient
                colors={[themedStyles.secondaryBackgroundColor, colors.red]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[StyleSheet.absoluteFill, styles.gradient]}
              />
            </View>
          </TouchableOpacity>
        </Animated.View>
      );
    };

    const onSwipeableWillOpen = () => {
      setIsOpen(true);
      onSwipeChange?.(true);
      Animated.parallel([
        Animated.timing(animatedTopRightRadius, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false
        }),
        Animated.timing(animatedBottomRightRadius, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false
        })
      ]).start();
    };

    const onSwipeableWillClose = () => {
      setIsOpen(false);
      onSwipeChange?.(false);
      Animated.parallel([
        Animated.timing(animatedTopRightRadius, {
          toValue: 10,
          duration: 200,
          useNativeDriver: false
        }),
        Animated.timing(animatedBottomRightRadius, {
          toValue: 10,
          duration: 200,
          useNativeDriver: false
        })
      ]).start();
    };

    const getBorderRadius = () => {
      if (swipeableType === 'workout') {
        return {
          borderTopRightRadius: isOpen ? 0 : 10,
          borderBottomRightRadius: isOpen ? 0 : 10,
          overflow: 'hidden'
        };
      }
      if (swipeableType === 'exercise') {
        return {
          borderTopRightRadius: 0,
          borderBottomRightRadius: isOpen ? 0 : isLast ? 10 : 0,
          overflow: 'hidden'
        };
      }
      if (swipeableType === 'exercise-start') {
        return {
          borderTopRightRadius: isOpen ? 0 : 10,
          borderBottomRightRadius: isOpen ? 0 : 10,
          overflow: 'hidden'
        };
      }
      // default case
      return {
        borderTopRightRadius: 0,
        borderBottomRightRadius: isOpen ? 0 : isLast ? 10 : 0,
        overflow: 'hidden'
      };
    };

    // If not enabled, just render children directly
    if (!enabled) {
      return (
        <Animated.View
          style={[
            styles.contentContainer,
            children.props.style,
            getBorderRadius()
          ]}
        >
          {children.props.children}
        </Animated.View>
      );
    }

    return (
      <Swipeable
        ref={swipeableRef}
        renderRightActions={renderRightActions}
        onSwipeableWillOpen={onSwipeableWillOpen}
        onSwipeableWillClose={onSwipeableWillClose}
        overshootRight={false}
      >
        <Animated.View
          style={[
            styles.contentContainer,
            children.props.style,
            getBorderRadius()
          ]}
        >
          {children.props.children}
        </Animated.View>
      </Swipeable>
    );
  }
);

const styles = StyleSheet.create({
  deleteActionContainer: {
    width: 80,
    paddingVertical: '1%'
  },
  deleteActionContainerSpacing: {
    marginTop: 1
  },
  deleteAction: {
    flex: 1,
    backgroundColor: colors.red,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    overflow: 'hidden'
  },
  deleteActionContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1
  },
  gradient: {
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    opacity: 1
  }
});

export default SwipeableItemDeletion;
