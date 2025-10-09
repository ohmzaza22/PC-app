// Web version - no maps, just placeholder
import React from 'react';
import { View, Text } from 'react-native';

export const MapView = React.forwardRef((props, ref) => {
  return (
    <View style={[props.style, { backgroundColor: '#e5e7eb', justifyContent: 'center', alignItems: 'center', borderRadius: 12 }]}>
      <Text style={{ color: '#6b7280', fontSize: 14 }}>🗺️ Map view available on mobile app</Text>
    </View>
  );
});

export const Marker = () => null;
export const Circle = () => null;

export default MapView;
