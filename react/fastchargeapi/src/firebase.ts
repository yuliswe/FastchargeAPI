import firebase from "firebase/compat/app";

type FirebaseInitializationResult = {
    user: Promise<firebase.User | null>;
};

export function initializeFirebase(): FirebaseInitializationResult {
    const firebaseConfig = {
        apiKey: "AIzaSyAtSOzX-i3gzBYULHltD4Xkz-H9_9U6tD8",
        authDomain: "fastchargeapi.firebaseapp.com", // https://cloud.google.com/identity-platform/docs/show-custom-domain
        projectId: "fastchargeapi",
        storageBucket: "fastchargeapi.appspot.com",
        messagingSenderId: "398384724830",
        appId: "1:398384724830:web:b20ccb2c0662b16e0eadcf",
        measurementId: "G-8BJ3Q22YR1",
    };

    firebase.initializeApp(firebaseConfig);

    let user = new Promise<firebase.User | null>((resolve, reject) => {
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                resolve(user);
            } else {
                resolve(null);
            }
        });
    });

    return { user };

    // export async function fetchWithAuth(url, options) {
    //     let u = await user;
    //     options.headers.Authorization = await u.getIdToken();
    //     return fetch(url, options);
    // }
}
