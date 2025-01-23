import React from 'react';
import { View, Text, TextInput, StyleSheet, Platform } from 'react-native';
import SwipeableItemDeletion from '../components/SwipeableItemDeletion';

const Set = ({
  index,
  set,
  isLast,
  onSetChange,
  onDelete,
  themedStyles,
  onFocus
}) => {
  return (
    <View style={[styles.setRowWrapper, isLast && styles.lastSetWrapper]}>
      <SwipeableItemDeletion
        onDelete={() => onDelete(set.id)}
        isLast={isLast}
        swipeableType='set'
      >
        <View
          style={[
            styles.setRow,
            {
              backgroundColor: themedStyles.secondaryBackgroundColor,
              borderBottomLeftRadius: isLast ? 10 : 0,
              borderBottomRightRadius: isLast ? 10 : 0
            }
          ]}
        >
          <Text style={[styles.setNumber, { color: themedStyles.textColor }]}>
            {index + 1}
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: themedStyles.primaryBackgroundColor,
                color: themedStyles.textColor
              }
            ]}
            value={set.weight?.toString()}
            onChangeText={value => onSetChange(index, 'weight', value)}
            onFocus={() => onFocus && onFocus(index, 'weight')}
            keyboardType='numeric'
            returnKeyType='next'
          />
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: themedStyles.primaryBackgroundColor,
                color: themedStyles.textColor
              }
            ]}
            value={set.reps?.toString()}
            onChangeText={value => onSetChange(index, 'reps', value)}
            onFocus={() => onFocus && onFocus(index, 'reps')}
            keyboardType='numeric'
            returnKeyType='done'
          />
        </View>
      </SwipeableItemDeletion>
    </View>
  );
};

const styles = StyleSheet.create({
  setRowWrapper: {
    marginBottom: 1,
    width: '100%',
    zIndex: 1
  },

  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 40
  },
  setNumber: {
    width: 40,
    fontSize: 16,
    textAlign: 'center',
    fontFamily: 'Lexend'
  },
  input: {
    flex: 1,
    height: 32,
    marginHorizontal: 15,
    borderRadius: 10,
    textAlign: 'center',
    fontFamily: 'Lexend',
    paddingVertical: 0
  }
});

export default Set;
