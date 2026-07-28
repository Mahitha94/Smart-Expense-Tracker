# Smart Expense Tracker Pro 📊

A professional, feature-rich personal finance management dashboard built as a College Mini Project. This repository hosts **Module 1 (Architecture & Boilerplate Structure)** which establishes a clean MVC-adjacent file structure, unified design tokens, standard includes, and database blueprints.

---

## 🛠️ Tech Stack
- **Backend:** PHP 8.x (Session management, secure auth templates, page routing)
- **Database:** MySQL (Relational tables, foreign key integrity, defaults)
- **Frontend:** Pure HTML5, CSS3 Variables, Vanilla JavaScript (Charts.js wrappers)
- **Icons:** SVG-based vector representations

---

## 📁 Project Architecture & Directory Walkthrough

```text
smart-expense-tracker-pro/
├── assets/                  # CSS styles, JS behaviors, images & media
│   ├── css/
│   │   ├── style.css        # Core reset, typography, layout & variables
│   │   ├── dashboard.css    # Dashboard grid, statistics cards
│   │   ├── login.css        # Centered auth container & split card design
│   │   ├── components.css   # Buttons, forms, tables, progress-bars & badges
│   │   └── responsive.css   # Fluid breakpoints for mobile support
│   ├── js/
│   │   ├── main.js          # Shared events (sidebar toggle, dropdowns)
│   │   ├── dashboard.js     # Dashboard interactive state
│   │   ├── expense.js       # Expense validation & filters
│   │   ├── income.js        # Income validation & source selectors
│   │   ├── budget.js        # Budget limit calculation and forms
│   │   └── charts.js        # Charts.js integration & line/donut graphs
│   ├── images/              # Custom images & avatars
│   └── icons/               # Inline SVG icon templates
├── api/                     # REST endpoints for future backend transactions
├── database/                # Database connection utilities and seeds
├── includes/                # Shared layout templates (DRY principle)
│   ├── db_connect.php       # PDO-based MySQL connector
│   ├── header.php           # Page header, styles, notifications bar
│   ├── sidebar.php          # Interactive collateral navigation links
│   ├── footer.php           # Script injections and copyright footers
│   └── auth.php             # Authentication wrappers and session guard
├── uploads/                 # Receipts files & avatar storage directory
├── pages/                   # Secondary content pages and custom lists
├── index.php                # Gateway router (Session detection / login redirect)
├── login.php                # Clean sign-in layout
├── register.php             # Secure registration fields validation template
├── dashboard.php            # Primary grid analytics dashboard
├── expenses.php             # Track expenses with tags & details
├── income.php               # Log income sources & categories
├── budget.php               # Define caps with progress gauges
├── savings.php              # Savings Goals progress bars
├── reports.php              # Multi-variant financial reporting
├── profile.php              # Personal info, credentials & avatar changer
├── settings.php             # Preferences, currency toggles & JSON backup
├── logout.php               # Clean session tear-down
└── db.sql                   # Blueprint database initialization queries
```

---

## 🚀 Getting Started with Module 1 (Local Setup)

To spin up this boilerplate on your local development machine:

### 1. Prerequisites
- **Local Server Engine:** Install [XAMPP](https://www.apachefriends.org/) (recommended), WampServer, or MAMP.
- **Database GUI:** phpMyAdmin or DBeaver.

### 2. Copying the files
1. Download the ZIP of this project from the settings menu or copy the directory.
2. Place the entire `smart-expense-tracker-pro` folder inside the webroot directory of your local server:
   - **XAMPP:** `C:\xampp\htdocs\`
   - **WampServer:** `C:\wamp64\www\`
   - **MAMP (macOS):** `/Applications/MAMP/htdocs/`

### 3. Importing the Database Schema
1. Start **Apache** and **MySQL** modules from your server controller panel.
2. Open your browser and navigate to `http://localhost/phpmyadmin/`.
3. Create a new database named `smart_expense_tracker`.
4. Go to the **Import** tab, browse and select the `db.sql` file located in the root of the project, then click **Go** / **Import**.

### 4. Configuration
- Open `includes/db_connect.php` in a code editor.
- Update your database credentials (username/password) if they differ from XAMPP defaults (`root` with empty password).

### 5. Running the Application
- Open your browser and head to: `http://localhost/smart-expense-tracker-pro/`
- The system will detect your session status and automatically route you through `index.php` to `login.php`.

---

## 🎯 What is Delivered in Module 1?
1. **Fully Scaffolded Architecture:** Every folder and file listed in the project scope has been physically created and structured with elegant, consistent spacing and professional coding conventions.
2. **Beautiful Design Core:** Standard typography styles (`Inter` and `JetBrains Mono`) have been mapped, combined with fluid layout calculations.
3. **Database Blueprint:** The `db.sql` contains a robust database layout including relational integrity (`foreign keys`), default categories, and auto-timestamps.
4. **Interactive Mock Interface:** All placeholder files feature highly polished layout segments (cards, stat-blocks, tables, forms, navs) with dummy content.
