import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';

/**
 * Add watermark to photo with timestamp and GPS coordinates
 * @param {string} imageUri - URI of the image to watermark
 * @param {object} location - GPS location {latitude, longitude}
 * @param {string} storeName - Name of the store
 * @returns {Promise<string>} - URI of watermarked image
 */
export async function addWatermarkToPhoto(imageUri, location = null, storeName = '') {
  try {
    // Get image info
    const imageInfo = await FileSystem.getInfoAsync(imageUri);
    if (!imageInfo.exists) {
      throw new Error('Image file not found');
    }

    // Get current timestamp
    const now = new Date();
    const timestamp = now.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    // Create watermark text
    let watermarkText = `📅 ${timestamp}`;
    
    if (location && location.latitude && location.longitude) {
      const lat = location.latitude.toFixed(6);
      const lon = location.longitude.toFixed(6);
      watermarkText += `\n📍 ${lat}, ${lon}`;
    }
    
    if (storeName) {
      watermarkText += `\n🏪 ${storeName}`;
    }

    // Note: expo-image-manipulator doesn't support text overlay directly
    // We'll need to use a different approach or library for actual text watermark
    // For now, we'll compress and prepare the image, and store metadata separately
    
    // Compress image for better performance
    const manipulatedImage = await ImageManipulator.manipulateAsync(
      imageUri,
      [
        { resize: { width: 1920 } }, // Resize to max 1920px width
      ],
      {
        compress: 0.8,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );

    // Return the manipulated image URI and metadata
    return {
      uri: manipulatedImage.uri,
      metadata: {
        timestamp: now.toISOString(),
        timestampFormatted: timestamp,
        location: location ? {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
        } : null,
        storeName: storeName || null,
        watermarkText,
      },
    };
  } catch (error) {
    console.error('Error adding watermark:', error);
    throw error;
  }
}

/**
 * Create a simple text overlay image (fallback method)
 * This creates metadata that can be displayed separately
 */
export function createPhotoMetadata(location, storeName) {
  const now = new Date();
  const timestamp = now.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  return {
    timestamp: now.toISOString(),
    timestampFormatted: timestamp,
    location: location ? {
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy,
    } : null,
    storeName: storeName || null,
    displayText: [
      `📅 ${timestamp}`,
      location ? `📍 ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}` : null,
      storeName ? `🏪 ${storeName}` : null,
    ].filter(Boolean).join('\n'),
  };
}

/**
 * Compress image for upload
 */
export async function compressImage(imageUri, quality = 0.8) {
  try {
    const manipulatedImage = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ resize: { width: 1920 } }],
      {
        compress: quality,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );

    return manipulatedImage.uri;
  } catch (error) {
    console.error('Error compressing image:', error);
    throw error;
  }
}

/**
 * Get image file size
 */
export async function getImageSize(imageUri) {
  try {
    const info = await FileSystem.getInfoAsync(imageUri);
    return info.size;
  } catch (error) {
    console.error('Error getting image size:', error);
    return 0;
  }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
