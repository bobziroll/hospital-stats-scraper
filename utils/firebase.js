// @ts-nocheck
const {
    initializeApp,
    applicationDefault,
    cert,
} = require("firebase-admin/app")
const {
    getFirestore,
    Timestamp,
    FieldValue,
} = require("firebase-admin/firestore")
const serviceAccount = require("../made-mindful-hospital-stats-ab829ba63271.json")

initializeApp({
    credential: cert(serviceAccount),
})

const db = getFirestore()
