import React from 'react';
import { BottomNav } from '../BottomNav';

interface AdminBottomNavProps {
  activeId: string;
  navigation: any;
}

export const AdminBottomNav: React.FC<AdminBottomNavProps> = ({ activeId, navigation }) => {
  const handleSelect = (id: string) => {
    if (id === 'dashboard') navigation.navigate('AdminDashboard');
    if (id === 'users') navigation.navigate('AdminUsers');
    if (id === 'coaches') navigation.navigate('AdminCoaches');
    if (id === 'subscriptions') navigation.navigate('AdminSubscriptions');
  };

  return (
    <BottomNav
      activeId={activeId}
      onSelect={handleSelect}
      items={[
        { id: 'dashboard', icon: 'dashboard' as const, label: 'Dashboard' },
        { id: 'users', icon: 'group' as const, label: 'Users' },
        { id: 'coaches', icon: 'verified-user' as const, label: 'Coaches' },
        { id: 'subscriptions', icon: 'card-membership' as const, label: 'Plans' },
      ]}
    />
  );
};
