/**
 * @deprecated Moved to database tables: product_categories and product_sub_categories
 */
export const GLOBAL_CATEGORIES_HIERARCHY: Record<string, string[]> = {
    'Grocery': ['Fruits & Vegetables', 'Dairy & Bakery', 'Staples', 'Snacks', 'Beverages', 'Personal Care', 'Household', 'Baby Care', 'Other'],
    'Fashion': ['Mens', 'Womens', 'Kids', 'Accessories', 'Footwear', 'Other'],
    'Electronics': ['Mobiles', 'Laptops', 'Accessories', 'Home Appliances', 'Cameras', 'Other'],
    'Health': ['Medicines', 'Supplements', 'Healthcare Devices', 'Personal Hygiene', 'Other'],
    'Home': ['Furniture', 'Decor', 'Kitchenware', 'Bedding', 'Other'],
    'Food': ['Veg', 'Non-Veg', 'Chinese', 'Arabian', 'Desserts', 'Beverages', 'Other'],
    'Other': ['Other']
};
