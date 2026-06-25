# Recall 📊
### Centralized Feedback & Analytics Platform for the Computer Science Association (CSA), RIT Kottayam

**Recall** is a professional, high-performance web application designed for the Computer Science Association (CSA) at RIT Kottayam. It replaces fragmented, ad-hoc feedback collection tools (like Google Forms) with a centralized, persistent system to record, analyze, and archive feedback for all association events—including workshops, bootcamps, hackathons, and technical talks.

---

## 📖 Table of Contents

1. [Project Motivation](#-project-motivation)
2. [Key Features](#-key-features)
3. [Tech Stack](#-tech-stack)
4. [Firestore Database Schema](#-firestore-database-schema)
5. [Architecture & System Flows](#-architecture--system-flows)
   - [Administrative Authentication Flow](#administrative-authentication-flow)
   - [Questionnaire Integrity (Signatures)](#questionnaire-integrity-signatures)
   - [Excel / CSV Export Flow](#excel--csv-export-flow)
6. [Directory Structure](#-directory-structure)
7. [Installation & Local Setup](#-installation--local-setup)
8. [Firebase Console & Security Rules Configuration](#-firebase-console--security-rules-configuration)
9. [Deployment](#-deployment)
10. [Maintainability & Handover Guide](#-maintainability--handover-guide)

---

## 🎯 Project Motivation

The current reliance on individual-led feedback loops (primarily Google Forms) introduces three critical failure points:
* **Access Fragmentation:** Responses are visible only to the form creator. Sharing access is manual, leading to data siloing and lost insights.
* **Institutional Memory Loss:** When a new Executive Committee (Excom) takes charge, there is no permanent archive of past events, feedback, or operational issues. Every new committee starts blind.
* **Lack of Automated Analytics:** Raw spreadsheet data requires manual parsing. There is no automated, recurring visualization of ratings, option selections, or qualitative sentiment.

**Recall** resolves these issues by establishing a centralized dashboard accessible to all authenticated CSA members, preserving event archives across handovers, and generating real-time analytics with exportable data options.

---

## ✨ Key Features

* **📅 Event Dashboard:** Unified dashboard listing all events (workshops, hackathons, bootcamps, etc.) sorted chronologically, displaying active status and total response counts.
* **🛠️ Drag-and-Drop Questionnaire Builder:** Dynamic form builder supporting four question types: `single_choice` (radio), `mcq` (checkbox), `short_text` (textarea), and `star_rating`. Powered by `@hello-pangea/dnd` for smooth, touch-responsive reordering.
* **🔒 Auto-Locking Safety:** The questionnaire builder automatically locks once an event receives its first response, preventing structural database mismatches.
* **🛡️ Questionnaire Integrity Protection:** Leverages a custom hashing mechanism to generate a signature for each form state. Submissions are rejected if the participant's form state does not match the active server configuration.
* **📊 Live Analytics & Visualization:** Interactive analytics using [Recharts](https://recharts.org/):
  - **Single Choice:** Rendered as colorful Pie Charts.
  - **Multiple Choice (MCQ):** Visualized as Horizontal Bar Charts with multi-select labels.
  - **Star Ratings:** Averages and star distributions.
  - **Short Text:** Searchable, scrollable lists sorted by submission time.
* **📥 Client-Side Excel/CSV Export:** Enables administrators to download event response data instantly. Generates clean, structured, and properly-escaped spreadsheet reports directly in the browser as a `.csv` file (fully compatible with Microsoft Excel and Google Sheets) containing respondent details, timestamps, and corresponding answers.
* **🔑 Hybrid Cookie-Based Auth:** Combines client-side Firebase Auth with secure, server-side HTTP-Only session cookies verified by Next.js Middleware.
* **🌀 Premium Visual Interface:** Built with a curated dark color palette, custom glassmorphism components, and a fluid 3D Three.js particle background (`PixelBlast`) that adds a premium feel.

---

## 💻 Tech Stack

| Layer | Choice | Reason |
| :--- | :--- | :--- |
| **Framework** | Next.js 16 (App Router) | React Server Components, server-side API routes, and optimized assets. |
| **Runtime** | React 19 | Standardized DOM rendering and async state handlers. |
| **Styling** | Tailwind CSS v4 & PostCSS | Rapid utility styling paired with modern CSS variables. |
| **Database** | Cloud Firestore (NoSQL) | Real-time nested document storage, highly scalable, and flexible. |
| **Auth** | Firebase Authentication | Secure, managed authentication for internal members. |
| **Admin Operations** | Firebase Admin SDK | Bypasses standard rules securely in serverless endpoints. |
| **Charts** | Recharts | Canvas-free, SVG-based declarative charting library. |
| **Visual Effects** | Three.js & Postprocessing | Renders high-performance interactive 3D particle backgrounds. |

---

## 🗄️ Firestore Database Schema

Firestore stores data in a hierarchical collection-document structure. Below is the nested design used in Recall:

```
events/                                  [Root Collection]
  ├── {eventId}/                         [Document: Event Metadata]
  │     ├── title: string
  │     ├── description: string | null
  │     ├── start_date: string           (ISO Date YYYY-MM-DD)
  │     ├── end_date: string             (ISO Date YYYY-MM-DD)
  │     ├── event_type: string           ("Workshop" | "Bootcamp" | "Hackathon" | "Technical Talk" | "Other")
  │     ├── is_published: boolean
  │     ├── created_at: string           (ISO Timestamp)
  │     │
  │     ├── questions/                   [Subcollection: Form Structure]
  │     │     └── {questionId}/          [Document: Question Configuration]
  │     │           ├── question_text: string
  │     │           ├── question_type: string  ("single_choice" | "mcq" | "short_text" | "star_rating")
  │     │           ├── options: string[] | null
  │     │           ├── order_index: number
  │     │           └── is_required: boolean
  │     │
  │     └── responses/                   [Subcollection: Submissions]
  │           └── {responseId}/          [Document: Respondent Header]
  │                 ├── respondent_token: string   (Client-side UUID for deduplication)
  │                 ├── respondent_name: string    (Optional)
  │                 ├── questionnaire_signature: string
  │                 ├── submitted_at: string       (ISO Timestamp)
  │                 │
  │                 └── answers/         [Subcollection: Submitted Values]
  │                       └── {questionId}/   (Document ID matches Question Document ID)
  │                             └── answer_value: string | string[] | number
```

> [!NOTE]
> Nesting `answers` inside a `responses` document allows the system to read a full submission in a single database read, while naming answer document IDs after their corresponding `questionId` optimizes per-question analytics aggregation.

---

## 🔄 Architecture & System Flows

### Administrative Authentication Flow

Recall uses a split authentication guard to maintain a secure admin boundary while enabling unauthenticated responses:

```mermaid
sequenceDiagram
    participant Browser as Admin Browser
    participant Context as AuthContext
    participant Server as Next.js API (/session)
    participant SDK as Firebase Auth SDK
    participant MW as Middleware (Edge)

    Browser->>SDK: Login(email, password)
    SDK-->>Browser: Return UserCredential & ID Token
    Browser->>Context: State Change Detected
    Context->>Server: POST /api/session { token }
    Server-->>Browser: Set HTTP-Only '__session' Cookie
    Note over Browser, MW: Subsequent Navigation to /dashboard
    Browser->>MW: Request Page
    alt Has Valid Cookie
        MW-->>Browser: Render Dashboard (200)
    else No Cookie / Invalid
        MW-->>Browser: Redirect to /login (307)
    end
```

### Questionnaire Integrity (Signatures)

When a questionnaire is built or updated, it has a cryptographic signature based on its structural layout (question texts, types, order, requirements, options). This signature is validated on response submission to prevent data pollution if an admin changes questions while a user is answering:

1. **Signature Generation:** Normalized fields are hashed using a `djb2` implementation:
   ```ts
   // lib/questionnaire-signature.ts
   function hashString(value: string) {
     let hash = 5381;
     for (let i = 0; i < value.length; i++) {
       hash = (hash * 33) ^ value.charCodeAt(i);
     }
     return (hash >>> 0).toString(36);
   }
   ```
2. **Validation Route:** During `POST /api/submit-response`:
   - Fetch active questions from Firestore.
   - Recompute the signature.
   - Compare the server-side signature with the payload's `questionnaire_signature`.
   - If they mismatch, return `409 Conflict` (Code: `QUESTIONNAIRE_CHANGED`), forcing the participant browser to reload.

### Excel / CSV Export Flow

Recall simplifies feedback retrieval by generating and compiling data client-side with zero external cloud dependencies or API authorization overhead. When an administrator clicks the **"Save as Excel"** button:

```mermaid
sequenceDiagram
    participant Admin as Administrator
    participant Browser as Browser (Client)
    participant DB as Firestore
    Admin->>Browser: Click "Save as Excel"
    Browser->>DB: Fetch Responses & Answers for Event
    Browser->>Browser: Construct CSV Headers (Timestamp, Name, Token, Questions...)
    Browser->>Browser: Iterate responses & map answers to columns
    Browser->>Browser: Sanitize content & escape double quotes
    Browser->>Browser: Generate CSV Blob with UTF-8 encoding
    Browser->>Browser: Trigger file download: recall-[event-title]-responses.csv
    Browser-->>Admin: Download completed
```

The exported spreadsheet file matches standard tabular structures:
- **Columns:** Map out Respondent metadata (Submitted Timestamp, Respondent Name, Token) followed by each question defined in the questionnaire.
- **Rows:** A separate entry for each submitted response.
- **Cell Values:** Raw text strings, numbers, or semi-colon-separated lists (for multiple choice questions).

---

## 📁 Directory Structure

```
recall/
├── app/                                 # Next.js App Router Pages & API Routes
│   ├── (portal)/                        # Administrative Authenticated Layout
│   │   ├── dashboard/                   # Event list & creation entry point
│   │   └── events/                      # Event details, builders, and statistics
│   │       ├── new/                     # Event metadata creator
│   │       └── [event-id]/
│   │           ├── builder/             # Drag-and-drop questionnaire editor
│   │           └── responses/           # Analytics charts and exports
│   ├── api/                             # Backend Endpoints
│   │   ├── export-responses-to-sheets/  # Unused legacy endpoint (Excel downloads are client-side)
│   │   ├── ping/                        # Keeping database active (cron target)
│   │   ├── session/                     # HTTP-Only cookie injector/remover
│   │   └── submit-response/             # Validated public response receiver
│   ├── login/                           # Administrator login panel
│   ├── reset-password/                  # Re-authentication password gate
│   ├── respond/[event-id]/              # Public participant response form
│   ├── globals.css                      # Global styles and Tailwind layout
│   ├── layout.tsx                       # Root layout & providers (Auth, Theme)
│   └── middleware.ts                    # Edge protection middleware
├── components/                          # React Components
│   ├── ui/                              # Core design system components
│   │   ├── Button.tsx                   # Customized primary/secondary action handlers
│   │   ├── Card.tsx                     # Content containers with custom glassmorphism
│   │   ├── Input.tsx / Select.tsx       # Pre-styled visual inputs
│   │   ├── NavBar.tsx                   # Site headers and navigation controls
│   │   ├── PixelBlast.tsx               # Three.js 3D dynamic particle background
│   │   └── Spinner.tsx                  # Pre-styled visual loaders
│   ├── AnalyticsCharts.tsx              # Recharts visualization selector
│   ├── ParticipantForm.tsx              # Public questionnaire renderer & validator
│   ├── ParticipantLinkShare.tsx         # Copy-to-clipboard invite links
│   └── QuestionnaireBuilder.tsx         # Form layout configurator
├── lib/                                 # Core Utilities & Library Wrappers
│   ├── auth.ts                          # Firebase Auth abstraction layer
│   ├── AuthContext.tsx                  # Client context listener
│   ├── db-admin.ts                      # Server-side Firestore operations (Firebase Admin)
│   ├── db.ts                            # Client-side Firestore operations (Firestore SDK)
│   ├── firebase-admin.ts                # Firebase Admin SDK initializer
│   ├── firebase.ts                      # Client Firebase SDK initializer
│   ├── questionnaire-signature.ts       # Hashing helper
│   └── types.ts                         # Global TypeScript type contracts
```

---

## 🚀 Installation & Local Setup

### Prerequisites
* Node.js v22.x
* npm v10.x
* A Firebase Project (with Firestore and Email/Password Sign-In enabled)

### 1. Clone the repository and install dependencies
```bash
git clone https://github.com/kevinjose06/Recall.git
cd Recall
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file in the root directory:
```env
# Client Firebase Keys (Publicly accessible in client bundles)
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Server-Side Firebase Admin Secret (Keep private)
# Escape double quotes inside the private key string or paste the service account JSON on a single line
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"your-project-id","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-...@your-project-id.iam.gserviceaccount.com",...}
```

### 3. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser.

---

## 🔒 Firebase Console & Security Rules Configuration

To keep the platform's backend secure while allowing unauthenticated form submissions, configure Cloud Firestore with the following security schema in the **Rules** tab:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper: Checks if the request is from an authenticated administrator
    function isAdmin() {
      return request.auth != null;
    }

    match /events/{eventId} {
      // Events can only be read or written by administrators
      allow read, write: if isAdmin();

      match /questions/{questionId} {
        // Form questions are only manageable by administrators
        allow read, write: if isAdmin();
      }

      match /responses/{responseId} {
        // Anyone can submit a response container (required for public forms)
        allow create: if true;
        // Only administrators can view submitted responses
        allow read: if isAdmin();

        match /answers/{questionId} {
          // Anyone can submit individual answer records
          allow create: if true;
          // Only administrators can read individual answer records
          allow read: if isAdmin();
        }
      }
    }
  }
}
```

---

## 🌐 Deployment

### 1. Hosting on Vercel
Recall is fully compatible with [Vercel](https://vercel.com).
* Link your repository to Vercel.
* Add all variables in the `.env.local` file to the **Environment Variables** tab in your Vercel project settings.
* Trigger a production build.

### 2. Keep-Alive Strategy (Supabase/Firebase Idle Prevention)
Although Cloud Firestore has no inactivity pause, any external components or microservices (e.g. Supabase instances integrated in adjacent projects) might sleep. A keepalive route is available at `/api/ping`.
You can configure a periodic health check via [cron-job.org](https://cron-job.org) targeting `https://<your-vercel-domain>/api/ping` every 5 days to ensure adjacent services stay active.

---

## 👥 Maintainability & Handover Guide

To ensure future Executive Committees can take over operations seamlessly, follow this protocol:

* **🔐 Password Rotation:**
  - Administrative accounts use a shared login (`csa@ritkerala.ac.in` or similar).
  - Rotation must occur **once per year** during the leadership transition.
  - The outgoing Tech Lead must update the password directly via the **Firebase Console** (Authentication -> Users -> Reset Password).
  - The incoming Tech Lead should change the password in-app at `/reset-password` after proving knowledge of the current credentials.
  - Distribute the new password securely via official college emails (never via messaging applications).
* **📈 Firebase Admin SDK Permissions:**
  - Ensure that the service account JSON defined in the `FIREBASE_SERVICE_ACCOUNT_JSON` environment variable has the necessary permissions to access your Firestore database (e.g., **Firebase Admin SDK Administrator Service Agent** or **Editor** role on the project).

---
*Created and maintained by the Computer Science Association (CSA), RIT Kottayam.*
