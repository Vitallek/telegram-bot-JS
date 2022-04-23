import admin from 'firebase-admin'
import {createRequire} from "module"; // Bring in the ability to create the 'require' method
const require = createRequire(import.meta.url); // construct the require method
const serviceAccount = require('../firebase-admin-key.json') // use the require method

const firebaseConfig = {
    credential: admin.credential.cert(serviceAccount),
    apiKey: "AIzaSyAiEm3We4DGpjL2VjixMTqEqWsOtRJRsUk",
    authDomain: "telegramweatherdb.firebaseapp.com",
    databaseURL: "https://telegramweatherdb-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "telegramweatherdb",
    storageBucket: "telegramweatherdb.appspot.com",
    messagingSenderId: "220557913224",
    appId: "1:220557913224:web:48ceb815942474b984433d",
    measurementId: "G-RY76EGTJKX"
};

admin.initializeApp(firebaseConfig);
const db = admin.database()

export const add_city = async (city_id, city_name, city_country) => {
    let ref = db.ref('/cities/')
    let key = city_id
    await ref.once('value', async (snapshot) => {
        console.log(snapshot.child(`${key}`).exists())
        if (snapshot.child(`${key}`).exists()) {
            let newQueryAmount = snapshot.child(`${key}/queries`).val() + 1
            await ref.child(`${key}/`).update({'queries': newQueryAmount})
        } else {
            await ref.child(`${key}`).set({
                "city": city_name,
                "region": city_name,
                "country": city_country,
                "queries": 1
            })
        }
    });
}

export const clearStat = async () => {
    let ref = db.ref('/cities/')
    return ref.set({})
}
export const getStat = async () => {
    let ref = db.ref('/cities/').orderByChild('queries').limitToLast(10)
    return await ref.once('value', (snapshot) => {
        console.log(snapshot.val())
        return JSON.stringify(snapshot.val())
    }, (errorObject) => {
        return {}
    })
}
