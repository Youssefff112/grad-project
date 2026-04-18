import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../../tw';
import { useTheme } from '../../context/ThemeContext';
import { CoachBottomNav } from '../../components/coach/CoachBottomNav';

type ClientStatus = 'active' | 'pending' | 'inactive';

interface Client {
  id: string;
  name: string;
  email: string;
  plan: string;
  status: ClientStatus;
  joinedDate: string;
  lastActivity: string;
  progress: number;
  weight: number | null;
}

const MOCK_CLIENTS: Client[] = [
  { id: '1', name: 'Alex Johnson', email: 'alex@email.com', plan: 'Weight Loss', status: 'active', joinedDate: 'Jan 2026', lastActivity: '2h ago', progress: 78, weight: 82 },
  { id: '2', name: 'Maria Garcia', email: 'maria@email.com', plan: 'Strength Training', status: 'active', joinedDate: 'Feb 2026', lastActivity: '5h ago', progress: 92, weight: 65 },
  { id: '3', name: 'James Wilson', email: 'james@email.com', plan: 'Muscle Gain', status: 'active', joinedDate: 'Mar 2026', lastActivity: '1d ago', progress: 65, weight: 75 },
  { id: '4', name: 'Sarah Chen', email: 'sarah@email.com', plan: 'Cardio & Endurance', status: 'pending', joinedDate: 'Apr 2026', lastActivity: '2d ago', progress: 0, weight: null },
  { id: '5', name: 'Mike Thompson', email: 'mike@email.com', plan: 'General Fitness', status: 'inactive', joinedDate: 'Dec 2025', lastActivity: '2w ago', progress: 40, weight: 90 },
];

const STATUS_CONFIG: Record<ClientStatus, { label: string; bg: string; text: string }> = {
  active: { label: 'Active', bg: '#10b98120', text: '#10b981' },
  pending: { label: 'Pending', bg: '#f59e0b20', text: '#f59e0b' },
  inactive: { label: 'Inactive', bg: '#ef444420', text: '#ef4444' },
};

export const CoachClientListScreen = ({ navigation }: any) => {
  const { isDark, accent } = useTheme();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ClientStatus | 'all'>('all');
  const [clients, setClients] = useState(MOCK_CLIENTS);

  const subtextColor = isDark ? '#94a3b8' : '#64748b';
  const cardBg = isDark ? '#111128' : '#ffffff';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const textPrimary = isDark ? '#f1f5f9' : '#1e293b';

  const filtered = clients.filter(c => {
    const matchesSearch = !search.trim() || c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || c.status === filter;
    return matchesSearch && matchesFilter;
  });

  const handleAccept = (id: string) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, status: 'active' } : c));
  };

  const handleRemove = (id: string, name: string) => {
    Alert.alert('Remove Client', `Remove ${name} from your client list?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => setClients(prev => prev.filter(c => c.id !== id)) },
    ]);
  };

  const counts = {
    all: clients.length,
    active: clients.filter(c => c.status === 'active').length,
    pending: clients.filter(c => c.status === 'pending').length,
    inactive: clients.filter(c => c.status === 'inactive').length,
  };

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5' }]}>
      <View style={[tw`px-4 pt-4 pb-3`, { borderBottomWidth: 1, borderColor: borderColor, backgroundColor: isDark ? '#0a0a12' : '#f8f7f5' }]}>
        <View style={tw`flex-row items-center justify-between mb-4`}>
          <Text style={[tw`text-2xl font-bold`, { color: textPrimary }]}>My Clients</Text>
          <View style={[tw`px-3 py-1 rounded-full`, { backgroundColor: accent + '14' }]}>
            <Text style={[tw`text-sm font-bold`, { color: accent }]}>{counts.active} active</Text>
          </View>
        </View>

        <View style={[tw`flex-row items-center px-3 py-2.5 rounded-xl mb-3`, { backgroundColor: cardBg, borderWidth: 1, borderColor: borderColor }]}>
          <MaterialIcons name="search" size={18} color={subtextColor} style={tw`mr-2`} />
          <TextInput
            style={[tw`flex-1 text-sm`, { color: textPrimary }]}
            placeholder="Search clients..."
            placeholderTextColor={subtextColor}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={tw`flex-row gap-2`}>
            {(['all', 'active', 'pending', 'inactive'] as const).map(f => (
              <TouchableOpacity
                key={f}
                onPress={() => setFilter(f)}
                style={[tw`px-4 py-1.5 rounded-full`, {
                  backgroundColor: filter === f ? accent : isDark ? '#1e293b' : '#e2e8f0',
                }]}
              >
                <Text style={[tw`text-xs font-bold capitalize`, { color: filter === f ? '#fff' : subtextColor }]}>
                  {f} ({counts[f]})
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`px-4 pt-4 pb-28`}>
        {filtered.length === 0 && (
          <View style={tw`items-center py-16`}>
            <MaterialIcons name="group-off" size={48} color={isDark ? '#334155' : '#cbd5e1'} />
            <Text style={[tw`mt-3 text-base font-bold`, { color: isDark ? '#475569' : '#94a3b8' }]}>No clients found</Text>
          </View>
        )}

        {filtered.map(client => {
          const statusCfg = STATUS_CONFIG[client.status];
          return (
            <TouchableOpacity
              key={client.id}
              onPress={() => navigation.navigate('CoachClientDetail', { clientId: client.id, clientName: client.name })}
              style={[tw`p-4 rounded-2xl mb-3`, { backgroundColor: cardBg, borderWidth: 1, borderColor: borderColor }]}
            >
              <View style={tw`flex-row items-start gap-3`}>
                <View style={[tw`w-12 h-12 rounded-full items-center justify-center flex-shrink-0`, { backgroundColor: accent + '20' }]}>
                  <MaterialIcons name="person" size={24} color={accent} />
                </View>
                <View style={tw`flex-1`}>
                  <View style={tw`flex-row items-center justify-between mb-0.5`}>
                    <Text style={[tw`text-sm font-bold`, { color: textPrimary }]}>{client.name}</Text>
                    <View style={[tw`px-2 py-0.5 rounded-full`, { backgroundColor: statusCfg.bg }]}>
                      <Text style={[tw`text-xs font-bold`, { color: statusCfg.text }]}>{statusCfg.label}</Text>
                    </View>
                  </View>
                  <Text style={[tw`text-xs`, { color: subtextColor }]}>{client.plan}</Text>
                  <Text style={[tw`text-xs mt-0.5`, { color: subtextColor }]}>Last active {client.lastActivity}</Text>

                  {client.status === 'active' && (
                    <View style={tw`flex-row items-center gap-2 mt-2`}>
                      <View style={[tw`flex-1 h-1.5 rounded-full overflow-hidden`, { backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }]}>
                        <View style={{ width: `${client.progress}%`, height: '100%', borderRadius: 4, backgroundColor: client.progress >= 80 ? '#10b981' : accent }} />
                      </View>
                      <Text style={[tw`text-xs font-bold w-8 text-right`, { color: subtextColor }]}>{client.progress}%</Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={tw`flex-row gap-2 mt-3`}>
                {client.status === 'pending' && (
                  <TouchableOpacity
                    onPress={() => handleAccept(client.id)}
                    style={[tw`flex-1 py-2 rounded-lg items-center`, { backgroundColor: '#10b98120', borderWidth: 1, borderColor: '#10b98140' }]}
                  >
                    <Text style={tw`text-xs font-bold text-green-500`}>Accept</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => navigation.navigate('Chat', { conversationName: client.name })}
                  style={[tw`flex-1 py-2 rounded-lg items-center`, { backgroundColor: accent + '14', borderWidth: 1, borderColor: accent + '28' }]}
                >
                  <Text style={[tw`text-xs font-bold`, { color: accent }]}>Message</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleRemove(client.id, client.name)}
                  style={[tw`px-4 py-2 rounded-lg items-center`, { backgroundColor: '#ef444414', borderWidth: 1, borderColor: '#ef444428' }]}
                >
                  <MaterialIcons name="person-remove" size={16} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <CoachBottomNav activeId="clients" navigation={navigation} />
    </SafeAreaView>
  );
};
