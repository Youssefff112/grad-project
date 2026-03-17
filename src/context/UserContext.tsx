import React, { createContext, useContext, useState, useCallback } from 'react';

interface UserContextType {
  fullName: string;
  email: string;
  setFullName: (name: string) => void;
  setEmail: (email: string) => void;
}

const UserContext = createContext<UserContextType>({
  fullName: '',
  email: '',
  setFullName: () => {},
  setEmail: () => {},
});

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');

  return (
    <UserContext.Provider value={{ fullName, email, setFullName, setEmail }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
