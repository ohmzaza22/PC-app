// Native version (iOS/Android) - use real react-native-maps
import React from 'react';
import MapViewNative, { Marker as MarkerNative, Circle as CircleNative } from 'react-native-maps';

export const MapView = React.forwardRef((props, ref) => {
  return <MapViewNative ref={ref} {...props} />;
});

export const Marker = (props) => {
  return <MarkerNative {...props} />;
};

export const Circle = (props) => {
  return <CircleNative {...props} />;
};

export default MapView;
