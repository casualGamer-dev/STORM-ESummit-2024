import React, { useState } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useNavigation } from '@react-navigation/native';
import { storage } from '../FirebaseConfig';  // Import the storage instance
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';  // Import necessary Firebase Storage methods
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore'; // Import Firestore methods

export default function Landing({ email, sname, db }) {
  const [uploading, setUploading] = useState(false);
  const navigation = useNavigation();

  const requestPermissions = async () => {
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    const galleryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (cameraPermission.status !== 'granted' || galleryPermission.status !== 'granted') {
      Alert.alert('Permission Denied', 'You need to grant camera and gallery permissions.');
      return false;
    }
    return true;
  };

  const takePicture = async () => {
    const permissionsGranted = await requestPermissions();
    if (!permissionsGranted) return;

    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [10, 16],
    });
    handleImagePicked(result);
  };

  const chooseFromGallery = async () => {
    const permissionsGranted = await requestPermissions();
    if (!permissionsGranted) return;

    let result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [10, 16],
    });
    handleImagePicked(result);
  };

  const handleImagePicked = async (pickerResult) => {
    try {
      setUploading(true);
      if (!pickerResult.cancelled && pickerResult.assets && pickerResult.assets.length > 0) {
        const { uri } = pickerResult.assets[0];

        if (typeof uri !== 'string') {
          console.error('Invalid URI:', uri);
          return;
        }

        const manipResult = await ImageManipulator.manipulateAsync(
          uri,
          [{ resize: { width: 600, height: 800 } }],
          { compress: 1, format: 'jpeg', base64: false }
        );

        // Upload the image to Firebase
        await uploadImageAsync(manipResult.uri, email, sname);

        const storageRef = ref(storage, `${email}/${sname}`);
        const imageUrl = await getDownloadURL(storageRef);
        addUrlToDatabase(imageUrl);
        navigation.navigate('SketchProfile', { email, sname });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUploading(false);
    }
  };

  const addUrlToDatabase = async (image_url) => {
    try {
      const sketchesRef = collection(db, 'sketches');
      const q = query(
        sketchesRef,
        where('name', '==', sname),
        where('from', '==', email)
      );
      const querySnapshot = await getDocs(q);

      querySnapshot.forEach(async (doc) => {
        if (querySnapshot.size > 0) {
          const docRef = doc(db, 'sketches', doc.id);
          await updateDoc(docRef, { image_url });
        }
      });
    } catch (error) {
      console.error('Error adding image URL to database:', error);
    }
  };

  const uploadImageAsync = async (uri, email, sname) => {
    const blob = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = function () {
        resolve(xhr.response);
      };
      xhr.onerror = function (e) {
        reject(new TypeError('Network request failed'));
      };
      xhr.responseType = 'blob';
      xhr.open('GET', uri, true);
      xhr.send(null);
    });

    const storageRef = ref(storage, `${email}/${sname}`);
    await uploadBytes(storageRef, blob);
    blob.close();
  };

  return (
    <View style={styles.container}>
      {uploading ? (
        <ActivityIndicator size="large" color="#66BB6A" />
      ) : (
        <View style={styles.container}>
          <Text style={styles.infoText}>
            Bring your idea to life by drawing any of the following elements:
          </Text>
          <Image style={styles.infoImg} source={require('../assets/guidelines.png')} />
          <View style={styles.buttonsContainer}>
            <TouchableOpacity style={styles.button} onPress={takePicture}>
              <Text style={styles.buttonText}>Take picture</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={chooseFromGallery}>
              <Text style={styles.buttonText}>Upload picture</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  button: {
    flex: 1,
    width: 200,
    backgroundColor: '#66BB6A',
    borderRadius: 35,
    margin: 15,
    paddingVertical: 13,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOpacity: 0.8,
    elevation: 6,
    shadowRadius: 15,
    shadowOffset: { width: 1, height: 13 },
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#ffffff',
    textAlign: 'center',
    fontFamily: 'Roboto',
  },
  infoText: {
    fontSize: 18,
    fontFamily: 'Roboto',
    color: 'black',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  infoImg: {
    width: 350,
    height: 420,
    margin: 40,
  },
});
