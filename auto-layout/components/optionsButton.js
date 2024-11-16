import React from 'react';
import { StyleSheet, View, Image, TouchableOpacity, Alert } from 'react-native';
import { getFirestore, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore'; // Import Firestore modular methods
import { getStorage, ref, deleteObject } from 'firebase/storage'; // Import Storage modular methods

export default class Logo extends React.Component {

  show = () => {
    Alert.alert(
      'Remove all your Sketches?',
      'Are you sure you would like to completely remove all your sketches? You can tap and hold a sketch to remove it.',
      [
        {
          text: 'Cancel',
          onPress: () => console.log('Cancel Pressed'),
          style: 'cancel',
        },
        { text: 'Yes, remove', onPress: () => this.removeAllSketches() },
      ],
      { cancelable: false },
    );
  };

  removeAllSketches = async () => {
    const { db, user } = this.props; // Assuming db and user are passed as props

    try {
      const q = query(
        collection(db, 'sketches'),
        where('from', '==', user) // Query to fetch user's sketches
      );

      const querySnapshot = await getDocs(q);
      if (querySnapshot.size > 0) {
        querySnapshot.forEach(async (doc) => {
          const sketchData = doc.data();
          const original = sketchData.name;
          const num_predictions = sketchData.num_predictions;

          const storage = getStorage();
          const originalImageRef = ref(storage, `${user}/${original}`);
          const predictedImageRef = ref(storage, `${user}/${original}-predicted`);
          const codeFileRef = ref(storage, `${user}/${original}-code.js`);

          // Delete predicted image
          if (num_predictions > 0) {
            await this.deleteStorageObject(predictedImageRef);
            await this.deleteStorageObject(codeFileRef);
          }

          // Delete original image
          await this.deleteStorageObject(originalImageRef);

          // Delete Firestore document
          await deleteDoc(doc.ref);
          console.log("Document successfully deleted!");
        });
      } else {
        console.log("No sketches found to delete.");
      }
    } catch (error) {
      console.error("Error removing sketches:", error);
    }
  };

  deleteStorageObject = async (storageRef) => {
    try {
      await deleteObject(storageRef);
      console.log("Object successfully deleted!");
    } catch (error) {
      console.error("Error removing object from storage:", error);
    }
  };

  render() {
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={this.show}>
          <Image style={styles.button} source={require('../assets/menu.png')} />
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    width: 30,
    height: 30,
    margin: 15,
  },
});
