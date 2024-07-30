import { HttpsError, onCall } from "firebase-functions/v2/https";
import { error as logError } from "firebase-functions/logger";
import { firestore } from "firebase-admin";
import { auth } from "firebase-functions";
import { StoreProperties } from "./store";
//import admin from "firebase-admin";

const store = firestore();

/**
 * Represents the properties of a user.
 */
export interface UserProperties {
    email: string;
    name: string;
    readonly uid: string;
    account_type: string;
    billing: {
        address: string;
        city: string;
        state: string;
        zip: string;
        country: string;
    };
    stripe_id: string;
    settings: {
        fs: {
            profile_image_dir: string;
            cover_image_dir: string;
        };
        notifications: {
            orders: boolean;
            feedback: boolean;
            promotions: boolean;
        };
    };
}

/**
 * Creates a userdata when a new Firebase authentication user is created.
 * @param user The newly created Firebase authentication user.
 * @returns A Promise that resolves when the user is created.
 */
export const onCreateNewUser = auth.user().onCreate(async (user) => {
    try {
        const storeProperties: StoreProperties = {
            store_name: user.displayName || "",
            store_billing: {
                address: "",
                city: "",
                state: "",
                zip: "",
                country: "",
            },
            store_settings: {
                banner_dir: "",
            },
            menuItems: [],
            salesAnalytics: [],
        };

        const userProperties: UserProperties = {
            email: user.email || "",
            name: user.displayName || "John Doe",
            uid: user.uid,
            account_type: "customer",
            billing: {
                address: "",
                city: "",
                state: "",
                zip: "",
                country: "",
            },
            stripe_id: "NONE",
            settings: {
                fs: {
                    profile_image_dir: user.photoURL || "",
                    cover_image_dir: "",
                },
                notifications: {
                    orders: true,
                    feedback: true,
                    promotions: true,
                },
            },
        };

        await store.collection("stores").doc(user.uid).set(storeProperties);
        return await store
            .collection("users")
            .doc(user.uid)
            .set(userProperties);
    } catch (error) {
        logError("[Homebowls-Firebase]: Error creating new user", error);
        return new HttpsError("internal", "Error creating new user");
    }
});

/**
 * Deletes userdata when a Firebase authentication user is deleted.
 * @param user The deleted Firebase authentication user.
 * @returns A Promise that resolves when the user is deleted.
 */
export const onUserDelete = auth.user().onDelete(async (user) => {
    try {
        await store.collection("stores").doc(user.uid).delete();

        return await store.collection("users").doc(user.uid).delete();
    } catch (error) {
        logError("[Homebowls-Firebase]: Error deleting user", error);
        return new HttpsError("internal", "Error deleting user");
    }
});

/**
 * Updates a user's properties.
 * @param request The request object containing the user's authentication information and updated properties.
 * @returns A Promise that resolves with the updated user object.
 */
export const updateUser = onCall(async (request) => {
    try {
        if (request.auth === undefined || request.auth.uid === undefined) {
            throw new HttpsError(
                "unauthenticated",
                "User is not authenticated."
            );
        }
        const userData = await store
            .collection("users")
            .doc(request.auth.uid)
            .get();
        if (!userData.exists) {
            throw new HttpsError("not-found", "User not found.");
        }

        console.log(request.data.updatedProperties);
        console.log(request.data);

        const userDataObj = userData.data();
        const updatedUser: UserProperties = {
            ...userDataObj,
            ...request.data.updatedProperties,
        };

        await store.collection("users").doc(request.auth.uid).set(updatedUser);
        return updatedUser;
    } catch (error) {
        logError("[Homebowls-Firebase]: Error updating user", error);
        return new HttpsError("internal", "Error updating user");
    }
});
