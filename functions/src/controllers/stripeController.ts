import Stripe from "stripe";
import { UserProperties } from "../types/usertypes";

export const stripe =
    process.env.NODE_ENV == "development"
        ? new Stripe(process.env.STRIPE_TEST_SECRET || "", {
              apiVersion: "2024-06-20",
          })
        : new Stripe(process.env.STRIPE_SECRET || "", {
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

export class StripeController {
    account: any;

    constructor() {
        this.account = {};
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
                    url:
                        "https://homebowls.com/storePage?store_id=" +
                        user.immutable.uid,
                    support_email: user.email,
                },
                metadata: {
                    firebaseUID: user.immutable.uid,
                },
                tos_acceptance: {
                    service_agreement: country === "US" ? "full" : "recipient",
                },
            });
        } catch (error) {
            throw new Error("Error creating account...");
        }
    }

    async generateAccountLink() {
        try {
            const accountLink = await stripe.accountLinks.create({
                account: this.account.id,
                refresh_url: process.env.NODE_ENV
                    ? "https://localhost:5173/verify"
                    : "https://homebowls.com/verify",
                return_url: process.env.NODE_ENV
                    ? "https://localhost:5173/verify"
                    : "https://homebowls.com/return",
                type: "account_onboarding",
                collect: "eventually_due",
            });

            return accountLink;
        } catch (error) {
            console.log(error);
            throw new Error("Error generating account link URL...");
        }
    }

    async getAccount(accountId: string) {
        try {
            this.account = await stripe.accounts.retrieve(accountId);
            console.log("Account data: " + JSON.stringify(this.account));
            return this.account;
        } catch (error) {
            console.log(error);
            throw new Error("Error getting account...");
        }
    }
}
