import firebase from 'firebase'

const config = {
  apiKey: "AIzaSyCLl33nDK0nbL84zFeUOAoxplQTqxA7xR0",
  authDomain: "cs554final-8b7d8.firebaseapp.com",
  databaseURL: "https://cs554final-8b7d8.firebaseio.com",
  projectId: "cs554final-8b7d8",
  storageBucket: "cs554final-8b7d8.appspot.com",
  messagingSenderId: "779108505214",
  appId: "1:779108505214:web:358c12bbdac1aae574aa2f"
};



firebase.initializeApp(config);

export const provider = new firebase.auth.GoogleAuthProvider();

export const auth = firebase.auth();

export default firebase;