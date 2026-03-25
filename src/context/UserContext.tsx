import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserContextType {
  fullName: string;
  email: string;
  setFullName: (name: string) => void;
  setEmail: (email: string) => void;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType>({
  fullName: '',
  email: '',
  setFullName: () => {},
  setEmail: () => {},
  isLoading: true,
});

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [fullName, setFullNameState] = useState('');
  const [email, setEmailState] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Load saved user data on mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const savedName = await AsyncStorage.getItem('user_fullname');
        const savedEmail = await AsyncStorage.getItem('user_email');
        
        if (savedName) setFullNameState(savedName);
        if (savedEmail) setEmailState(savedEmail);
      } catch (error) {
        console.log('Failed to load user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

  const setFullName = useCallback((name: string) => {
    setFullNameState(name);
    AsyncStorage.setItem('user_fullname', name).catch((error) =>
      console.log('Failed to save fullname:', error)
    );
  }, []);

  const setEmail = useCallback((email: string) => {
    setEmailState(email);
    AsyncStorage.setItem('user_email', email).catch((error) =>
      console.log('Failed to save email:', error)
    );
  }, []);

  return (
    <UserContext.Provider value={{ fullName, email, setFullName, setEmail, isLoading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
