import React, {
  createContext,
  useCallback,
  useContext,
  useState,
  useEffect,
} from 'react';
import AsyncStorage from '@react-native-community/async-storage';
import api from '../service/api';

interface AuthState {
  token: string;
  user: object;
}

interface SingInCredentials {
  email: string;
  password: string;
}

interface AuthContexData {
  user: object;
  signIn(credentials: SingInCredentials): Promise<void>;
  singOut(): void;
}

const AuthContext = createContext<AuthContexData>({} as AuthContexData);

const AuthProvider: React.FC = ({ children }) => {
  // preenche os valores de data de acordo com o que esta no localstorage
  // pois se ja tiver os dados podemos já preencher os dados Data

  const [data, setData] = useState<AuthState>({} as AuthState);

  useEffect(() => {
    async function loadStorageData(): Promise<void> {
      const [token, user] = await AsyncStorage.multiGet([
        '@GoBaber:token',
        '@Gobaber:user',
      ]);

      if (token[1] && user[1]) {
        setData({ token: token[1], user: JSON.parse(user[1]) });
      }
    }
  }, []);

  const signIn = useCallback(async ({ email, password }) => {
    const response = await api.post('sessions', {
      email,
      password,
    });

    const { token, user } = response.data;

    await AsyncStorage.multiSet([
      ['@GoBaber:token', token],
      ['@Gobaber:user', JSON.stringify(user)],
    ]);

    setData({ token, user });
  }, []);

  const singOut = useCallback(async () => {
    await AsyncStorage.multiRemove(['@GoBaber:token', '@GoBaber:user']);

    setData({} as AuthState);
  }, []);
  return (
    <AuthContext.Provider value={{ user: data.user, signIn, singOut }}>
      {children}
    </AuthContext.Provider>
  );
};

function useAuth(): AuthContexData {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export { AuthProvider, useAuth };
