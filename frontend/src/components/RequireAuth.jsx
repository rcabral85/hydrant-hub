import React from 'react';
import { loadToken } from '../services/auth';

export default function RequireAuth({ children }){
  const token = loadToken();
  if (!token) {
    window.location.href = '/login';
    return null;
  }
  return children;
}
