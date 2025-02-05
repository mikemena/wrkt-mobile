import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  TouchableWithoutFeedback,
  ScrollView
} from 'react-native';
import { useTheme } from '../src/hooks/useTheme';
import { getThemedStyles } from '../src/utils/themeUtils';

const CustomPicker = ({
  options,
  selectedValue,
  onValueChange,
  placeholder = 'Select an option'
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const { state } = useTheme();
  const themedStyles = getThemedStyles(state.theme, state.accentColor);

  const selectedOption = options?.find(
    option => option.value === selectedValue
  );
  const displayText = selectedOption ? selectedOption.label : placeholder;

  return (
    <View style={styles.pickerContainer}>
      <TouchableOpacity
        style={[
          styles.pickerButton,
          { backgroundColor: themedStyles.secondaryBackgroundColor }
        ]}
        onPress={() => setModalVisible(true)}
      >
        <Text
          style={[styles.pickerButtonText, { color: themedStyles.textColor }]}
        >
          {displayText}
        </Text>
      </TouchableOpacity>
      <Modal
        visible={modalVisible}
        animationType='fade'
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.modalContent,
                  { backgroundColor: themedStyles.secondaryBackgroundColor }
                ]}
              >
                <ScrollView style={styles.scrollView}>
                  {options?.map((option, index) => (
                    <TouchableOpacity
                      key={`${option.value}-${index}`}
                      style={[
                        styles.optionButton,
                        {
                          borderBottomColor: themedStyles.primaryBackgroundColor
                        }
                      ]}
                      onPress={() => {
                        onValueChange(option.value);
                        setModalVisible(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          { color: themedStyles.textColor }
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  pickerContainer: {
    flex: 1,
    marginBottom: 20
  },
  pickerButton: {
    height: 50,
    paddingHorizontal: 15,
    justifyContent: 'center'
  },
  pickerButtonText: {
    fontSize: 16
  },
  label: {
    fontSize: 16,
    marginBottom: 8
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  modalContent: {
    padding: 20,
    width: '80%',
    maxHeight: '75%'
  },
  scrollView: {
    maxHeight: '100%'
  },
  optionButton: {
    padding: 10,
    borderBottomWidth: 1
  },
  optionText: {
    fontSize: 16
  }
});

export default CustomPicker;
