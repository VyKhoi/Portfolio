# Microservices Specifications

This document outlines the responsibilities of each .NET 9 backend component.

## 1. Gateway.API
- **Role**: Entry point for all API requests from the frontend.
- **Tech**: Yarp.ReverseProxy.
- **Features**: Rate limiting, CORS, request routing. Routes `/identity/{**catch-all}` to Identity Service and `/api/{**catch-all}` to Content/Contact Services.

## 2. Identity.Service
- **Role**: Handles user authentication, authorization, and audit logging.
- **Stack**: ASP.NET Core Web API, Entity Framework Core, JWT.
- **Entities**: `User` (Id, Username, PasswordHash, Role), `AuditLog`.
- **Endpoints**: `/identity/login`, `/identity/register`.

## 3. Content.Service
- **Role**: Core business logic for managing portfolio data.
- **Stack**: ASP.NET Core Web API, CQRS (MediatR), Redis (Caching), MinIO (Blob storage).
- **Entities**: 
  - `Project` (Id, Title, Description, TechStack, ImageUrl, GitHubUrl, LiveUrl).
  - `Skill` (Id, Name, Category, ProficiencyLevel).
- **Caching**: Queries (e.g., Get All Projects) are cached in Redis to handle high read loads from the public site.

## 4. Contact.Service
- **Role**: Receives contact form submissions.
- **Stack**: ASP.NET Core Web API, Kafka Producer.
- **Entities**: `ContactMessage` (Id, SenderName, SenderEmail, Subject, Content, IsRead, CreatedAt).
- **Flow**: Saves message to Postgres -> Publishes `contact_submitted` event to Kafka topic.

## 5. Notification.Worker
- **Role**: Background processor acting on events and scheduled tasks.
- **Stack**: Worker Service, Confluent.Kafka (Consumer), MailKit, Hangfire, SignalR.
- **Workflows**:
  - **Kafka Consumer**: Listens to `contact_submitted`.
  - **Email**: Uses MailKit to send an acknowledgment email to the sender and an alert to the admin (via Mailpit locally).
  - **SignalR**: Pushes a real-time notification to the connected Admin Dashboard to update the Inbox badge.
  - **Hangfire**: Scheduled job runs daily to clean up read messages older than 30 days.
