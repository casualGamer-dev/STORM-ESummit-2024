import React from 'react';
import { StyleSheet, Text, TextInput, View, TouchableOpacity, KeyboardAvoidingView } from 'react-native';
import { auth } from '../FirebaseConfig';  // Import Firebase Authentication
import { signInWithEmailAndPassword } from 'firebase/auth';  // Firebase Authentication method

export default class Login extends React.Component {
  state = {
    email: '',
    password: '',
    message: ''  // Error message for invalid login attempts
  };

  // Function to log in the user
  loginUser = () => {
    const { email, password } = this.state;

    // Check if email and password are provided
    if (email !== '' && password !== '') {
      signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          // Successful login
          const user = userCredential.user;
          console.log('Logged in successfully:', user);

          // Navigate to ListSketches screen after successful login and pass email as a parameter
          this.props.navigation.navigate('ListSketches', { email: user.email });
        })
        .catch((error) => {
          // Handle errors like incorrect credentials
          const errorMessage = error.message;
          console.error('Login Error:', errorMessage);
          this.setState({ message: 'Incorrect email or password' });
        });
    } else {
      // Display error if fields are empty
      this.setState({ message: 'Please fill out both fields' });
    }
  };

  // Navigate to the signup screen
  signup = () => {
    this.props.navigation.navigate('Signup');  // Navigate to signup screen
  };

  render() {
    return (
      <KeyboardAvoidingView style={styles.container} behavior="padding">
        <View style={styles.formContainer}>
          {/* Email Input */}
          <TextInput
            style={styles.inputBox}
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="next"
            onChangeText={(text) => this.setState({ email: text })}
            value={this.state.email}
          />
          
          {/* Password Input */}
          <TextInput
            style={styles.inputBox}
            placeholder="Password"
            secureTextEntry={true}
            autoCapitalize="none"
            returnKeyType="go"
            onChangeText={(text) => this.setState({ password: text })}
            value={this.state.password}
          />

          {/* Error Message */}
          <Text style={styles.error_message}>{this.state.message}</Text>

          {/* Login Button */}
          <TouchableOpacity style={styles.button} onPress={this.loginUser}>
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>
        </View>

        {/* Signup Redirect */}
        <View style={styles.singupTextContent}>
          <Text style={styles.singupText}>Don't have an account yet?</Text>
          <TouchableOpacity onPress={this.signup}>
            <Text style={styles.singupButton}>Signup</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }
}

// Styles for the Login screen
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0000',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  formContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '80%'  // Adjust form container width
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
    marginVertical: 10
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#fff',
    textAlign: 'center'
  },
  error_message: {
    color: '#C20000',
    fontSize: 14,
    marginVertical: 10
  },
  singupTextContent: {
    flexDirection: 'row',
    paddingBottom: 20
  },
  singupText: {
    color: '#9E9E9E',
    fontSize: 16
  },
  singupButton: {
    color: '#66BB6A',
    fontSize: 16,
    marginLeft: 5
  }
});
