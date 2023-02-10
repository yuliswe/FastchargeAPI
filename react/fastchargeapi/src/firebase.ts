import axios from "axios";
import firebase from "firebase/compat/app";

export function initializeFirebase() {
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

    let user = new Promise<firebase.User>((resolve, reject) => {
        firebase.auth().onAuthStateChanged(async (user) => {
            if (user) {
                resolve(user);
            } else {
                reject();
            }
        });
    });

    axios.interceptors.request.use(
        async (config) => {
            let u = await user;
            config.headers.Authorization = await u.getIdToken();
            return config;
        },
        (error) => {
            return Promise.reject(error);
        }
    );
}
