import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../../tw';
import { useTheme } from '../../context/ThemeContext';

const MONTHLY_DATA = [
  { month: 'Nov 2025', revenue: 820, sessions: 18, clients: 8 },
  { month: 'Dec 2025', revenue: 980, sessions: 22, clients: 9 },
  { month: 'Jan 2026', revenue: 1100, sessions: 24, clients: 10 },
  { month: 'Feb 2026', revenue: 1240, sessions: 28, clients: 11 },
  { month: 'Mar 2026', revenue: 1380, sessions: 31, clients: 12 },
  { month: 'Apr 2026', revenue: 1240, sessions: 26, clients: 12 },
];

const PER_CLIENT = [
  { name: 'Alex Johnson', plan: 'Weight Loss', earned: 149.99, sessions: 4, since: 'Jan 2026' },
  { name: 'Maria Garcia', plan: 'Strength Training', earned: 199.99, sessions: 6, since: 'Feb 2026' },
  { name: 'James Wilson', plan: 'Muscle Gain', earned: 149.99, sessions: 4, since: 'Mar 2026' },
  { name: 'Sarah Chen', plan: 'Cardio & Endurance', earned: 99.99, sessions: 2, since: 'Apr 2026' },
  { name: 'Mike Thompson', plan: 'General Fitness', earned: 249.99, sessions: 8, since: 'Dec 2025' },
];

export const CoachEarningsScreen = ({ navigation }: any) => {
  const { isDark, accent } = useTheme();
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('month');

  const subtextColor = isDark ? '#94a3b8' : '#64748b';
  const cardBg = isDark ? '#111128' : '#ffffff';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const textPrimary = isDark ? '#f1f5f9' : '#1e293b';

  const current = MONTHLY_DATA[MONTHLY_DATA.length - 1];
  const previous = MONTHLY_DATA[MONTHLY_DATA.length - 2];
  const revChange = ((current.revenue - previous.revenue) / previous.revenue * 100).toFixed(1);
  const isPositive = current.revenue >= previous.revenue;

  const maxRevenue = Math.max(...MONTHLY_DATA.map(m => m.revenue));

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5' }]}>
      <View style={[tw`flex-row items-center px-4 py-3`, { borderBottomWidth: 1, borderColor: borderColor, backgroundColor: isDark ? '#0a0a12' : '#f8f7f5' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={tw`p-1 mr-3`}>
          <MaterialIcons name="arrow-back" size={24} color={isDark ? '#e2e8f0' : '#1e293b'} />
        </TouchableOpacity>
        <Text style={[tw`text-lg font-bold`, { color: textPrimary }]}>Earnings</Text>
      </View>

      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`px-4 py-4 pb-8`}>
        {/* Main stat */}
        <View style={[tw`p-6 rounded-2xl mb-4`, { backgroundColor: accent + '14', borderWidth: 1, borderColor: accent + '28' }]}>
          <Text style={[tw`text-xs font-bold uppercase tracking-wider mb-1`, { color: subtextColor }]}>This Month</Text>
          <Text style={[tw`text-5xl font-black`, { color: accent }]}>${current.revenue.toLocaleString()}</Text>
          <View style={tw`flex-row items-center gap-1 mt-2`}>
            <MaterialIcons
              name={isPositive ? 'trending-up' : 'trending-down'}
              size={18}
              color={isPositive ? '#10b981' : '#ef4444'}
            />
            <Text style={[tw`text-sm font-bold`, { color: isPositive ? '#10b981' : '#ef4444' }]}>
              {isPositive ? '+' : ''}{revChange}% vs last month
            </Text>
          </View>
        </View>

        {/* Summary stats */}
        <View style={tw`flex-row gap-3 mb-6`}>
          {[
            { label: 'Sessions', value: String(current.sessions), icon: 'event' as const },
            { label: 'Active Clients', value: String(current.clients), icon: 'group' as const },
            { label: 'Avg/Session', value: `$${(current.revenue / current.sessions).toFixed(0)}`, icon: 'payments' as const },
          ].map(s => (
            <View key={s.label} style={[tw`flex-1 p-3 rounded-xl items-center`, { backgroundColor: cardBg, borderWidth: 1, borderColor: borderColor }]}>
              <MaterialIcons name={s.icon} size={18} color={accent} style={tw`mb-1`} />
              <Text style={[tw`text-lg font-black`, { color: textPrimary }]}>{s.value}</Text>
              <Text style={[tw`text-xs text-center`, { color: subtextColor }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Revenue chart */}
        <View style={[tw`p-4 rounded-2xl mb-6`, { backgroundColor: cardBg, borderWidth: 1, borderColor: borderColor }]}>
          <Text style={[tw`text-sm font-bold mb-4`, { color: textPrimary }]}>Revenue Trend</Text>
          <View style={tw`flex-row items-end justify-between h-32 gap-1`}>
            {MONTHLY_DATA.map((m, i) => {
              const pct = m.revenue / maxRevenue;
              const isLast = i === MONTHLY_DATA.length - 1;
              return (
                <View key={m.month} style={tw`flex-1 items-center`}>
                  <View style={[tw`w-full rounded-t-lg`, {
                    height: `${pct * 100}%`,
                    backgroundColor: isLast ? accent : accent + '40',
                    minHeight: 8,
                  }]} />
                  <Text style={[tw`text-xs mt-1`, { color: subtextColor }]}>
                    {m.month.split(' ')[0].slice(0, 3)}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Per client breakdown */}
        <Text style={[tw`text-sm font-bold mb-3`, { color: textPrimary }]}>Per Client Breakdown</Text>
        {PER_CLIENT.map((client, i) => (
          <View
            key={client.name}
            style={[tw`flex-row items-center gap-3 p-4 rounded-xl mb-3`, { backgroundColor: cardBg, borderWidth: 1, borderColor: borderColor }]}
          >
            <View style={[tw`w-10 h-10 rounded-full items-center justify-center flex-shrink-0`, { backgroundColor: accent + '20' }]}>
              <MaterialIcons name="person" size={20} color={accent} />
            </View>
            <View style={tw`flex-1`}>
              <Text style={[tw`text-sm font-bold`, { color: textPrimary }]}>{client.name}</Text>
              <Text style={[tw`text-xs mt-0.5`, { color: subtextColor }]}>{client.plan} · {client.sessions} sessions</Text>
            </View>
            <Text style={[tw`text-base font-black`, { color: accent }]}>${client.earned}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};
