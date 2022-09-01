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
const serviceAccount = require("../hospital-stats-firebase-adminsdk-3i68k-23a06284a6.json")
const { chunk } = require("./jsUtilities")

initializeApp({
    credential: cert(serviceAccount),
})

const db = getFirestore()

async function batchWriteAllDocs(db, data) {
    const groupedData = chunk(data, 500)
    for (let groupOf500 of groupedData) {
        const batch = db.batch()
        for (let doc of groupOf500) {
            let docRef = db.collection("facilities").doc(`${doc.id}`)
            batch.set(docRef, doc)
        }
        batch.commit()
    }
}

module.exports = {
    db,
    batchWriteAllDocs,
}
