# FinLend – Full Stack Loan Management System

A full-stack loan management application built with **Spring Boot, React, MySQL, and JWT Authentication**. FinLend provides a centralized platform for customers to explore loan products, submit loan applications, and manage their loans, while administrators can manage loan products, review applications, and monitor loan accounts.

## Overview

FinLend is designed to demonstrate real-world full-stack development using REST APIs, role-based access control, relational database management, and a responsive web interface.

The application supports two primary roles:

- **Customer:** Explore available loan products, apply for loans, and view personal loan information.
- **Admin:** Manage loan products, review loan applications, and manage loan accounts.

## Features

### Authentication and Authorization

- User registration and login
- JWT-based authentication
- Role-based authorization
- Admin and customer access levels
- Protected backend API endpoints
- Protected frontend routes

### Customer Features

- Customer dashboard
- Browse available loan products
- Submit loan applications
- Track submitted applications
- View personal loan accounts
- View detailed loan information
- Responsive interface for desktop and mobile devices

### Admin Features

- Admin dashboard
- Create and manage loan products
- Edit existing loan products
- Review customer loan applications
- Manage loan accounts
- View loan-related information through a centralized interface

### Financial Application Design

- Structured loan and application data
- Backend validation and business rules
- Database-backed loan records
- Separation of customer and administrative operations
- Financial safety checks in backend workflows

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React, Vite, Tailwind CSS |
| Backend | Java 17, Spring Boot 3.3.13 |
| Security | Spring Security, JWT |
| Database | MySQL |
| ORM | Spring Data JPA, Hibernate |
| API | REST APIs |
| API Documentation | Swagger / OpenAPI |
| Build Tools | Maven, npm |
| Version Control | Git, GitHub |

## System Architecture

```text
                 FinLend Application
                         |
                React + Vite Frontend
                         |
                  Axios HTTP Client
                         |
                   REST API Layer
                         |
                 Spring Boot Backend
                         |
                Spring Security + JWT
                         |
               Controllers and Services
                         |
                Spring Data JPA
                         |
                    MySQL Database
```

The frontend communicates with the Spring Boot backend using REST APIs. Spring Security handles authentication and authorization, while Spring Data JPA manages database persistence.

## Project Structure

```text
finlend-starter/
|
|-- backend/
|   |-- src/
|   |   |-- main/
|   |       |-- java/
|   |       |   |-- com/
|   |       |       |-- finlend/
|   |       |           |-- controller/
|   |       |           |-- service/
|   |       |           |-- repository/
|   |       |           |-- security/
|   |       |           |-- ...
|   |       |
|   |       |-- resources/
|   |           |-- application.properties
|   |
|   |-- .env.example
|   |-- pom.xml
|
|-- frontend/
|   |-- src/
|   |   |-- api/
|   |   |-- components/
|   |   |-- pages/
|   |   |-- ...
|   |
|   |-- package.json
|   |-- vite.config.js
|
|-- .gitignore
|-- README.md
```

## Prerequisites

Install the following tools before running the project:

- Java Development Kit (JDK) 17
- Apache Maven
- Node.js and npm
- MySQL Server
- Git
- VS Code or another preferred IDE

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/FinLend.git
cd FinLend
```

Replace `YOUR_USERNAME` with your GitHub username.

### 2. Configure the Database

Start MySQL and create the database:

```sql
CREATE DATABASE IF NOT EXISTS finlend;
```

### 3. Configure Backend Environment Variables

Navigate to the backend directory:

```bash
cd backend
```

Create a `.env` file using `.env.example` as a reference.

```dotenv
DB_URL=jdbc:mysql://localhost:3306/finlend?createDatabaseIfNotExist=true
DB_USERNAME=root
DB_PASSWORD=your_mysql_password
DDL_AUTO=update
JWT_SECRET=your_secure_base64_encoded_secret
JWT_EXPIRATION_MS=3600000
```

Generate a secure Base64 JWT secret using PowerShell:

```powershell
$bytes = New-Object byte[] 64
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$rng.GetBytes($bytes)
[Convert]::ToBase64String($bytes)
$rng.Dispose()
```

Copy the generated value into `JWT_SECRET`.

**Important:** Never commit `.env`, database passwords, or JWT secrets to GitHub.

### 4. Backend Application Configuration

The backend uses environment-based configuration through `application.properties`.

```properties
spring.application.name=finlend-api
server.port=${PORT:8082}

spring.config.import=optional:file:./.env[.properties]

spring.datasource.url=${DB_URL:jdbc:mysql://localhost:3306/finlend?createDatabaseIfNotExist=true}
spring.datasource.username=${DB_USERNAME:root}
spring.datasource.password=${DB_PASSWORD}

spring.jpa.hibernate.ddl-auto=${DDL_AUTO:validate}
spring.jpa.open-in-view=false
spring.jpa.show-sql=false

app.jwt.secret=${JWT_SECRET}
app.jwt.expiration-ms=${JWT_EXPIRATION_MS:3600000}
```

The local `.env` file is loaded when the backend is started from the `backend` directory. In deployment environments, these values should be configured using the hosting provider's environment variable settings.

### 5. Run the Backend

From the `backend` directory:

```bash
mvn spring-boot:run
```

The backend runs at:

```text
http://localhost:8082
```

API documentation:

```text
http://localhost:8082/swagger-ui/index.html
```

### 6. Install Frontend Dependencies

Open another terminal:

```bash
cd frontend
npm install
```

### 7. Run the Frontend

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

## API Configuration

The frontend uses Axios for API communication.

File: `frontend/src/api/axios.js`

```javascript
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("finlend_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;
```

For local development, the Vite proxy forwards `/api` requests to the Spring Boot backend.

For deployment, configure:

```dotenv
VITE_API_BASE_URL=https://your-backend-domain.com/api
```

## API Documentation

Swagger UI provides interactive documentation for the available backend endpoints.

Local Swagger URL:

```text
http://localhost:8082/swagger-ui/index.html
```

The APIs support operations related to:

- Authentication
- Loan products
- Loan applications
- Loan accounts
- Customer information
- Administrative workflows

Refer to Swagger for the exact endpoint paths, request bodies, and response schemas.

## Application Workflow

### Customer Workflow

1. Register or log in.
2. Access the customer dashboard.
3. Browse available loan products.
4. Select a loan product.
5. Submit a loan application.
6. Track the application.
7. View loan account details when available.

### Admin Workflow

1. Log in with an administrator account.
2. Access the admin dashboard.
3. Create or update loan products.
4. Review customer applications.
5. Perform authorized loan management operations.
6. Monitor loan accounts.

## Security

FinLend uses Spring Security and JWT-based authentication.

Key security considerations include:

- Role-based API authorization
- Protected application routes
- JWT-based access tokens
- Environment-based secret management
- Backend validation
- Restricted administrative operations

### Environment File Protection

The root `.gitignore` should include:

```gitignore
.env
.env.*
!.env.example

backend/target/
frontend/node_modules/
frontend/dist/

.idea/
.vscode/
*.log
```

A `.gitignore` file prevents new ignored files from being tracked. It does not remove secrets already committed to Git history.

## Deployment

FinLend is structured for separate frontend, backend, and database deployment.

### Backend Deployment

Deploy the Spring Boot application to a Java-compatible hosting provider.

Configure these environment variables:

| Variable | Description |
|---|---|
| `PORT` | Application port, if required by the provider |
| `DB_URL` | Cloud MySQL JDBC connection URL |
| `DB_USERNAME` | Database username |
| `DB_PASSWORD` | Database password |
| `JWT_SECRET` | Secure Base64-encoded JWT signing secret |
| `JWT_EXPIRATION_MS` | Token expiration duration |
| `DDL_AUTO` | Hibernate schema management mode |

For production, use controlled database migrations and prefer `DDL_AUTO=validate` after the schema has been initialized.

### Frontend Deployment

Build the frontend:

```bash
npm run build
```

Deploy the generated `dist` directory to a static hosting provider.

Configure:

```dotenv
VITE_API_BASE_URL=https://your-backend-domain.com/api
```

Ensure the backend CORS configuration allows requests from the deployed frontend domain.

### Database Deployment

Use a managed MySQL instance and configure secure database credentials and network access.

## Screenshots

Application screenshots can be added here after final UI verification.

Suggested screenshots:

- Login page
- Customer dashboard
- Admin dashboard
- Loan products
- Loan application form
- Loan applications management
- Loan accounts
- Loan details

## Future Enhancements

- Email notifications for loan application updates
- Repayment reminders
- Advanced loan analytics and reporting
- Audit logging and monitoring
- Automated API and integration tests
- Improved deployment observability
- Database migration tooling
- Additional security hardening

## Project Status

**Development:** Core backend and frontend features implemented.

**Deployment:** In progress.

This application is a portfolio and educational project. It is not intended to operate as a regulated lending platform without further security, compliance, testing, and operational review.

## Author

**Sambhav Raj**

Computer Science and Engineering

GitHub: [sambhavraj71](https://github.com/sambhavraj71)

## License

No open-source license has been specified yet. All rights are reserved unless a license is added to the repository.
