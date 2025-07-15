import pyrebase

firebase_config = {
    "apiKey": "AIzaSyC79q_h_SqMD_2LwLv7OrS40SO3wD39PTc",
    "authDomain": "communityplatform-dad94.firebaseapp.com",
    "databaseURL": "https://communityplatform-dad94-default-rtdb.firebaseio.com",
    "projectId": "communityplatform-dad94",
    "storageBucket": "communityplatform-dad94.firebasestorage.app",
    "messagingSenderId": "508492662197",
    "appId": "1:508492662197:web:0a96f2fb488b4430d1c5fc",
    "measurementId": "G-BGPKR15QS0"
}

firebase = pyrebase.initialize_app(firebase_config)
db = firebase.database()
