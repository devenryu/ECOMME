-- Insert test seller
INSERT INTO sellers (id, email, name) VALUES
    ('d0c24bf4-4e40-4758-9d09-3f4c071a68a8', 'test@example.com', 'Test Seller');

-- Insert test products
INSERT INTO products (
    seller_id,
    title,
    description,
    price,
    currency,
    template_type,
    status,
    slug
) VALUES
    (
        'd0c24bf4-4e40-4758-9d09-3f4c071a68a8',
        'Premium Coffee Maker',
        'Handcrafted coffee maker for the perfect brew every morning.',
        129.99,
        'USD',
        'premium',
        'active',
        'premium-coffee-maker'
    ),
    (
        'd0c24bf4-4e40-4758-9d09-3f4c071a68a8',
        'Minimalist Watch',
        'Elegant timepiece with a clean, modern design.',
        199.99,
        'USD',
        'minimal',
        'active',
        'minimalist-watch'
    );

-- Insert test order
INSERT INTO orders (
    product_id,
    customer_name,
    customer_email,
    customer_phone,
    shipping_address,
    order_total,
    currency,
    status,
    payment_status
) VALUES
    (
        (SELECT id FROM products WHERE slug = 'premium-coffee-maker'),
        'John Doe',
        'john@example.com',
        '+1234567890',
        '{"street": "123 Main St", "city": "New York", "state": "NY", "postal_code": "10001", "country": "USA"}',
        129.99,
        'USD',
        'pending',
        'pending'
    ); 