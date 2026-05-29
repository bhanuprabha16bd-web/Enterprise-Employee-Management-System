# Enterprise Employee Management System

A full-stack Enterprise Employee Management application featuring a modern React frontend and a FastAPI backend with SQLite persistence.

## 🚀 Features

- **Robust Authentication**: JWT-based login and role-based access control (Admin vs User).
- **Analytics Dashboard**: Interactive charts (Chart.js) with real-time computed statistics (Total Employees, Active Employees, Departments count) and visual distribution of departments and statuses.
- **CRUD Operations**: Complete Create, Read, Update, and Delete flows for Employees and Departments.
- **Dynamic Theming**: Built-in Dark/Light mode utilizing CSS variables and React Context.
- **Modern UI**: Designed with a premium aesthetic featuring glassmorphism, responsive grid layouts, and smooth animations.

## 🏗️ Architecture & Component Structure

### Frontend (React + Vite)
- **`src/components/layout`**: Contains `MainLayout`, `Header`, and `Sidebar`. Handles the main responsive shell of the application.
- **`src/context`**: `AuthContext` manages global authentication state (login/logout). `ThemeContext` manages global dark/light mode toggle.
- **`src/pages`**: 
  - `Dashboard`: Pulls data from services to compute overall analytics and visualize them via Chart.js.
  - `Login` & `Welcome`: Unprotected routes serving as the entry point and authentication gateway.
  - `Employees`, `Departments`, `Attendance`, `Settings`: Protected routes showcasing CRUD data tables.
- **`src/services`**: API logic wrapped around Axios with interceptors to automatically attach the JWT token.
- **`src/routes`**: Centralized routing using `react-router-dom`, featuring a `ProtectedRoute` wrapper for authenticated access.

### Backend (FastAPI + SQLAlchemy)
- **`app/models`**: SQLAlchemy ORM definitions mapping to SQLite tables.
- **`app/routes`**: API endpoints separated by domain (e.g., `user_routes`, `employee_routes`, `department_routes`).
- **`app/controllers`**: Business logic handling the actual database queries and interactions.
- **`app/auth.py`**: JWT token creation, password hashing (bcrypt), and dependency injection for protected routes.
- **`app/database`**: SQLite connection configuration.

## 🔄 Data Flows

### Authentication Flow
1. User enters credentials on the `Login` page.
2. Frontend posts to `POST /users/login`.
3. Backend verifies password hash and returns a JWT access token.
4. Frontend `AuthContext` decodes the token payload, stores it in `localStorage`, and updates state.
5. All subsequent requests go through `api.js` which attaches `Authorization: Bearer <token>`.

### CRUD Flow
1. User interacts with a Data Table (e.g., clicking "Add Employee").
2. The component calls a function from `employeeService.js`.
3. An Axios request is sent to the FastAPI backend (e.g., `POST /employees/`).
4. The backend controller inserts data using SQLAlchemy.
5. The frontend re-fetches the list and updates the state.

## 🛠️ How to Run Locally

### 1. Backend Setup
```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
python run.py
```
*The backend will run on `http://localhost:8000`.*

### 2. Frontend Setup
```bash
cd Frontend
npm install
npm run dev
```
*The frontend will run on `http://localhost:5173`.*

## 🌟 Future Enhancements
- Expand the Attendance module with backend persistence.
- Connect settings preferences to user profiles.
- Implement pagination for large datasets in the backend controllers.
