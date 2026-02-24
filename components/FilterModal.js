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
  const filters = ['Today', 'This week', 'Last week', 'All clients'];

  const handleFilterSelect = (filter) => {
    onSelectFilter(filter);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.header}>
              <Text style={styles.title}>Filter Call Requests</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={COLORS.slate} />
              </TouchableOpacity>
            </View>

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
                  {selectedFilter === filter && (
                    <Ionicons name="checkmark" size={20} color={COLORS.white} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlayDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    maxWidth: 400,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.silver,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  closeButton: {
    padding: 4,
  },
  filterList: {
    padding: 12,
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: COLORS.background,
  },
  filterOptionSelected: {
    backgroundColor: COLORS.blue,
  },
  filterText: {
    fontSize: 16,
    color: COLORS.black,
    fontWeight: '500',
  },
  filterTextSelected: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
});

export default FilterModal;
