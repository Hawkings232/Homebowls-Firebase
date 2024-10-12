import { firestore } from "firebase-admin";
import { StripeController, stripe } from "./controllers/stripeController";
import { onRequest } from "firebase-functions/v2/https";

const store = firestore();

type EventHandler = (event: any) => Promise<void>;

const handlers: Record<string, EventHandler> = {};
const connectHandlers: Record<string, EventHandler> = {};

connectHandlers["account.updated"] = async (event) => {
    const data = event.data.object;
    const controller = new StripeController();
    const account = await controller.getAccount(data.id);

    const userData = await store
        .collection("users")
        .doc(account.metadata?.firebaseUID || "")
        .get();

    if (userData.exists) {
        const user = userData.data();
        if (user) {
            user.immutable.stripe_properties = {
                payouts_enabled: account.payouts_enabled,
                charges_enabled: account.charges_enabled,
                details_submitted: account.details_submitted,
                stripe_id: account.id,
            };
            await store
                .collection("users")
                .doc(account.metadata?.firebaseUID || "")
                .update(user);
        }
    }
};

export const webhookConnectEndpoint = onRequest(async (request, response) => {
    if (request.method !== "POST") {
        response.status(405).end();
        return;
    }

    try {
        const signature = request.headers["stripe-signature"];
        const event = stripe.webhooks.constructEvent(
            request.rawBody,
            signature as string,
            process.env.STRIPE_LOCAL_ENDPOINT_SECRET || ""
        );

        if (connectHandlers[event.type]) {
            await connectHandlers[event.type](event);
            response.status(200).end();
        } else {
            response.status(200).end();
        }
    } catch (error) {
        console.error(error);
        response.status(400).end();
    }
});

export const webhookEndpoint = onRequest(async (request, response) => {
    if (request.method !== "POST") {
        response.status(405).end();
        return;
    }

    try {
        const signature = request.headers["stripe-signature"];
        const event = stripe.webhooks.constructEvent(
            request.rawBody,
            signature as string,
            process.env.STRIPE_LOCAL_ENDPOINT_SECRET || ""
        );

        if (handlers[event.type]) {
            await handlers[event.type](event);
            response.status(200).end();
        } else {
            response.status(200).end();
        }
    } catch (error) {
        console.error(error);
        response.status(400).end();
    }
});
