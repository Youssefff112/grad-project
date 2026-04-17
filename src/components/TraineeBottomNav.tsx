import React from 'react';
import { useUser } from '../context/UserContext';
import { BottomNav } from './BottomNav';

interface TraineeBottomNavProps {
  activeId: string;
  navigation: any;
  totalUnread?: number;
}

export const TraineeBottomNav: React.FC<TraineeBottomNavProps> = ({ activeId, navigation, totalUnread = 0 }) => {
  const { subscriptionPlan } = useUser();

  const handleSelect = (id: string) => {
    if (id === 'home') navigation.navigate('TraineeCommandCenter');
    if (id === 'workouts') navigation.navigate('VisionAnalysisLab');
    if (id === 'track') navigation.navigate('DailyTracker');
    if (id === 'meals') navigation.navigate('Meals');
    if (id === 'messages') navigation.navigate('Messages');
    if (id === 'profile') navigation.navigate('Profile');
    if (id === 'coaches') navigation.navigate('CoachBrowsingScreen');
  };

  return (
    <BottomNav
      activeId={activeId}
      onSelect={handleSelect}
      items={[
        { id: 'home', icon: 'home' as const, label: 'Home' },
        { id: 'workouts', icon: 'fitness-center' as const, label: 'Workouts' },
        { id: 'track', icon: 'trending-up' as const, label: 'Track' },
        { id: 'meals', icon: 'restaurant' as const, label: 'Meals' },
        { id: 'messages', icon: 'chat-bubble' as const, label: 'Messages', badge: totalUnread },
        ...((subscriptionPlan === 'Premium' || subscriptionPlan === 'Elite') ? [{ id: 'coaches', icon: 'person-add' as const, label: 'Coaches' }] : []),
        { id: 'profile', icon: 'person' as const, label: 'Profile' },
      ]}
    />
  );
};
