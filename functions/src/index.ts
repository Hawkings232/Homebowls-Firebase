/**
    __ __                  __                __          ____ _            __                
   / // /___   __ _  ___  / /  ___  _    __ / /___ ____ / __/(_)____ ___  / /  ___ _ ___ ___ 
  / _  // _ \ /  ' \/ -_)/ _ \/ _ \| |/|/ // /(_-</___// _/ / // __// -_)/ _ \/ _ `/(_-</ -_)
 /_//_/ \___//_/_/_/\__//_.__/\___/|__,__//_//___/    /_/  /_//_/   \__//_.__/\_,_//___/\__/

 * This is the entry point for the Firebase Functions.
 * Follow documentation for more information.
 * V1.0.0A
 */

import admin from "firebase-admin";

admin.initializeApp();

// import { createCustomerPaymentSession, checkoutCompleted } from "./payment";
// import { updateStore } from "./store";
import {
    onCreateNewUser,
    updateUser,
    onUserDelete,
    generateStripeAccountLink,
    setupAccountType,
} from "./user";
import { webhookEndpoint, webhookConnectEndpoint } from "./stripe";

import { joinWaitlist } from "./waitlist";

console.log(process.env.NODE_ENV);

export {
    joinWaitlist,
    onCreateNewUser,
    updateUser,
    onUserDelete,
    generateStripeAccountLink,
    setupAccountType,
    webhookEndpoint,
    webhookConnectEndpoint,
};
