import { useEffect } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';

// This file redirects to edit-store for consistency
export default function AddStoreScreen() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to edit-store page (unified add/edit page)
    router.replace('/edit-store');
  }, []);
  
  return <View />;
}
