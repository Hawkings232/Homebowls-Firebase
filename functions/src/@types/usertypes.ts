import { StripeAccountProperties } from "./stripetypes";
import { MenuItem } from "./storetypes";
/**
 * Represents the account type of a user.
 */
export enum AccountType {
    /**
     * Represents customer account type.
     */
    Customer = "customer",
    /**
     * Represents seller account type.
     */
    Chef = "chef",
    /**
     * Represents None account type.
     */
    None = "none",
}

/**
 * Represents the properties of a user in the system.
 *
 * @property {string} email - The email address of the user.
 * @property {string} name - The name of the user.
 * @property {Object} billing - The billing information of the user.
 * @property {string} billing.address - The address of the user.
 * @property {string} billing.city - The city of the user.
 * @property {string} billing.state - The state of the user.
 * @property {string} billing.zip - The ZIP code of the user.
 * @property {string} billing.country - The country of the user.
 * @property {Object} customer - Customer-specific fields.
 * @property {MenuItem[]} customer.cart_items - Cart items of the customer.
 * @property {Object} settings - The settings of the user.
 * @property {Object} settings.fs - The file system settings of the user.
 * @property {string} settings.fs.profile_image_dir - The directory for profile images.
 * @property {string} settings.fs.cover_image_dir - The directory for cover images.
 * @property {Object} settings.notifications - The notification settings of the user.
 * @property {boolean} settings.notifications.orders - Indicates whether order notifications are enabled.
 * @property {boolean} settings.notifications.feedback - Indicates whether feedback notifications are enabled.
 * @property {boolean} settings.notifications.promotions - Indicates whether promotions notifications are enabled.
 * @property {Object} immutable - The immutable properties of the user on the client-side.
 * @property {boolean} immutable.tos_accepted - Indicates whether the terms of service have been accepted.
 * @property {AccountType} immutable.account_type - The account type of the user.
 * @property {string} immutable.uid - The unique identifier of the user (read-only).
 * @property {StripeAccountProperties} immutable.stripe_properties - The Stripe properties of the user (read-only).
 * @property {number} [immutable.lastEmailVerification] - The last email verification time (optional, read-only).
 */
export interface UserProperties {
    /**
     * The email address of the user.
     */
    email: string;
    /**
     * The name of the user.
     */
    name: string;
    /**
     * The billing information of the user.
     */
    billing: {
        /**
         * The address of the user.
         */
        address: string;
        /**
         * The city of the user.
         */
        city: string;
        /**
         * The state of the user.
         */
        state: string;
        /**
         * The ZIP code of the user.
         */
        zip: string;
        /**
         * The country of the user.
         */
        country: string;
    };
    /**
     * Customer Fields
     */
    customer: {
        /**
         * Cart Items of the Customer
         */
        cart_items: MenuItem[];
    };

    /**
     * The settings of the user.
     */
    settings: {
        /**
         * The file system settings of the user.
         */
        fs: {
            /**
             * The directory for profile images.
             */
            profile_image_dir: string;
            /**
             * The directory for cover images.
             */
            cover_image_dir: string;
        };
        /**
         * The notification settings of the user.
         */
        notifications: {
            /**
             * Indicates whether orders notifications are enabled for the user.
             */
            orders: boolean;
            /**
             * Indicates whether feedback notifications are enabled for the user.
             */
            feedback: boolean;
            /**
             * Indicates whether promotions notifications are enabled for the user.
             */
            promotions: boolean;
        };
    };

    /**
     * The immutable properties of the user on (CLIENT-SIDE)
     */
    immutable: {
        tos_accepted: boolean;
        /**
         * The account type of the user.
         */
        account_type: AccountType;
        /**
         * The unique identifier of the user (read-only).
         */
        uid: string;
        /**
         * The Stripe properties of the user (read-only).
         */
        stripe_properties: StripeAccountProperties;
        /**
         * CANBENULL
         * Last Email-Verification Time (read-only).
         */
        lastEmailVerification?: number;
    };
}
