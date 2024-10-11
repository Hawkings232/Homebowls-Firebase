import { HttpsError, onCall } from "firebase-functions/v2/https";
import { error as logError } from "firebase-functions/logger";
import { firestore } from "firebase-admin";
import { WaitlistProperties } from "./@types/waitlisttypes";

export const joinWaitlist = onCall(async (request) => {
    try {
        const properties = request.data as WaitlistProperties;
        const waitlist = firestore().collection("waitlist");

        if (
            properties.name === undefined ||
            properties.email === undefined ||
            properties.phone === undefined
        ) {
            logError("[Homebowls-Firebase]: Missing required fields...");
            return new HttpsError(
                "invalid-argument",
                "Missing required fields"
            );
        }
        console.log(properties);
        if (
            properties.email &&
            (await waitlist.doc(properties.email).get()).exists
        ) {
            logError("[Homebowls-Firebase]: User already on waitlist...");
            return new HttpsError("already-exists", "User already on waitlist");
        }

        await waitlist.doc(properties.email).set(properties);

        return properties;
    } catch (error) {
        console.log(error);
        logError("[Homebowls-Firebase]: Could not add to waitlist...");
        return new HttpsError("internal", "Error adding user to waitlist");
    }
});
