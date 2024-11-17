import React, { useState } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useNavigation } from '@react-navigation/native';

import { storage, db } from '../FirebaseConfig';  // Import Firebase instance
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';  
import { collection, query, where, getDocs, updateDoc } from 'firebase/firestore'; // Firestore methods

export default function Landing({ route }) {
  const { email, sname } = route.params; // Access email and sname from route.params
  const [uploading, setUploading] = useState(false);
  const navigation = useNavigation();

  console.log('Received email:', email);  // Log email to check if it's being passed
  console.log('Received sketch name:', sname);  // Log sketch name to check if it's being passed

  // Function to request camera and gallery permissions
  const requestPermissions = async () => {
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    const galleryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (cameraPermission.status !== 'granted' || galleryPermission.status !== 'granted') {
      Alert.alert('Permission Denied', 'You need to grant camera and gallery permissions.');
      return false;
    }
    return true;
  };

  // Function to take a picture using the camera
  const takePicture = async () => {
    const permissionsGranted = await requestPermissions();
    if (!permissionsGranted) return;

    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [10, 16],
    });
    handleImagePicked(result);
  };

  // Function to choose an image from the gallery
  const chooseFromGallery = async () => {
    const permissionsGranted = await requestPermissions();
    if (!permissionsGranted) return;

    let result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [10, 16],
    });
    handleImagePicked(result);
  };

  // Function to handle the picked image (either from camera or gallery)
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
          [{ resize: { width: 600, height: 800 } }], // Resize image to fit
          { compress: 1, format: 'jpeg', base64: false } // Compress and convert to jpeg
        );

        // Upload the image to Firebase Storage
        await uploadImageAsync(manipResult.uri, email, sname);

        // Get the image URL from Firebase Storage
        const storageRef = ref(storage, `${email}/${sname}`);
        const imageUrl = await getDownloadURL(storageRef);

        // Update the Firestore document with the new image URL
        addUrlToDatabase(imageUrl);
        navigation.navigate('SketchProfile', { email, sname });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUploading(false);
    }
  };

  // Function to add image URL to Firestore database
  const addUrlToDatabase = async (image_url) => {
    try {
      // Validate email and sname
      if (!email || !sname) {
        console.error('Error: email or sname is undefined.');
        return;
      }

      const sketchesRef = collection(db, 'sketches');
      const q = query(
        sketchesRef,
        where('name', '==', sname), // Ensure 'sname' is not undefined
        where('from', '==', email) // Ensure 'email' is not undefined
      );

      // Fetch the documents
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        console.log('No sketches found with the given name and email.');
        return;
      }

      // Update the document with the image URL
      querySnapshot.forEach(async (doc) => {
        const docRef = doc(db, 'sketches', doc.id);
        await updateDoc(docRef, { image_url });
        console.log(`Image URL added to the document: ${doc.id}`);
      });
    } catch (error) {
      console.error('Error adding image URL to database:', error);
    }
  };

  // Function to upload image to Firebase Storage
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
        <ActivityIndicator size={"large"} color={"#66BB6A"} />
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
    color: '#fff',
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
