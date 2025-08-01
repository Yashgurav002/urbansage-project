import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import * as NetInfo from '@react-native-community/netinfo';
import { useNavigation } from '@react-navigation/native';
import apiService from '../services/api';
import databaseService from '../services/database';
import notificationService from '../services/notifications';

interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
}

export default function CameraScreen() {
  const navigation = useNavigation();
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [locationPermission, setLocationPermission] = useState<boolean>(false);
  const [photo, setPhoto] = useState<string | undefined>(undefined); // ✅ Fixed: Changed from null to undefined
  const [location, setLocation] = useState<LocationData | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  
  // Form data
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    requestLocationPermission();
    checkNetworkStatus();
  }, []);

  const checkNetworkStatus = async () => {
    const netInfo = await NetInfo.fetch();
    setIsOnline(netInfo.isConnected || false);
  };

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
      
      if (status === 'granted') {
        getCurrentLocation();
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
    }
  };

  const getCurrentLocation = async () => {
    setLocationLoading(true);
    try {
      const locationResult = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = locationResult.coords;

      // Reverse geocoding to get address
      const addressResult = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      let address = 'Unknown location';
      if (addressResult.length > 0) {
        const addr = addressResult[0];
        address = `${addr.street || ''} ${addr.city || ''} ${addr.region || ''}`.trim();
      }

      setLocation({
        latitude,
        longitude,
        address,
      });
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Location Error', 'Could not get your current location');
    } finally {
      setLocationLoading(false);
    }
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Camera Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
        });
        
        if (photo) {
          setPhoto(photo.uri);
          setShowForm(true);
        }
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Failed to take picture');
      }
    }
  };

  const retakePicture = () => {
    setPhoto(undefined); // ✅ Fixed: Changed from null to undefined
    setShowForm(false);
    setTitle('');
    setDescription('');
  };

  const submitIssue = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Error', 'Please fill in both title and description');
      return;
    }

    setLoading(true);
    
    try {
      await checkNetworkStatus();
      
      const issueData = {
        title: title.trim(),
        description: description.trim(),
        location: location?.address || 'Unknown location',
        photo_url: undefined as string | undefined,
      };

      // Upload photo if available and online
      if (photo && isOnline) {
        console.log('📸 Uploading photo...');
        const photoUrl = await apiService.uploadPhoto(photo);
        if (photoUrl) {
          issueData.photo_url = photoUrl;
          console.log('✅ Photo uploaded:', photoUrl);
        }
      }

      if (isOnline) {
        // Online: Submit to API and save locally
        console.log('🌐 Submitting online...');
        await apiService.createIssue(issueData);
        
        // Save locally as synced
        await databaseService.saveIssueLocally({
          ...issueData,
          created_at: new Date().toISOString(),
          synced: true,
        });

        // Send success notification
        const pushToken = notificationService.getPushToken();
        if (pushToken) {
          await notificationService.sendPushNotification(
            pushToken,
            '✅ Issue Reported',
            `Your report "${title}" has been submitted successfully!`
          );
        }

        Alert.alert(
          'Success!',
          'Your issue has been reported with AI analysis and photo upload!',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        // Offline: Save locally for later sync
        console.log('📱 Saving offline...');
        await databaseService.saveIssueLocally({
          ...issueData,
          photo_url: photo, // ✅ Now this works - both are string | undefined
          created_at: new Date().toISOString(),
          synced: false,
        });

        Alert.alert(
          'Saved Offline!',
          'No internet connection. Your issue has been saved and will be uploaded when you\'re back online.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (error) {
      console.error('Error submitting issue:', error);
      
      // If online submission fails, save offline
      if (isOnline) {
        console.log('❌ Online submission failed, saving offline...');
        await databaseService.saveIssueLocally({
          title: title.trim(),
          description: description.trim(),
          location: location?.address || 'Unknown location',
          photo_url: photo, // ✅ Fixed: Now type-safe
          created_at: new Date().toISOString(),
          synced: false,
        });

        Alert.alert(
          'Saved for Later',
          'Could not submit now, but your report is saved and will be uploaded when possible.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Error', 'Failed to save issue. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.flipButton} onPress={toggleCameraFacing}>
            <Text style={styles.text}>🔄</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.locationButton} 
            onPress={getCurrentLocation}
            disabled={locationLoading}
          >
            <Text style={styles.text}>
              {locationLoading ? '⏳' : '📍'}
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Network status */}
        <View style={styles.networkStatus}>
          <Text style={[styles.networkText, { color: isOnline ? '#10B981' : '#EF4444' }]}>
            {isOnline ? '🌐 Online' : '📱 Offline'}
          </Text>
        </View>
        
        {/* Location info */}
        <View style={styles.locationInfo}>
          {location ? (
            <Text style={styles.locationText}>📍 {location.address}</Text>
          ) : (
            <Text style={styles.locationText}>📍 Getting location...</Text>
          )}
        </View>
      </CameraView>

      {/* Form Modal */}
      <Modal visible={showForm} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>
                {isOnline ? '🤖 AI Analysis + Photo Upload' : '📱 Offline Report'}
              </Text>
              
              {/* Photo Preview */}
              {photo && (
                <View style={styles.photoPreview}>
                  <Image source={{ uri: photo }} style={styles.previewImage} />
                  <Text style={styles.photoLabel}>📸 Photo attached</Text>
                </View>
              )}
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Issue Title</Text>
                <TextInput
                  style={styles.input}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="e.g., Pothole on Main Street"
                  maxLength={100}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Describe the issue in detail for AI analysis"
                  multiline
                  numberOfLines={4}
                  maxLength={500}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Location</Text>
                <Text style={styles.locationDisplay}>
                  {location?.address || 'Unknown location'}
                </Text>
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity 
                  style={styles.cancelButton} 
                  onPress={retakePicture}
                  disabled={loading}
                >
                  <Text style={styles.cancelButtonText}>📸 Retake</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.submitButton, loading && styles.disabledButton]} 
                  onPress={submitIssue}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text style={styles.submitButtonText}>
                      {isOnline ? '🚀 Submit' : '💾 Save'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
    fontSize: 16,
    color: '#4B5563',
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'transparent',
    margin: 20,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  button: {
    backgroundColor: '#3B82F6',
    padding: 15,
    borderRadius: 10,
    margin: 20,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  flipButton: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    backgroundColor: 'white',
    borderRadius: 35,
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    backgroundColor: '#3B82F6',
    borderRadius: 30,
    width: 60,
    height: 60,
  },
  locationButton: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  networkStatus: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 8,
    borderRadius: 8,
  },
  networkText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  locationInfo: {
    position: 'absolute',
    top: 80,
    left: 20,
    right: 80,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 10,
    borderRadius: 10,
  },
  locationText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    margin: 20,
    maxHeight: '80%',
    width: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#1F2937',
  },
  photoPreview: {
    alignItems: 'center',
    marginBottom: 15,
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
    marginBottom: 5,
  },
  photoLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  formGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#374151',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  locationDisplay: {
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    backgroundColor: '#6B7280',
    padding: 15,
    borderRadius: 10,
    flex: 1,
    marginRight: 10,
  },
  cancelButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#3B82F6',
    padding: 15,
    borderRadius: 10,
    flex: 1,
    marginLeft: 10,
  },
  submitButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.6,
  },
});
