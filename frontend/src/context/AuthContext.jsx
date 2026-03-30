import React, { createContext, useState, useEffect, useContext } from 'react';
import { account, databases } from '../appwrite';
import { Query } from 'appwrite';

const AuthContext = createContext(null);

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const PROFILES_ID = import.meta.env.VITE_APPWRITE_PROFILES_ID;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [needsUsername, setNeedsUsername] = useState(false);

  useEffect(() => {
    checkUserStatus();
  }, []);

  const checkUserStatus = async () => {
    try {
      const currentAccount = await account.get();
      setUser(currentAccount);
      
      // Phase 2: Check if this user has a created profile yet
      if (DATABASE_ID && PROFILES_ID && DATABASE_ID !== 'your_database_id') {
        try {
          const userProfile = await databases.getDocument(DATABASE_ID, PROFILES_ID, currentAccount.$id);
          setProfile(userProfile);
          setNeedsUsername(false);
        } catch (err) {
          // If 404, we need to prompt for username
          if (err.code === 404) {
            setNeedsUsername(true);
          }
        }
      }
    } catch (error) {
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    account.createOAuth2Session(
        'google',
        window.location.origin,
        window.location.origin + '/failed'
    );
  };

  const createProfile = async (username) => {
    if (!user) return;
    
    try {
      const newProfile = await databases.createDocument(
        DATABASE_ID,
        PROFILES_ID,
        user.$id, // Use Account ID as Document ID for easy lookup
        {
          username: username,
          email: user.email,
          points: 0
        }
      );
      setProfile(newProfile);
      setNeedsUsername(false);
      return newProfile;
    } catch (err) {
      console.error("Profile creation failed", err);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await account.deleteSession('current');
      setUser(null);
      setProfile(null);
      setNeedsUsername(false);
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, needsUsername, loginWithGoogle, logout, createProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
