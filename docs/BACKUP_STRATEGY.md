# NEXORA ARENA — Database Backup & Disaster Recovery Strategy

## 1. Overview & Objectives
NEXORA ARENA stores competitive tournament brackets, player Elo ratings, immutable audit hashes, and dispute dossiers. The backup architecture ensures continuous zero-trust integrity, non-repudiation of competitive match results, and rapid recovery from outages.

- **Recovery Point Objective (RPO)**: < 1 minute (via continuous write-ahead logging and Point-in-Time Recovery).
- **Recovery Time Objective (RTO)**: < 15 minutes (automated container restart and cold-storage restoration).

---

## 2. Backup Tiers & Schedule

### Tier 1: Continuous Point-in-Time Recovery (PITR)
- **Engine**: Google Cloud Firestore PITR / Cloud SQL WAL archiving.
- **Retention**: Continuous 7-day rolling window with recovery granularity down to the exact second.
- **Use Case**: Accidental bulk document deletion, bad migration script rollback, or real-time state corruption.

### Tier 2: Automated Daily Scheduled Exports
- **Execution**: Google Cloud Scheduler triggering Cloud Function export daily at `02:00 UTC`.
- **Destination**: Dual-region Google Cloud Storage (GCS) Coldline bucket (`gs://nexora-arena-backups-prod`).
- **Encryption**: Customer-Managed Encryption Keys (CMEK) via Google Cloud KMS (AES-256).
- **Lifecycle Rule**:
  - Days 1–30: Standard / Nearline storage.
  - Days 31–365: Coldline storage.
  - After 365 days: Archive / Expire according to GDPR telemetry minimization policy.

### Tier 3: Cryptographic Audit Ledger Sealing
- **Mechanism**: Every completed match generates an immutable cryptographic hash (`AUTH-NEXORA-...`) binding:
  `MatchID | Player1_ID:Score | Player2_ID:Score | Winner_ID | ServerTimestamp`
- **Tamper Evidence**: Match results stored in the append-only `auditLogs` and `matchResults` collections cannot be updated by any client token (`allow update, delete: if false;`).

---

## 3. Disaster Recovery (DR) Runbook

### Scenario A: Accidental Data Corruption or Bad Batch Write
1. Identify the timestamp of the corruption event `T_CORRUPT`.
2. Access Google Cloud Console -> Firestore -> Database -> Point in time recovery.
3. Select recovery point `T_RECOVERY = T_CORRUPT - 60s`.
4. Restore to isolated staging database `nexora-dr-restore`.
5. Validate participant seeds, Elo ratings, and active tournament brackets.
6. Swap production database pointer or export/import affected collections.

### Scenario B: Cloud Region Outage
1. Container image is replicated in multi-region Artifact Registry (`asia-southeast1` and `us-central1`).
2. Traffic Director / Cloud Load Balancing automatically routes traffic to secondary Cloud Run instance.
3. Firestore multi-region configuration maintains quorum across dual regions with zero manual intervention.

---

## 4. Periodic Backup Verification & Drills
- **Frequency**: Monthly automated restoration test in staging environment.
- **Verification Criteria**:
  - All 19 entity collections restored with matching document counts.
  - Cryptographic audit hashes re-verified against restored match event rows.
  - User Elo ratings and tournament standings match pre-backup checksums.
