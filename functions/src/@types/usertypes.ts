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
 * Represents the properties of a user.
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
     * The account type of the user.
     */
    account_type: AccountType;
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
     * The immutable properties of the user. ON (CLIENT-SIDE)
     */
    immutable: {
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
