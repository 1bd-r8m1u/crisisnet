# CrisisNet: Federated Health Network Manual

## 1. System Overview
CrisisNet is a **decentralized, offline-first medical coordination platform** designed for environments where traditional infrastructure (internet, central servers, power) is compromised. 

It operates on a **Federated Mesh Architecture**:
*   **Local-First Data:** Every device (node) carries a slice of the database.
*   **Deterministic Identity:** Patients are identified by a cryptographic hash of their Name + Date of Birth. This allows medical records to be retrieved on any device without a central lookup server.
*   **Mesh Sync:** (Simulated) Devices sync data peer-to-peer when they come within range (Wi-Fi Direct / LoRa).

---

## 2. User Roles & Capabilities

### A. Patient (The Digital Health Wallet)
*Designed for civilians to carry their own medical history.*
*   **Access:** Login via Name & Date of Birth (No password required, reliant on physical identity verification).
*   **Medical Packet:** View Blood Type, Allergies, Active Prescriptions, and Conditions.
*   **Self-Reporting:** Patients can log symptoms or conditions (e.g., "Flu symptoms") which appear as "Self-Reported" notes for doctors.
*   **QR Identity:** Generates a dense QR code containing the full JSON medical history, allowing instant data transfer to a doctor's device even with zero network connectivity.
*   **Appointments:** Request bookings which enter a "Pending" queue for doctors.

### B. Doctor (The Field Unit)
*Designed for rapid triage and clinical documentation.*
*   **Patient Lookup:**
    *   **QR Scan:** Uses device camera to decode Patient QR and load records instantly.
    *   **Manual Entry:** Lookup via Name/DOB.
*   **Clinical Dashboard:**
    *   **Timeline:** View chronological history of treatments, notes, and transfers.
    *   **Entry:** Log "Observations" or "Prescriptions". Prescriptions automatically update the patient's "Active Meds" list.
    *   **Status Triage:** Update patient status (Stable, Unstable, Critical, Deceased).
*   **Logistics:**
    *   **Supply Requests:** Order specific resources (e.g., Insulin, Bandages). 
        *   *Internal:* Goes to local Director.
        *   *Severity:* Critical (24h), Medium (3d), Low (7d).
    *   **Patient Transfers:** Request movement of a patient to another node. Requires "Reason", "Urgency", and "Suggested Destination".
    *   **Appointment Management:** Confirm or Postpone pending patient bookings.

### C. Director (The Command Node)
*Designed for strategic oversight and resource allocation.*
*   **Ops Dashboard:**
    *   **Live Topology Map:** Visualizes connected hospitals, link status, and critical load (pulsing red nodes).
    *   **Resource Matrix:** A heatmap view of aggregated supplies across the entire federation (Insulin, Fuel, Blood, etc.).
*   **Coordination:**
    *   **Incoming Requests:** Approve supply orders (deducts from local inventory) or Broadcast them to the network.
    *   **Cross-Border Transfers:** View and Accept/Reject patients being sent from other hospitals.
    *   **Transport Logistics:** Schedule supply runs, staff rotations, or patient transport.
*   **Staff Management:** Recruit new staff, monitor check-ins, and view active duty status.
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
    *   *OR* External NGO node sees broadcast. Marks as "Delegated to NGO".
4.  **Delivery:** Stock arrives at H100 (Simulated via inventory increment).

### The Patient Transfer Flow
1.  **Triage:** Doctor at Field Hospital (H101) stabilizes a patient but needs surgery.
2.  **Referral:** Doctor initiates Transfer Request -> Suggested Target: "Harbor Medical (H103)".
3.  **Handshake:** Director at H103 sees incoming request in "Transfers" tab.
    *   Checks Capacity.
    *   Clicks "Accept".
4.  **Migration:** Patient record is digitally re-homed to H103.

---

## 4. Simulated Use-Case: "Operation Northwind"

**Scenario:** A seismic event has damaged infrastructure in the North Province. Hospital H100 is partially operational but overwhelmed.

**Step 1: The Event**
*   **Director (H100)** activates "Emergency Broadcast": *"SEISMIC EVENT NORTH. H100 STRUCTURAL DAMAGE. DIVERT TRAFFIC."*
*   All screens on the network flash Red with the alert.

**Step 2: Field Triage**
*   **Patient (Mira Joud)** arrives at H100. She is unconscious.
*   **Doctor (Dr. Yusuf)** finds her phone, opens CrisisNet, and scans her QR Code.
*   **Insight:** The scan reveals she has a "Latex Allergy" and is "Pregnant".
*   **Action:** Dr. Yusuf logs a "Trauma" condition but avoids using latex gloves based on the alert. He marks her status as "UNSTABLE".

**Step 3: Resource Crunch**
*   Dr. Yusuf realizes they are out of "O- Blood".
*   He submits a **Supply Request**: Item: "O- Blood", Urgency: "Critical".

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
