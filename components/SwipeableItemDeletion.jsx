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
    };

    const onSwipeableWillClose = () => {
      setIsOpen(false);
      onSwipeChange?.(false);
    };

    // If not enabled, just render children directly
    if (!enabled) {
      return (
        <Animated.View style={[styles.contentContainer, children.props.style]}>
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
        <Animated.View style={[styles.contentContainer, children.props.style]}>
          {children.props.children}
        </Animated.View>
      </Swipeable>
    );
  }
);

const styles = StyleSheet.create({
  deleteActionContainer: {
    width: 80
  },
  deleteActionContainerSpacing: {
    marginTop: 1
  },
  deleteAction: {
    flex: 1,
    backgroundColor: colors.red,
    overflow: 'hidden'
  },
  deleteActionContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1
  },
  gradient: {
    opacity: 1
  }
});

export default SwipeableItemDeletion;
