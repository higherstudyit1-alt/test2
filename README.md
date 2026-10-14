# Higher.study Employee Counsellor Training Platform

A secure, persistent, dynamic, college-specific training platform designed for educational counsellors at Higher.study who handle student enquiries, explain verified university details, conduct structured discovery calls, manage CRM pipelines, resolve student objections, and achieve certification.

Hosted Application: [https://higherstudyit1-alt.github.io/test2/](https://higherstudyit1-alt.github.io/test2/)

---

## 1. Project Architecture & Core Pillars

The application operates as a data-driven Single Page Application (SPA) with a persistent storage engine that synchronizes bidirectionally with Google Sheets via Google Apps Script.

### File Hierarchy
- `index.html`: Modern, responsive UI shell with navigation, role switcher, modals, and route controllers.
- `config.js`: Central configuration for Google Apps Script Web App URL and Primary Admin seeds.
- `Code.gs`: Complete Google Apps Script backend code supporting all sheets and role elevations.
- `data/collegesData.js`: Verified data for all 28 distinct institutions with campus-specific course restrictions.
- `data/trainingModulesData.js`: Exactly eight main modules, nested Counselling Process, 4 Call Handling sub-processes, and 15 complete Objection Scenarios.
- `data/questionBankData.js`: Question bank engine with honest target tracking (50 questions per module).
- `js/db.js`: Database engine managing persistence (LocalStorage) and two-way Google Sheets synchronization.
- `js/auth.js`: Multi-role authentication (Primary Admin, Admin, Manager, Employee) and session control.
- `js/quiz.js`: Mandatory quiz engine with strict answer-hiding during attempts, retakes, and Fisher-Yates shuffling.
- `js/admin.js`: 19-section Admin Dashboard for complete platform management.
- `js/manager.js`: Manager Team Portal with scoped employee visibility.
- `js/employee.js`: Employee Training Portal with expandable 8-module accordion and printable study guides.

---

## 2. Mandatory Eight Main Modules Hierarchy

Every college training plan contains these eight main modules in this exact order:

1. **Module 1: College Introduction**
   - Overview, background, official aliases, campuses, approved courses, eligibility, fees, admission procedure, accreditations (NAAC/NIRF), and talking points.
2. **Module 2: Self Introduction (Employee)**
   - Greeting, call structure, rapport building, and **Required Nested Sub-process: Counselling Process** (Academic discovery, budget evaluation, course shortlisting, parent involvement).
3. **Module 3: Call Handling**
   - Four required operational sub-processes:
     - 3.1 Lead Handling (First-hour contact rule, qualification)
     - 3.2 Follow-up Process (Structured cadence, value-addition messages)
     - 3.3 Lead Status Management (CRM workflow, notes discipline)
     - 3.4 Admission Process (Document checklists, fee guidance, verified seat allotment)
4. **Module 4: Objection Handling**
   - 15 specific student objection scenarios with 12 structured fields each (Statements, discovery questions, recommended/alternative responses, facts, practice activities).
5. **Module 5: CRM Process**
   - Higher.study CRM pipeline hygiene, lead logging, status updates, duplicate prevention, and data privacy.
6. **Module 6: Daily Reporting**
   - End-of-day activity reports, completed calls, follow-ups, confirmed admissions, and blockers.
7. **Module 7: Final Assessment**
   - Comprehensive certification assessment evaluating multi-module mastery with an 80% passing threshold.
8. **Module 8: IMP Module (Important Information & Resources)**
   - **ALWAYS MODULE 8 AND THE FINAL MODULE**: Official campus video tours, verified university links, downloadable prospectus PDFs, and auxiliary training materials.

---

## 3. Initial 28 Colleges & Alliance Campus Restrictions

All 28 entries are kept distinct in alphabetical order:

1. Aditya University
2. Alliance
3. Amity
4. Amity Online
5. Amity University
6. ASBM
7. ATLAS SkillTech
8. Bennett University
9. BGU
10. Centurion Old
11. Centurion University
12. Chandigarh University
13. CV Raman GIFT
14. CV Raman University Old
15. Dhaneshwar
16. Driems University
17. GEC Old
18. GEC University
19. GLA
20. GNIOT
21. K U
22. KJ Somaiya
23. Pearl University
24. Presidency University
25. REVA
26. SadGuru
27. UAI
28. UPES

### Alliance Campus Course Scope Enforcement (Section 5)
- **Alliance Central Campus (Anekal)**: Chikkahadage Cross, Chandapura-Anekal Main Road, Anekal, Bengaluru, Karnataka 562106. Course scope: Engineering, Law, Design, and Central Business.
- **Alliance Ascent Campus (BTM Layout)**: 19th Cross, 7th Main Road, N.S. Palya, BTM Layout 2nd Stage, Bengaluru, Karnataka 560076. **Course scope: MBA Only** (June/July batch). Other courses strictly prohibited.
- **Alliance Impact Campus (Sarjapura)**: No. 42, Near Gopasandra Gate, Muthanallur Post, Sarjapura Hobli, Anekal Taluk, Gopasandra, Bengaluru, Karnataka 560099. **Course scope: B.Com Only**. Other courses strictly prohibited.

---

## 4. Root Cause & Verified Fix for Admin-Login Issue

### Root Cause
During initial user onboarding, the account `hsadmin@gmail.com` was registered via a client form where the default role was set to `employee`. The Apps Script backend wrote `Role = employee` in the Google Sheet's `Users` tab and created an entry in `Employees`. When logging in as Admin, both the remote script and frontend checked `user.role !== requestedRole`, throwing the error:
`"This is a employee account. Choose 'Employee' above."`

### Verified Fix
1. **Frontend & DB (`js/auth.js` & `js/db.js`)**:
   - `hsadmin@gmail.com` is permanently recognized as the system **Primary Admin**.
   - During sign-in, if the backend reports `hsadmin@gmail.com` as an employee, the auth system authenticates the password against the backend and automatically elevates the user session to `role: 'admin'`, `jobRole: 'Primary Admin'`, `isPrimaryAdmin: true`, and redirects directly to `#admin`.
2. **Server-Side (`Code.gs`)**:
   - `Code.gs` auto-elevates and auto-corrects `hsadmin@gmail.com` in the `Users` sheet to `Role = admin` and `Approved = TRUE`.
   - `handleRegister` now respects the requested `role` parameter rather than forcing all new signups into `employee`.

---

## 5. Mandatory Quiz Behavior (Section 12 Compliance)

- **Zero Immediate Correctness Feedback**: No green/red indicators, no "Correct/Incorrect" labels, no explanations, and no running score while answering.
- **Neutral Progress Tracker**: Shows neutral counters like "Question 12 of 50".
- **Question Navigation**: Freely navigate between questions and modify answers before submission.
- **In-Progress Persistence**: Attempts persist across page reloads and browser restarts.
- **Confirmation Dialog**: Warns students of unanswered questions prior to submission.
- **End-of-Module Results Screen**: Displays score, percentage, correct/incorrect/unanswered counts, passing criteria, and official pass/fail encouragement messages.
- **Retake Assessment & Retake with Shuffled Questions**: Independent attempts preserved in historical records with Fisher-Yates randomization.

---

## 6. Initial User Credentials

| Role | Email | Password | Access Level |
|---|---|---|---|
| **Primary Admin** | `hsadmin@gmail.com` | `hsadmin@2026` | Full global administrative access |
| **Manager** | `manager@higher.study` | `manager@2026` | Scoped team management portal |
| **Employee** | `neha@higher.study` | `employee@2026` | Employee training portal & assessments |

---

## 7. Google Apps Script Deployment Instructions

To connect your Google Sheet to the live web application:

1. Open your Google Sheet.
2. Navigate to **Extensions > Apps Script**.
3. Replace all contents in `Code.gs` with the updated `Code.gs` file from this repository.
4. Click **Deploy > Manage Deployments > Edit** (or New Deployment).
5. Select:
   - **Type**: Web App
   - **Execute as**: Me
   - **Who has access**: Anyone
6. Copy the generated Web App URL (ending with `/exec`).
7. Paste the URL into `config.js` or in the web application's **Settings > Change Sheet URL** dialog.
