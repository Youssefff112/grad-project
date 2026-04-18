import React from 'react';
import { BottomNav } from '../BottomNav';

interface CoachBottomNavProps {
  activeId: string;
  navigation: any;
  totalUnread?: number;
}

export const CoachBottomNav: React.FC<CoachBottomNavProps> = ({
  activeId,
  navigation,
  totalUnread = 0,
}) => {
  const handleSelect = (id: string) => {
    if (id === 'dashboard') navigation.navigate('CoachCommandCenter');
    if (id === 'clients') navigation.navigate('CoachClientList');
    if (id === 'messages') navigation.navigate('Messages');
    if (id === 'schedule') navigation.navigate('CoachSchedule');
    if (id === 'profile') navigation.navigate('CoachProfileEdit');
  };

  return (
    <BottomNav
      activeId={activeId}
      onSelect={handleSelect}
      items={[
        { id: 'dashboard', icon: 'dashboard' as const, label: 'Dashboard' },
        { id: 'clients', icon: 'group' as const, label: 'Clients' },
        { id: 'messages', icon: 'chat-bubble' as const, label: 'Messages', badge: totalUnread },
        { id: 'schedule', icon: 'calendar-today' as const, label: 'Schedule' },
        { id: 'profile', icon: 'person' as const, label: 'Profile' },
      ]}
    />
  );
};
