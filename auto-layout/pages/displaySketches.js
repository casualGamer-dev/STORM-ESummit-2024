import React, { Component } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Image, FlatList, Alert } from 'react-native';
import { List, ListItem } from 'react-native-elements';
import { db, app } from '../FirebaseConfig'; // Ensure correct db import
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore'; // Modular imports from Firebase v9+

export default class DisplaySketches extends React.Component {
  unsubscribe = null;

  state = {
    sname: '',
    sketches: [],
    isEmpty: false,
  };

  newSketch = () => {
    let email = this.props.param.email;
    this.props.navigation.navigate('Sketch', { email });
  };

  componentDidMount() {
    // Validate email before querying
    const { email } = this.props;
    console.log(email)
    if (!email) {
      console.warn('Email is undefined, cannot query sketches.');
      return;
    }

  
    const sketchesRef = collection(db, 'sketches');
    const q = query(sketchesRef, where('from', '==', email));

    // Listen for real-time updates
    this.unsubscribe = onSnapshot(q, this.onCollectionUpdate);
  }

  componentWillUnmount() {
    if (this.unsubscribe) {
      this.unsubscribe(); // Stop listening when the component unmounts
    }
  }

  showDetails = (name, email) => {
    this.props.navigation.navigate('SketchProfile', { sname: name, email: email });
  };

  getSketchName(name) {
    this.setState({ sname: name });
  }

  combinedFunction(name) {
    this.getSketchName(name);
    Alert.alert(
      'Remove ' + this.state.sname.replace(/_/g, " "),
      'Are you sure you want to delete this sketch?',
      [
        {
          text: 'Cancel',
          onPress: () => console.log('Cancel Pressed'),
          style: 'cancel',
        },
        { text: 'OK', onPress: () => this.removeSketch() },
      ],
      { cancelable: false },
    );
  }

  removeSketch = async () => {
    const originalImage = app.storage().ref().child(this.props.email + "/" + this.state.sname);
    const predictedImage = app.storage().ref().child(this.props.email + "/" + this.state.sname + "-predicted");
    const codeFile = app.storage().ref().child(this.props.email + "/" + this.state.sname + "-code.js");

    const { email, db } = this.props;
    const sketchesRef = collection(db, 'sketches');
    const q = query(sketchesRef, where('name', '==', this.state.sname), where('from', '==', email));

    // Fetch the documents and delete them
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach(async (doc) => {
      await doc.ref.delete(); // Delete the document
    });

    // Delete the associated Firebase storage files
    await originalImage.delete();
    await predictedImage.delete();
    await codeFile.delete();
  };

  renderSeparator = () => (
    <View
      style={{
        height: 1,
        width: "86%",
        backgroundColor: "#CED0CE",
        marginLeft: "14%"
      }}
    />
  );

  render() {
    const empty = this.state.isEmpty;

    return (
      <View style={styles.container}>
        {empty ? (
          <View style={styles.img_container}>
            <Image
              style={styles.no_results}
              source={require('../assets/no_results_found.png')}
            />
            <TouchableOpacity style={styles.button} onPress={this.newSketch}>
              <Text style={styles.buttonText}>Create Sketch</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <List style={styles.list} containerStyle={{ borderTopWidth: 0, borderBottomWidth: 0, marginTop: 0 }}>
            <FlatList
              data={this.state.sketches}
              ItemSeparatorComponent={this.renderSeparator}
              renderItem={({ item }) => (
                <ListItem
                  style={styles.listItem}
                  button onPress={() => { this.showDetails(item.name, this.props.email) }}
                  onLongPress={() => { this.combinedFunction(item.name) }}
                  roundAvatar
                  title={`${item.name.replace(/_/g, " ")}`}
                  avatar={{ uri: item.original_img }}
                  containerStyle={{ borderBottomWidth: 0 }}
                />
              )}
            />
          </List>
        )}
      </View>
    );
  }

  onCollectionUpdate = (querySnapshot) => {
    const sketches = [];
    if (querySnapshot.empty) {
      this.setState({ isEmpty: true });
    } else {
      querySnapshot.forEach(doc => {
        const { name, original_img, date_created } = doc.data();
        sketches.push({
          name,
          original_img,
          date_created,
          id: doc.id,
        });
      });

      this.setState({
        sketches,
        isEmpty: false
      });
    }
  };
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
    marginTop: 20,
    marginBottom: 20
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  img_container: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20
  },
  no_results: {
    width: 250,
    height: 250
  },
  button: {
    backgroundColor: '#5CB85C',
    padding: 10,
    borderRadius: 5
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold'
  }
});
