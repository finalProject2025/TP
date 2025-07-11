import { createContext } from 'react';
import type { ToastContextType } from './useToast.types';

export const ToastContext = createContext<ToastContextType | undefined>(undefined); 