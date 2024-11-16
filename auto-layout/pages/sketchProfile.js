import React, { Component } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Image, Dimensions, BackHandler } from 'react-native';
import ScalableImage from 'react-native-scalable-image';
import { DotIndicator } from 'react-native-indicators';
import { getFirestore, collection, query, where, onSnapshot } from 'firebase/firestore'; // Modular Firestore imports
import { app } from '../FirebaseConfig'; // Ensure Firebase app is correctly initialized

export default class SketchProfile extends Component {
  unsubscribe = null;
  db = getFirestore(app); // Initialize Firestore instance

  state = {
    isLoading: true,
    isEmpty: true,
    predicted_image: '',
    codeUrl: '',
    imageStatus: ''
  };

  // Firestore data fetch and listener setup
  componentDidMount() {
    const { email, sname } = this.props.route.params;
   console.log(this.props.route.params)
    // Validate email and sketch name before querying Firestore
    if (!email || !sname) {
      console.warn('Email or sketch name is missing.');
      return;
    }

    console.log(`componentDidMount: Starting data fetch for email: ${email}, sketch name: ${sname}`);

    // Firestore query to fetch sketch details
    const sketchesRef = collection(this.db, 'sketches');
    const q = query(sketchesRef, where('name', '==', sname), where('from', '==', email));

    console.log('componentDidMount: Query initialized, setting up Firestore listener...');

    // Listen for real-time updates
    this.unsubscribe = onSnapshot(q, this.onImageLoad, (error) => {
      console.error('componentDidMount: Error fetching data from Firestore:', error);
    });

    // Set up back button handler to navigate back
    this.backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      console.log('Back button pressed, navigating back...');
      this.goBack();
      return true; // Prevent default back button behavior
    });
  }

  componentWillUnmount() {
    // Clean up Firestore listener and back handler when component unmounts
    if (this.unsubscribe) {
      console.log('componentWillUnmount: Unsubscribing from Firestore updates...');
      this.unsubscribe(); // Unsubscribe from Firestore real-time listener
    }
    if (this.backHandler) {
      console.log('componentWillUnmount: Removing back button handler...');
      this.backHandler.remove(); // Remove back button handler
    }
  }

  // Navigate back to the list of sketches
  async goBack() {
    const { email } = this.props.route.params;
    console.log(`goBack: Navigating to ListSketches screen with email: ${email}`);
    this.props.navigation.navigate('ListSketches', { email });
  }

  // Navigate to the layout display screen
  displayLayout = () => {
    const { sname, email } = this.props.route.params;
    console.log(`displayLayout: Navigating to layout display for sketch: ${sname}`);
    this.props.navigation.navigate('DisplayLayout', { email, sname });
  };

  // Navigate to the source code display screen
  displayCode = () => {
    const { sname, email } = this.props.route.params;
    const { codeUrl } = this.state;
    console.log(`displayCode: Navigating to source code display for sketch: ${sname}, fileUrl: ${codeUrl}`);
    this.props.navigation.navigate('DisplaySourceCode', { email, sname, fileUrl: codeUrl });
  };

  // Firestore snapshot listener callback to update the state with sketch data
  onImageLoad = (querySnapshot) => {
    console.log('onImageLoad: Firestore snapshot received...');
    
    if (querySnapshot.empty) {
      console.log('onImageLoad: No data found for the requested sketch.');
      this.setState({
        isLoading: false,
        isEmpty: true
      });
      return;
    }

    querySnapshot.forEach((doc) => {
      const { predicted_url, code_url, num_predictions } = doc.data();
      console.log(`onImageLoad: Fetched data for sketch (doc id: ${doc.id})`);

      if (num_predictions === 0) {
        console.log('onImageLoad: No predictions available for this sketch.');
        this.setState({
          isLoading: false,
          isEmpty: true
        });
      }

      if (predicted_url !== "") {
        console.log('onImageLoad: Predicted image URL found, updating state...');
        this.setState({
          predicted_image: predicted_url,
          codeUrl: code_url,
          isLoading: false,
          isEmpty: false
        });
      } else {
        console.log('onImageLoad: No predicted URL available.');
      }
    });
  };

  render() {
    const { isLoading, isEmpty, predicted_image, codeUrl, imageStatus } = this.state;

    console.log(`render: isLoading: ${isLoading}, isEmpty: ${isEmpty}`);

    return (
      <View style={styles.container}>
        {isLoading ? (
          <View style={styles.container}>
            <Image style={styles.infoImg} source={require('../assets/ml.png')} />
            <Text style={styles.infoText}>Please wait while your sketch is being processed.</Text>
            {/* Fix: Pass key directly to DotIndicator and spread other props */}
            <DotIndicator color="#66BB6A" key={"loading-indicator"} />
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

// Styles for the SketchProfile component
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
