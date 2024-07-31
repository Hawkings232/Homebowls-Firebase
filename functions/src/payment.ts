import Stripe from "stripe";

import { onRequest } from "firebase-functions/v2/https";
import { log, error as logError } from "firebase-functions/logger";
import { firestore } from "firebase-admin";
import { MenuItem } from "./types/storetypes";

const stripe: Stripe = new Stripe(process.env.STRIPE_SECRET || "", {
    apiVersion: "2024-06-20",
});
const store = firestore();

export interface CartItem {
    store_reference_id: string;
    uid: string;
    quantity: number;
}

export interface CustomerPaymentSessionRequest {
    contents: Array<CartItem>;
}

export interface OrderProcessingData {
    store_reference_id: string;
    uid: string;
    quantity: number;
}

async function fulfillCustomerOrder(sessionId: string) {
    //const session = await stripe.checkout.sessions.retrieve(sessionId);
    const lineItems = await stripe.checkout.sessions.listLineItems(sessionId);

    const items: Array<OrderProcessingData> = lineItems.data.map(
        (item: Stripe.LineItem) => {
            return {
                store_reference_id:
                    item?.price?.metadata.store_reference_id || "",
                uid: item?.price?.metadata.foodid || "",
                quantity: item.quantity || 0,
            };
        }
    );

    for (const item of items) {
        const storeDoc = await store
            .collection("stores")
            .doc(item.store_reference_id)
            .get();
        if (!storeDoc.exists) {
            logError("[Homebowls-Firebase]: Store not found", {
                store_reference_id: item.store_reference_id,
            });
            return;
        }

        const foodItem = storeDoc
            .data()
            ?.menuItems.find((element: MenuItem) => {
                return element.name == item.uid;
            });

        if (!foodItem) {
            logError("[Homebowls-Firebase]: Food item not found", {
                foodid: item.uid,
            });
            return;
        }

        const order = {
            store_reference_id: item.store_reference_id,
            foodid: item.uid,
            quantity: item.quantity,
            price: foodItem.price,
            status: "pending",
        };

        await store
            .collection("stores")
            .doc(item.store_reference_id)
            .update({
                pendingOrders: firestore.FieldValue.arrayUnion(order),
            });
    }
}

export const createCustomerPaymentSession = onRequest(
    { timeoutSeconds: 120 },
    async (request, response) => {
        try {
            const contents = request.body.contents; // Get the contents of the request
            if (contents && contents.length > 0) {
                const lineItems: Array<Stripe.Checkout.SessionCreateParams.LineItem> =
                    []; // Create an empty array to store line items
                for (const item of contents) {
                    // Iterate through each item in the contents array
                    if (
                        item.store_reference_id &&
                        item.uid &&
                        item.quantity > 1
                    ) {
                        const doc = await store
                            .collection("stores")
                            .doc(item.store_reference_id)
                            .get(); // Get the store document
                        if (!(await doc).exists) {
                            response
                                .status(404)
                                .send("{error: 'Store not found'}"); // Check if the store exists
                            return;
                        }

                        const foodItem = doc
                            ?.data()
                            ?.menuItems.find((element: MenuItem) => {
                                return element.name == item.uid;
                            });
                        if (!foodItem) {
                            response
                                .status(404)
                                .send("{error: 'Food item not found'}"); // Check if the food item exists
                            return;
                        }

                        lineItems.push({
                            // Add the food item to the line items array
                            price_data: {
                                currency: "usd",
                                product_data: {
                                    name: foodItem.name,
                                    description: foodItem.description,
                                    metadata: {
                                        store_reference_id:
                                            item.store_reference_id,
                                        foodid: item.uid,
                                    },
                                },
                                unit_amount_decimal: foodItem.price,
                            },
                            quantity: item.quantity,
                        });
                        console.log(lineItems);
                    } else {
                        response
                            .status(400)
                            .send("{error: 'Invalid item properties'}");
                    }
                }

                if (lineItems.length > 0) {
                    const session: Stripe.Checkout.Session = // Create a new Stripe Checkout Session
                        await stripe.checkout.sessions.create({
                            payment_method_types: ["card"],
                            mode: "payment",
                            line_items: lineItems,
                            success_url:
                                "http://yoursite.com/order/success?session_id={CHECKOUT_SESSION_ID}",
                            cancel_url:
                                "http://yoursite.com/order/canceled?session_id={CHECKOUT_SESSION_ID}",
                        });

                    if (session.url) {
                        response.redirect(303, session.url); // Redirect the user to the Stripe Checkout page
                    } else {
                        response
                            .status(500)
                            .send("{error: 'Session creation failed'}"); // Return an error if the session creation failed
                    }
                }
            } else response.status(400).end("{error: 'Invalid request'}"); // Check if the request is valid
        } catch (error) {
            logError(error);
            response.status(500).send("{error: 'Internal server error'}"); // Return an error if an internal server error occurred
        }
    }
);

export const checkoutCompleted = onRequest(async (request, response) => {
    if (!(request.method == "POST")) {
        response.status(400).send("{error: 'Invalid request'}");
        return;
    }

    const sig = request.headers["stripe-signature"];
    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            request.rawBody,
            sig as string,
            process.env.STRIPE_LOCAL_ENDPOINT_SECRET || ""
        );
    } catch (error) {
        logError("[Homebowls-Firebase]: Event couldn't be constructed", {
            error: error as Error,
        });
        response.status(400).send({ error: "Webhook Error" });
        return;
    }

    log("Checkout Completed: ", JSON.stringify(event, null, 2));
    fulfillCustomerOrder((event.data.object as Stripe.Checkout.Session).id);

    response.status(200).end();
});
