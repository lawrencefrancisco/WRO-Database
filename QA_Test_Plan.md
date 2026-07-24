# WRO Database - QA Test Plan

This document outlines the testing strategy and specific test cases for the WRO (World Robot Olympiad) Database & Management System. QA should go through each module to ensure data integrity, UI/UX consistency, and robust functionality.

## 1. Authentication & User Roles
Test the login system and ensure users only see what they are authorized to see.
- [ ] **Login/Logout**: Verify that valid credentials work and invalid credentials show appropriate error messages.
- [ ] **Session Timeout**: Ensure sessions expire securely after periods of inactivity.
- [ ] **Role-Based Access Control (RBAC)**: Verify different views and permissions for:
  - Admin (Full access)
  - Coach (Can manage their own teams, students, and payments)
  - Judge (Can input and edit scores, cannot manage teams)

## 2. Participant Management
Ensure that the core entities can be created, updated, and deleted properly.
- [ ] **Schools**: Add new schools, update details, and ensure duplicate handling works.
- [ ] **Coaches**: Register new coaches and verify they are correctly linked to their respective schools.
- [ ] **Students**: Add students. Verify birthdate/age validation (crucial for age-specific categories).
- [ ] **Teams**:
  - Create a team and assign a coach.
  - Add students to the team (verify maximum/minimum student limits per team).
  - Assign the team to a specific competition category.

## 3. Competition & Season Management
- [ ] **Seasons**: Create a new season and set it as active.
- [ ] **Competitions**: Create competitions within a season. Test start/end dates.
- [ ] **Registration Flow**: Test the opening and closing of registration periods. Verify that coaches cannot register teams past the deadline.

## 4. Judging & Awards System
This is a critical path for the event.
- [ ] **Judge Assignment**: Assign judges to specific categories or teams.
- [ ] **Score Input**: 
  - Test inputting scores as a judge.
  - Verify validation rules (e.g., scores cannot exceed the maximum allowed per criteria).
  - Attempt concurrent scoring (if multiple judges score the same team).
- [ ] **Score Calculation**: Verify that the system correctly calculates total scores, handles penalties, and ranks teams accurately.
- [ ] **Awards**: Verify that the system correctly identifies and generates award winners based on the final rankings.

## 5. Payments & Delegation
- [ ] **Invoicing**: Generate invoices for registered teams.
- [ ] **Payment Statuses**: Update payment statuses (Pending, Paid, Failed) and verify that the UI reflects these changes.
- [ ] **Access Restriction**: Ensure teams with "Pending" payments have appropriate restrictions (if applicable by business rules) compared to "Paid" teams.

## 6. Communications & Notifications
- [ ] **Announcements**: Create a global announcement and verify it appears on user dashboards.
- [ ] **Direct Emails**: Test sending direct emails to specific coaches/users. Verify delivery and template formatting.
- [ ] **Chat System**: Test real-time message delivery, read receipts, and chat history loading.
- [ ] **System Notifications**: Trigger system notifications (e.g., payment confirmed) and ensure they appear in the UI promptly.

## 7. Portals, Dashboards & UI/UX
- [ ] **Dashboard Metrics**: Verify that counts (Total Teams, Total Students, Total Revenue) calculate correctly based on the database state.
- [ ] **Responsive Design**: Test the application on various screen sizes (Desktop, Tablet, Mobile) to ensure CSS (Tailwind) behaves properly.
- [ ] **Cross-Browser Testing**: Verify core workflows on Chrome, Safari, Firefox, and Edge.
- [ ] **Form Validations**: Ensure all forms have proper client-side and server-side validation (e.g., required fields, email formatting).
- [ ] **Error Handling**: Verify that server errors (500s) or missing resources (404s) show user-friendly error pages rather than raw stack traces.

---
**Testing Notes for QA:**
- Always test edge cases (e.g., empty inputs, extremely long strings, negative numbers in score fields).
- Keep an eye on `server_log.txt` and `server_err.txt` during testing to catch any silent backend errors.
