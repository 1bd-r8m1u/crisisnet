# CrisisNet: Federated Health Network Manual

## 1. System Overview
CrisisNet is a **decentralized, offline-first medical coordination platform** designed for environments where traditional infrastructure (internet, central servers, power) is compromised. 

It operates on a **Federated Mesh Architecture**:
*   **Local-First Data:** Every device (node) carries a slice of the database.
*   **Deterministic Identity:** Patients are identified by a cryptographic hash of their Name + Date of Birth. This allows medical records to be retrieved on any device without a central lookup server.
*   **Mesh Sync:** (Simulated) Devices sync data peer-to-peer when they come within range (Wi-Fi Direct / LoRa).
*   **Resilience:** The network survives even if individual nodes or hospitals go offline.

---

## 2. User Roles & Capabilities

### A. Patient (The Digital Health Wallet)
*Designed for civilians to carry their own medical history.*
*   **Registration:** Users can self-register by providing Name, DOB, Blood Type, and Allergies. A unique, permanent Mesh ID is generated instantly.
*   **Access:** Login via Name & Date of Birth (No password required, reliant on physical identity verification).
*   **Medical Packet:** View Blood Type, Allergies, Active Prescriptions, and Conditions.
*   **Voice & Audio Notes:** Patients can use Text-to-Speech to hear recent doctor notes and voice recordings read aloud, improving accessibility.
*   **QR Identity:** Generates a dense QR code containing the full JSON medical history, allowing instant data transfer to a doctor's device even with zero network connectivity.
*   **Appointments:** Request bookings which enter a "Pending" queue for doctors.
*   **Self-Reporting:** Patients can log symptoms or conditions that are flagged as "Self-Reported" for doctor review.

### B. Doctor (The Field Unit)
*Designed for rapid triage and clinical documentation.*
*   **Patient Intake:**
    *   **QR Scan:** Uses device camera to decode Patient QR and load records instantly. Supports JSON payloads for offline data transfer.
    *   **Manual Entry:** Lookup via Name/DOB or Manual ID entry if scanning fails.
    *   **Create Patient:** Doctors can register new patients on the spot, generating a permanent ID immediately.
    *   **"My Patients" List:** Pin patients to a personal dashboard for quick access during shifts.
*   **Clinical Dashboard:**
    *   **Timeline:** View chronological history of treatments, notes, and transfers.
    *   **Voice Recorder:** Record audio notes directly into the patient record for rapid documentation during trauma care.
    *   **Entry:** Log "Observations" or "Prescriptions". Prescriptions automatically update the patient's "Active Meds" list.
    *   **Status Triage:** Update patient status (Stable, Unstable, Critical, Deceased).
*   **Logistics:**
    *   **Supply Requests:** Order specific resources (e.g., Insulin, Bandages). 
        *   *Multi-Select:* Tag requests with categories (Medicine, Blood, Tools).
        *   *Patient Link:* Associate a request with a specific patient ID.
        *   *Severity:* Critical (24h), Medium (3d), Low (7d).
    *   **Patient Transfers:** Request movement of a patient to another node. Requires "Reason", "Urgency", and "Suggested Destination".
    *   **Appointment Management:** Confirm pending bookings or Postpone/Reassign them to other colleagues.

### C. Director (The Command Node)
*Designed for strategic oversight and resource allocation.*
*   **Ops Dashboard:**
    *   **Live Topology Map:** Visualizes connected hospitals, link status, and critical load (pulsing red nodes).
    *   **Resource Matrix:** A heatmap view of aggregated supplies across the entire federation (Insulin, Fuel, Blood, etc.).
    *   **Facility Status:** Detailed view of Bed Capacity, Patient Count, and Critical Cases.
*   **Network Expansion:**
    *   **Connect Node:** Directors can register new Clinics or Field Hospitals into the mesh, assigning them coordinates and expanding the coverage map.
*   **Coordination:**
    *   **Supply Chain:**
        *   *Approve:* Deducts stock from local inventory.
        *   *Broadcast:* Send request to the entire mesh.
        *   *Delegate to NGO:* Mark request as fulfilled by external aid (adds stock without decrementing local).
    *   **Cross-Border Transfers:** View and Accept/Reject patients being sent from other hospitals.
    *   **Transport Logistics:** Schedule supply runs, staff rotations, or patient transport.
*   **Staff Management:** 
    *   **Recruitment:** Add new Doctors/Nurses to the facility.
    *   **Status Tracking:** Monitor who is Available, Busy, or Unreachable.
    *   **Geo-Tagging:** View last known location of staff members.
*   **Emergency Broadcast:** Send high-priority alerts (e.g., "Mass Casualty Event") that override the UI on all connected devices.

---

## 3. Coordination Mechanics

### The Supply Chain Flow
1.  **Request:** Doctor at H100 needs "Trauma Kits". Flags as "Critical".
2.  **Review:** Director at H100 sees request.
    *   *Option A (Local):* Director approves. Stock is deducted from H100 inventory.
    *   *Option B (Broadcast):* H100 is out of stock. Director broadcasts to mesh.
3.  **Fulfillment:**
    *   Director at H102 sees broadcast. Approves transport.
    *   *Option C (NGO):* Director marks as "Delegate to NGO". Stock is injected into H100 from external source.
4.  **Delivery:** Stock arrives at H100 (Simulated via inventory increment).

### The Patient Transfer Flow
1.  **Triage:** Doctor at Field Hospital (H101) stabilizes a patient but needs surgery.
2.  **Referral:** Doctor initiates Transfer Request -> Suggested Target: "Harbor Medical (H103)".
3.  **Handshake:** Director at H103 sees incoming request in "Transfers" tab.
    *   Checks Capacity.
    *   Clicks "Accept".
4.  **Migration:** Patient record is digitally re-homed to H103. Patient GeoLocation updates to H103 coordinates.

---

## 4. Simulated Use-Case: "Operation Northwind"

**Scenario:** A seismic event has damaged infrastructure in the North Province. Hospital H100 is partially operational but overwhelmed.

**Step 1: The Event**
*   **Director (H100)** activates "Emergency Broadcast": *"SEISMIC EVENT NORTH. H100 STRUCTURAL DAMAGE. DIVERT TRAFFIC."*
*   All screens on the network flash Red with the alert.

**Step 2: Field Triage**
*   **Patient (Mira Joud)** arrives at H100. She is unconscious.
*   **Doctor (Dr. Yusuf)** finds her phone, opens CrisisNet, and scans her QR Code using the camera.
*   **Insight:** The scan reveals she has a "Latex Allergy" and is "Pregnant".
*   **Action:** Dr. Yusuf records a **Voice Note**: "Patient unconscious, BP 90/60, fetal heart rate stable."
*   **Action:** He marks her status as "UNSTABLE".

**Step 3: Resource Crunch**
*   Dr. Yusuf realizes they are out of "O- Blood".
*   He submits a **Supply Request**: Item: "O- Blood", Urgency: "Critical", Resource Type: "Blood".

**Step 4: The Network Reacts**
*   **Director (H100)** sees the request but has 0 stock. He clicks **Broadcast**.
*   **Director (H103 - Harbor Medical)**, safely in the Delta Province, sees the broadcast on the "Network Feed".
*   He checks the **Resource Matrix** and sees H103 has surplus blood.
*   He approves the request and schedules a **Transport Request** (Drone/Truck) to H100.

**Step 5: Patient Transfer**
*   Mira stabilizes, but H100 cannot perform the necessary surgery.
*   Dr. Yusuf requests **Patient Transfer** to H103.
*   Director (H103) accepts the transfer. Mira's digital record moves to H103's patient list before she even arrives physically.

**Outcome:**
The system facilitated identity verification, allergy prevention, supply restocking, and patient transfer without relying on a central server or internet connection.
