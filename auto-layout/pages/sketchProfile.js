import React, { Component } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  Linking
} from 'react-native';
import { Dimensions, BackHandler } from 'react-native';
import ScalableImage from 'react-native-scalable-image';
import { DotIndicator } from 'react-native-indicators';

export default class Signup extends React.Component {
  unsubscribe = null;
  ref = this.props.db.collection("sketches").where("name", "==", this.props.sname).where("from", "==", this.props.email);

  state = {
    isLoading: true,
    isEmpty: true,
    predicted_image: '',
    codeUrl: ''
  };

  componentDidMount() {
    this.unsubscribe = this.ref.onSnapshot(this.onImageLoad);
    this.backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      this.goBack(); // works best when the goBack is async
      return true;
    });
  }

  componentWillUnmount() {
    this.unsubscribe = null;
    this.backHandler.remove();
  }

  // Navigate back to the list of sketches
  async goBack() {
    let email = this.props.email;
    this.props.navigation.navigate('ListSketches', { email: email });
  }

  // Navigate to the layout display
  displayLayout = () => {
    let sname = this.props.sname;
    let email = this.props.email;
    this.props.navigation.navigate('DisplayLayout', { email: email, sname: sname });
  };

  // Navigate to the source code display
  displayCode = () => {
    let sname = this.props.sname;
    let email = this.props.email;
    let url = this.state.codeUrl;
    this.props.navigation.navigate('DisplaySourceCode', { email: email, sname: sname, fileUrl: url });
  };

  render() {
    const { isLoading, isEmpty, codeUrl } = this.state;

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
                  source={{ uri: this.state.predicted_image }}
                />
                <Text>{this.state.imageStatus}</Text>
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

  // Firestore listener callback
  onImageLoad = (querySnapshot) => {
    querySnapshot.forEach((doc) => {
      const predicted_img = doc.data().predicted_url;
      const code_url = doc.data().code_url;
      const num_predictions = doc.data().num_predictions;

      if (num_predictions === 0) {
        this.setState({
          isLoading: false
        });
      }

      if (predicted_img !== "") {
        this.setState({
          predicted_image: predicted_img,
          codeUrl: code_url,
          isLoading: false,
          isEmpty: false
        });
      }
    });
  };
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
