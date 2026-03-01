# AutoClaimAI System 👾

## 🚀 Overview:
Processing insurance claims (e.g., after a car accident) can be time-consuming and error-prone. AutoClaimAI automates this process: the user uploads a photo of the damaged vehicle, and an AI service (using Google Gemini) analyzes the damage. The AI identifies damaged parts and needed repairs, and provides an estimated total cost. For example, Gemini models support multimodal input, allowing them to analyze images and extract detailed information.

## 🔑 Key Points
- Problem: Insurance claim processing is slow and requires manual inspection.
- Solution: Automated AI-driven analysis – upload an image, list damaged parts, and compute the estimated repair cost.
- Architecture: Microservices-based (Gateway, Identity, Claim, Pricing).
- Security: User passwords are hashed with BCrypt and JWT tokens are used for stateless authentication.

## Architecture and Services
The project is built as a microservices architecture with four main services:
+ Gateway Service: Serves as the API gateway using Spring Cloud Gateway. It routes incoming requests to the appropriate backend services and can serve a simple static web UI (HTML/CSS/JS).
+ Identity Service: Manages user registration and login. User passwords are hashed with BCrypt for secure storage. Upon successful login, a JWT (JSON Web Token) is issued for stateless authentication.
+ Claim Service: Implements the core business logic. Users upload a vehicle image and the Claim Service sends it to the Google Gemini API for damage analysis. Gemini models can process images along with textual prompts to generate detailed outputs. The AI’s response (including the damage report and the [TƏXMİNİ XƏRC: ...] tag) is saved in a Claim record in the database (via JPA/Hibernate).
+ Pricing Service (Future): Intended to provide spare-part pricing. In the future, the Claim Service will use Spring Cloud OpenFeign to call Pricing Service endpoints.

## Technical Implementation
The project uses Java 17 and Spring Boot (v3.5.11). Key technologies include:
+ Spring Cloud Gateway: Provides an API gateway to route requests and apply cross-cutting concerns.
+ Spring Cloud OpenFeign: A declarative REST client for inter-service communication (e.g., Claim → Pricing).
+ Spring Data JPA / Hibernate: ORM for mapping Java entities to the PostgreSQL database (e.g., Claim, and potentially Policy with a one-to-many relation).
+ AI Integration (Google Gemini): The Claim Service uses WebClient to call the Gemini generative API. Images are encoded as Base64 and sent inline. Gemini processes the combined image and text input to produce a detailed damage analysis.
+ Security: User passwords are hashed with BCrypt, and JWT tokens are generated for authentication, enabling stateless security.

## Setup and Usage
+ Prerequisites: Java 17, Maven/Gradle, and PostgreSQL must be installed.
+ Configuration: Each service has its own application.yml. Set the spring.datasource URL, username, and password for PostgreSQL. For the Claim Service, also set the gemini.api.key property with a valid API key.
+ Running the Services: Start the Gateway on port 8080, Identity on 8081, Claim on 8085, and (optionally) Pricing on 8083. The Gateway will forward requests to the appropriate service based on the path (e.g., /api/auth/** to Identity, /api/claims/** to Claim).

## API Endpoints:
+ POST /api/auth/register – Register a new user (provide JSON with username, fullName, password).
+ POST /api/auth/login – Log in a user (send username, password); returns a JWT token if successful.
+ POST /api/claims/upload – Create a new claim. This endpoint expects a multipart request with fields file (the image) and username. The response is the saved Claim object in JSON (including the AI’s damage analysis and estimated cost).
+ Authorization: Send the JWT token in the Authorization: Bearer <token> header for protected endpoints.

## 👤 Author
Kanan

GitHub:

https://github.com/Kanan-peoiks

## ⭐ If you like this project, feel free to star the repo!

