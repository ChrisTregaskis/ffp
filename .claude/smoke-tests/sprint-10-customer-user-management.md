# Sprint 10 — Customer & User Management Smoke Test

**Epic**: FFP-6 (MVP: Customer & User Onboarding)
**Covers**: FFP-494, FFP-495, FFP-496, FFP-497
**Last run**: 20th March 2026 — 9/9 journeys passed (3 bugs found and fixed during run)

## Prerequisites

- Frontend + backend running on `http://localhost:3000`
- Database has at least one customer (Sunshine Care Home)
- RLS admin bypass policies applied (`pnpm db:migrate`)
- Cognito IAM permissions configured for admin Lambda
- User logged in as system admin

## Test Journeys

### Journey 1: Customer List Page

1. Navigate to `/admin/customers`
2. Screenshot — verify table loads with "Sunshine Care Home" data
3. Verify columns: Name, Account Code, Status, Created, Actions
4. Test search — type "Sunshine", verify results filter
5. Clear search — verify all customers return
6. Test status filter — select a status, verify filtering works
7. Click "Clear All" — verify filters reset and all customers show

**Expected**: Table loads with seed customer, search and status filter work, Clear All resets to unfiltered view.

### Journey 2: Create Customer

1. Click "Create Customer" button
2. Screenshot — verify create page at `/admin/customers/create`
3. Verify context nav shows "Back to Customers"
4. Fill in customer name (e.g., "Test Physiotherapy Clinic")
5. Fill in address fields: line1, city, postcode, country
6. Click "Create Customer"
7. Screenshot — verify redirect to customer list with success toast
8. Verify new customer appears in the table

**Expected**: Form submits, customer created, redirect to list with toast.

### Journey 3: Edit Customer

1. On the customer list, click "Edit" action on "Sunshine Care Home"
2. Screenshot — verify edit page loads with pre-populated data
3. Verify name is populated as "Sunshine Care Home"
4. Verify status dropdown is visible (edit mode only)
5. Change the name (append " (Updated)")
6. Click "Save Changes"
7. Screenshot — verify redirect to list with success toast
8. Verify updated name appears in table
9. Edit the customer again and restore the original name

**Expected**: Edit form pre-populates, diff-based update works, redirect + toast.

### Journey 4: Customer Status Toggle

1. On the customer list, click "Deactivate" on a customer
2. Screenshot — verify status changes to "Inactive" with success toast
3. Click "Activate" on the same customer
4. Verify status returns to "Active"

**Expected**: Status toggle works via row actions.

### Journey 5: User List Page

1. Navigate to `/admin/users` via sidebar
2. Screenshot — verify table loads
3. Verify columns: Name, Email, Customer, Role, Created, Actions
4. Verify default filter is "Programme User" in the Roles dropdown
5. Change role filter to "All Roles" — verify all user types show
6. Change role filter to "System Admin" — verify only system admins show
7. Test search — type a partial name or email, verify results filter
8. Click "Clear All" — verify filters clear and all users show

**Expected**: Table loads, role filter defaults to Programme User, search and filter work, Clear All shows all users.

### Journey 6: Create User

1. Click "Create User" button
2. Screenshot — verify create page at `/admin/users/create`
3. Verify context nav shows "Back to Users"
4. Verify email, first name, last name, customer selector, phone, date of birth fields are present
5. Verify customer selector dropdown loads with available customers
6. Fill in: email (test-user@example.com), first name (Test), last name (User)
7. Select a customer from the dropdown
8. Fill in phone (07590000000) and date of birth (1990-01-15)
9. Click "Create User"
10. Screenshot — verify result (success redirect or Cognito error if IAM not configured)

**Expected**: Form renders with customer selector, all fields work. If Cognito IAM is configured: user created, redirect + toast. If not: clear error message about service configuration.

### Journey 7: Edit User

1. On the user list, find a user and click "Edit"
2. Screenshot — verify edit page loads with pre-populated data
3. Verify email is displayed as a disabled input (not editable)
4. Verify customer is displayed as a disabled input (not editable)
5. Change first name (append " (Updated)")
6. Click "Save Changes"
7. Screenshot — verify redirect to list with success toast
8. Verify updated name appears in table
9. Edit the user again and restore the original name

**Expected**: Edit form pre-populates, email and customer are read-only disabled inputs, diff-based update works.

### Journey 8: Navigation & Route Protection

1. Verify sidebar shows "Customers" and "Users" links
2. Click "Customers" — verify navigates to customer list
3. Click "Users" — verify navigates to user list
4. From customer create page, click "Back to Customers" context nav — verify returns to list
5. From user create page, click "Back to Users" context nav — verify returns to list
6. Navigate to `/admin/customers/non-existent-uuid` — verify error state with "Back to Customers" action

**Expected**: Sidebar navigation, context nav, and error states all work correctly.

### Journey 9: Cross-Feature — User-Customer Relationship

1. Navigate to `/admin/users`
2. Verify the "Customer" column shows customer names (not IDs)
3. Navigate to `/admin/users/create`
4. Verify customer dropdown shows customer names with account codes
5. Cancel and return to user list

**Expected**: User list shows customer names from join query, create form loads customer options.

## Reporting

After each journey, summarise:

- **Pass/Fail** for each step
- Screenshots of key states
- Any bugs or unexpected behaviour found

At the end, provide a full summary table.
