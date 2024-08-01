import { HttpsError, onCall } from "firebase-functions/v2/https";
import { error as logError } from "firebase-functions/logger";
import { firestore } from "firebase-admin";
import { auth } from "firebase-functions";
import { StoreProperties } from "./types/storetypes";
import { UserProperties, AccountType } from "./types/usertypes";
import { stripe, StripeController } from "./controllers/stripeController";

const store = firestore();

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
            schedule: {
                specialty: [],
                routine: [],
            },
        };

        const userProperties: UserProperties = {
            email: user.email || "",
            name: user.displayName || "John Doe",
            account_type: AccountType.None,
            billing: {
                address: "",
                city: "",
                state: "",
                zip: "",
                country: "",
            },
            immutable: {
                uid: user.uid,
                stripe_properties: {
                    stripe_id: AccountType.None,
                    charges_enabled: false,
                    details_submitted: false,
                    payouts_enabled: false,
                },
            },
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

        const stripeController = new StripeController();
        await stripeController.createAccount(userProperties, "US");
        userProperties.immutable.stripe_properties.stripe_id =
            stripeController.account.id;

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
        const userData = await store.collection("users").doc(user.uid).get();
        await stripe.accounts.del(
            userData.data()?.immutable.stripe_properties.stripe_id
        );

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
            immutable: userDataObj?.immutable, // Keep the immutable properties unchanged
        };

        await store.collection("users").doc(request.auth.uid).set(updatedUser);
        return updatedUser;
    } catch (error) {
        logError("[Homebowls-Firebase]: Error updating user", error);
        return new HttpsError("internal", "Error updating user");
    }
});

/**
 * Generates a Stripe account link for the authenticated user.
 * @param request - The request object containing the user's authentication information.
 * @returns The URL of the generated Stripe account link.
 * @throws {HttpsError} If the user is not authenticated or not found, or if there is an error generating the account link.
 */
export const generateStripeAccountLink = onCall(async (request) => {
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

        const userDataObj = userData.data();
        const user: UserProperties = userDataObj as UserProperties;

        const stripeController = new StripeController();
        await stripeController.getAccount(
            user.immutable.stripe_properties.stripe_id
        );

        const accountLink = await stripeController.generateAccountLink();
        console.log(accountLink);
        return accountLink.url;
    } catch (error) {
        logError("[Homebowls-Firebase]: Error generating account link", error);
        return new HttpsError("internal", "Error generating account link");
    }
});
