# ✨ GlowUp

### Try your makeup before you wear it.

GlowUp is a **mobile-first AI-powered virtual makeup experience** that lets you experiment with makeup directly on your own photo.

Upload a selfie, choose your makeup, adjust the intensity, and see how the look changes — all through a lightweight browser-based experience.

> 💄 **Lipstick · Eyeliner · Contour · Blush**
> ✨ AI-powered shade suggestions
> 📸 Photo-based virtual try-on
> 🎨 Adjustable intensity & lighting
> 💾 Save and share your looks

---

## 🌸 Why GlowUp?

Choosing makeup online can be surprisingly difficult.

A shade can look completely different depending on:

* Skin tone
* Natural lip color
* Lighting
* Face structure
* Makeup intensity
* The combination of multiple products

GlowUp is designed around a simple idea:

> **Don't imagine how it will look. Try it first.**

Instead of browsing endless makeup shades, users can upload a photo and experiment visually before deciding what they like.

---

## ✨ What You Can Do

### 💋 Lipstick

Experiment with different lipstick shades and finishes while preserving natural lip texture and lighting.

Features include:

* Multiple lipstick shades
* Shade names
* Shade colors
* Adjustable intensity
* Multiple finishes
* Before / After comparison
* AI-powered Top 3 shade suggestions

---

### 👁 Eyeliner

Experiment with different eyeliner styles and colors.

Users can adjust the eyeliner while keeping other makeup layers active.

Lipstick and eyeliner can be applied **simultaneously**.

---

### ✨ Contour

Create subtle facial definition using soft, realistic contour placement.

GlowUp focuses on:

* Cheek contour
* Jawline contour
* Soft gradients
* Adjustable intensity
* Multiple contour shades
* AI-powered shade suggestions

The goal is **natural sculpting rather than painted lines**.

---

### 🌸 Blush

Add a soft flush to the cheeks using different blush shades.

Users can experiment with:

* Pink
* Peach
* Rose
* Coral
* Berry
* Mauve

Blush can be combined with contour, lipstick and eyeliner.

---

## 🎨 Layered Makeup

GlowUp isn't limited to trying one product at a time.

Users can combine:

```text
💋 Lipstick
      +
👁 Eyeliner
      +
✨ Contour
      +
🌸 Blush
```

to create a complete makeup look.

Each makeup layer can be adjusted independently.

---

## 🧠 AI Shade Suggestions

GlowUp includes lightweight recommendation logic to suggest makeup options based on available facial/image characteristics.

Instead of overwhelming users with dozens of choices, GlowUp surfaces:

### ✨ Top 3 Suggestions

For example:

```text
✨ Recommended for you

1. Dusty Rose
   Soft everyday flush

2. Peach
   Fresh warm finish

3. Mauve Rose
   Muted rosy look
```

The recommendations are designed to assist exploration rather than automatically decide what the user should wear.

---

## 💡 Lighting Controls

Lighting can significantly affect how makeup appears.

GlowUp includes lightweight lighting presets such as:

* Auto
* Natural
* Soft
* Warm
* Cool

This allows users to preview their makeup under different visual conditions.

---

## 📱 Mobile First

GlowUp is designed primarily for smartphones.

The interface is optimized around:

* 375px
* 390px
* 430px

with responsive support for larger screens.

The goal is to make the experience feel natural when someone discovers GlowUp through a social-media link and immediately opens it on their phone.

---

## 🧭 User Experience

The main flow is intentionally simple:

```text
                ✨ GlowUp
                    │
                    ▼
              Upload Photo
                    │
                    ▼
              Choose Makeup
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
    Lipstick    Eyeliner     Contour
                                │
                                ▼
                              Blush
                    │
                    ▼
              Adjust Intensity
                    │
                    ▼
              Preview Result
                    │
             ┌──────┴──────┐
             ▼             ▼
          Save           Share
```

No complicated setup is required to experiment with a look.

---

## 🎯 Design Philosophy

GlowUp intentionally avoids the typical heavy beauty-app aesthetic.

### Visual direction

* Warm cream backgrounds
* Peach accents
* Dusty rose
* Soft pink
* Warm brown typography
* White cards
* Rounded controls
* Subtle shadows
* Editorial-style typography

The result is designed to feel:

**✨ Playful
🌸 Soft
💄 Beauty-focused
📱 Modern
🤍 Approachable**

rather than overly corporate or overly technical.

---

## 🛠️ Tech Stack

### Frontend

* ⚛️ React
* ⚡ Vite
* 🎨 CSS
* 📱 Responsive / Mobile-first UI

### Development

* JavaScript
* ESLint
* npm
* Git
* GitHub

### Deployment

Designed for deployment through:

* Vercel

### Analytics

Planned/Integrated analytics can track product interactions such as:

* Visitors
* Try-on starts
* Photo uploads
* Makeup selections
* Saves
* Shares

No user photos should be sent to analytics services.

---

## 📂 Project Structure

```text
glowup/
│
├── public/
│
├── src/
│   ├── components/
│   │
│   ├── screens/
│   │   ├── HomeScreen.jsx
│   │   ├── TryOnStudioScreen.jsx
│   │   ├── HistoryScreen.jsx
│   │   └── ProfileScreen.jsx
│   │
│   ├── utils/
│   │   ├── shadeRecommender.js
│   │   ├── shades.js
│   │   └── shareUtils.js
│   │
│   ├── App.jsx
│   ├── App.css
│   └── main.jsx
│
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/SiddiqaBagwan/glowup.git
```

### 2. Enter the project

```bash
cd glowup
```

### 3. Install dependencies

```bash
npm install
```

### 4. Start the development server

```bash
npm run dev
```

GlowUp will be available at:

```text
http://localhost:5173
```

---

## 🏗️ Production Build

Create a production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

---

## 🔒 Privacy Approach

GlowUp is designed with a privacy-conscious approach.

The application should avoid sending uploaded personal photos to third-party services unnecessarily.

Analytics should measure **product interactions**, not collect or transmit the actual uploaded images.

Examples of useful analytics:

```text
try_makeup_clicked
photo_uploaded
lipstick_selected
eyeliner_selected
contour_selected
blush_selected
save_look_clicked
share_look_clicked
```

No facial image should be included as an analytics event parameter.

---

## 📊 Product Analytics

GlowUp is designed to understand how people actually use the experience.

Important product metrics include:

| Metric           | Meaning                        |
| ---------------- | ------------------------------ |
| 👥 Visitors      | People reaching GlowUp         |
| 📸 Try-On Starts | Users beginning the experience |
| 📤 Photo Uploads | Users who provide a photo      |
| 💋 Lipstick Uses | Lipstick interactions          |
| 👁 Eyeliner Uses | Eyeliner interactions          |
| ✨ Contour Uses   | Contour interactions           |
| 🌸 Blush Uses    | Blush interactions             |
| 💾 Saves         | Looks saved                    |
| ↗️ Shares        | Looks shared                   |

This makes it possible to understand where users engage or drop off.

---

## 📱 Social Discovery

GlowUp is designed with social sharing in mind.

A typical discovery flow:

```text
Instagram Reel
       ↓
   GlowUp Link
       ↓
   Mobile Website
       ↓
   Upload Selfie
       ↓
   Try Makeup
       ↓
   Create Look
       ↓
   Share
```

The goal is to reduce the distance between:

**"That looks good!"**

and

**"Let me try it on myself."**

---

## 🗺️ Roadmap

### ✅ Current

* [x] Mobile-first interface
* [x] Photo upload
* [x] Camera support
* [x] Lighting controls
* [x] Lipstick try-on
* [x] Lipstick shade library
* [x] Lipstick intensity
* [x] Lipstick AI suggestions
* [x] Eyeliner try-on
* [x] Eyeliner + lipstick layering
* [x] Contour try-on
* [x] Blush try-on
* [x] Makeup reset
* [x] Before / After
* [x] Save Look
* [x] History
* [x] Share Look
* [x] Profile / guest mode

### 🔄 Next

* [ ] AI suggestions for eyeliner
* [ ] AI suggestions for contour
* [ ] AI suggestions for blush
* [ ] Improved recommendation intelligence
* [ ] Analytics and usage insights
* [ ] Production deployment
* [ ] Performance optimization across mobile devices

### 🚀 Future

* [ ] Complete Look generator
* [ ] More makeup categories
* [ ] Improved face-aware placement
* [ ] Real-time camera try-on
* [ ] Personalized makeup profiles
* [ ] Product discovery / shopping integrations
* [ ] More advanced virtual try-on models

---

## ⚠️ Current Limitations

GlowUp is an evolving project.

Virtual makeup rendering can vary depending on:

* Image quality
* Lighting
* Face angle
* Camera quality
* Occlusion
* Facial landmarks
* Skin and lip texture

The current implementation focuses on creating a lightweight and accessible browser experience rather than photorealistic commercial-grade AR.

---

## 🌟 Vision

GlowUp aims to make makeup experimentation:

**visual → personal → interactive**

Instead of asking:

> *"Will this shade suit me?"*

GlowUp lets users explore:

> **"How does this look on me?"**

---

## 👩‍💻 Built By

**Siddiqa Bagwan**

B.Tech Computer Engineering

Built as a hands-on project exploring:

* Computer vision
* Frontend engineering
* AI-assisted recommendations
* Human-centered UI/UX
* Virtual try-on experiences
* Product analytics

---

## ⭐ If You Like GlowUp

If you find the project interesting:

⭐ Star the repository
🍴 Fork it
💡 Open an issue
🚀 Try the live demo
📤 Share GlowUp with someone who loves makeup

---

## 📄 License

This project is currently intended as a personal/project portfolio application.

Add an explicit open-source license only if you decide you want others to reuse, modify, and redistribute the code.
