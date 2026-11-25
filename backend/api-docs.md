## API Documentation
*(Note: For all protected routes, the user must be logged in and send the `x-business-id` header).*

```markdown
# Ordexa API Reference

**Base URL:** `https://ordexa-backend.vercel.app/api`  
**Authentication:** Most routes require an HTTP-only Cookie containing a JWT Access Token.

---

## 🛡️ 1. Authentication & Users
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Public | Register a new user (Form-data for profile pic) |
| `POST` | `/auth/login` | Public | Login and receive HTTP-only cookies |
| `POST` | `/auth/verify-email` | Public | Verify email using the 6-digit code |
| `POST` | `/auth/forgot-password` | Public | Send password reset code |
| `PATCH` | `/auth/reset-password` | Public | Reset password using the reset cookie |
| `POST` | `/auth/logout` | Public | Clear auth cookies |
| `GET` | `/my-profile` | User | Get current user profile |
| `PATCH`| `/my-profile` | User | Update name, email |

## 🏢 2. Businesses (Multi-Tenancy)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/businesses` | User | Create a new business (auto-creates FREE subscription) |
| `GET` | `/businesses` | User | Get all businesses the user belongs to |
| `GET` | `/businesses/current` | Tenant | Get the active business details |
| `PATCH`| `/businesses/current` | Tenant | Update business settings (Owner/Manager) |
| `POST` | `/businesses/current/invitations` | Tenant | Invite a staff member via email |
| `PATCH`| `/businesses/current/members/:id/role` | Tenant | Update member role (Owner only) |

## 📦 3. Products & Inventory
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/products` | Tenant | Create product with variants and images (Multipart) |
| `GET` | `/products` | Tenant | List products (Supports `?includeDeleted=true`) |
| `PATCH`| `/products/:id` | Tenant | Update product details |
| `DELETE`| `/products/:id` | Tenant | Soft-delete product |
| `PATCH`| `/products/:id/restore` | Tenant | Restore deleted product |
| `PATCH`| `/variants/:id/stock` | Tenant | Manually adjust stock (logs to StockMovement) |

## 📝 4. Order Forms & Submissions
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/order-forms` | Tenant | Create a form (auto-generates a public token) |
| `GET` | `/order-forms` | Tenant | List all forms and their links |
| `PATCH`| `/order-forms/:id/status` | Tenant | Open/Close the store (`isActive`) |
| `GET` | `/public/orders/:token` | **Public**| Customer views the form and products |
| `POST` | `/public/orders/:token/submit` | **Public**| Customer submits an order request |
| `GET` | `/submissions` | Tenant | List all customer submissions |
| `POST` | `/submissions/:id/convert` | Tenant | Convert submission to a PENDING order |
| `PATCH`| `/submissions/:id/status` | Tenant | Reject or restore a PENDING submission |

## 🛒 5. Orders & Invoices
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/orders` | Tenant | List all orders (filter by status/search) |
| `PATCH`| `/orders/:id/status` | Tenant | Confirm/Cancel order (handles stock & quotas) |
| `GET` | `/public/invoices/:orderId` | **Public**| Streams the PDF invoice directly to browser |

## 🚚 6. Couriers & Shipments
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/couriers` | Tenant | Connect Steadfast (Encrypts API keys) |
| `POST` | `/shipments/orders/:orderId` | Tenant | Queue a shipment booking |
| `GET` | `/shipments` | Tenant | List all shipments |
| `POST` | `/shipments/:id/retry` | Tenant | Retry a FAILED shipment |
| `GET` | `/public/track/:token` | **Public**| Customer views the parcel tracking timeline |

## 💳 7. Billing & Subscriptions
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/billing` | Tenant | Get subscription plan, usage, and limits |
| `POST` | `/billing/checkout` | Tenant | Get SSLCommerz Gateway URL for upgrade |

## 📊 8. Analytics & Tools
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/analytics/overview` | Tenant | Total revenue, pending orders, etc. |
| `GET` | `/analytics/sales-chart` | Tenant | Revenue grouped by day (Last 30 days) |
| `GET` | `/analytics/top-products` | Tenant | Top 5 best-selling products |
| `GET` | `/analytics/low-stock` | Tenant | Products with stock <= 5 |
| `POST` | `/fraud/check` | Tenant | Check a phone number via FraudBD (24hr cache) |

## 🪝 9. Webhooks (Public)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/integrations/meta/webhook` | Public | Meta Webhook Verification |
| `POST` | `/integrations/meta/webhook` | Public | Receive Messenger messages (captures PSID) |
| `POST` | `/webhooks/steadfast` | Public | Receive parcel status updates from Steadfast |
| `POST` | `/billing/success` | Public | SSLCommerz IPN (Payment Success) |