/**
 * Represents a sales analytic object.
 */
export interface SalesAnalytic {
    name: string;
    sales: number;
}

/**
 * Represents a scheduled item.
 */
export interface ScheduledItem {
    day: number;
    item: MenuItem;
}

/**
 * Represents an order in the store.
 */
export interface Order {
    /**
     * The ID of the order.
     */
    order_id: string;

    /**
     * The date of the order.
     */
    order_date: string;

    /**
     * The time of the order.
     */
    order_time: string;

    /**
     * The status of the order.
     */
    order_status: string;

    /**
     * The items included in the order.
     */
    order_items: MenuItem[];

    /**
     * The total amount of the order.
     */
    order_total: number;
}

/**
 * Represents a menu item.
 */
export interface MenuItem {
    /**
     * The cuisine of the menu item.
     */
    cuisine: string;
    /**
     * The description of the menu item.
     */
    description: string;
    /**
     * The type of dish.
     */
    dish_type: string;
    /**
     * The name of the menu item.
     */
    name: string;
    /**
     * Indicates if the menu item is hidden.
     */
    hidden: boolean;
    /**
     * The price of the menu item.
     */
    price: number;
    /**
     * Indicates if the menu item is a routine item.
     */
    is_routine: boolean;
    /**
     * Indicates if the menu item is available.
     */
    is_available: boolean;
    /**
     * The URLs of the menu item's images.
     */
    imageURLS: string[];
    /**
     * The restrictions of the menu item.
     */
    restrictions: string[];
}

/**
 * Represents the properties of a store.
 */
export interface StoreProperties {
    /**
     * The name of the store.
     */
    store_name: string;

    /**
     * The billing information of the store.
     */
    store_billing: {
        /**
         * The address of the store.
         */
        address: string;

        /**
         * The city of the store.
         */
        city: string;

        /**
         * The state of the store.
         */
        state: string;

        /**
         * The ZIP code of the store.
         */
        zip: string;

        /**
         * The country of the store.
         */
        country: string;
    };

    /**
     * The settings of the store.
     */
    store_settings: {
        /**
         * The directory for the store's banner.
         */
        banner_dir: string;
    };

    /**
     * The menu items of the store.
     */
    menuItems: MenuItem[];

    /**
     * The sales analytics of the store.
     */
    salesAnalytics: SalesAnalytic[];
}
