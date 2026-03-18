import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface WebCheckboxProps {
  checked: boolean;
  onPress: () => void;
  color?: string;
}

export function WebCheckbox({ checked, onPress, color = '#4A90D9' }: WebCheckboxProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.box,
        { borderColor: checked ? color : '#BDC3C7' },
        checked && { backgroundColor: color },
      ]}
    >
      {checked && <Text style={styles.check}>✓</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  box: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  check: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 18,
  },
});
