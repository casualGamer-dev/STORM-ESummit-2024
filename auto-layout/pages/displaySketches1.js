import React, { Component } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Image, Alert, Dimensions, ScrollView } from 'react-native';
import ImageLoad from 'react-native-image-placeholder';
import { db } from '../FirebaseConfig'; 
import { collection, query, where, onSnapshot } from 'firebase/firestore'; 
import Options from '../components/optionsButton';

const resizeComponent = (value, percentage) => {
  return value - (value * (percentage / 100));
};

const Window = {
  Height: Dimensions.get('window').height,
  Width: Dimensions.get('window').width,
};

const CardContainerSize = {
  Height: resizeComponent(300, 5),
  Width: resizeComponent(Window.Width, 50),
};

class Container extends Component {
  render() {
    return (
      <View style={styles.container2}>
        {this.props.children}
      </View>
    );
  }
}

class Card extends Component {
  render() {
    return (
      <TouchableOpacity onPress={this.props.onPress} onLongPress={this.props.onLongPress}>
        <View style={styles.cardContainer}>
          <View style={styles.card}>
            {this.props.children}
          </View>
        </View>
      </TouchableOpacity>
    );
  }
}

export default class DisplaySketches1 extends React.Component {
  unsubscribe = null;

  // Validate email before making Firestore query
  getRef() {
    const { email } = this.props.route.params;
    if (!email) {
      console.warn('Email is undefined, cannot query sketches.');
      return null;
    }
    return collection(db, "sketches");
  }

  state = {
    sketches: [],
    isEmpty: false,
  };

  static renderRightButton = (props) => {
    return <Options user={props.email} db={props.db} />;
  };

  newSketch = () => {
    let email = this.props.route.params;
    console.log(email)
    this.props.navigation.navigate('Sketch', { email });
  };

  componentDidMount() {
    console.log(this.props.route.params)
    const { email } = this.props.route.params;
    const ref = this.getRef();
    if (ref) {
      const q = query(ref, where("from", "==", email ));

      // Listening for changes in Firestore (Real-time updates)
      this.unsubscribe = onSnapshot(q, this.onCollectionUpdate);
    }
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
        { text: 'Cancel', onPress: () => console.log('Cancel Pressed'), style: 'cancel' },
        { text: 'OK', onPress: () => this.removeSketch() },
      ],
      { cancelable: false },
    );
  }

  removeSketch = async () => {
    const originalImage = app.storage().ref().child(this.props.param.email + "/" + this.state.sname);
    const predictedImage = app.storage().ref().child(this.props.param.email + "/" + this.state.sname + "-predicted");
    const codeFile = app.storage().ref().child(this.props.param.email + "/" + this.state.sname + "-code.js");

    const sketchesRef = query(
      collection(db, "sketches"),
      where("name", "==", this.state.sname),
      where("from", "==", this.props.param.email)
    );

    // Fetch the documents and delete them
    const querySnapshot = await getDocs(sketchesRef);
    querySnapshot.forEach(async (doc) => {
      if (querySnapshot.size > 0) {
        await doc.ref.delete();
        console.log("Document successfully deleted!");
      }
    });

    // Delete associated images and files from Firebase Storage
    await originalImage.getDownloadURL().then(function (url) {
      if (url !== "") {
        originalImage.delete().then(() => console.log("Original Object successfully deleted!"));
      }
    });

    await predictedImage.getDownloadURL().then(function (url) {
      if (url !== "") {
        predictedImage.delete().then(() => console.log("Predicted Object successfully deleted!"));
      }
    });

    await codeFile.getDownloadURL().then(function (url) {
      if (url !== "") {
        codeFile.delete().then(() => console.log("Code File successfully deleted!"));
      }
    });
  };

  onCollectionUpdate = (querySnapshot) => {
    const sketches = [];
    if (querySnapshot.empty) {
      this.setState({ isEmpty: true });
    } else {
      querySnapshot.forEach((doc) => {
        const name = doc.data().name;
        const original_img = doc.data().image_url;
        sketches.push({ key: doc.id, name, original_img });
      });

      this.setState({ sketches, isEmpty: false });
    }
  };

  render() {
    const { sketches, isEmpty } = this.state;

    return (
      <View style={styles.container}>
        {isEmpty ? (
          <View style={styles.img_container}>
            <Image style={styles.no_results} source={require('../assets/no_results_found.png')} />
            <TouchableOpacity style={styles.button} onPress={this.newSketch}>
              <Text style={styles.buttonText}>Create Sketch</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Container>
            <ScrollView>
              <View style={{ flexDirection: 'row', flex: 1, flexWrap: 'wrap' }}>
                {sketches.map((item, i) => (
                  <Card
                    key={i}
                    onPress={() => this.showDetails(item.name, this.props.param.email)}
                    onLongPress={() => this.combinedFunction(item.name)}
                  >
                    <ImageLoad style={styles.image} loadingStyle={{ size: 'large', color: 'green' }} source={{ uri: item.original_img }} />
                    <Text style={styles.title}>{item.name.replace(/_/g, " ")}</Text>
                  </Card>
                ))}
              </View>
            </ScrollView>
            <TouchableOpacity activeOpacity={0.5} style={styles.TouchableOpacityStyle} onPress={this.newSketch}>
              <Image source={require('../assets/plus.png')} style={styles.FloatingButtonStyle} />
            </TouchableOpacity>
          </Container>
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FAFAFA',
    flex: 1,
  },
  container2: {
    flex: 1,
    flexDirection: 'row',
  },
  img_container: {
    backgroundColor: '#fbfcfc',
    justifyContent: 'center',
    flexGrow: 1,
    alignItems: 'center',
  },
  no_results: {
    width: 250,
    height: 250,
    borderWidth: 1,
    borderRadius: 75,
  },
  button: {
    width: 300,
    backgroundColor: '#66BB6A',
    borderRadius: 25,
    paddingVertical: 12,
    marginVertical: 10,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#ffffff',
    textAlign: 'center',
    fontFamily: 'Roboto',
  },
  cardContainer: {
    height: 200,
    width: CardContainerSize.Width,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    height: resizeComponent(200, 5),
    width: resizeComponent(CardContainerSize.Width, 5),
    elevation: 3,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
  },
  image: {
    width: resizeComponent(CardContainerSize.Width, 6),
    height: 151,
    resizeMode: 'stretch',
    borderRadius: 5,
  },
  title: {
    fontSize: 13,
    fontWeight: 'bold',
    fontFamily: 'Roboto',
    padding: 10,
  },
  TouchableOpacityStyle: {
    position: 'absolute',
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    right: 20,
    bottom: 20,
    backgroundColor: '#66BB6A',
    borderRadius: 64,
    shadowColor: 'rgba(0,0,0, .4)',
    shadowOffset: { height: 1, width: 1 },
    shadowOpacity: 1,
    shadowRadius: 1,
    elevation: 4,
  },
  FloatingButtonStyle: {
    resizeMode: 'contain',
    width: 30,
    height: 30,
  },
});

