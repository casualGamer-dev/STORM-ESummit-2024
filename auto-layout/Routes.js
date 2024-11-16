import React, { Component } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Options from './components/optionsButton';
import Login from './pages/login';
import Singup from './pages/singup';
import Landing from './pages/landing';
import Sketch from './pages/Sketch';
import ListSketches from './pages/displaySketches1';
import SketchProfile from './pages/sketchProfile';
import DisplayLayout from './pages/displayLayout';
import DisplaySourceCode from './pages/displaySourceCode';

import * as Font from 'expo-font'; // Importing font module from Expo
import {db} from "./FirebaseConfig"
// Initialize Firebase

  const firestore = db;
 

const Stack = createStackNavigator();

export default class Routes extends Component {
  state = {
    fontLoaded: false,
  };

  async componentDidMount() {
    // Ensure fonts are loaded before rendering components
    await Font.loadAsync({
      'System-code': require('./assets/fonts/code-regular.ttf'),
    });
    this.setState({ fontLoaded: true });
  }

  render() {
    // Wait for fonts to be loaded before rendering navigation
    if (!this.state.fontLoaded) {
      return <Text>Loading...</Text>; // Or a custom loading spinner
    }

    return (
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerStyle: {
              height: 40,
              paddingTop: 5,
            },
            headerTitleStyle: styles.navTitle,
          }}
        >
          <Stack.Screen
            name="Login"
            component={Login}
            initialParams={{ db:  firestore }} // Passing firestore directly here
            options={{ title: 'Login', headerShown: false }}
          />
        <Stack.Screen
          name="Signup"
          component={Singup} // Pass Signup directly here
          initialParams={{ db: firestore}}  // Passing db to the component
        />
          <Stack.Screen
            name="Sketch"
            component={Sketch}
            initialParams={{ db:  firestore }}
            options={{ title: 'New Sketch' }}
          />
          <Stack.Screen
            name="ListSketches"
            component={ListSketches}
            initialParams={{ db:  firestore }}
            options={{ title: 'Sketches', headerLeft: () => null }} // Hides back button
          />
          <Stack.Screen
            name="Landing"
            component={Landing}
            initialParams={{ db:  firestore }}
          />
          <Stack.Screen
            name="SketchProfile"
            component={SketchProfile}
            initialParams={{ db:  firestore  ,}}
            options={{ title: 'Sketch Results' }}
          />
          <Stack.Screen
            name="DisplayLayout"
            component={DisplayLayout}
            initialParams={{ db:  firestore }}
            options={{ title: 'Layout' }}
          />
          <Stack.Screen
            name="DisplaySourceCode"
            component={DisplaySourceCode}
            initialParams={{ db:  firestore }}
            options={{ title: 'Source Code' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }
}

const styles = StyleSheet.create({
  navTitle: {
    width: 150,
    marginBottom: 15,
    fontFamily: 'Roboto',
  },
  routerScene: {
    marginTop: 0,
    paddingTop: 0,
  },
});
