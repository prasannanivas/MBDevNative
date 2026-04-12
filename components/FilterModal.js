import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import COLORS from '../utils/colors';

const FilterModal = ({ visible, onClose, selectedFilter, onSelectFilter }) => {
  const filters = ['Today', 'This week', 'Last week'/*, 'All clients'*/];

  const handleFilterSelect = (filter) => {
    onSelectFilter(filter);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.title}>Which calls would you like to see</Text>

            <View style={styles.filterList}>
              {filters.map((filter) => (
                <TouchableOpacity
                  key={filter}
                  style={[
                    styles.filterOption,
                    selectedFilter === filter && styles.filterOptionSelected,
                  ]}
                  onPress={() => handleFilterSelect(filter)}
                >
                  <Text
                    style={[
                      styles.filterText,
                      selectedFilter === filter && styles.filterTextSelected,
                    ]}
                  >
                    {filter}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    maxWidth: 400,
  },
  modalContent: {
    backgroundColor: '#F5F5F5',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#202020',
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'Futura Book',
  },
  filterList: {
    width: '100%',
    marginBottom: 20,
  },
  filterOption: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 32,
    marginBottom: 12,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#377473',
    alignItems: 'center',
  },
  filterOptionSelected: {
    backgroundColor: '#377473',
    borderColor: '#377473',
  },
  filterText: {
    fontSize: 18,
    color: '#377473',
    fontWeight: '600',
    fontFamily: 'Futura Book',
  },
  filterTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  cancelButton: {
    marginTop: 8,
    paddingVertical: 12,
  },
  cancelText: {
    fontSize: 18,
    color: '#202020',
    fontWeight: '600',
    fontFamily: 'Futura Book',
  },
});

export default FilterModal;
