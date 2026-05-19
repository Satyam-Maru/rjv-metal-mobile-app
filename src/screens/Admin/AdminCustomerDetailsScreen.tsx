import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../theme';
import { AdminService } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { Package, ArrowUpRight, ArrowDownLeft, History, Users, Phone, MapPin, Tag, Briefcase, ChevronLeft, Calendar } from 'lucide-react-native';
import LineChart from 'react-native-chart-kit/dist/line-chart';
import PieChart from 'react-native-chart-kit/dist/PieChart';
import { toGujaratiNumerals } from '../../i18n/translations';

const screenWidth = Dimensions.get('window').width;

const StatCard = ({ title, value, icon: Icon, color, isCurrency, lang }: any) => (
  <View style={styles.statCard}>
    <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
      <Icon size={20} color={color} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
        {isCurrency
          ? `₹${lang === 'gu' ? toGujaratiNumerals(value) : value}`
          : (lang === 'gu' ? toGujaratiNumerals(value) : value)}
      </Text>
    </View>
  </View>
);

const AdminCustomerDetailsScreen = ({ route, navigation }: any) => {
  const { customerId, businessName } = route.params;
  const { language, t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState<any>({
    user: {},
    categories: [],
    locations: [],
    entities: [],
    products: [],
    stockHistory: [],
    stats: {
      totalStock: 0,
      totalPurchases: 0,
      totalSales: 0,
      historyCount: 0,
      dailyTrend: [],
      categoryDistribution: []
    }
  });

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const res = await AdminService.getCustomerDetails(customerId);
        setData(res.data);
      } catch (error) {
        console.error('Error fetching customer details:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [customerId]);

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(13, 110, 253, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(108, 117, 125, ${opacity})`,
    style: { borderRadius: 16 },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: theme.colors.accent,
    },
  };

  const trendData = {
    labels: data.stats.dailyTrend.map((d: any) =>
      language === 'gu' ? toGujaratiNumerals(d.date.split('-')[2]) : d.date.split('-')[2]
    ),
    datasets: [
      {
        data: data.stats.dailyTrend.map((d: any) => d.sales),
        color: (opacity = 1) => `rgba(40, 167, 69, ${opacity})`,
        strokeWidth: 2
      },
      {
        data: data.stats.dailyTrend.map((d: any) => d.purchases),
        color: (opacity = 1) => `rgba(220, 53, 69, ${opacity})`,
        strokeWidth: 2
      }
    ],
    legend: [t.sales, t.purchases]
  };

  const pieData = data.stats.categoryDistribution.map((cat: any, index: number) => {
    const colors = [theme.colors.primary, theme.colors.accent, '#20c997', '#ffc107', '#fd7e14', '#6610f2'];
    return {
      name: cat.name,
      population: cat.value,
      color: colors[index % colors.length],
      legendFontColor: '#7F7F7F',
      legendFontSize: 12
    };
  });

  const renderOverview = () => (
    <ScrollView style={styles.tabScrollContent} showsVerticalScrollIndicator={false}>
      {/* Contact card */}
      <View style={styles.contactCard}>
        <View style={styles.contactRow}>
          <Phone size={16} color={theme.colors.textSecondary} />
          <Text style={styles.contactText}>{data.user.mobile_number}</Text>
        </View>
        <View style={[styles.contactRow, { marginTop: theme.spacing.sm }]}>
          <Calendar size={16} color={theme.colors.textSecondary} />
          <Text style={styles.contactText}>
            {t.adminRegisteredOn}: {new Date(data.user.created_at).toLocaleDateString()}
          </Text>
        </View>
      </View>

      {/* KPI Cards Grid */}
      <View style={styles.statsGrid}>
        <StatCard
          title={t.totalStock}
          value={data.stats.totalStock.toLocaleString()}
          icon={Package}
          color={theme.colors.primary}
          lang={language}
        />
        <StatCard
          title={t.totalHistory}
          value={data.stats.historyCount.toLocaleString()}
          icon={History}
          color={theme.colors.textSecondary}
          lang={language}
        />
        <StatCard
          title={t.purchases}
          value={data.stats.totalPurchases.toLocaleString()}
          icon={ArrowDownLeft}
          color={theme.colors.error}
          isCurrency
          lang={language}
        />
        <StatCard
          title={t.sales}
          value={data.stats.totalSales.toLocaleString()}
          icon={ArrowUpRight}
          color={theme.colors.success}
          isCurrency
          lang={language}
        />
      </View>

      {/* Line Chart */}
      <View style={styles.chartSection}>
        <Text style={styles.chartTitle}>{t.last7DaysTrend}</Text>
        {data.stats.dailyTrend.length > 0 ? (
          <LineChart
            data={trendData}
            width={screenWidth - 64}
            height={200}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        ) : (
          <Text style={styles.emptyText}>No trend data available</Text>
        )}
      </View>

      {/* Pie Chart */}
      <View style={styles.chartSection}>
        <Text style={styles.chartTitle}>{t.stockByCategory}</Text>
        {data.stats.categoryDistribution.length > 0 ? (
          <View style={styles.pieContainer}>
            <PieChart
              data={pieData}
              width={screenWidth - 48}
              height={180}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft={(screenWidth / 4.5).toString()}
              absolute
              hasLegend={false}
            />
            <View style={styles.customLegend}>
              {pieData.map((item: any, index: number) => (
                <View key={index} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                  <Text style={styles.legendText}>{item.name}</Text>
                  <Text style={styles.legendValue}>
                    ({language === 'gu' ? toGujaratiNumerals(item.population) : item.population})
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <Text style={styles.emptyText}>{t.noCategoryData}</Text>
        )}
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );

  const renderProducts = () => (
    <FlatList
      data={data.products}
      keyExtractor={(item: any) => item.id.toString()}
      contentContainerStyle={styles.listContainer}
      renderItem={({ item }: any) => (
        <View style={styles.itemRow}>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{item.name}</Text>
            <View style={styles.subBadgeRow}>
              {item.code && <Text style={styles.codeBadge}>{item.code}</Text>}
              <Text style={styles.metaSubText}>
                {item.category?.name || 'Uncategorized'} | Unit: {item.unit || 'pcs'}
              </Text>
            </View>
          </View>
          <View style={styles.itemPricing}>
            <Text style={styles.itemPrice}>₹{item.price}</Text>
            <Text style={[styles.itemStock, item.quantity <= 0 && { color: theme.colors.error }]}>
              Qty: {item.quantity}
            </Text>
          </View>
        </View>
      )}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Package size={36} color={theme.colors.border} />
          <Text style={styles.emptyText}>No products added yet</Text>
        </View>
      }
    />
  );

  const renderTransactions = () => (
    <FlatList
      data={data.stockHistory}
      keyExtractor={(item: any) => item.id.toString()}
      contentContainerStyle={styles.listContainer}
      renderItem={({ item }: any) => {
        const itemTotal = (item.quantity * item.price) * (1 - ((item.discount || 0) / 100));
        const isPurchase = item.type === 'purchase';
        return (
          <View style={styles.itemRow}>
            <View style={styles.itemInfo}>
              <View style={styles.historyNameRow}>
                <View style={[styles.typeIcon, { backgroundColor: isPurchase ? theme.colors.error + '10' : theme.colors.success + '10' }]}>
                  {isPurchase ? <ArrowDownLeft size={16} color={theme.colors.error} /> : <ArrowUpRight size={16} color={theme.colors.success} />}
                </View>
                <Text style={styles.itemName}>{item.products?.name || 'Unknown Product'}</Text>
              </View>
              <Text style={styles.metaSubText}>
                {isPurchase ? 'From' : 'To'}: {item.entities?.name || 'Direct'}
              </Text>
              <Text style={styles.dateSubText}>
                {new Date(item.created_at).toLocaleString()}
              </Text>
            </View>
            <View style={styles.itemPricing}>
              <Text style={[styles.itemPrice, { color: isPurchase ? theme.colors.error : theme.colors.success }]}>
                {isPurchase ? '-' : '+'}₹{itemTotal.toFixed(2)}
              </Text>
              <Text style={styles.metaSubText}>
                {item.quantity} x ₹{item.price} {item.discount > 0 ? `(-${item.discount}%)` : ''}
              </Text>
            </View>
          </View>
        );
      }}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <History size={36} color={theme.colors.border} />
          <Text style={styles.emptyText}>No transactions recorded</Text>
        </View>
      }
    />
  );

  const renderSetupData = () => (
    <ScrollView style={styles.tabScrollContent} showsVerticalScrollIndicator={false}>
      {/* Categories */}
      <View style={styles.sectionHeader}>
        <Tag size={16} color={theme.colors.primary} />
        <Text style={styles.sectionTitle}>Categories ({data.categories.length})</Text>
      </View>
      <View style={styles.chipsRow}>
        {data.categories.map((c: any) => (
          <View key={c.id} style={styles.chip}>
            <Text style={styles.chipText}>{c.name}</Text>
          </View>
        ))}
        {data.categories.length === 0 && <Text style={styles.emptySectionText}>No categories configured</Text>}
      </View>

      {/* Locations */}
      <View style={[styles.sectionHeader, { marginTop: theme.spacing.lg }]}>
        <MapPin size={16} color={theme.colors.primary} />
        <Text style={styles.sectionTitle}>Locations ({data.locations.length})</Text>
      </View>
      <View style={styles.chipsRow}>
        {data.locations.map((l: any) => (
          <View key={l.id} style={styles.chip}>
            <Text style={styles.chipText}>{l.name}</Text>
          </View>
        ))}
        {data.locations.length === 0 && <Text style={styles.emptySectionText}>No locations configured</Text>}
      </View>

      {/* Entities */}
      <View style={[styles.sectionHeader, { marginTop: theme.spacing.lg }]}>
        <Briefcase size={16} color={theme.colors.primary} />
        <Text style={styles.sectionTitle}>Entities / Parties ({data.entities.length})</Text>
      </View>
      {data.entities.map((e: any) => (
        <View key={e.id} style={styles.entityRow}>
          <View>
            <Text style={styles.entityName}>{e.name}</Text>
            <Text style={styles.entityType}>
              {e.type === 'supplier' ? 'Supplier' : 'Customer'}
            </Text>
          </View>
          {e.locations?.name && (
            <View style={styles.entityLocation}>
              <MapPin size={12} color={theme.colors.textSecondary} />
              <Text style={styles.entityLocationText}>{e.locations.name}</Text>
            </View>
          )}
        </View>
      ))}
      {data.entities.length === 0 && <Text style={styles.emptySectionText}>No suppliers or customers configured</Text>}
      <View style={{ height: 40 }} />
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{businessName}</Text>
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={theme.colors.accent} />
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {/* Custom Tab Selector */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'overview' && styles.tabItemActive]}
              onPress={() => setActiveTab('overview')}
            >
              <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>Overview</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'products' && styles.tabItemActive]}
              onPress={() => setActiveTab('products')}
            >
              <Text style={[styles.tabText, activeTab === 'products' && styles.tabTextActive]}>Products</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'transactions' && styles.tabItemActive]}
              onPress={() => setActiveTab('transactions')}
            >
              <Text style={[styles.tabText, activeTab === 'transactions' && styles.tabTextActive]}>Txns</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'setup' && styles.tabItemActive]}
              onPress={() => setActiveTab('setup')}
            >
              <Text style={[styles.tabText, activeTab === 'setup' && styles.tabTextActive]}>Metadata</Text>
            </TouchableOpacity>
          </View>

          {/* Render Tab Content */}
          <View style={styles.tabContent}>
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'products' && renderProducts()}
            {activeTab === 'transactions' && renderTransactions()}
            {activeTab === 'setup' && renderSetupData()}
          </View>
        </View>
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
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    marginRight: theme.spacing.sm,
    padding: 4,
  },
  title: {
    ...theme.typography.h2,
    fontSize: 20,
    color: theme.colors.primary,
    flex: 1,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Tab Navigation Bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: theme.colors.accent,
  },
  tabText: {
    ...theme.typography.caption,
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  tabTextActive: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  tabContent: {
    flex: 1,
  },
  tabScrollContent: {
    padding: theme.spacing.lg,
  },
  listContainer: {
    padding: theme.spacing.lg,
    paddingBottom: 40,
  },
  contactCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  contactText: {
    ...theme.typography.body,
    fontSize: 14,
    color: theme.colors.text,
  },
  // KPI Cards Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  statCard: {
    width: '48%',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  iconContainer: {
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    marginRight: theme.spacing.sm,
  },
  statTitle: {
    ...theme.typography.caption,
    fontSize: 9,
    textTransform: 'uppercase',
    color: theme.colors.textSecondary,
  },
  statValue: {
    ...theme.typography.h2,
    fontSize: 16,
    marginTop: 2,
    color: theme.colors.text,
  },
  chartSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  chartTitle: {
    ...theme.typography.h3,
    fontSize: 15,
    marginBottom: 16,
    color: theme.colors.text,
  },
  pieContainer: {
    alignItems: 'center',
  },
  customLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginTop: 16,
    width: '100%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    ...theme.typography.caption,
    fontSize: 11,
    color: theme.colors.text,
    fontWeight: '600',
  },
  legendValue: {
    ...theme.typography.caption,
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  emptyText: {
    ...theme.typography.caption,
    textAlign: 'center',
    marginVertical: 20,
  },
  // List elements (Products & Txns)
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  itemInfo: {
    flex: 1,
    gap: 4,
  },
  historyNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  typeIcon: {
    padding: 4,
    borderRadius: theme.borderRadius.sm,
  },
  itemName: {
    ...theme.typography.h3,
    fontSize: 15,
    color: theme.colors.text,
  },
  subBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginTop: 2,
  },
  codeBadge: {
    fontSize: 10,
    backgroundColor: theme.colors.primary,
    color: '#FFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: 'bold',
  },
  metaSubText: {
    ...theme.typography.caption,
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  dateSubText: {
    ...theme.typography.caption,
    fontSize: 10,
    color: '#9E9E9E',
  },
  itemPricing: {
    alignItems: 'flex-end',
    gap: 4,
  },
  itemPrice: {
    ...theme.typography.h3,
    fontSize: 15,
    color: theme.colors.text,
  },
  itemStock: {
    ...theme.typography.body,
    fontSize: 13,
    color: theme.colors.success,
    fontWeight: '600',
  },
  // Metadata Section
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    ...theme.typography.h3,
    fontSize: 16,
    color: theme.colors.text,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  chip: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
  },
  chipText: {
    ...theme.typography.body,
    fontSize: 13,
    color: theme.colors.text,
  },
  emptySectionText: {
    ...theme.typography.caption,
    fontStyle: 'italic',
    paddingVertical: theme.spacing.xs,
  },
  entityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
  },
  entityName: {
    ...theme.typography.h3,
    fontSize: 14,
    color: theme.colors.text,
  },
  entityType: {
    ...theme.typography.caption,
    fontSize: 11,
    textTransform: 'uppercase',
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  entityLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  entityLocationText: {
    ...theme.typography.caption,
    fontSize: 12,
    color: theme.colors.text,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 8,
  },
});

export default AdminCustomerDetailsScreen;
