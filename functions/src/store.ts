import { onCall, HttpsError } from "firebase-functions/v2/https";
import { error as logError } from "firebase-functions/logger";
import { firestore } from "firebase-admin";

export interface SalesAnalytic {
    name: string;
    sales: number;
}

export interface ScheduledItem {
    day: number;
    item: MenuItem;
}

export interface Order {
    order_id: string;
    order_date: string;
    order_time: string;
    order_status: string;
    order_items: MenuItem[];
    order_total: number;
}

export interface MenuItem {
    cuisine: string;
    description: string;
    dish_type: string;
    name: string;
    hidden: boolean;
    price: number;
    is_routine: boolean;
    is_available: boolean;
    imageURLS: string[];
    restrictions: string[];
}

export interface StoreProperties {
    store_name: string;
    store_billing: {
        address: string;
        city: string;
        state: string;
        zip: string;
        country: string;
    };
    store_settings: {
        banner_dir: string;
    };
    menuItems: MenuItem[];
    salesAnalytics: SalesAnalytic[];
}

const store = firestore();

async function propertySecurityMeasures(updatedStore: StoreProperties) {
    if (updatedStore.salesAnalytics !== undefined) {
        throw new HttpsError(
            "invalid-argument",
            "Cannot update salesAnalytics."
        );
    }
    if (updatedStore.menuItems !== undefined) {
        throw new HttpsError("invalid-argument", "Cannot update menuItems.");
    }
}

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

        await propertySecurityMeasures(updatedStore);

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
