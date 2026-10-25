# OPD Saathi (OPD साथी) — City District Hospital

Visiting a government hospital OPD often means hours of standing in the wrong queue, decoding English medical signboards, climbing stairs with aching knees, and fearing you will miss your turn if you sit down.  
**OPD Saathi** turns that stressful visit into calm, bilingual (`English` / `हिंदी`), step-free registration, live queue tracking, and landmark-by-landmark indoor navigation — with zero login and zero app install.

---

## Who the App Is For

- **Elderly patients** (such as 62-year-old *Kamla*, visiting alone with knee pain) who need large type, spoken instructions, and routes that avoid stairs.
- **Low-literacy and first-time visitors** who recognise symptoms (`Bones and joints`, `Fever, cough, cold`) and visual landmarks (`blue chairs`, `silver lift doors`) rather than medical department names (`Orthopaedics`, `Otolaryngology`).
- **Family members, neighbours, and hospital volunteers** helping a relative register and navigate via one-tap **Assisted Mode**.
- **Walk-in patients without smartphones** who register at the **Staff Registration Counter** and receive a printed privacy-safe paper slip while tracking their token on the **Waiting-Room TV Board**.
- **OPD nurses, counter clerks, and floor coordinators** managing room queues, doctor breaks/delays, waiting-hall crowding, and urgent patient help requests from a single screen.

---

## What It Does (One Line per Screen)

1. **Home (`/`)**: Welcomes visitors in `English` or `हिंदी` with four clear picture cards (`Register`, `I have my slip`, `Find a place`, `Emergency`), one-tap urgent help, and a 4-step visual overview.
2. **Register (`/register`)**: Walks through an 8-sign emergency check followed by five one-question-at-a-time screens with voice microphone input, *Assisted Mode*, and symptom picture cards.
3. **OPD Slip (`/slip/:token`)**: Displays a privacy-safe digital/printable token slip (`Token`, `First Name`, `Department`, `Room & Floor`, `Doctor`, `People ahead`, `Est. wait`, and QR code) with `Save Image`, `Print`, `Read Aloud`, and `Large Type`.
4. **I Have My Slip (`/have-slip`)**: Lets any visitor look up a live queue by typing or speaking their token (including bare numbers like `041` or Devanagari `०४१`) or scanning their slip's QR code.
5. **My Turn (`/turn/:token`)**: Shows live queue position, token inside the room now, doctor status, plain-language next steps, automatic `"3 ahead"` alerts (sound, vibration, banner, simulated SMS), and embedded room directions.
6. **Find a Place (`/find`)**: Computes shortest indoor routes across all three floors using Dijkstra's algorithm on interactive blueprint SVG maps, with landmark-based steps, `Avoid stairs`, `Listen`, and an `"I'm lost"` bilingual staff helper card.
7. **Emergency (`/emergency`)**: Lists the 8 urgent danger signs, provides one-tap `112` Helpline and `108` Ambulance calls, triggers a staff urgent alert, and draws an immediate step-free route to Ground-Floor Casualty (no token needed).
8. **Settings (`/settings`)**: Customises `Language` (`English` / `हिंदी`), `Text size` (`18px`, `21px`, `24px`), `High contrast`, `Read aloud`, and `Avoid stairs`, persisted across reloads.
9. **Staff Dashboard (`/staff`)**: Gives OPD staff pinned audible urgent-help alerts, live 8-room queue controls (`Call Next`, `No-Show`, `Send to End`, `Move Dept`), doctor status switches (`In Room`, `On Break`, `Running Late`), waiting-area crowding bars, and hackathon demo controls.
10. **Registration Counter (`/staff/counter`)**: Lets desk clerks register walk-in patients without phones in seconds and print a clean paper OPD slip with QR code.
11. **Waiting-Room TV Board (`/board`)**: Renders a high-contrast forest-green widescreen display for waiting halls with a `Now Serving` spotlight, `Next 3 Tokens`, spoken bilingual call-outs, and an 8-room live status grid.

---

## How Emergencies Are Handled — and Why the App Never Decides Who Is Urgent

### How Emergencies Work in OPD Saathi
- **Always one tap away**: Every screen keeps a persistent crimson **`Emergency (112)`** button and **`I need urgent help`** flag pinned at the top.
- **Safety Gate before registration**: Step 0 of `/register` shows 8 plain-language warning signs (*chest pain, trouble breathing, heavy bleeding, fainting, drooping face, serious injury/burn, pregnancy bleeding/pain, limp or very drowsy child*) before asking a single form question.
- **Zero-queue Casualty routing**: Tapping **`Yes — Emergency`** skips token registration altogether, opens `112` / `108` calling options, explains what *Casualty* means in plain words, and shows a step-free Ground-Floor map straight to the Emergency room.
- **Sub-second human alert**: Tapping **`I need urgent help`** immediately pins a crimson **`URGENT HELP NEEDED`** banner with the visitor's location/token at the top of `/staff` and plays a repeating chime until a staff member clicks **`Mark as seen`**.

### Why the App Never Decides Who Is Urgent
OPD Saathi **intentionally never runs an automated symptom-triage algorithm or assigns clinical urgency scores**:
1. **Clinical safety**: Automated questionnaires routinely miss atypical presentations (for example, silent cardiac symptoms in elderly or diabetic patients) or misread voice/text input from stressed visitors.
2. **Zero algorithmic delay**: Telling a critically ill patient *"You appear non-urgent, please wait for Token MED-042"* could cost lives, while over-flagging floods Casualty.
3. **Human-first rule**: Instead of acting as a gatekeeper, the app puts unmistakable plain-language danger signs in front of the patient and companion and gives them direct, friction-free access to Casualty and live hospital staff — leaving medical judgement strictly to trained clinicians.

---

## Key Design Decisions and Why We Made Them

- **Assisted Mode (*"Someone is helping me"*)**: In Indian public hospitals, elders often hand their phone to a son, daughter, neighbour, or help-desk volunteer. One tap switches prompts for a helper while automatically turning on Extra-Large `24px` text, `Read Aloud`, and `Avoid stairs`.
- **Symptom Picture Cards & `>= 56px` Icon+Word Buttons**: Visitors rarely know that knee pain belongs to *"Orthopaedics"* or ear pain to *"ENT"*. Every interactive button is at least `56px` tall, pairs a custom inline SVG icon with Class-8 plain language (`Bones and joints`, `Ear, nose and throat`), never relies on colour alone, and explains hospital terms (`OPD`, `Token`, `Casualty`) the first time they appear.
- **Avoid Stairs (Step-Free Dijkstra Routing)**: Climbing stairs is painful or impossible for seniors, wheelchair users, and pregnant women. Turning on `Avoid stairs` filters out every `usesStairs: true` edge in the 31-node hospital graph so routes automatically use the gentle Ground-Floor **Ramp** (with handrails) and vertically aligned **Lifts**.
- **Full Bilingual Parity (`English` & `हिंदी`)**: A first-visit language sheet and a persistent header toggle switch 100% of the experience — buttons, symptom cards, landmark directions, spoken TTS announcements, `"I'm lost"` helper cards, and exported PNG slips — and accept both Latin (`042`) and Devanagari (`०४२`) digits.
- **Read Aloud & Voice Input**: Built on browser `SpeechSynthesis` and `SpeechRecognition` with zero heavy external audio downloads, so low-literacy or visually impaired patients can listen to every screen/step and speak their name, age, phone number, token, or destination.
- **Privacy-Safe Slips & No Aadhaar/ABHA Gate**: Asking for 12–14 digit IDs stalls queues and excludes visitors who forgot documents. Registration needs only first name, age, gender, and symptom category, and the OPD slip displays **only Token, First Name, and Department** — never full name, phone number, age, or gender — protecting patient dignity if a paper slip is dropped.

---

## How Waiting Time Is Worked Out

OPD Saathi calculates dynamic room-level wait estimates rather than fixed guesses:

1. **People ahead (`peopleAhead`)**: Count of `waiting` patients ahead of this token in the assigned room, plus `+1` if a patient is currently `serving` inside the consultation room.
2. **Rolling consultation speed (`avgConsult`)**: Mean duration of the **last 10 completed consultations** in that specific room (seeded with the department's baseline average and updated automatically whenever staff tap `Call Next`), balancing General Medicine across **Room 1** and **Room 2** according to whichever room currently has the shorter estimated wait.
3. **Live doctor delay (`doctorDelay`)**: Adds `0` minutes when the doctor is `In the room`, the configured delay when `Running late`, or remaining minutes until `breakUntil` when `On break`.
4. **Plain-language 5-minute rounding**:
   $$\text{Estimated Wait} = \max\Big(5,\ \text{round}\big(\tfrac{(\text{peopleAhead} \times \text{avgConsult}) + \text{doctorDelay}}{5}\big) \times 5\Big)$$
   Displayed in plain, honest language as **"about 20 minutes"** (or **"Less than 5 minutes"** when next in line).

---

## How It Improves on a Hospital Visit Today

| Hospital Visit Today | With OPD Saathi |
| :--- | :--- |
| Long standing queues just to learn which window or room to visit | 5-step self or assisted registration with automatic load-balancing across rooms |
| English department boards (`Orthopaedics`, `Ophthalmology`) confuse visitors | Plain-word symptom cards + first-appearance glossary in `English` and `हिंदी` |
| Patients stand crowded outside the doctor's door afraid to miss their call | Live `My Turn` tracker + sound, vibration & simulated SMS alert when **3 people are ahead** |
| Asking strangers for directions; accidentally taking stairs with knee pain | Blueprint floor maps + landmark steps (*"pass the blue chairs"*) + 1-tap **Avoid stairs** |
| Getting disoriented on upper floors with no way to explain your destination | **"I'm lost"** button shows a large bilingual card to hand any staff member + routes to Help Desk |
| Staff find out about distressed waiting patients too late | One-tap **`I need urgent help`** pins a repeating audible alert on `/staff` in under a second |

---

## How to Run It

### Prerequisites
- **Node.js 18+** and **npm**

### Local Development
```bash
npm install
npm run dev
```
Open **`http://localhost:5173`** in your browser. No backend, database, API keys, or login are needed.

### Multi-Tab Live Sync Setup
Open three tabs in the same browser window to watch `localStorage` + `BroadcastChannel` sync instantaneously:
- **Patient App**: `http://localhost:5173/`
- **Staff Dashboard**: `http://localhost:5173/staff`
- **Waiting-Room TV Board**: `http://localhost:5173/board`

### Production Build
```bash
npm run build
npm run preview
```

---

## What Is Simulated

- **Cross-screen real-time state**: Synchronised across open browser tabs on the same machine via `localStorage` and the browser `BroadcastChannel` API rather than a central hospital server.
- **SMS turn notifications**: Simulated via an in-app SMS preview toast, Web Audio chime, device vibration, and Browser Notification when `<= 3` patients remain ahead (no telecom SMS gateway attached).
- **Hospital & patient dataset**: *City District Hospital* (3 floors, 31 mapped nodes, 8 OPD rooms) and all pre-loaded patients (`MED-034`, *Kamla*, and the `+20 patients` demo batch) are 100% synthetic.
- **Hospital clock & `10x` speed mode**: Simulated OPD clock starting at `10:15` with a staff demo toggle (`10x time`) that advances consultations automatically every ~1.8 seconds for live judging.

---

## What We'd Build Next

1. **Lightweight Hospital LAN Backend & HMIS/ABDM Optional Bridge**: A small local Node/PostgreSQL + WebSocket service runnable on a hospital mini-PC so separate physical smartphones, counter PCs, and smart TVs sync over hospital Wi-Fi even if internet drops, plus optional ABHA scan for hospitals that already use it.
2. **Real SMS / WhatsApp / Automated Voice Callbacks**: Trigger real gateway SMS or missed-call/IVR voice alerts in the patient's language when 3 tokens remain ahead so feature-phone users get the exact same peace of mind.
3. **80mm Thermal Kiosk Printer Integration**: Direct ESC/POS one-click printing from `/staff/counter` and self-service touch kiosks at the hospital gate.
4. **Offline PWA & More Indian Languages**: Service-worker caching so maps and slips work in zero-signal hospital corridors, plus regional language packs (`Punjabi`, `Marathi`, `Tamil`, `Bengali`, `Telugu`).
