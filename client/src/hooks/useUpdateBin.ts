import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

interface UpdateBinData {
  binName: string;
  binType: string;
  mainLocation: string;
}

interface UpdateBinResponse {
  message: string;
  binId: string;
  updatedData: UpdateBinData & {
    updatedAt: Date;
    updatedBy: string;
  };
}

const updateBinDetails = async (binId: string, data: UpdateBinData): Promise<UpdateBinResponse> => {
  const response = await api.put(`/api/bins/${binId}`, data);
  return response.data;
};

export const useUpdateBin = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ binId, data }: { binId: string; data: UpdateBinData }) =>
      updateBinDetails(binId, data),
    onMutate: () => {
      setIsLoading(true);
      setError(null);
    },
    onSuccess: (data) => {
      setIsLoading(false);
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: ['bins'] });
      queryClient.invalidateQueries({ queryKey: ['binLocations'] });
      queryClient.invalidateQueries({ queryKey: ['realTimeData'] });
      
      console.log('Bin updated successfully:', data);
    },
    onError: (error: Error) => {
      setIsLoading(false);
      setError(error.message);
      console.error('Error updating bin:', error);
    },
  });

  const updateBin = async (binId: string, data: UpdateBinData) => {
    try {
      await mutation.mutateAsync({ binId, data });
      return true;
    } catch (error) {
      return false;
    }
  };

  return {
    updateBin,
    isLoading: isLoading || mutation.isPending,
    error: error || mutation.error?.message,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
  };
};
