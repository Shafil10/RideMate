# RideMate — Use Case Diagram (Whole App)

Covers current (Sprint 1–2) and planned (Sprint 3–7) functionality. Renders natively on GitHub.

```mermaid
flowchart LR
    Student([Student / Rider])
    Driver([Student Driver])
    Admin([Admin])
    Support([Human Support Agent])

    subgraph System["RideMate System"]
        UC1((Register / Login))
        UC2((Create Ride))
        UC3((Search & Browse Rides))
        UC4((Join Ride))
        UC5((View Fare Split))
        UC6((Chat with AI Helpline))
        UC7((Escalate to Human Support))
        UC8((Rate & Review Ride))
        UC9((View Trust / Safety Score))
        UC10((Get AI Route Match & Fare Recommendation))
        UC11((Manage Users & Rides))
    end

    Student --> UC1
    Student --> UC3
    Student --> UC4
    Student --> UC5
    Student --> UC6
    Student --> UC8
    Student --> UC9
    Student --> UC10

    Driver --> UC1
    Driver --> UC2
    Driver --> UC5
    Driver --> UC6
    Driver --> UC8
    Driver --> UC9

    UC6 --> UC7
    UC7 --> Support

    Admin --> UC11
```

**Notes**
- `UC1` (Register/Login) and `UC11` (Manage Users & Rides) land in Sprint 3.
- `UC6`/`UC7` (AI Chatbox Helpline + human escalation) are the Sprint 1–2 focus, rule-based now, real-LLM upgrade in Sprint 4.
- `UC10` (AI route match & fare recommendation) covers the originally-listed AI matching features, deferred to Sprint 5–6.
