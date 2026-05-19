# MCD MERISE - Schema de la base SQLite

Ce document decrit le modele conceptuel de donnees (MCD) correspondant a la base SQLite actuelle du projet.

## Diagramme Mermaid

```mermaid
erDiagram
    USERS {
        int id PK
        string name
    }

    USER_ROLES {
        int user_id FK
        string role
    }

    HOSPITALS {
        int id PK
        string name
    }

    PHARMACIES {
        int id PK
        int hospital_id FK
        string name
    }

    CONSULTATIONS {
        int id PK
        int doctor_user_id FK
        int patient_user_id FK
        int hospital_id FK
        string consultation_reason
        string consultation_notes
        datetime consulted_at
    }

    PRESCRIPTIONS {
        int id PK
        int consultation_id FK
        string medication_name
        string dosage
        string instructions
        datetime prescribed_at
    }

    DISPENSATIONS {
        int id PK
        int prescription_id FK
        int pharmacy_id FK
        int patient_user_id FK
        datetime dispensed_at
        string notes
    }

    APPOINTMENTS {
        int id PK
        int doctor_user_id FK
        int patient_user_id FK
        int hospital_id FK
        datetime scheduled_for
        datetime booked_at
        string booking_channel
        string status
        string purpose
    }

    USERS ||--o{ USER_ROLES : possede
    HOSPITALS ||--o{ PHARMACIES : contient

    USERS ||--o{ CONSULTATIONS : docteur
    USERS ||--o{ CONSULTATIONS : patient
    HOSPITALS ||--o{ CONSULTATIONS : a_lieu_dans

    CONSULTATIONS ||--o{ PRESCRIPTIONS : donne_lieu_a

    PRESCRIPTIONS ||--o{ DISPENSATIONS : est_delivree_par
    PHARMACIES ||--o{ DISPENSATIONS : effectue
    USERS ||--o{ DISPENSATIONS : recoit

    USERS ||--o{ APPOINTMENTS : docteur
    USERS ||--o{ APPOINTMENTS : patient
    HOSPITALS ||--o{ APPOINTMENTS : programme_dans
```

## Lecture metier

- Un utilisateur peut avoir un ou plusieurs roles.
- Un hopital contient une ou plusieurs pharmacies.
- Une consultation relie un docteur, un patient et un hopital.
- Une consultation peut produire une ou plusieurs prescriptions.
- Une prescription peut donner lieu a une delivrance en pharmacie.
- Un rendez-vous relie un docteur, un patient et un hopital.

## Entites principales

- `USERS` : personnes enregistrees dans le systeme.
- `USER_ROLES` : roles portes par les utilisateurs, par exemple docteur ou patient.
- `HOSPITALS` : etablissements de sante.
- `PHARMACIES` : pharmacies rattachees a un hopital.
- `CONSULTATIONS` : consultations medicales realisees a l'hopital.
- `PRESCRIPTIONS` : ordonnances emises lors d'une consultation.
- `DISPENSATIONS` : retraits effectifs des medicaments en pharmacie.
- `APPOINTMENTS` : rendez-vous programmes pour un suivi.
