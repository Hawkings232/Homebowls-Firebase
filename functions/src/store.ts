import { onCall, HttpsError } from "firebase-functions/v2/https";
import { error as logError } from "firebase-functions/logger";
import { firestore } from "firebase-admin";
import { StoreProperties } from "./@types/storetypes";

const store = firestore();

/*
async function propertySecurityMeasures(updatedStore: StoreProperties) {
    if (updatedStore.salesAnalytics !== undefined) {
        throw new HttpsError(
            "invalid-argument",
            "Cannot update salesAnalytics."
        );
    }*/
/*
    if (updatedStore.menuItems !== undefined) {
        throw new HttpsError("invalid-argument", "Cannot update menuItems.");
    }
}
*/

export const updateStore = onCall(async (request) => {
    try {
        if (request.auth === undefined || request.auth.uid === undefined) {
            throw new HttpsError(
                "unauthenticated",
                "User is not authenticated."
            );
        }
        const currentStoreDoc = await store
            .collection("stores")
            .doc(request.auth.uid)
            .get();

        const currentStoreData = currentStoreDoc.data() as StoreProperties;

        const updatedStore: StoreProperties = {
            ...currentStoreData,
            ...request.data.updatedProperties,
        };

        //await propertySecurityMeasures(request.data.updatedProperties);

        await store
            .collection("stores")
            .doc(request.auth.uid)
            .update({ ...updatedStore });

        return {
            message: "Store updated successfully.",
        };
    } catch (error) {
        logError("[Homebowls-Firebase]: Error updating store", error);
        if (error instanceof HttpsError) {
            throw error;
        } else {
            throw new HttpsError("internal", "Error updating store");
        }
    }
});
