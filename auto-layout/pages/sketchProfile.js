import React, { Component } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Image, Dimensions, BackHandler, Alert } from 'react-native';
import ScalableImage from 'react-native-scalable-image';
import { DotIndicator } from 'react-native-indicators';
import { getFirestore, collection, query, where, onSnapshot } from 'firebase/firestore'; // Modular imports for Firestore
import { app } from '../FirebaseConfig'; // Ensure this imports the Firebase app (initialized)

// Your SketchProfile component
export default class SketchProfile extends Component {
  unsubscribe = null;
  db = getFirestore(app); // Use the Firestore instance from Firebase config

  state = {
    isLoading: true,
    isEmpty: true,
    predicted_image: '',
    codeUrl: '',
    imageStatus: ''
  };

  componentDidMount() {
    // Validate email and sketch name
    const { email, sname } = this.props;

    if (!email || !sname) {
      console.warn('Email or sketch name is missing.');
      return;
    }

    // Firestore query for the sketch details
    const sketchesRef = collection(this.db, 'sketches');
    const q = query(sketchesRef, where('name', '==', sname), where('from', '==', email));

    // Listen for real-time updates
    this.unsubscribe = onSnapshot(q, this.onImageLoad);

    // Set up back button handler to navigate back
    this.backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      this.goBack();
      return true; // Prevent default behavior
    });
  }

  componentWillUnmount() {
    if (this.unsubscribe) {
      this.unsubscribe(); // Unsubscribe from Firestore updates
    }
    if (this.backHandler) {
      this.backHandler.remove(); // Clean up back handler
    }
  }

  // Navigate back to the list of sketches
  async goBack() {
    const { email } = this.props;
    this.props.navigation.navigate('ListSketches', { email });
  }

  // Navigate to the layout display
  displayLayout = () => {
    const { sname, email } = this.props;
    this.props.navigation.navigate('DisplayLayout', { email, sname });
  };

  // Navigate to the source code display
  displayCode = () => {
    const { sname, email } = this.props;
    const { codeUrl } = this.state;
    this.props.navigation.navigate('DisplaySourceCode', { email, sname, fileUrl: codeUrl });
  };

  // Firestore snapshot listener callback to handle image data
  onImageLoad = (querySnapshot) => {
    const sketches = [];
    if (querySnapshot.empty) {
      this.setState({
        isLoading: false,
        isEmpty: true
      });
    } else {
      querySnapshot.forEach((doc) => {
        const { predicted_url, code_url, num_predictions } = doc.data();

        if (num_predictions === 0) {
          this.setState({
            isLoading: false,
            isEmpty: true
          });
        }

        if (predicted_url !== "") {
          this.setState({
            predicted_image: predicted_url,
            codeUrl: code_url,
            isLoading: false,
            isEmpty: false
          });
        }
      });
    }
  };

  render() {
    const { isLoading, isEmpty, predicted_image, codeUrl, imageStatus } = this.state;

    return (
      <View style={styles.container}>
        {isLoading ? (
          <View style={styles.container}>
            <Image style={styles.infoImg} source={require('../assets/ml.png')} />
            <Text style={styles.infoText}>Please wait while your sketch is being processed.</Text>
            <DotIndicator color="#66BB6A" />
          </View>
        ) : (
          <View style={styles.container}>
            {isEmpty ? (
              <View style={styles.container}>
                <Image style={styles.infoImg} source={require('../assets/no_predictions.png')} />
                <Text style={styles.infoText}>No results found</Text>
              </View>
            ) : (
              <View style={styles.container}>
                <ScalableImage
                  width={Dimensions.get('window').width + 50}
                  height={Dimensions.get('window').height - 320}
                  source={{ uri: predicted_image }}
                />
                <Text>{imageStatus}</Text>
                <TouchableOpacity style={styles.button} onPress={this.displayLayout}>
                  <Text style={styles.buttonText}>Show Layout</Text>
                </TouchableOpacity>
                {codeUrl !== undefined ? (
                  <TouchableOpacity style={styles.button} onPress={this.displayCode}>
                    <Text style={styles.buttonText}>Show Source Code</Text>
                  </TouchableOpacity>
                ) : (
                  <Text>No code available</Text>
                )}
              </View>
            )}
          </View>
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FAFAFA',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  button: {
    width: 300,
    backgroundColor: '#66BB6A',
    borderRadius: 25,
    marginVertical: 5,
    paddingVertical: 13,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOpacity: 0.8,
    elevation: 6,
    shadowRadius: 15,
    shadowOffset: { width: 1, height: 13 }
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#ffffff',
    textAlign: 'center',
    fontFamily: 'Roboto'
  },
  infoText: {
    fontSize: 20,
    fontFamily: 'Roboto',
    color: 'black',
    textAlign: 'center'
  },
  infoImg: {
    width: 150,
    height: 150,
    margin: 100
  }
});
