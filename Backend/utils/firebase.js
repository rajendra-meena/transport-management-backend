const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getMessaging } = require('firebase-admin/messaging');
const path = require('path');
const fs = require('fs');

let serviceAccount;

function loadServiceAccountFromEnv() {
    const encodedKey = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

    if (!encodedKey || encodedKey.includes('your_')) {
        return null;
    }

    try {
        const decoded = Buffer.from(encodedKey, 'base64').toString('utf8');
        return JSON.parse(decoded);
    } catch (error) {
        console.warn('Invalid FIREBASE_SERVICE_ACCOUNT_BASE64 value. Push notifications are disabled until a valid Firebase Admin key is added.');
        return null;
    }
}

serviceAccount = loadServiceAccountFromEnv();

if (!serviceAccount) {
    const serviceAccountPath = path.join(__dirname, '../Config/transport-management-cb902-firebase-adminsdk-fbsvc-54d2b703c5.json');
    if (fs.existsSync(serviceAccountPath)) {
        serviceAccount = require(serviceAccountPath);
    }
}

if (serviceAccount && !getApps().length) {
    initializeApp({
        credential: cert(serviceAccount)
    });
    console.log('Firebase Admin SDK initialized successfully.');
} else if (!serviceAccount) {
    console.warn('Firebase Service Account Key not found. Push notifications are disabled.');
}

exports.sendPushNotification = async (token, title, body, data = {}) => {
    try {
        if (!token || !getApps().length) return;

        const message = {
            notification: { title, body },
            data,
            token
        };

        const response = await getMessaging().send(message);
        console.log('Successfully sent message:', response);
        return response;
    } catch (error) {
        console.error('Error sending push notification:', error);
    }
};

exports.sendMulticastNotification = async (tokens, title, body, data = {}) => {
    try {
        if (!tokens || tokens.length === 0 || !getApps().length) return;

        const message = {
            notification: { title, body },
            data,
            tokens
        };

        const response = await getMessaging().sendEachForMulticast(message);
        console.log(response.successCount + ' messages were sent successfully');
        return response;
    } catch (error) {
        console.error('Error sending multicast push notification:', error);
    }
};
