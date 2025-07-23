import { useState } from 'react';

interface LoadingState {
  isLoading: boolean;
  error: string;
  setLoading: (loading: boolean) => void;
  setError: (error: string) => void;
  resetState: () => void;
  handleAsyncOperation: <T>(
    operation: () => Promise<T>,
    errorMessage?: string
  ) => Promise<T>;
}

export const useLoadingState = (): LoadingState => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const resetState = () => {
    setIsLoading(false);
    setError("");
  };

  const handleAsyncOperation = async <T>(
    operation: () => Promise<T>,
    errorMessage: string = "Ein Fehler ist aufgetreten"
  ): Promise<T> => {
    try {
      setIsLoading(true);
      setError("");
      const result = await operation();
      return result;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : errorMessage;
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    setLoading: setIsLoading,
    setError,
    resetState,
    handleAsyncOperation
  };
}; 