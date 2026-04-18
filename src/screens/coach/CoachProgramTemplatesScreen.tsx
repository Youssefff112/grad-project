import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../../tw';
import { useTheme } from '../../context/ThemeContext';

type TemplateType = 'workout' | 'meal';

interface Template {
  id: string;
  type: TemplateType;
  name: string;
  description: string;
  duration: string;
  goal: string;
  timesUsed: number;
  createdAt: string;
}

const MOCK_TEMPLATES: Template[] = [
  { id: '1', type: 'workout', name: 'Hypertrophy Phase 1', description: '4-day upper/lower split focused on muscle growth', duration: '8 weeks', goal: 'Muscle Gain', timesUsed: 7, createdAt: 'Mar 2026' },
  { id: '2', type: 'workout', name: 'Foundation Strength', description: 'Full-body compound movements for beginners', duration: '6 weeks', goal: 'Strength', timesUsed: 12, createdAt: 'Jan 2026' },
  { id: '3', type: 'workout', name: 'Cardio Fat Burn', description: 'HIIT and steady-state cardio combination', duration: '4 weeks', goal: 'Weight Loss', timesUsed: 5, createdAt: 'Feb 2026' },
  { id: '4', type: 'meal', name: 'High Protein Cut', description: 'High-protein, caloric deficit plan for fat loss', duration: '8 weeks', goal: 'Weight Loss', timesUsed: 9, createdAt: 'Feb 2026' },
  { id: '5', type: 'meal', name: 'Clean Bulk Nutrition', description: 'Caloric surplus with clean whole foods', duration: '12 weeks', goal: 'Muscle Gain', timesUsed: 4, createdAt: 'Mar 2026' },
  { id: '6', type: 'meal', name: 'Balanced Maintenance', description: 'Balanced macros for weight maintenance and health', duration: 'Ongoing', goal: 'General Health', timesUsed: 6, createdAt: 'Jan 2026' },
];

export const CoachProgramTemplatesScreen = ({ navigation }: any) => {
  const { isDark, accent } = useTheme();
  const [activeTab, setActiveTab] = useState<TemplateType>('workout');
  const [templates, setTemplates] = useState(MOCK_TEMPLATES);

  const subtextColor = isDark ? '#94a3b8' : '#64748b';
  const cardBg = isDark ? '#111128' : '#ffffff';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const textPrimary = isDark ? '#f1f5f9' : '#1e293b';

  const filtered = templates.filter(t => t.type === activeTab);

  const handleAssign = (template: Template) => {
    Alert.alert('Assign Template', `Assign "${template.name}" to a client?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Go to Client List', onPress: () => navigation.navigate('CoachClientList') },
    ]);
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Delete Template', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => setTemplates(prev => prev.filter(t => t.id !== id)) },
    ]);
  };

  const handleCreate = () => {
    if (activeTab === 'workout') {
      navigation.navigate('CoachWorkoutPlan');
    } else {
      navigation.navigate('CoachMealPlan');
    }
  };

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5' }]}>
      <View style={[tw`flex-row items-center justify-between px-4 py-3`, { borderBottomWidth: 1, borderColor: borderColor, backgroundColor: isDark ? '#0a0a12' : '#f8f7f5' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={tw`p-1`}>
          <MaterialIcons name="arrow-back" size={24} color={isDark ? '#e2e8f0' : '#1e293b'} />
        </TouchableOpacity>
        <Text style={[tw`text-lg font-bold`, { color: textPrimary }]}>Program Templates</Text>
        <TouchableOpacity onPress={handleCreate} style={[tw`flex-row items-center gap-1 px-3 py-1.5 rounded-xl`, { backgroundColor: accent }]}>
          <MaterialIcons name="add" size={16} color="white" />
          <Text style={tw`text-xs text-white font-bold`}>New</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={[tw`flex-row px-4 pt-3 gap-2`, { borderBottomWidth: 1, borderColor: borderColor }]}>
        {(['workout', 'meal'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[tw`flex-1 items-center py-2.5 rounded-t-lg`, {
              borderBottomWidth: 2,
              borderColor: activeTab === tab ? accent : 'transparent',
            }]}
          >
            <View style={tw`flex-row items-center gap-1.5`}>
              <MaterialIcons
                name={tab === 'workout' ? 'fitness-center' : 'restaurant-menu'}
                size={16}
                color={activeTab === tab ? accent : subtextColor}
              />
              <Text style={[tw`text-sm font-bold capitalize`, { color: activeTab === tab ? accent : subtextColor }]}>
                {tab === 'workout' ? 'Workout Plans' : 'Meal Plans'}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`px-4 py-4 pb-8`}>
        <Text style={[tw`text-xs font-semibold uppercase tracking-wider mb-3`, { color: subtextColor }]}>
          {filtered.length} template{filtered.length !== 1 ? 's' : ''}
        </Text>

        {filtered.map(template => (
          <View key={template.id} style={[tw`p-4 rounded-2xl mb-4`, { backgroundColor: cardBg, borderWidth: 1, borderColor: borderColor }]}>
            <View style={tw`flex-row items-start gap-3 mb-3`}>
              <View style={[tw`w-10 h-10 rounded-xl items-center justify-center flex-shrink-0`, { backgroundColor: accent + '14' }]}>
                <MaterialIcons name={template.type === 'workout' ? 'fitness-center' : 'restaurant-menu'} size={20} color={accent} />
              </View>
              <View style={tw`flex-1`}>
                <Text style={[tw`text-base font-bold`, { color: textPrimary }]}>{template.name}</Text>
                <Text style={[tw`text-xs mt-0.5 leading-relaxed`, { color: subtextColor }]}>{template.description}</Text>
              </View>
            </View>

            <View style={tw`flex-row flex-wrap gap-2 mb-3`}>
              {[
                { icon: 'flag' as const, label: template.goal },
                { icon: 'schedule' as const, label: template.duration },
                { icon: 'group' as const, label: `Used ${template.timesUsed}x` },
                { icon: 'calendar-today' as const, label: template.createdAt },
              ].map(tag => (
                <View key={tag.label} style={[tw`flex-row items-center gap-1 px-2 py-1 rounded-full`, { backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }]}>
                  <MaterialIcons name={tag.icon} size={11} color={subtextColor} />
                  <Text style={[tw`text-xs`, { color: subtextColor }]}>{tag.label}</Text>
                </View>
              ))}
            </View>

            <View style={tw`flex-row gap-2`}>
              <TouchableOpacity
                onPress={() => handleAssign(template)}
                style={[tw`flex-1 py-2.5 rounded-xl items-center`, { backgroundColor: accent }]}
              >
                <Text style={tw`text-xs font-bold text-white`}>Assign to Client</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDelete(template.id, template.name)}
                style={[tw`px-4 py-2.5 rounded-xl items-center`, { backgroundColor: '#ef444414', borderWidth: 1, borderColor: '#ef444428' }]}
              >
                <MaterialIcons name="delete-outline" size={18} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {filtered.length === 0 && (
          <View style={tw`items-center py-16`}>
            <MaterialIcons name="inventory" size={48} color={isDark ? '#334155' : '#cbd5e1'} />
            <Text style={[tw`mt-3 text-base font-bold`, { color: isDark ? '#475569' : '#94a3b8' }]}>No templates yet</Text>
            <TouchableOpacity onPress={handleCreate} style={[tw`mt-4 px-6 py-3 rounded-xl`, { backgroundColor: accent }]}>
              <Text style={tw`text-white font-bold`}>Create Your First Template</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};
