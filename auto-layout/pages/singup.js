import React, { Component } from 'react';
import { Alert, StyleSheet, Text, TextInput, View, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import Logo from '../components/logo'; // Assuming you have a custom Logo component
import { db, auth } from '../FirebaseConfig'; // Import auth from FirebaseConfig
import { createUserWithEmailAndPassword } from 'firebase/auth'; // Import the necessary function from Firebase
import { setDoc, doc } from 'firebase/firestore'; // Import Firestore functions

export default class Signup extends Component {
  state = {
    name: '',
    email: '',
    password: '',
    message: '',
  };

  // Create a user using Firebase Authentication
  createUser = () => {
    const { name, email, password } = this.state;
    const { navigation } = this.props; // Get navigation from props

    if (name !== "" && email !== "" && password !== "") {
      // Proceed with user creation using Firebase Auth

      // Pass `auth` as the first argument to createUserWithEmailAndPassword
      createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          const user = userCredential.user;
          const userId = user.uid;
          
          // Create user data for Firestore (don't store the password)
          const userData = {
            id: userId,
            name,
            email,
          };

          // Now store additional user data in Firestore
          setDoc(doc(db, 'users', userId), userData)
            .then(() => {
              // Successfully created the user in Firestore
              Alert.alert('Thanks for signing up!', 'Registration completed.');
              navigation.navigate('ListSketches', { email }); // Navigate to ListSketches
            })
            .catch((error) => {
              Alert.alert('Error', 'There was an issue saving user data.');
              console.error(error);
            });
        })
        .catch((error) => {
          // Handle errors during user creation
          Alert.alert('Error', error.message);
          console.error(error);
        });
    } else {
      this.setState({ message: 'Please complete all fields.' });
    }
  };

  goBack = () => {
    this.props.navigation.goBack(); // Go back to the previous screen
  };

  render() {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <Logo width={120} height={120} />
        <TextInput
          style={styles.inputBox}
          underlineColorAndroid="rgba(0,0,0,0)"
          placeholder="Name"
          placeholderTextColor="#9E9E9E"
          selectionColor="#fff"
          autoCapitalize="none"
          onSubmitEditing={() => this.email.focus()}
          onChangeText={(text) => this.setState({ name: text })}
        />
        <TextInput
          style={styles.inputBox}
          underlineColorAndroid="rgba(0,0,0,0)"
          placeholder="Email"
          placeholderTextColor="#9E9E9E"
          selectionColor="#fff"
          keyboardType="email-address"
          autoCapitalize="none"
          onSubmitEditing={() => this.password.focus()}
          ref={(input) => (this.email = input)}
          onChangeText={(text) => this.setState({ email: text })}
        />
        <TextInput
          style={styles.inputBox}
          underlineColorAndroid="rgba(0,0,0,0)"
          placeholder="Password"
          secureTextEntry={true}
          placeholderTextColor="#9E9E9E"
          autoCapitalize="none"
          ref={(input) => (this.password = input)}
          onChangeText={(text) => this.setState({ password: text })}
        />
        <Text style={styles.error_message}>{this.state.message}</Text>
        <TouchableOpacity style={styles.button} onPress={this.createUser}>
          <Text style={styles.buttonText}>Sign Up</Text>
        </TouchableOpacity>
        <View style={styles.signupTextContent}>
          <Text style={styles.signupText}>Already have an account?</Text>
          <TouchableOpacity onPress={this.goBack}>
            <Text style={styles.signupButton}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0000',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupTextContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingBottom: 20,
    flexDirection: 'row',
  },
  signupText: {
    color: '#9E9E9E',
    fontSize: 16,
  },
  signupButton: {
    color: '#9E9E9E',
    fontSize: 16,
    marginHorizontal: 5,
  },
  inputBox: {
    width: 300,
    backgroundColor: 'rgba(194,194,194,0.2)',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#9E9E9E',
    marginVertical: 10,
  },
  button: {
    width: 300,
    backgroundColor: '#66BB6A',
    borderRadius: 25,
    paddingVertical: 12,
    marginVertical: 10,
    fontFamily: 'Roboto',
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
  },
  error_message: {
    color: '#C20000',
  },
});
