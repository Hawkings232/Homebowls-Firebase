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
     * The unique identifier of the user (read-only).
     */
    readonly uid: string;
    /**
     * The account type of the user.
     */
    account_type: string;
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
     * The Stripe ID of the user.
     */
    stripe_id: string;
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
}
