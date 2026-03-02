import { Text as RNText, StyleSheet } from 'react-native';
import React from 'react';

// Custom Text component with Futura as default font
const Text = ({ style, children, ...props }) => {
  return (
    <RNText style={[styles.defaultText, style]} {...props}>
      {children}
    </RNText>
  );
};

const styles = StyleSheet.create({
  defaultText: {
    fontFamily: 'Futura',
  },
});

export default Text;