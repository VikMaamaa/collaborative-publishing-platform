'use client';

import React from 'react';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => children;

export const useAuth = () => {
  throw new Error('useAuth from AuthContext is deprecated. Use Zustand useAuth instead.');
}; 