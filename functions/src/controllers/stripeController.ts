import Stripe from "stripe";
import { UserProperties } from "../types/usertypes";

const stripe: Stripe = new Stripe(process.env.STRIPE_SECRET || "", {
    apiVersion: "2024-06-20",
});

/*
export interface StripeExpressAccount {
    stripe_account_id: string;
    charges_enabled: boolean;
    details_submitted: boolean;
    transfers_enabled: boolean;
    payouts_enabled: boolean;
}*/

class StripeController {
    account: Stripe.Account;

    constructor() {
        this.account = {} as Stripe.Account;
    }

    async createAccount(user: UserProperties, country: string) {
        try {
            this.account = await stripe.accounts.create({
                type: "express",
                country: country || "US",
                email: user.email,
                capabilities: {
                    card_payments: { requested: true },
                    transfers: { requested: true },
                },
                business_type: "individual",
                business_profile: {
                    mcc: "7299",
                    product_description: "Food",
                    url: "https://homebowls.com/storePage?store_id=" + user.uid,
                    support_email: user.email,
                },
                tos_acceptance: {
                    service_agreement: country === "US" ? "full" : "recipient",
                },
            });
        } catch (error) {
            console.error(error);
        }
    }

    async generateAccountLinkURL() {
        try {
            const accountLink = await stripe.accountLinks.create({
                account: this.account.id,
                refresh_url: "https://homebowls.com/refresh",
                return_url: "https://homebowls.com/return",
                type: "account_onboarding",
            });

            return accountLink.url;
        } catch (error) {
            console.error(error);
        }
    }
}
exports.stripe = stripe;
