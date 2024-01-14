import { initializeApp } from "firebase/app";

export function initializeFirebase() {
  const firebaseConfig = {
    apiKey: "AIzaSyAtSOzX-i3gzBYULHltD4Xkz-H9_9U6tD8",
    // https://stackoverflow.com/questions/44815580/how-to-replace-the-myapp-123-firebaseapp-com-with-my-custom-domain-myapp-com
    authDomain: "login.fastchargeapi.com", // https://cloud.google.com/identity-platform/docs/show-custom-domain
    projectId: "fastchargeapi",
    storageBucket: "fastchargeapi.appspot.com",
    messagingSenderId: "398384724830",
    appId: "1:398384724830:web:b20ccb2c0662b16e0eadcf",
    measurementId: "G-8BJ3Q22YR1",
  };

  return initializeApp(firebaseConfig);
}
