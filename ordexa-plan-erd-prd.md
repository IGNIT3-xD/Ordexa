# OrderDesk --- Product Plan, ERD & Product Requirements Document

**Document version:** 1.0\
**Status:** MVP planning baseline\
**Target market:** Bangladesh\
**Primary customer segment:** Clothing and fashion sellers operating
through Facebook\
**Product type:** Multi-tenant SaaS\
**Date:** November 2026

------------------------------------------------------------------------

## 1. Executive Summary

OrderDesk is a social-commerce order management platform for clothing
and fashion sellers in Bangladesh. It helps sellers turn conversations
and customer interest on Facebook Messenger into structured, reviewable
orders, then manage confirmation, courier booking, shipment tracking,
and customer notifications from one workspace.

The MVP is built around a deliberate workflow:

1.  A customer contacts a seller through Facebook Messenger.
2.  The seller sends the customer a unique OrderDesk order-form link.
3.  The customer submits contact, delivery, and product/variant details.
4.  The seller reviews the submission and confirms or rejects it.
5.  OrderDesk records the confirmed order and manages inventory and
    order history.
6.  The seller books a shipment through one courier integration.
7.  OrderDesk synchronizes tracking events and sends customer
    notifications through channels that are permitted and configured.

A submitted form is **not** automatically a confirmed order. Seller
review and approval are explicit steps.

### Product principles

-   **Seller remains in control:** customers submit requests; sellers
    confirm orders.
-   **Structured data over chat parsing:** use a public order form
    rather than depending on AI or free-form message extraction.
-   **Reliable money and inventory handling:** calculate prices on the
    server, use decimal money fields, and make critical transitions
    transactional.
-   **Tenant isolation by design:** every business-owned record and
    query is scoped to an authorized business.
-   **Integration-independent core:** the order lifecycle must work even
    if Meta approval or a courier API is delayed.
-   **Async external work:** courier calls, notifications, and webhook
    processing run through background jobs.
-   **Bangladesh-first:** support local phone/address patterns, BDT,
    local courier workflows, and seller operating practices.

------------------------------------------------------------------------

## 2. Product Scope

### 2.1 MVP goals

The MVP should allow a fashion seller to:

-   Create an account and business workspace.
-   Manage products, sizes, colors, SKUs, prices, and stock.
-   Create or configure customer-facing order forms.
-   Generate secure, expiring, single-use order links.
-   Review incoming form submissions.
-   Convert an approved submission into an order.
-   Confirm, cancel, and track orders.
-   Book a shipment using one courier provider's API.
-   See courier tracking updates.
-   Send customer updates through permitted notification channels.
-   View basic operational metrics and order history.

### 2.2 Explicitly out of scope for v1

-   WhatsApp integration.
-   Instagram integration.
-   AI chatbot or automatic order extraction from messages.
-   Advanced accounting, invoicing, and tax automation.
-   Multiple courier providers at launch.
-   Marketing campaigns and bulk messaging.
-   Native iOS or Android apps.
-   Complex warehouse management.
-   Marketplace or multi-vendor checkout.
-   Automatic customer order confirmation without seller review.

### 2.3 Assumptions and constraints

-   Facebook Messenger is the first social channel.
-   Sellers manually send OrderDesk links through Messenger initially;
    deeper inbox automation is a later increment within the Messenger
    milestone.
-   Meta app review, permissions, messaging policy, and business
    verification may affect integration timing.
-   Messenger messages must comply with Meta's current messaging windows
    and approved use cases. Do not assume that an arbitrary tracking
    message can be sent at any time.
-   One courier provider is integrated first. Steadfast, Pathao, and
    RedX are candidates; select the provider after validating API
    access, seller coverage, pricing, webhook support, and operational
    reliability.
-   Email can be used as a fallback when collected and configured. SMS
    is a later option and must be implemented through a provider.
-   Currency is BDT for the initial market. Store monetary values as
    PostgreSQL `Decimal`, not JavaScript floating-point numbers.

------------------------------------------------------------------------

# Part A --- Product Requirements Document (PRD)

## 3. Problem Statement

Fashion sellers in Bangladesh often receive orders and customer details
through social channels. Order details can be scattered across
conversations, comments, screenshots, spreadsheets, and manual notes.
This makes it difficult to:

-   Capture consistent customer and delivery information.
-   Confirm the exact product, size, color, quantity, and price.
-   Avoid duplicate or incomplete orders.
-   Keep inventory accurate when several staff members handle orders.
-   Track which orders are awaiting confirmation, packing, shipment, or
    delivery.
-   Retrieve courier tracking information.
-   Send reliable customer updates.
-   Understand daily order volume and operational performance.

OrderDesk provides a structured order workflow while allowing sellers to
keep Facebook as their primary customer acquisition and conversation
channel.

## 4. Target Users and Personas

### 4.1 Primary persona --- Owner/operator

A small or medium clothing seller who receives orders through a Facebook
Page and manages product catalog, order confirmation, and courier
handoff.

**Needs** - A simple dashboard showing work that needs attention. - A
fast way to create and send order links. - Control over price, stock,
and order confirmation. - A clear order timeline and shipment status. -
Minimal setup and low operational complexity.

### 4.2 Secondary persona --- Order management staff

A staff member who reviews submissions, contacts customers, confirms
details, and prepares orders.

**Needs** - Access only to the business workspace they belong to. -
Clear permissions for reviewing, confirming, and managing orders. -
Searchable customer and order history. - Protection against accidental
duplicate confirmation.

### 4.3 End customer

A customer who has expressed interest in a product through Messenger and
receives a secure OrderDesk form link.

**Needs** - A mobile-friendly form. - Clear product, variant, quantity,
price, and delivery information. - Simple address and phone entry. - A
clear submission confirmation. - No requirement to create an OrderDesk
account.

## 5. Jobs to Be Done

-   When a customer wants to buy an item, the seller wants to send a
    structured form so the customer can submit complete order details.
-   When a customer submits a form, the seller wants to review it before
    committing stock or confirming the sale.
-   When an order is confirmed, the seller wants inventory and order
    status to update consistently.
-   When a parcel is booked, the seller wants the courier tracking ID
    and status visible in the order.
-   When shipment status changes, the seller wants the customer informed
    through a permitted channel.
-   When several staff members work at once, the seller wants to prevent
    duplicate confirmations, overselling, and cross-business data
    access.

## 6. Functional Requirements

Priority definitions:

-   **P0 --- Required for MVP:** blocks launch if missing.
-   **P1 --- Important:** include if feasible in MVP; otherwise
    immediately after pilot.
-   **P2 --- Later:** intentionally deferred.

### 6.1 Authentication and business workspaces

  ------------------------------------------------------------------------
  ID                Priority          Requirement       Acceptance
                                                        criteria
  ----------------- ----------------- ----------------- ------------------
  AUTH-01           P0                Users can         Password/session
                                      register and sign handling follows
                                      in securely.      the selected auth
                                                        provider's
                                                        security guidance.

  AUTH-02           P0                A user can create Creator becomes
                                      a business        the business
                                      workspace.        owner.

  AUTH-03           P0                A user can belong Every business
                                      to a business     operation checks
                                      through           membership and
                                      membership.       role on the
                                                        server.

  AUTH-04           P1                Owner can invite  Invitation is
                                      staff.            expiring,
                                                        single-use, and
                                                        scoped to one
                                                        business.

  AUTH-05           P0                Business data is  A user cannot read
                                      isolated.         or mutate another
                                                        business's records
                                                        by changing IDs in
                                                        a request.
  ------------------------------------------------------------------------

### 6.2 Product catalog and inventory

  -----------------------------------------------------------------------
  ID                Priority          Requirement       Acceptance
                                                        criteria
  ----------------- ----------------- ----------------- -----------------
  CAT-01            P0                Seller can        Archived products
                                      create, edit,     cannot be added
                                      archive, and list to new
                                      products.         submissions.

  CAT-02            P0                Product can have  Variant SKU,
                                      size/color        price, and stock
                                      variants.         are stored per
                                                        variant where
                                                        applicable.

  CAT-03            P0                Product and       No JavaScript
                                      variant prices    floating-point
                                      use decimal       arithmetic is
                                      storage.          used for
                                                        persisted money
                                                        calculations.

  CAT-04            P0                Seller can manage Stock changes are
                                      stock.            validated and
                                                        audited.

  CAT-05            P1                Seller can upload Images are stored
                                      product images.   in object
                                                        storage; database
                                                        stores durable
                                                        metadata/URLs.

  CAT-06            P1                Seller can search Search is
                                      and filter        business-scoped
                                      products.         and paginated.
  -----------------------------------------------------------------------

### 6.3 Public order forms and links

  -----------------------------------------------------------------------------
  ID                Priority          Requirement           Acceptance criteria
  ----------------- ----------------- --------------------- -------------------
  FORM-01           P0                Seller can configure  Form belongs to
                                      an order form.        exactly one
                                                            business.

  FORM-02           P0                Seller can generate a Token has at least
                                      unique public link.   32
                                                            cryptographically
                                                            random bytes; only
                                                            a hash is stored.

  FORM-03           P0                Link can expire and   Expired or consumed
                                      be single-use.        tokens cannot
                                                            create another
                                                            submission.

  FORM-04           P0                Customer can submit   Public form is
                                      without an account.   mobile-friendly and
                                                            validates
                                                            server-side.

  FORM-05           P0                Form collects         Email is optional;
                                      customer name, phone, phone and required
                                      delivery address,     address fields are
                                      product/variant, and  validated.
                                      quantity.             

  FORM-06           P0                Server calculates     Client-supplied
                                      displayed/submitted   price is ignored.
                                      price from catalog    
                                      data.                 

  FORM-07           P1                Seller can revoke a   Revoked token
                                      link.                 cannot be
                                                            submitted.

  FORM-08           P1                Seller can configure  Only supported
                                      form instructions and fields can be
                                      optional fields.      enabled.
  -----------------------------------------------------------------------------

### 6.4 Submission review and order conversion

  -----------------------------------------------------------------------
  ID                Priority          Requirement       Acceptance
                                                        criteria
  ----------------- ----------------- ----------------- -----------------
  SUB-01            P0                Seller can view   List is
                                      incoming          filterable by
                                      submissions.      status and
                                                        paginated.

  SUB-02            P0                Seller can        Submitted values
                                      inspect submitted are retained as a
                                      customer and item review snapshot.
                                      details.          

  SUB-03            P0                Seller can reject Rejection is
                                      a submission with recorded with
                                      an optional       actor and
                                      reason.           timestamp.

  SUB-04            P0                Seller can        Conversion is
                                      convert an        transactional and
                                      eligible          idempotent.
                                      submission into   
                                      an order.         

  SUB-05            P0                Conversion        Invalid or
                                      revalidates       unavailable items
                                      product, variant, cannot be
                                      price, and stock. silently
                                                        converted.

  SUB-06            P0                Duplicate         Repeated requests
                                      conversion is     return the
                                      prevented.        existing
                                                        converted order
                                                        or a safe
                                                        conflict
                                                        response.
  -----------------------------------------------------------------------

### 6.5 Order management

  ------------------------------------------------------------------------
  ID                Priority          Requirement       Acceptance
                                                        criteria
  ----------------- ----------------- ----------------- ------------------
  ORD-01            P0                Seller can list,  All queries are
                                      search, filter,   business-scoped.
                                      and view orders.  

  ORD-02            P0                Seller can        Confirmation uses
                                      confirm a pending a transaction and
                                      order.            prevents
                                                        concurrent
                                                        duplicate
                                                        confirmation.

  ORD-03            P0                Seller can cancel Cancellation
                                      an eligible       reason and status
                                      order.            history are
                                                        recorded.

  ORD-04            P0                Order stores      Later
                                      immutable item    catalog/customer
                                      and delivery      edits do not
                                      snapshots.        rewrite historical
                                                        order details.

  ORD-05            P0                Order status      Each transition
                                      changes are       records
                                      recorded.         previous/new
                                                        status,
                                                        actor/system
                                                        source, and
                                                        timestamp.

  ORD-06            P1                Seller can add    Notes are not
                                      internal notes.   exposed to the
                                                        customer.

  ORD-07            P1                Seller can view   History is
                                      customer order    restricted to the
                                      history.          same business.
  ------------------------------------------------------------------------

### 6.6 Messenger integration

  -----------------------------------------------------------------------
  ID                Priority          Requirement       Acceptance
                                                        criteria
  ----------------- ----------------- ----------------- -----------------
  META-01           P0 for integrated Seller can        OAuth state is
                    launch            connect an        validated and
                                      eligible Facebook tokens are
                                      Page.             encrypted at
                                                        rest.

  META-02           P0 for integrated Webhook endpoint  Verification and
                    launch            verifies Meta     signature checks
                                      requests.         follow current
                                                        Meta
                                                        requirements.

  META-03           P0 for integrated Incoming events   Replayed webhook
                    launch            are persisted and events do not
                                      deduplicated.     create duplicate
                                                        messages or
                                                        actions.

  META-04           P1                Seller can view   UI shows
                                      conversations and delivery/error
                                      send the          state where
                                      order-form link.  available.

  META-05           P0 for integrated Outbound messages Channel policy is
                    launch            respect Meta      checked before
                                      messaging         sending; failures
                                      policies.         are recorded.

  META-06           P1                Seller can        Tokens are
                                      disconnect a      revoked/deleted
                                      Page.             where supported
                                                        and connection is
                                                        disabled.
  -----------------------------------------------------------------------

**Integration gate:** validate Meta app type, required permissions,
review process, Page eligibility, and permitted messaging use cases
before committing to a public launch date. Keep the rest of the product
usable without Meta approval.

### 6.7 Courier and shipment management

  ------------------------------------------------------------------------------------
  ID                Priority          Requirement            Acceptance criteria
  ----------------- ----------------- ---------------------- -------------------------
  SHIP-01           P0                Seller can request     Order must be confirmed
                                      courier booking for an and have valid
                                      eligible order.        recipient/address/phone
                                                             details.

  SHIP-02           P0                Booking is processed   API request does not wait
                                      asynchronously.        for the courier provider
                                                             to finish.

  SHIP-03           P0                Courier                Provider response is
                                      tracking/consignment   mapped to a normalized
                                      ID is stored.          internal shipment model.

  SHIP-04           P0                Shipment status can be Webhooks or scheduled
                                      synchronized.          polling update the
                                                             shipment timeline.

  SHIP-05           P0                Duplicate booking is   Idempotency key and
                                      prevented.             booking state prevent
                                                             accidental duplicate
                                                             shipments.

  SHIP-06           P1                Seller can retry a     Retry does not create a
                                      failed booking safely. second parcel if the
                                                             provider already accepted
                                                             the first request.
  ------------------------------------------------------------------------------------

Select one courier after checking API availability, documentation,
credentials, webhook/polling support, service coverage, COD support, and
commercial terms.

### 6.8 Notifications

  -------------------------------------------------------------------------
  ID                Priority          Requirement         Acceptance
                                                          criteria
  ----------------- ----------------- ------------------- -----------------
  NOT-01            P0                System can queue    Notification is
                                      order confirmation  queued after the
                                      notifications.      transaction
                                                          commits.

  NOT-02            P0                System can queue    Only permitted
                                      shipment/tracking   channels and
                                      notifications.      message types are
                                                          used.

  NOT-03            P0                Notification        Status, channel,
                                      attempts are        provider
                                      tracked.            response, retry
                                                          count, and
                                                          timestamps are
                                                          recorded.

  NOT-04            P0                Failed sends can be Retries are
                                      retried safely.     idempotent and
                                                          bounded.

  NOT-05            P1                Email fallback is   Email is sent
                                      available.          only when an
                                                          address exists
                                                          and the business
                                                          has configured a
                                                          provider.

  NOT-06            P2                SMS provider        Implement after
                                      integration.        validating local
                                                          provider, cost,
                                                          consent, and
                                                          delivery support.
  -------------------------------------------------------------------------

### 6.9 Dashboard and reporting

  -----------------------------------------------------------------------
  ID                Priority          Requirement       Acceptance
                                                        criteria
  ----------------- ----------------- ----------------- -----------------
  DASH-01           P0                Dashboard shows   Counts are
                                      operational order business-scoped
                                      counts.           and use
                                                        documented status
                                                        definitions.

  DASH-02           P0                Seller sees       Pending work is
                                      submissions       easy to reach
                                      awaiting review.  from the
                                                        dashboard.

  DASH-03           P1                Seller sees basic Date range and
                                      sales/order       status filters
                                      summaries.        are available.

  DASH-04           P2                Advanced cohort,  Deferred until
                                      channel, and      core workflows
                                      staff analytics.  are stable.
  -----------------------------------------------------------------------

## 7. Core User Flows

### 7.1 Customer order submission

1.  Seller creates or selects a form/link.
2.  Backend generates a high-entropy token and stores only its hash.
3.  Seller shares the public URL with the customer.
4.  Customer opens the link.
5.  Backend validates token existence, expiry, revocation, and
    consumption state.
6.  Form displays only active products/variants allowed by the form.
7.  Customer submits name, phone, address, items, quantities, and
    optional email/payment preference.
8.  Backend validates all fields and re-reads current product/variant
    data.
9.  Backend calculates authoritative price and stores an
    `OrderSubmission` snapshot.
10. Token is marked consumed atomically.
11. Seller sees a new submission in the dashboard.

### 7.2 Seller reviews and converts a submission

1.  Seller opens the submission.
2.  Seller checks phone, address, item, variant, quantity, stock, price,
    delivery charge, and payment preference.
3.  Seller may reject it, request clarification outside the app, or
    convert it.
4.  Conversion revalidates current product/variant state.
5.  In a database transaction, create the order and item snapshots,
    attach the submission, and record history.
6.  A unique relation/idempotency guard prevents a second order from
    being created for the same submission.

### 7.3 Seller confirms an order

1.  Seller opens a pending order.
2.  Backend verifies business membership and role.
3.  Backend checks that the order is still in a confirmable state.
4.  Backend revalidates/reserves stock transactionally.
5.  Backend changes order status and writes status history.
6.  Backend creates/updates payment state as appropriate.
7.  After commit, an outbox/job record is processed to send permitted
    notifications.

### 7.4 Seller books a courier shipment

1.  Seller requests shipment booking.
2.  Backend validates order status and recipient details.
3.  Backend creates a shipment in `PENDING`/`BOOKING` state with an
    idempotency key.
4.  A worker calls the courier adapter.
5.  Worker stores provider reference, consignment/tracking ID, booking
    result, and normalized status.
6.  Worker records the event and queues a customer notification if
    allowed.
7.  Webhook or polling updates subsequent shipment events.

### 7.5 Messenger connection and messaging

1.  Seller starts Page connection.
2.  Backend creates OAuth state and redirects to Meta.
3.  Callback validates state and stores encrypted credentials and Page
    metadata.
4.  Webhook verification is completed.
5.  Incoming webhook payload is verified, deduplicated, and queued for
    processing.
6.  Seller can associate a conversation/customer and send an order-form
    link.
7.  Outbound sends pass through a policy-aware notification/messaging
    service.
8.  Disallowed or unavailable messaging routes are not attempted; the
    seller is shown a useful fallback.

------------------------------------------------------------------------

# Part B --- Product and Technical Plan

## 8. Recommended Architecture

### 8.1 Architecture style

Use a **modular monolith** for the MVP. Do not split into microservices
at this stage.

-   Next.js App Router + TypeScript for the web application and
    server-side API.
-   Route Handlers for HTTP endpoints.
-   Domain/service modules for business logic.
-   PostgreSQL as the primary database.
-   Prisma ORM.
-   Zod for request and environment validation.
-   Auth.js or another well-supported authentication solution.
-   Redis + BullMQ for background jobs.
-   S3-compatible object storage for product images.
-   Separate worker process for BullMQ jobs.
-   Vitest for unit/integration tests and Playwright for end-to-end
    tests.

A serverless web deployment can host Next.js, but a persistent BullMQ
worker should run as a separate long-running process. Do not rely on a
serverless request handler to run a permanent queue worker.

### 8.2 High-level system diagram

``` mermaid
flowchart TB
    Customer[Customer mobile browser]
    Seller[Seller / Staff browser]
    Meta[Facebook Messenger / Meta APIs]
    Courier[Courier API]
    Email[Email provider]
    SMS[SMS provider - later]

    subgraph App[OrderDesk application]
        Web[Next.js App Router]
        API[Route Handlers]
        Auth[Authentication and tenant access]
        Domain[Domain services]
        Jobs[Job producer]
        Worker[Background worker]
        Adapters[Meta / Courier / Notification adapters]
    end

    DB[(PostgreSQL)]
    Redis[(Redis / BullMQ)]
    Storage[(S3-compatible object storage)]

    Customer --> Web
    Seller --> Web
    Web --> API
    API --> Auth
    API --> Domain
    Domain --> DB
    Domain --> Storage
    Domain --> Jobs
    Jobs --> Redis
    Redis --> Worker
    Worker --> Adapters
    Adapters <--> Meta
    Adapters <--> Courier
    Adapters --> Email
    Adapters -. later .-> SMS
    Meta --> API
    Courier --> API
    API --> DB
```

### 8.3 Suggested domain/module structure

``` text
src/
  app/
    (auth)/
    (dashboard)/
    order/[token]/
    api/
  modules/
    auth/
    businesses/
    memberships/
    products/
    customers/
    order-forms/
    submissions/
    orders/
    inventory/
    payments/
    shipments/
    notifications/
    integrations/
      meta/
      couriers/
  lib/
    db/
    auth/
    validation/
    queue/
    storage/
    crypto/
    observability/
  workers/
    index.ts
    jobs/
  components/
  types/
prisma/
  schema.prisma
  migrations/
tests/
  unit/
  integration/
  e2e/
```

Keep route handlers thin. They should authenticate, validate input, call
a domain service, and map the result to an HTTP response. Put
transaction boundaries and business rules in domain services.

## 9. Data Model and ERD

### 9.1 Modeling rules

1.  Every business-owned entity must have a `businessId` or be reachable
    through a business-scoped parent with explicit ownership checks.
2.  Every request must resolve the active business from the
    authenticated session and verify membership/role on the server.
3.  Never trust a `businessId` supplied by the browser as authorization.
4.  Store money as `Decimal`/PostgreSQL `NUMERIC`.
5.  Snapshot product name, SKU, variant, unit price, line total, and
    shipping recipient/address on the order. Historical orders must not
    change when catalog/customer records change.
6.  Store public form tokens as hashes, not raw tokens.
7.  Encrypt Meta and courier credentials at rest; never return secrets
    to the browser.
8.  Use unique provider event IDs and external message IDs for
    webhook/message deduplication.
9.  Keep payment status, order status, and shipment status independent.
10. Use explicit transactions and idempotency for submission conversion,
    stock reservation, confirmation, and courier booking.

### 9.2 ERD --- core entities

The following ERD is a logical model. The implementation schema should
refine field names, delete behavior, indexes, and provider-specific
metadata.

``` mermaid
erDiagram
    USER ||--o{ MEMBERSHIP : joins
    BUSINESS ||--o{ MEMBERSHIP : has
    BUSINESS ||--o{ PRODUCT : owns
    PRODUCT ||--o{ PRODUCT_VARIANT : has
    BUSINESS ||--o{ CUSTOMER : owns
    CUSTOMER ||--o{ ADDRESS : has
    BUSINESS ||--o{ ORDER_FORM : configures
    ORDER_FORM ||--o{ FORM_TOKEN : issues
    BUSINESS ||--o{ ORDER_SUBMISSION : receives
    FORM_TOKEN ||--o| ORDER_SUBMISSION : consumed_by
    CUSTOMER o|--o{ ORDER_SUBMISSION : submits
    ORDER_SUBMISSION o|--o| ORDER : converts_to
    BUSINESS ||--o{ ORDER : owns
    CUSTOMER o|--o{ ORDER : places
    ORDER ||--|{ ORDER_ITEM : contains
    PRODUCT_VARIANT o|--o{ ORDER_ITEM : referenced_by
    ORDER ||--o{ ORDER_STATUS_HISTORY : records
    ORDER ||--o{ PAYMENT : has
    ORDER ||--o{ SHIPMENT : ships_as
    SHIPMENT ||--o{ SHIPMENT_EVENT : tracks
    BUSINESS ||--o{ SOCIAL_CONNECTION : connects
    SOCIAL_CONNECTION ||--o{ CONVERSATION : receives
    CUSTOMER o|--o{ CONVERSATION : participates
    CONVERSATION ||--o{ MESSAGE : contains
    BUSINESS ||--o{ COURIER_CONNECTION : configures
    BUSINESS ||--o{ NOTIFICATION : queues
    BUSINESS ||--o{ WEBHOOK_EVENT : receives
    BUSINESS ||--o{ AUDIT_LOG : audits
```

### 9.3 ERD --- important relationship notes

-   `User` and `Business` are many-to-many through `Membership`.
-   `Business` owns products, customers, forms, submissions, orders,
    integrations, and audit records.
-   A product has variants; products without variants can use a default
    sellable variant or a clearly defined product-level inventory
    strategy. Avoid mixing both strategies ambiguously.
-   `OrderSubmission` is a pre-order request. It may be associated with
    a known customer, but public submission must not require an account.
-   A submission converts to at most one order.
-   An order contains one or more immutable `OrderItem` snapshots.
-   An order may have multiple payment records if partial
    payments/refunds are supported.
-   An order may have multiple shipment attempts/shipments, but the MVP
    should define which shipment is active and prevent accidental
    duplicate booking.
-   Social conversations and messages are associated with a connected
    Page. Customer matching may be incomplete; keep external platform
    identifiers separate from internal customer IDs.
-   Webhook events are persisted before processing and deduplicated by
    provider/event identity.
-   Audit logs capture sensitive operational changes and staff actions.

### 9.4 Entity inventory

  -------------------------------------------------------------------------------
  Entity                  Purpose                       Key design considerations
  ----------------------- ----------------------------- -------------------------
  User                    Login identity.               Unique normalized email
                                                        or chosen login
                                                        identifier.

  Business                Seller workspace/tenant.      Currency, timezone,
                                                        business profile, status.

  Membership              User's role in a business.    Unique
                                                        `(businessId, userId)`;
                                                        role-based authorization.

  Product                 Catalog item.                 Business-owned; archive
                                                        instead of destructive
                                                        delete.

  ProductVariant          Size/color/SKU/stock/price.   Enforce business
                                                        consistency with parent
                                                        product.

  Customer                Business-scoped customer      Phone normalization;
                          profile.                      avoid global cross-tenant
                                                        customer leakage.

  Address                 Saved customer address.       Historical order must
                                                        still snapshot delivery
                                                        data.

  OrderForm               Form configuration.           Business-owned; enabled
                                                        fields and allowed
                                                        products.

  FormToken               Public form access token.     Store hash; expiry,
                                                        revoked/consumed
                                                        timestamps; unique hash.

  OrderSubmission         Customer's submitted request. Review status, submitted
                                                        JSON snapshot, idempotent
                                                        conversion.

  Order                   Confirmed/managed sale.       Status, totals, currency,
                                                        recipient/address
                                                        snapshots.

  OrderItem               Immutable line item.          Snapshot title, SKU,
                                                        variant labels, quantity,
                                                        unit price, line total.

  OrderStatusHistory      Order lifecycle audit.        Actor/system source,
                                                        from/to status,
                                                        timestamp, metadata.

  Payment                 Payment/COD/advance/refund    Independent from order
                          state.                        and shipment status.

  SocialConnection        Meta Page connection.         Encrypted tokens,
                                                        external Page ID, scopes,
                                                        status.

  Conversation            External social conversation. Platform and external
                                                        conversation identifiers.

  Message                 Incoming/outgoing message     External message ID
                          record.                       dedupe; payload metadata;
                                                        direction.

  CourierConnection       Courier                       Encrypted credentials;
                          account/configuration.        provider and business
                                                        scope.

  Shipment                Courier booking.              Provider reference,
                                                        tracking ID, status,
                                                        idempotency key.

  ShipmentEvent           Tracking timeline.            Provider event ID,
                                                        normalized status, event
                                                        time, raw payload
                                                        reference.

  Notification            Outbound communication        Channel, policy decision,
                          attempt.                      status, retries, provider
                                                        ID.

  WebhookEvent            Incoming webhook inbox.       Provider/event unique
                                                        key, signature
                                                        verification result,
                                                        processing state.

  AuditLog                Security/business audit       Actor, action, target,
                          trail.                        metadata, timestamp.
  -------------------------------------------------------------------------------

### 9.5 Important database constraints and indexes

At minimum, implement and test:

-   `Membership`: unique `(businessId, userId)`.
-   `Product`: index `(businessId, status)` and business-scoped
    searchable fields.
-   `ProductVariant`: unique SKU per business where SKU is present;
    validate variant ownership.
-   `Customer`: index `(businessId, normalizedPhone)`.
-   `FormToken`: unique `tokenHash`; index
    `(expiresAt, consumedAt, revokedAt)`.
-   `OrderSubmission`: index `(businessId, status, createdAt)`; unique
    `convertedOrderId` if one-to-one conversion is modeled.
-   `Order`: index `(businessId, status, createdAt)`,
    `(businessId, orderNumber)`, and `conversationId` if used.
-   `OrderItem`: index by `orderId`; validate variant belongs to the
    same business as the order.
-   `OrderStatusHistory`: index `(orderId, createdAt)`.
-   `Shipment`: unique idempotency key; index
    `(businessId, status, createdAt)`.
-   `ShipmentEvent`: unique `(shipmentId, providerEventId)` when
    provider event IDs exist.
-   `WebhookEvent`: unique `(provider, externalEventId)` where event IDs
    are globally unique for that provider; otherwise include the
    account/Page identifier in the unique key.
-   `Message`: unique `(socialConnectionId, externalMessageId)` where
    IDs are stable; index `(conversationId, createdAt)`.
-   `Notification`: index `(businessId, status, createdAt)` and
    idempotency key.
-   `AuditLog`: index `(businessId, createdAt)` and
    `(actorUserId, createdAt)`.

**PostgreSQL NULL caveat:** ordinary unique constraints generally allow
multiple rows with `NULL` values. For optional external IDs/SKUs, decide
whether to use partial unique indexes, non-null normalized keys, or a
different compound key. Prisma may require a SQL migration for partial
indexes or advanced constraints.

### 9.6 ERD implementation cautions

-   Prisma relations do not automatically guarantee that a variant
    belongs to the same business as an order. Enforce this in the
    service transaction and, where practical, with composite foreign
    keys or database constraints.
-   A nullable `(productId, size, color)` unique constraint may not
    prevent duplicate rows when one or more fields are `NULL`. Use a
    normalized variant key or partial indexes.
-   Avoid storing raw Meta/courier credentials in plain text.
-   Do not store full payment card data.
-   Keep raw webhook payloads only as long as operational/debugging
    needs and privacy policy justify; redact sensitive fields.
-   Define delete behavior carefully. Prefer archival/soft deletion for
    business records that are referenced by orders or audit logs.
-   Do not cascade-delete historical orders when a product, customer,
    staff membership, or integration is removed.

## 10. API Plan

Use versioning only if there is a real external API consumer; for the
internal web app, a consistent `/api` structure is sufficient initially.
Validate request bodies with Zod and return predictable error shapes.

### 10.1 Authentication and business

  ---------------------------------------------------------------------------------------
  Method                  Endpoint                                Purpose
  ----------------------- --------------------------------------- -----------------------
  POST                    `/api/auth/register`                    Register account, if
                                                                  custom registration is
                                                                  used.

  GET                     `/api/businesses/current`               Read active business.

  POST                    `/api/businesses`                       Create business
                                                                  workspace.

  PATCH                   `/api/businesses/current`               Update business
                                                                  settings.

  GET                     `/api/businesses/current/members`       List members.

  POST                    `/api/businesses/current/invitations`   Invite staff (P1).
  ---------------------------------------------------------------------------------------

### 10.2 Catalog and customers

  -------------------------------------------------------------------------------------
  Method                  Endpoint                              Purpose
  ----------------------- ------------------------------------- -----------------------
  GET/POST                `/api/products`                       List/create products.

  GET/PATCH               `/api/products/:productId`            Read/update product.

  POST                    `/api/products/:productId/archive`    Archive product.

  POST                    `/api/products/:productId/variants`   Create variant.

  PATCH                   `/api/variants/:variantId`            Update variant/stock.

  GET                     `/api/customers`                      Search customers.

  GET                     `/api/customers/:customerId`          Read customer and
                                                                business-scoped
                                                                history.
  -------------------------------------------------------------------------------------

### 10.3 Forms and submissions

  Method      Endpoint                                   Purpose
  ----------- ------------------------------------------ --------------------------
  GET/POST    `/api/order-forms`                         List/create forms.
  GET/PATCH   `/api/order-forms/:formId`                 Read/update form.
  POST        `/api/order-forms/:formId/tokens`          Generate public link.
  POST        `/api/form-tokens/:tokenId/revoke`         Revoke link.
  GET         `/api/public/orders/:token`                Resolve public form.
  POST        `/api/public/orders/:token/submit`         Submit customer request.
  GET         `/api/submissions`                         List submissions.
  GET         `/api/submissions/:submissionId`           Read submission.
  POST        `/api/submissions/:submissionId/convert`   Convert to order.
  POST        `/api/submissions/:submissionId/reject`    Reject submission.

### 10.4 Orders and shipments

  ----------------------------------------------------------------------------------
  Method                  Endpoint                           Purpose
  ----------------------- ---------------------------------- -----------------------
  GET/POST                `/api/orders`                      List/create eligible
                                                             orders.

  GET/PATCH               `/api/orders/:orderId`             Read/update allowed
                                                             fields.

  POST                    `/api/orders/:orderId/confirm`     Confirm and reserve
                                                             stock.

  POST                    `/api/orders/:orderId/cancel`      Cancel eligible order.

  GET                     `/api/orders/:orderId/history`     Read status timeline.

  POST                    `/api/orders/:orderId/shipments`   Queue courier booking.

  GET                     `/api/shipments`                   List shipments.

  GET                     `/api/shipments/:shipmentId`       Shipment
                                                             detail/tracking
                                                             timeline.
  ----------------------------------------------------------------------------------

### 10.5 Integrations and webhooks

  Method   Endpoint                            Purpose
  -------- ----------------------------------- ----------------------------
  GET      `/api/integrations/meta/connect`    Start OAuth.
  GET      `/api/integrations/meta/callback`   Handle OAuth callback.
  GET      `/api/integrations`                 List connections.
  DELETE   `/api/integrations/:connectionId`   Disconnect integration.
  GET      `/api/webhooks/meta`                Meta webhook verification.
  POST     `/api/webhooks/meta`                Receive Meta events.
  POST     `/api/webhooks/courier/:provider`   Receive courier events.

Webhook endpoints should verify authenticity, persist the event,
acknowledge quickly, and process asynchronously.

## 11. Order and Inventory State Model

### 11.1 Suggested order statuses

``` text
PENDING_REVIEW
PENDING_CONFIRMATION
CONFIRMED
PROCESSING
READY_TO_SHIP
SHIPPED
DELIVERED
CANCELLED
RETURNED
```

Use only statuses that map to real operational transitions. If the
product uses `PENDING_REVIEW` for submissions, keep submission status
separate from order status and create an order only after conversion. A
simpler order lifecycle may begin at `PENDING_CONFIRMATION`.

### 11.2 Submission statuses

``` text
PENDING
CONVERTED
REJECTED
EXPIRED
```

### 11.3 Shipment statuses

``` text
PENDING
BOOKING
BOOKED
PICKED_UP
IN_TRANSIT
OUT_FOR_DELIVERY
DELIVERED
DELIVERY_FAILED
RETURNED
CANCELLED
BOOKING_FAILED
```

Map provider-specific states into these normalized statuses and retain
the provider's original status for troubleshooting.

### 11.4 Payment statuses

``` text
UNPAID
PARTIALLY_PAID
PAID
REFUNDED
PARTIALLY_REFUNDED
FAILED
```

Payment method and payment status are separate fields. COD is a payment
method, not a payment status.

### 11.5 Inventory rules

-   A public form submission does not reserve stock by default.
-   Seller confirmation is the point at which stock is
    reserved/deducted, according to the chosen inventory policy.
-   Use atomic conditional updates to prevent overselling.
-   If a reservation model is introduced, store reservation expiry and
    release rules explicitly.
-   Cancellation/restocking must be idempotent. Never increment stock
    twice because a cancellation request or webhook was replayed.
-   Define whether stock is deducted at confirmation or shipment booking
    and apply one policy consistently. Recommended MVP policy:
    reserve/deduct on confirmation and restore only on eligible
    cancellation before fulfillment.

Example atomic decrement:

``` ts
const result = await tx.productVariant.updateMany({
  where: {
    id: variantId,
    product: { businessId },
    stock: { gte: quantity },
  },
  data: {
    stock: { decrement: quantity },
  },
});

if (result.count !== 1) {
  throw new Error("Insufficient stock or invalid variant");
}
```

For multiple line items, lock/update variants in a deterministic order
or use a transaction strategy that handles deadlocks with bounded
retries.

## 12. Security, Privacy, and Reliability Requirements

### 12.1 Tenant security

-   Resolve business membership from the authenticated server session.
-   Check role and record ownership on every read/write path.
-   Never authorize based only on a URL ID or client-provided
    `businessId`.
-   Add automated tests that attempt cross-tenant access for every
    domain.
-   Keep background jobs scoped to a business and validate referenced
    records before mutation.

### 12.2 Public form security

-   Generate tokens with a cryptographically secure random generator and
    at least 32 bytes of entropy.
-   Store a cryptographic hash of the token; compare hashes safely.
-   Add expiry, revocation, and one-time consumption.
-   Rate-limit public form reads/submissions by token and IP/device
    signals, with privacy-conscious retention.
-   Validate all input server-side; treat browser validation as UX only.
-   Add CSRF/origin protections appropriate to the public form
    architecture.
-   Do not accept authoritative prices, discounts, stock, or business
    IDs from the browser.

### 12.3 Integration secrets

-   Encrypt credentials using an application-managed key or a managed
    secret/KMS solution.
-   Keep encryption keys outside the database and source control.
-   Rotate/revoke credentials when a connection is removed or
    compromised.
-   Redact secrets from logs, error messages, analytics, and client
    responses.

### 12.4 Webhook safety

-   Verify provider signatures/tokens before trusting payloads.
-   Persist event identity and processing state.
-   Deduplicate retries.
-   Acknowledge quickly and process asynchronously.
-   Make handlers idempotent.
-   Prevent stale shipment events from overwriting a newer state; use
    provider event time/sequence where available.

### 12.5 Operational reliability

-   Use an outbox pattern or durable job record for actions that must
    happen after a database transaction, such as notifications.
-   Use bounded retries with exponential backoff and jitter.
-   Send permanently failing jobs to a dead-letter/failure queue and
    provide an operator retry path.
-   Add structured logs, request IDs, job IDs, and integration
    correlation IDs.
-   Monitor queue depth, job age, webhook failures, courier booking
    failures, notification failures, and API latency.
-   Back up PostgreSQL and test restoration.
-   Define retention and deletion policies for customer data and
    integration payloads.

## 13. Non-Functional Requirements

  -----------------------------------------------------------------------
  Area                                MVP requirement
  ----------------------------------- -----------------------------------
  Performance                         Dashboard and common list views
                                      should feel responsive under normal
                                      pilot load; paginate all unbounded
                                      lists.

  Availability                        Design for graceful degradation
                                      when Meta, courier, Redis, or email
                                      providers are unavailable.

  Consistency                         Order confirmation, stock changes,
                                      and submission conversion must be
                                      transactional/idempotent.

  Security                            Enforce tenant isolation, role
                                      authorization, secret encryption,
                                      and webhook verification.

  Accessibility                       Forms and dashboard controls should
                                      support keyboard navigation,
                                      labels, focus states, and readable
                                      contrast.

  Responsive UX                       Public order form must work well on
                                      common mobile browsers.

  Localization                        Initial UI language can be English;
                                      customer-facing text should be
                                      structured for later Bangla
                                      support.

  Currency                            BDT in v1; store currency code with
                                      business/order totals.

  Observability                       Structured logs and error
                                      monitoring for web requests and
                                      background jobs.

  Maintainability                     Modular domain boundaries, typed
                                      validation, automated tests, and
                                      documented state transitions.
  -----------------------------------------------------------------------

## 14. Testing Strategy

### Unit tests

-   Price and discount calculations.
-   Phone/address validation.
-   Token hashing and expiry.
-   Status transition rules.
-   Provider status mapping.
-   Notification policy decisions.

### Integration tests

-   Tenant authorization for all business-owned resources.
-   Submission creation and one-time token consumption.
-   Idempotent submission conversion.
-   Concurrent order confirmation.
-   Atomic stock decrement and restoration.
-   Webhook signature verification and deduplication.
-   Courier booking idempotency.
-   Notification retry and duplicate suppression.

### End-to-end tests

-   Register → create business → create product/variant.
-   Generate form link → customer submits → seller reviews.
-   Convert submission → confirm order.
-   Book shipment → tracking status appears.
-   Unauthorized user cannot access another business.
-   Public token cannot be reused after successful submission.

### Concurrency tests to prioritize

-   Two staff members confirm the same order simultaneously.
-   Two orders attempt to consume the final unit of a variant.
-   Same public form token is submitted twice at nearly the same time.
-   Same courier booking job is delivered more than once.
-   Same webhook event is delivered repeatedly.

------------------------------------------------------------------------

# Part C --- Delivery Roadmap

## 15. Implementation Plan

The schedule below is a focused solo-developer estimate, not a
guarantee. Meta review, courier onboarding, and provider access can
extend the timeline. Validate external integrations early while building
the independent core.

### Phase 0 --- Risk validation (parallel, first few days)

**Objectives** - Confirm Meta app requirements, Page permissions,
webhook setup, review process, and messaging restrictions. - Compare
candidate courier APIs and confirm credentials, booking, tracking, COD,
and webhook/polling capabilities. - Confirm email provider and
deployment/worker hosting choices.

**Deliverables** - Integration feasibility checklist. - Chosen first
courier provider. - Meta permission/review plan. - Documented fallback
behavior if integrations are delayed.

**Exit criteria** - No critical integration assumption remains untested
or undocumented.

### Phase 1 --- Foundation and multi-tenancy (Week 1)

**Work** - Create Next.js App Router + TypeScript project. - Configure
linting, formatting, environment validation, and CI. - Provision
PostgreSQL and Prisma. - Implement User, Business, Membership. - Add
authentication and business context resolution. - Implement role/tenant
authorization helpers. - Add initial migrations and seed data.

**Deliverables** - Working login. - Create/select business workspace. -
Protected dashboard shell. - Cross-tenant authorization tests.

**Exit criteria** - A user can access only businesses they belong to.

### Phase 2 --- Catalog and inventory (Week 2)

**Work** - Product CRUD and archive. - Size/color variants, SKU, price,
and stock. - Product image storage. - Server-side validation and
business-scoped search. - Inventory audit trail or stock movement
records.

**Deliverables** - Seller can manage a clothing catalog with variants
and stock.

**Exit criteria** - Product and variant operations are tenant-safe and
tested.

### Phase 3 --- Public order forms (Week 3)

**Work** - OrderForm and FormToken models. - Secure token
generation/hash/expiry/revocation. - Public mobile form. -
Product/variant selection. - Server-side price calculation. - Submission
persistence and token consumption. - Rate limiting and
duplicate-submission prevention.

**Deliverables** - A seller can share a unique link and receive a
structured submission.

**Exit criteria** - Expired, revoked, and consumed links cannot submit;
prices cannot be manipulated by the browser.

### Phase 4 --- Submission review and orders (Week 4)

**Work** - Submission inbox and detail page. - Reject and convert
actions. - Order and OrderItem snapshots. - Order status history. -
Confirm/cancel actions. - Transactional stock reservation/decrement. -
Customer profile association and order history.

**Deliverables** - End-to-end order workflow works without external
integrations.

**Exit criteria** - Conversion and confirmation are idempotent;
concurrent confirmation and stock tests pass.

### Phase 5 --- Messenger integration (Weeks 5--6)

**Work** - Meta app setup and OAuth. - Page connection and encrypted
token storage. - Webhook verification and ingestion. - Event/message
deduplication. - Conversation/message persistence. - Basic inbox or
conversation view. - Send order-form link from a conversation. -
Policy-aware outbound messaging and error states.

**Deliverables** - Eligible seller can connect a Page and use Messenger
as the entry point to the order form.

**Exit criteria** - Webhook retries do not duplicate records; outbound
sends are blocked when policy requirements are not met.

**Risk note** - Meta approval/review can take longer than the
engineering work. Keep the public-link and order workflows functional
independently.

### Phase 6 --- Courier and notifications (Week 7)

**Work** - Define `CourierAdapter` interface. - Implement one
provider. - Queue booking jobs. - Store tracking ID and normalized
shipment status. - Implement webhook or polling synchronization. - Add
notification abstraction and delivery tracking. - Add email fallback if
configured.

**Deliverables** - Seller can book a shipment and see tracking updates.

**Exit criteria** - Duplicate jobs cannot create duplicate bookings;
failed jobs are observable and safely retryable.

### Phase 7 --- Pilot and production readiness (Week 8+)

**Work** - Dashboard metrics and operational polish. - Audit log and
access review. - Tenant isolation review. - Load/concurrency tests for
critical flows. - Backups and restore test. - Error monitoring and queue
monitoring. - Pilot onboarding and feedback. - Fix high-severity
usability and reliability issues.

**Deliverables** - Limited pilot release with documented support and
recovery procedures.

**Exit criteria** - Pilot sellers can complete the entire workflow; no
unresolved critical security or data-integrity issue remains.

## 16. Milestones and Release Gates

  -----------------------------------------------------------------------
  Milestone                           Must be true before proceeding
  ----------------------------------- -----------------------------------
  M1 --- Secure foundation            Auth, business membership, and
                                      tenant isolation tests pass.

  M2 --- Catalog ready                Product/variant/stock model and
                                      validation work.

  M3 --- Form workflow ready          Public token and submission
                                      lifecycle is secure and reliable.

  M4 --- Core order operations ready  Conversion, confirmation,
                                      inventory, and history are
                                      transactional.

  M5 --- Messenger pilot ready        OAuth/webhooks work for eligible
                                      Pages and policy checks are
                                      enforced.

  M6 --- Shipping pilot ready         One courier can book and
                                      synchronize tracking safely.

  M7 --- Pilot release                Monitoring, backups, support
                                      workflow, and critical tests are in
                                      place.
  -----------------------------------------------------------------------

## 17. MVP Definition of Done

The MVP is ready for a limited pilot when:

-   A seller can register, create a business, and manage staff access as
    applicable.
-   Seller can create products and size/color variants with stock.
-   Seller can generate a secure, expiring, single-use order link.
-   Customer can submit a complete order request from a mobile browser
    without an account.
-   Seller can review, reject, or convert the submission.
-   Seller can confirm/cancel an order with correct inventory behavior.
-   Historical order item and delivery snapshots remain stable.
-   Eligible seller can connect a Facebook Page, subject to Meta
    approval and permissions.
-   Messenger webhook events are verified and deduplicated.
-   Seller can book shipment through one courier API.
-   Tracking events update the shipment timeline.
-   Notifications are sent only through permitted, configured channels.
-   Cross-tenant access tests, concurrency tests, webhook replay tests,
    and core E2E tests pass.
-   Database backup and restore procedure is documented and tested.
-   Production logs, error monitoring, and background job monitoring are
    available.

## 18. Key Risks and Mitigations

  ------------------------------------------------------------------------
  Risk                    Impact                  Mitigation
  ----------------------- ----------------------- ------------------------
  Meta app review or      Messenger launch        Validate requirements
  permission delays       delayed.                early; keep manual link
                                                  sharing and core order
                                                  workflow usable.

  Messaging policy        Tracking/confirmation   Policy-aware channel
  restrictions            messages may not be     service; use email/SMS
                          allowed in every        fallback only with valid
                          situation.              consent/configuration.

  Courier API instability Shipment automation     Validate provider before
  or limited access       delayed or unreliable.  commitment; use adapter
                                                  boundary; queue/retry
                                                  safely.

  Duplicate form          Duplicate orders and    Single-use hashed token,
  submissions             customer confusion.     atomic consumption,
                                                  idempotent conversion.

  Overselling             Seller loses trust and  Atomic stock updates,
                          incurs operational      transaction boundaries,
                          cost.                   concurrency tests.

  Cross-tenant data       Critical security       Central tenant
  leakage                 incident.               authorization, scoped
                                                  repositories/services,
                                                  automated negative
                                                  tests.

  External API downtime   Delayed messages or     Background queues,
                          shipment updates.       retries, dead-letter
                                                  handling, manual
                                                  operator recovery.

  Scope expansion         MVP never ships.        Keep v1 exclusions
                                                  explicit; prioritize
                                                  complete core workflow
                                                  over broad feature
                                                  count.
  ------------------------------------------------------------------------

## 19. Product Metrics

Track a small set of metrics that directly reflect whether the workflow
is useful:

-   Active businesses per week.
-   Orders/forms created per business.
-   Form link open-to-submit conversion rate.
-   Submission-to-confirmation conversion rate.
-   Median time from submission to seller decision.
-   Order cancellation rate.
-   Courier booking success rate.
-   Median time from booking to first tracking event.
-   Notification success/failure rate by channel.
-   Weekly active sellers and seller retention.

Avoid collecting unnecessary personal data for analytics. Aggregate
business metrics where possible.

## 20. Open Decisions Before Implementation

These decisions should be resolved during Phase 0 or before the related
feature is built:

1.  **Courier provider:** choose one based on API access, COD workflow,
    coverage, tracking, webhook support, and commercial terms.
2.  **Meta integration scope:** decide whether v1 includes only Page
    connection + sending links, or a full basic inbox.
3.  **Notification fallback:** select an email provider and decide
    whether SMS is excluded entirely from v1.
4.  **Inventory policy:** confirm whether stock is deducted at order
    confirmation or reserved with an expiry. Recommended MVP default:
    decrement/reserve at confirmation.
5.  **Order numbering:** define a human-readable, business-scoped order
    number generated safely under concurrency.
6.  **Address fields:** decide the structured Bangladesh address fields
    required by the selected courier.
7.  **Languages:** decide whether seller dashboard is English-only
    initially and whether customer form needs Bangla at launch.
8.  **Pricing model:** define free trial, subscription tiers, and
    whether courier/notification costs are passed through. This does not
    block the core data model but affects billing design.
9.  **Data retention:** define retention for customer details, messages,
    raw webhooks, and audit logs.
10. **Prisma version:** pin Prisma 6 or Prisma 7 before writing the
    final schema and migrations; datasource configuration differs.

------------------------------------------------------------------------

## 21. Recommended First Development Sprint

Do not start by building every dashboard page. Build one secure vertical
foundation that later features can reuse.

### Sprint 1 checklist

-   [ ] Create Next.js App Router + TypeScript project.
-   [ ] Add Tailwind CSS and component system.
-   [ ] Configure PostgreSQL and Prisma with a pinned version.
-   [ ] Add environment validation.
-   [ ] Implement `User`, `Business`, and `Membership`.
-   [ ] Add authentication.
-   [ ] Implement active-business resolution.
-   [ ] Implement `requireBusinessAccess()` and role checks.
-   [ ] Add migration and seed script.
-   [ ] Add tests proving one business cannot access another business's
    records.
-   [ ] Deploy a minimal protected dashboard.

**Sprint 1 success condition:** the application has a secure
multi-tenant foundation, not merely a login screen.

## 22. Final Recommendation

Build OrderDesk as a modular monolith and prioritize the complete seller
workflow: catalog → secure customer form → submission review → order
confirmation → stock handling → one courier booking → tracking. Keep
Messenger and courier integrations behind adapters and validate their
external requirements early. The product's trustworthiness will depend
more on tenant isolation, idempotency, inventory correctness, and
reliable operational states than on having a large number of dashboard
features.

This document is the planning baseline. Before implementation, turn the
ERD into a version-pinned Prisma schema, validate provider requirements,
and convert the P0 acceptance criteria into issues and automated tests.
