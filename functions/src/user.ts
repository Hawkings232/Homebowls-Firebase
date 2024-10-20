import { HttpsError, onCall } from "firebase-functions/v2/https";
import { error as logError } from "firebase-functions/logger";
import { firestore } from "firebase-admin";
import { auth } from "firebase-functions";
import { StoreProperties } from "./@types/storetypes";
import { UserProperties, AccountType } from "./@types/usertypes";
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
            billing: {
                address: "",
                city: "",
                state: "",
                zip: "",
                country: "",
            },
            customer: {
                cart_items: [],
            },
            immutable: {
                tos_accepted: false,
                account_type: AccountType.None,
                uid: user.uid,
                stripe_properties: {
                    stripe_id: "",
                    charges_enabled: false,
                    details_submitted: false,
                    payouts_enabled: false,
                },
                lastEmailVerification: 0,
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
        if (userData.data()?.immutable.stripe_properties.stripe_id) {
            await stripe.accounts.del(
                userData.data()?.immutable.stripe_properties.stripe_id
            );
        }

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
            ...(request.data.updatedProperties as UserProperties),
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

/**
 * Sets up a user account based on the provided setup type.
 *
 * @param request - The request object containing authentication and data.
 * @returns The updated user properties or an error if the setup fails.
 *
 * @throws {HttpsError} If the user is not authenticated.
 * @throws {HttpsError} If the user is not found.
 * @throws {HttpsError} If the user account type is already set.
 * @throws {HttpsError} If required fields are missing in the request data.
 * @throws {HttpsError} If the setup type is invalid.
 * @throws {HttpsError} If there is an internal error during account setup.
 */
export const setupAccount = onCall(async (request) => {
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

        console.log(request.data);
        if (
            request.data === undefined ||
            request.data === null ||
            request.data.type_setup === undefined
        ) {
            throw new HttpsError("invalid-argument", "Missing required fields");
        }
        if (request.data.type_setup == "account_type") {
            if (user.immutable.account_type !== AccountType.None) {
                throw new HttpsError(
                    "already-exists",
                    "User account type already set"
                );
            }
            const updatedUser: UserProperties = {
                ...user,
                immutable: {
                    ...user.immutable,
                    account_type: request.data.updatedProperties.immutable
                        .account_type as AccountType,
                },
            };

            if (updatedUser.immutable.account_type === AccountType.Chef) {
                const stripeController = new StripeController();
                await stripeController.createAccount(user, "US");
                user.immutable.stripe_properties.stripe_id =
                    stripeController.account.id;
            }
            await store
                .collection("users")
                .doc(request.auth.uid)
                .set(updatedUser);
            return updatedUser;
        } else if (request.data.type_setup == "tos_agreement") {
            if (user.immutable.tos_accepted) {
                throw new HttpsError(
                    "already-exists",
                    "User has already accepted the terms of service"
                );
            }

            const updatedUser: UserProperties = {
                ...user,
                immutable: {
                    ...user.immutable,
                    tos_accepted: true,
                },
            };
            await store
                .collection("users")
                .doc(request.auth.uid)
                .set(updatedUser);
            return updatedUser;
        }

        return new HttpsError("invalid-argument", "Invalid setup type");
    } catch (error) {
        logError("[Homebowls-Firebase]: Error setting up account", error);
        return new HttpsError("internal", "Error setting up account");
    }
});
