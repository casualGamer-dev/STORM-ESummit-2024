const functions = require('firebase-functions');
const exec = require('child_process').exec;
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');
const sizeOf = require('image-size');
const { google } = require('googleapis');
const { Storage } = require('@google-cloud/storage');
const projectId = 'ai-draw-c2807';
const UUID = require("uuid");
const prettier = require("prettier");
const codeGen = require('./code-gen.js');
admin.initializeApp(
    {
        apiKey: "AIzaSyCD72jfLDMbs1kP3QhxR49bcWE80qj9COc",
        authDomain: "ai-draw-c2807.firebaseapp.com",
        projectId: "ai-draw-c2807",
        storageBucket: "ai-draw-c2807.firebasestorage.app",
        messagingSenderId: "357135848223",
        appId: "1:357135848223:web:7930d2fd0917b83d0c162a",
        measurementId: "G-TFSLTX56RH"
    }
);
const db = admin.firestore();

// Creates a client
const storage = new Storage({ projectId });
const { auth } = require('google-auth-library');

async function makePrediction(b64img) {
  const client = await auth.getClient({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
  return new Promise((resolve, reject) => {

    var ml = google.ml({
      version: 'v1'
    });

    const params = {
      auth: client,
      name: 'projects/auto-layout/models/auto-layout_detect/versions/v2',
      resource: {
        instances: [{ "b64": b64img }]
      }
    };
    var timeStart = new Date();  
    ml.projects.predict(params, (err, result) => {
      console.log("executing ML Predict...");
      if (err) {
        console.log("ERROR:" + err);
        reject(err);
      } else {
        var timeEnd = new Date();  
        console.log("The object detection took " + (timeStart- timeEnd) + " ms.")  
        console.log("RESULT: " + result.data.predictions[0].num_detections);
        resolve(result);
      }
    });
  });
}
//Function to sort bounding boxes by its minY coordinate
function sortFunction(a, b) {
  if (a['y0'] === b['y0']) {
      return 0;
  }
  else {
      return (a['y0'] < b['y0']) ? -1 : 1;
  }
}
//Function to sort bounding boxes by its minX coordinate
function sortXaxis(a, b) {
  if (a['x0'] === b['x0']) {
      return 0;
  }
  else {
      return (a['x0'] < b['x0']) ? -1 : 1;
  }
}
async function createLayoutFile(fileBucket,bucket,filePath,predictions) {
  //Call to function sort by minY coordinate
  
  let sorted_predictions = predictions.sort(sortFunction);
  let yCounter = 0;
      let counterRows = 0;
      var row = [];
      
      //For loop to iterate through sorted elements. It calculates the number of rows and the elements that are part of the rows.
      for( i=0;i<sorted_predictions.length;i++){
          row [counterRows] = [];//Creates a 2D array for each row
          if(sorted_predictions[i]['y0']>yCounter){
            counterRows++;
            yCounter = sorted_predictions[i]['y0'] +sorted_predictions[i]['height']
      
            if(sorted_predictions[i]['y0']<yCounter){
              console.log("Element "+ sorted_predictions[i]['object']+" is in row: " + (counterRows-1));
              let position = (counterRows-1);
             row[position].push(sorted_predictions[i]);  
            }
          }else{
            if(sorted_predictions[i]['y0']<yCounter){
              console.log("Element "+ sorted_predictions[i]['object']+" is in row: " + (counterRows-1));
              let position = (counterRows-1);
               row[position].push(sorted_predictions[i]);
            }
            continue;
          }    
      }//end for loop
      console.log("No. of rows: "+counterRows);
      
      let xCounter = 0;
      var rowOrder=[];
      for(i=0;i<row.length;i++){//Iterates through all the rows 
        rowOrder[i]=[];
          for( j=0;j<row[i].length;j++){//Iterates through all the columns of each row
            //If a row only contains one element
            if(row[i].length===1){ 
              // console.log("There is only one elements on this row");
               rowOrder[i].push(row[i][j]);
            }else if(row[i].length>1){
              // console.log(row[i][j]);
              if(row[i][j]['x0']>xCounter){
                xCounter = row[i][j]['x0'];
                 rowOrder[i].push(row[i][j]);//add element at the end of the row array
              }else{
                 rowOrder[i].unshift(row[i][j]);//add element at the start of the row array
              }
              rowOrder[i]=rowOrder[i].sort(sortXaxis);//sort all elements on the x coordinate
            } 
          }          
      }//end for loop
   
    let fileName = path.basename(filePath);
    let file = '/tmp/'+ fileName + '.js';
    let concatenate="";
    concatenate +=codeGen.addImports();
    concatenate +=codeGen.addopeningHeaders();
    for(i=0;i<rowOrder.length;i++){//Iterates through all the rows 
      concatenate +="<View style={styles.rows}>";
      for(j=0;j<rowOrder[i].length;j++){//Iterates through all the columns of each row
        //Each type of object will add an UI element to the array of elements
          let objectType= rowOrder[i][j]['object'];
          if(objectType==="Textfield"){
            console.log("TEXTFIELD");
            let textfield = "<TextInput style = {styles.input} "+
            "underlineColorAndroid = 'transparent' "+
            "autoCapitalize = 'none'/>";
            concatenate +=textfield;
          }else if(objectType==="Text"){
            console.log("LABEL");
            let label = "<Text style = {styles.label}> Text </Text>";
            concatenate += label;
          }else if(objectType==="Button"){
            console.log("BUTTON");
            let button = "<TouchableOpacity style={styles.btn}>"+
                        "<Text style={styles.btnText}>Button</Text>"+
                        "</TouchableOpacity>";
            concatenate += button;
          }else if(objectType==="Image"){
            console.log("IMAGE");
            let image = "<Image style={styles.img}"+
                        "source={require('yourImage.png')}/>";
            concatenate += image;
          }else if(objectType==="Switch"){
            console.log("SWITCH");
            let switchui = "<Switch style = {styles.switch}"+
                           "thumbTintColor='#338a3e'/>";
            concatenate += switchui;
          }
      }
      concatenate +="</View>";
    }//end for loop
    
    concatenate +=codeGen.addclosingHeaders();
    concatenate +=codeGen.addStyles();

    let options = {
        "arrowParens": "avoid",
        "bracketSpacing": true,
        "htmlWhitespaceSensitivity": "css",
        "insertPragma": false,
        "jsxBracketSameLine": false,
        "jsxSingleQuote": false,
        "parser": "babel",
        "printWidth": 80,
        "proseWrap": "preserve",
        "requirePragma": false,
        "semi": true,
        "singleQuote": false,
        "tabWidth": 2,
        "trailingComma": "none",
        "useTabs": false 
    }
    
    fs.writeFile(file, prettier.format(concatenate,options), function(err) {
      if (err) throw err;
    
      console.log('complete');
  });

  //Upload code file to cloud storage
    let uuid = UUID();
    await  bucket.upload(file, {
    destination: filePath + "-code.js",
    metadata: {
      // Enable long-lived HTTP caching headers
      // Use only if the contents of the file will never change
      contentType: 'text/javascript',
      cacheControl: 'public, max-age=31536000',
      firebaseStorageDownloadTokens: uuid
    },
  }, (err, file) => {
    if (err) return console.error(err);
    return console.log("Successfully uploaded code to bucket.");
  });
  
  let code_url = "https://firebasestorage.googleapis.com/v0/b/" + fileBucket + "/o/" + encodeURIComponent(filePath + "-code.js") + "?alt=media&token=" + uuid;
  if (code_url !== null){
     // Update document on Firestore
     let addCodeFile =  db.collection('sketches');
     addCodeFile.where("name", "==", path.basename(filePath)).where("from", "==", path.dirname(filePath)).get()
     .then((querySnapshot) => {
       querySnapshot.forEach((doc) => {
         if (querySnapshot.size > 0) {
          addCodeFile.doc(doc.id).update({ code_url: code_url }, { merge: true });
         }
       });
       return true;
     })
     .catch((error) => {
       console.log("Error getting documents:", error);
       return error;
     });
  }
}

// exports.hourly_job = functions.pubsub
//   .topic('hourly-tick')
//   .onPublish((message) => {
//     console.log("This job is run every hour!");
//     if (message.data) {
//       const dataString = Buffer.from(message.data, 'base64').toString();
//       console.log(`Message Data: ${dataString}`);
//     }

//     return true;
//   });
const bucket = storage.bucket("ai-draw-c2807.firebasestorage.app")


exports.startPrediction = ((event) => {

    const bucket = storage.bucket("ai-draw-c2807.firebasestorage.app")
  const contentType = event.contentType;
  const filePath = event.name;

  const fileName = path.basename(filePath);
  const file = bucket.file(filePath);
  const dirName = path.dirname(filePath);

  if (path.basename(filePath).endsWith('-predicted') ) {
    console.log('Predicted File already exists. Exiting ...');
    return 0;
  }
  if (path.basename(filePath).endsWith('-code.js')) {
    console.log('Code File already exists. Exiting ...');
    return 0;
  }
  fs.rmdir('./tmp/', (err) => {
    if (err) {
      console.log('error deleting tmp/ dir');
    }else{
      console.log('tmp/ dir removed succesfully');
    }
  });
  
  if (filePath.startsWith(dirName)) {
    const destination = '/tmp/' + fileName;
    console.log('got a new image', filePath);
    console.log('dest', destination);
    return file.download({
      destination: destination
    }).then(() => {
      console.log('base64 encoding image...');
      let bitmap = fs.readFileSync(destination);
      return new Buffer(bitmap).toString('base64');
    }).then((b64string) => {
      console.log('sending image againts ML model ...');
      return makePrediction(b64string);
    }).then((result) => {
      let boxes = result.data.predictions[0].detection_boxes;
      let scores = result.data.predictions[0].detection_scores;
      let objectName = result.data.predictions[0].detection_classes;
      let dimensions = sizeOf(destination);
      let data = "";
      let num_predictions = 0;
      let arrayOfElements = [];
      let imageRef = db.collection('sketches');
      console.log("SCORES" + scores);

      for (i = 0; i < scores.length; i++) {
        if (scores[i] >= 0.7) {
          num_predictions++;
          let x0 = boxes[i][1] * dimensions.width;
          let y0 = boxes[i][0] * dimensions.height;
          let x1 = boxes[i][3] * dimensions.width;
          let y1 = boxes[i][2] * dimensions.height;
          let width = x1 - x0;
          let height = y1 - y0;
          let class_name = "";
          let class_color = "";
          if (objectName[i] === 1) {
            console.log("CLASS: TEXT");
            class_name = "Text";
            class_color = "Firebrick"
          } else if (objectName[i] === 2) {
            console.log("CLASS: TEXT FIELD");
            class_name = "Textfield";
            class_color = "limegreen"
          } else if (objectName[i] === 3) {
            console.log("CLASS: BUTTON");
            class_name = "Button";
            class_color = "gold"
          } else if (objectName[i] === 4) {
            console.log("CLASS: IMAGE");
            class_name = "Image";
            class_color = "deepskyblue	"
          } else if (objectName[i] === 5) {
            console.log("CLASS: SWITCH");
            class_name = "Switch";
            class_color = "purple1"
          }
          console.log("Class: " + objectName[i]);
          data += "stroke " + class_color + " fill none rectangle " + x0 + "," + y0 + "," + x1 + "," + y1 + "\r\n";
          arrayOfElements.push({ object: class_name, accuracy: scores[i], x0: x0, y0: y0, x1: x1, y1: y1, width: width, height: height });
        }
      }//end for loop
      console.log("num_predictions: " + num_predictions);
      if (num_predictions > 0) {


        fs.writeFile('/tmp/rect.txt', data, (err, data) => {
          if (err) console.log(err);
          console.log("Successfully Written to File.");
        });
        console.log(arrayOfElements);


        // Draw a box on the image around the predicted bounding box
        return new Promise((resolve, reject) => {
          console.log(destination);
          // exec(`convert ${destination} -stroke "#39ff14" -strokewidth 2 -fill none -draw @/tmp/rect.txt ${destination}`, (err) => {
          exec(`convert ${destination} -strokewidth 2 -draw @/tmp/rect.txt ${destination}`, (err) => {
            if (err) {
              console.error('Failed to draw rect.', err);
              reject(err);
            } else {
              console.log('drew the rect');
              console.log("uploading image...");
              const metadata = { contentType: contentType };
              // Upload to cloud Storage
              let uuid = UUID();
              bucket.upload(destination, {
                destination: filePath + "-predicted",
                uploadType: "media",
                metadata: {
                  contentType: 'image/jpg',
                  metadata: {
                    firebaseStorageDownloadTokens: uuid
                  }
                }
              }, (err, file) => {
                if (err) return console.error(err);
                return console.log("succesfully uploaded!");
              });
              let predicted_img_url = "https://firebasestorage.googleapis.com/v0/b/" + fileBucket + "/o/" + encodeURIComponent(filePath + "-predicted") + "?alt=media&token=" + uuid;
              // Update document on Firestore
              imageRef.where("name", "==", path.basename(filePath)).where("from", "==", path.dirname(filePath)).get()
                .then((querySnapshot) => {
                  querySnapshot.forEach((doc) => {
                    // console.log(querySnapshot.size);
                    if (querySnapshot.size > 0) {
                      console.log(doc.id, " => ", doc.data());
                      imageRef.doc(doc.id).update({ num_predictions: num_predictions, 
                                                    predicted_url: predicted_img_url, 
                                                    width: dimensions.width, 
                                                    height: dimensions.height, 
                                                    predictions: arrayOfElements }, { merge: true });
                    }
                  });
                  return true;
                })
                .catch((error) => {
                  console.log("Error getting documents:", error);
                  return error;
                });
                createLayoutFile(fileBucket,bucket,filePath,arrayOfElements);
                
              resolve(destination);
            }
          });
        });
      } else {

        // Update document on Firestore
        imageRef
          .where("name", "==", path.basename(filePath))
          .where("from", "==", path.dirname(filePath))
          .get()
          .then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
              // console.log(querySnapshot.size);
              if (querySnapshot.size > 0) {
                console.log(doc.id, " => ", doc.data());
                imageRef.doc(doc.id).update({ num_predictions: num_predictions }, { merge: true });

              }
            });
            return true;
          })
          .catch((error) => {
            console.log("Error getting documents:", error);
            return error;
          });
        return console.log("No objects were found");
      }
    })
  }else{
    return false;
  }
});