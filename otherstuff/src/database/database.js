import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBhvpldQKs4Fj8fL-qfgFavcgd8p2DGaK4",
  authDomain: "otherstuff-58508.firebaseapp.com",
  projectId: "otherstuff-58508",
  storageBucket: "otherstuff-58508.firebasestorage.app",
  messagingSenderId: "822016640997",
  appId: "1:822016640997:web:c777c31e06a68c22da110c",
  measurementId: "G-PZVGDVS17Q",
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
const database = getFirestore(app);
const analytics = getAnalytics(app);

// if (window.location.hostname === "localhost") {
//   self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
// }

// export const appCheck = initializeAppCheck(app, {
//   provider: new ReCaptchaV3Provider("6LcJRYMqAAAAAPupH6YhMAM1DM2_dRqrWtcsKv65"),
//   isTokenAutoRefreshEnabled: true,
// });

export { database, analytics };
