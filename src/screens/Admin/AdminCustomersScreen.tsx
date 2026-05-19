import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../theme';
import { AdminService } from '../../services/api';
import { Users, Search, ChevronRight, Calendar, UserCheck } from 'lucide-react-native';
import { useLanguage } from '../../context/LanguageContext';
import { getFormattedDate } from '../../i18n/translations';

const AdminCustomersScreen = ({ navigation }: any) => {
  const { language, t } = useLanguage();
  const [customers, setCustomers] = useState<any[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCustomers = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      const res = await AdminService.getCustomers();
      setCustomers(res.data);
      filterList(res.data, searchQuery);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchCustomers(false);
  };

  const filterList = (list: any[], query: string) => {
    if (!query.trim()) {
      setFilteredCustomers(list);
    } else {
      const q = query.toLowerCase();
      const filtered = list.filter(
        c => c.business_name.toLowerCase().includes(q) || c.mobile_number.includes(q)
      );
      setFilteredCustomers(filtered);
    }
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    filterList(customers, text);
  };

  const formatDateString = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(language === 'gu' ? 'gu-IN' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (e) {
      return dateStr;
    }
  };

  const renderCustomerItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={() => navigation.navigate('AdminCustomerDetails', {
        customerId: item.id,
        businessName: item.business_name,
      })}
    >
      <View style={styles.cardLeft}>
        <View style={styles.avatar}>
          <UserCheck size={22} color={theme.colors.accent} />
        </View>
        <View style={styles.info}>
          <Text style={styles.businessName} numberOfLines={1}>{item.business_name}</Text>
          <Text style={styles.mobileNumber}>{item.mobile_number}</Text>
          <View style={styles.dateBadge}>
            <Calendar size={12} color={theme.colors.textSecondary} />
            <Text style={styles.dateText}>
              {t.adminRegisteredOn}: {formatDateString(item.created_at)}
            </Text>
          </View>
        </View>
      </View>
      <ChevronRight size={20} color={theme.colors.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t.adminCustomerAccounts}</Text>
        <View style={styles.badge}>
          <Users size={16} color="#FFF" />
          <Text style={styles.badgeText}>{filteredCustomers.length}</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={20} color={theme.colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={t.adminCustomerSearch}
          placeholderTextColor={theme.colors.textSecondary}
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={theme.colors.accent} />
        </View>
      ) : (
        <FlatList
          data={filteredCustomers}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderCustomerItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[theme.colors.accent]} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Users size={48} color={theme.colors.border} />
              <Text style={styles.emptyText}>{t.adminNoCustomers}</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.primary,
  },
  badge: {
    flexDirection: 'row',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    gap: 6,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: theme.spacing.lg,
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
  },
  searchIcon: {
    marginRight: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: theme.colors.text,
  },
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 40,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: theme.spacing.md,
  },
  avatar: {
    backgroundColor: '#FFEAD2', // Soft amber gold
    padding: 10,
    borderRadius: theme.borderRadius.full,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  businessName: {
    ...theme.typography.h3,
    fontSize: 16,
    color: theme.colors.text,
  },
  mobileNumber: {
    ...theme.typography.body,
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  dateText: {
    ...theme.typography.caption,
    fontSize: 11,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: theme.spacing.md,
  },
  emptyText: {
    ...theme.typography.caption,
    fontSize: 14,
    textAlign: 'center',
  },
});

export default AdminCustomersScreen;
