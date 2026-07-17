# RideMate — Sequence Diagram (Core End-to-End Flow)

Covers the primary runtime flow tying the whole app together: browsing/joining a ride and using the AI Chatbox Helpline. Renders natively on GitHub.

```mermaid
sequenceDiagram
    actor Student
    participant FE as Frontend (React)
    participant API as Backend API (Express)
    participant DB as Ride Store
    participant Bot as Chatbot Engine
    participant LLM as AI/LLM Service (Sprint 4+)
    actor Support as Human Support Agent

    Student->>FE: Open RideMate, go to "Find a Ride"
    FE->>API: GET /api/rides
    API->>DB: fetch rides
    DB-->>API: ride list
    API-->>FE: 200 OK (rides)
    FE-->>Student: render ride list

    Student->>FE: Click "Join" on a ride
    FE->>API: POST /api/rides/:id/join
    API->>DB: increment seatsTaken
    DB-->>API: updated ride
    API-->>FE: 200 OK (ride)
    FE-->>Student: show confirmed seat

    Student->>FE: Open chatbox, ask a question
    FE->>API: POST /api/chatbot/message
    API->>Bot: getChatbotReply(message)
    alt Sprint 1-2 (current)
        Bot-->>API: rule-based reply
    else Sprint 4+ (planned)
        Bot->>LLM: forward message + conversation context
        LLM-->>Bot: generated reply
        Bot-->>API: AI-generated reply
    end
    API-->>FE: 200 OK (reply)
    FE-->>Student: show bot reply

    opt Bot can't resolve the question
        Bot-->>API: escalate flag
        API-->>Support: notify support queue (planned)
        Support-->>Student: follow up
    end
```
