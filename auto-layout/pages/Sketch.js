import React, { Component } from 'react';
import { StyleSheet, Text, TextInput, View, Image, KeyboardAvoidingView, TouchableOpacity, BackHandler } from 'react-native';
import { collection, addDoc } from 'firebase/firestore';  // Modular Firestore imports
import { db } from "../FirebaseConfig";  // Importing Firestore db from FirebaseConfig

export default class Sketch extends React.Component {
  state = {
    name: '',
    message: ''
  };

  componentDidMount() {
    // Handle hardware back press on Android devices
    this.backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      this.goBack(); // Go back to the list of sketches
      return true;
    });
  }

  componentWillUnmount() {
    this.backHandler.remove(); // Clean up back handler when the component unmounts
  }

  // Go back to the previous screen
  goBack() {
    const { email } = this.props.route.params.email;  // Retrieve email from route params
    this.props.navigation.navigate('ListSketches', { email });  // Ensure email is passed correctly
  }

  // Create a new sketch in Firestore
  createSketch = async () => {
    let { name } = this.state;
    name = name.replace(/ /g, "_");  // Replace spaces with underscores for Firestore compatibility

    // Get email from the passed params
    const { email } = this.props.route.params.email;  // Get email from route params

    if (name !== "") {
      try {
        // Reference to the 'sketches' collection in Firestore
        const sketchesCollection = collection(db, "sketches");

        // Add a new document to Firestore using addDoc
        await addDoc(sketchesCollection, {
          name: name,        // Store the name of the sketch
          from: email,       // Store the email address (not db object)
          image_url: '',     // Placeholder for the image URL
          predicted_url: ''  // Placeholder for predicted URL
        });

        // Navigate to the 'Landing' screen after creating the sketch
        this.props.navigation.navigate('Landing', { email, sname: name });
      } catch (error) {
        console.error("Error adding document: ", error);
        this.setState({ message: 'Error creating sketch' });
      }
    } else {
      this.setState({
        message: 'Incomplete fields'
      });
    }
  };

  render() {
    return (
      <KeyboardAvoidingView behavior="padding" style={styles.container}>
        <View style={styles.formContainer}>
          <Image style={styles.infoImg} source={require('../assets/idea.png')} />
          <TextInput
            style={styles.inputBox}
            underlineColorAndroid="rgba(0,0,0,0)"
            placeholder="Sketch Name"
            placeholderTextColor="#9E9E9E"
            selectionColor="#fff"
            onChangeText={(text) => this.setState({ name: text })}
          />
          <Text style={styles.error_message}>{this.state.message}</Text>
          <TouchableOpacity style={styles.button} onPress={this.createSketch}>
            <Text style={styles.buttonText}>Create Sketch</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  formContainer: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  inputBox: {
    width: 300,
    backgroundColor: 'rgba(194,194,194,0.2)',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#9E9E9E',
    marginVertical: 10
  },
  button: {
    width: 300,
    backgroundColor: '#66BB6A',
    borderRadius: 25,
    paddingVertical: 12,
    marginVertical: 10,
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
  error_message: {
    color: '#C20000'
  },
  infoImg: {
    width: 150,
    height: 150,
    margin: 30
  }
});
