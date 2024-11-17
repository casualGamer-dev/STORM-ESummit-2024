import React, { Component } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput, Switch, Image } from 'react-native';

export default class Signup extends React.Component {
  unsubscribe = null; 

  state = {
    widgets: [],
  };

  componentDidMount() {

    const sketchesRef = collection(db, 'sketches');
    const q = query(sketchesRef, where('from', '==', email));

    // Listen for real-time updates
    this.unsubscribe = onSnapshot(q, this.onCollectionUpdate);
  }

  componentWillUnmount() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  // Create the UI layout dynamically based on the widgets array
  createLayout = () => {
    return this.state.widgets.map((row, rowIndex) => (
      <View key={rowIndex} style={styles.rows}>
        {row.map((item, colIndex) => this.createUIElement(item, colIndex))}
      </View>
    ));
  };

  // Generate UI element based on the object type
  createUIElement = (item, index) => {
    switch (item.object) {
      case "Textfield":
        return <TextInput key={index} style={styles.input} placeholder="Enter Your text Here" underlineColorAndroid="transparent" />;
      case "Text":
        return <Text key={index} style={styles.label}>Lorem Ipsum</Text>;
      case "Button":
        return (
          <TouchableOpacity key={index} style={styles.button}>
            <Text style={styles.buttonText}>Button</Text>
          </TouchableOpacity>
        );
      case "Image":
        return <Image key={index} style={styles.img} source={require('../assets/img-placeholder.png')} />;
      case "Switch":
        return <Switch key={index} style={styles.switch} thumbTintColor="#66BB6A" />;
      default:
        return null;
    }
  };

  // Sort by minY (vertical position)
  sortByY = (a, b) => (a['y0'] === b['y0'] ? 0 : a['y0'] < b['y0'] ? -1 : 1);

  // Sort by minX (horizontal position)
  sortByX = (a, b) => (a['x0'] === b['x0'] ? 0 : a['x0'] < b['x0'] ? -1 : 1);

  // Process predictions and organize them into rows and columns
  onDataLoad = (querySnapshot) => {
    const elements = [];
    querySnapshot.forEach((doc) => {
      const predictions = doc.data().predictions || []; // Safely handle missing predictions
      const sortedPredictions = predictions.sort(this.sortByY); // Sort by vertical position
      const imgWidth = doc.data().width;
      const imgHeight = doc.data().height;

      let yCounter = 0;
      let counterRows = 0;
      let row = [];

      // Organize predictions into rows
      sortedPredictions.forEach((prediction) => {
        if (prediction['y0'] > yCounter) {
          counterRows++;
          yCounter = prediction['y0'] + prediction['height'];
        }
        if (!row[counterRows - 1]) {
          row[counterRows - 1] = [];
        }
        row[counterRows - 1].push(prediction);
      });

      // Sort elements in each row by x position
      row.forEach((r) => {
        r.sort(this.sortByX);
      });

      // Update state only if data has changed
      if (row !== this.state.widgets) {
        this.setState({
          widgets: row,
        });
      }
    });
  };

  // Handle errors while fetching data
  handleError = (error) => {
    console.error("Error fetching data from Firestore:", error);
  };

  render() {
    return (
      <View style={styles.container}>
        {this.createLayout()}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    marginTop: 50,
    justifyContent: 'center',
    flexDirection: 'column',
    alignItems: 'center',
  },
  rows: {
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 2,
    backgroundColor: '#fff',
    borderWidth: 0.5,
    borderColor: '#fff',
    height: 40,
    borderRadius: 5,
    margin: 15,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  button: {
    margin: 25,
    height: 40,
    width: 100,
    backgroundColor: '#66BB6A',
    justifyContent: 'center',
    borderRadius: 5,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOpacity: 0.8,
    elevation: 6,
    shadowRadius: 15,
    shadowOffset: { width: 1, height: 13 },
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
    textAlign: 'center',
    fontFamily: 'Roboto',
  },
  switch: {
    margin: 25,
    height: 40,
  },
  img: {
    width: 120,
    height: 120,
    margin: 25,
  },
  label: {
    margin: 25,
  },
});
