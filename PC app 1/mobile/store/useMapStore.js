import { create } from 'zustand';

export const useMapStore = create((set, get) => ({
  // Map camera state
  region: {
    latitude: 13.7563, // Default to Bangkok
    longitude: 100.5018,
    latitudeDelta: 0.5,
    longitudeDelta: 0.5,
  },
  
  // Current user location
  currentLocation: null,
  
  // Map reference for programmatic control
  mapRef: null,
  
  // Whether map is ready
  isMapReady: false,
  
  // Actions
  setRegion: (region) => set({ region }),
  
  setCurrentLocation: (location) => {
    set({ currentLocation: location });
    
    // Auto-update region when location is first set
    if (!get().region.latitude || get().region.latitude === 13.7563) {
      set({
        region: {
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.5,
          longitudeDelta: 0.5,
        },
      });
    }
  },
  
  setMapRef: (ref) => {
    const currentRef = get().mapRef;
    if (currentRef !== ref) {
      set({ mapRef: ref });
    }
  },
  
  setMapReady: (ready) => {
    const current = get().isMapReady;
    if (current !== ready) {
      set({ isMapReady: ready });
    }
  },
  
  // Center map on current location
  centerOnCurrentLocation: () => {
    const { currentLocation, mapRef } = get();
    if (currentLocation && mapRef) {
      const newRegion = {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.5,
        longitudeDelta: 0.5,
      };
      set({ region: newRegion });
      mapRef.animateToRegion(newRegion, 500);
    }
  },
  
  // Zoom in
  zoomIn: () => {
    const { region, mapRef } = get();
    if (mapRef && region) {
      const newRegion = {
        ...region,
        latitudeDelta: region.latitudeDelta / 2,
        longitudeDelta: region.longitudeDelta / 2,
      };
      set({ region: newRegion });
      mapRef.animateToRegion(newRegion, 300);
    }
  },
  
  // Zoom out
  zoomOut: () => {
    const { region, mapRef } = get();
    if (mapRef && region) {
      const newRegion = {
        ...region,
        latitudeDelta: region.latitudeDelta * 2,
        longitudeDelta: region.longitudeDelta * 2,
      };
      set({ region: newRegion });
      mapRef.animateToRegion(newRegion, 300);
    }
  },
  
  // Fit map to markers
  fitToMarkers: (markers) => {
    const { mapRef } = get();
    if (mapRef && markers && markers.length > 0) {
      mapRef.fitToCoordinates(markers, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  },
  
  // Update region when user pans/zooms
  onRegionChangeComplete: (newRegion) => {
    set({ region: newRegion });
  },
}));
