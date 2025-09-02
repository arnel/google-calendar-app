# Google Calendar App

A fullstack TypeScript application that integrates with Google Calendar API to display and manage events.

## Prerequisites

- Docker and Docker Compose
- Google Cloud account with Calendar API enabled

## Setup Instructions

To run the code

- docker-compose up --build

Add all required ENV variables

##### /backend/.env

- JWT_SECRET
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET

##### /frontend/.env

- VITE_GOOGLE_CLIENT_ID
