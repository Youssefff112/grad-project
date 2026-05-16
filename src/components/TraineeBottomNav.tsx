import React from 'react';
import { useUser } from '../context/UserContext';
import { BottomNav } from './BottomNav';
import { canClientSelectPersonalCoach } from '../utils/planUtils';

interface TraineeBottomNavProps {
  activeId: string;
  navigation: any;
  totalUnread?: number;
}

export const TraineeBottomNav: React.FC<TraineeBottomNavProps> = ({ activeId, navigation, totalUnread = 0 }) => {
  const { subscriptionPlan } = useUser();

  const tabIdToRoute: Record<string, string> = {
    home: 'TraineeCommandCenter',
    workouts: 'VisionAnalysisLab',
    meals: 'Meals',
    messages: 'Messages',
    profile: 'Profile',
    coaches: 'CoachBrowsingScreen',
  };

  const handleSelect = (id: string) => {
    if (id === activeId) return;
    const route = tabIdToRoute[id];
    if (!route) return;
    navigation.navigate(route);
  };

  return (
    <BottomNav
      activeId={activeId}
      onSelect={handleSelect}
      items={[
        { id: 'home', icon: 'home' as const, label: 'Home' },
        { id: 'workouts', icon: 'fitness-center' as const, label: 'Workouts' },
        { id: 'meals', icon: 'restaurant' as const, label: 'Meals' },
        { id: 'messages', icon: 'chat-bubble' as const, label: 'Messages', badge: totalUnread },
        ...(canClientSelectPersonalCoach(subscriptionPlan) ? [{ id: 'coaches', icon: 'person-add' as const, label: 'Coaches' }] : []),
        { id: 'profile', icon: 'person' as const, label: 'Profile' },
      ]}
    />
  );
};
