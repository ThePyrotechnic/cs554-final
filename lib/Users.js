const admin = require('firebase-admin')

admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    databaseURL: "https://cs554final-8b7d8.firebaseio.com"
})
