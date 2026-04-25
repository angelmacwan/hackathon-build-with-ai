### **1. Design Philosophy & Vibe**
* **Style:** Modern Minimalist, "Neumorphic" adjacent (but flat), Playful, and Welcoming.
* **Key Characteristics:** Generous use of whitespace, soft pastel color blocking, highly rounded corners, and friendly vector illustrations. The design feels light, reducing cognitive load for the user.

---

### **2. Color Palette**
The color palette relies on warm, neutral backgrounds to make soft pastel accent colors pop without being overwhelming.

**Base & Neutrals:**
* **App Background:** Light Mint/Teal tint (from the outer edge of image 1) or pure White/Off-White (`#FFFFFF` to `#F8F9FA`).
* **Container/Card Backgrounds:** Warm Beige/Cream (`#FDFBF7`) and White (`#FFFFFF`).
* **Primary Text:** Dark Charcoal (`#2D2D2D` or `#1A1A1A`) instead of pure black for a softer read.
* **Secondary Text:** Medium Gray (`#717171`).

**Pastel Accents (Used for Cards & Charts):**
* **Soft Lavender/Purple:** `#D1C4E9` (Used in the "Six Sigma" card).
* **Mint Green:** `#B2DFDB` (Used in the "Design a Room" card).
* **Warm Peach/Orange:** `#FFE0B2` (Used in the "Business Writing" card).
* **Blush Pink:** `#F8BBD0` (Used in the "CCNA" card).

---

### **3. Typography**
The fonts are clean, geometric sans-serifs that feel modern and legible.
* **Recommended Fonts:** *Poppins*, *Nunito*, or *Circular*.
* **Headings (H1, H2):** Use Bold or Semi-Bold weights. High contrast against the background. (e.g., "Invest in your education", "Hi, George!").
* **Body Text:** Regular weight. Keep line height generous (e.g., `1.5` or `150%`) for readability.
* **Labels/Tags:** Small, bold or medium weight, often in all-caps or title case for category pills.

---

### **4. UI Components & Shapes**

**A. Cards & Containers**
* **Shape:** Highly rounded corners. Use a generous `border-radius` (e.g., `20px` to `24px` for large cards, `12px` to `16px` for smaller inner elements).
* **Shadows:** Shadows are almost non-existent. The design relies on color contrast (pastel on cream) or very faint, soft, diffused drop-shadows (e.g., `box-shadow: 0 4px 12px rgba(0,0,0,0.03);`) rather than harsh borders.

**B. Buttons & Tags**
* **Pill Shape:** All tags, categories, and primary buttons should be fully rounded (pill-shaped, `border-radius: 50px`).
* **Active State:** High contrast. For example, the active "All" filter button is solid black with white text.
* **Inactive State:** Outlined or soft light-grey background with dark text.

**C. Icons**
* **Style:** Minimalist line icons or solid flat icons.
* **Placement:** Icons are often placed inside their own small, rounded-square or circular containers with a slightly darker background than the card they sit on.

**D. Avatars**
* **Style:** Perfect circles.
* **Groupings:** When showing multiple users (e.g., "students"), overlap the avatars slightly with a thick white border to separate them.

---

### **5. Imagery & Data Visualization**

**A. Illustrations**
* Use flat, vector-based illustrations with a cute, friendly aesthetic (like the meditating bear).
* Illustrations should incorporate the app's core pastel palette to feel cohesive.
* Use them to welcome users, handle empty states (like "No messages yet"), or confirm actions.

**B. Charts (Like the Activity Graph)**
* **Style:** Stacked bar charts with rounded tops (`border-radius` on the top of the bar).
* **Colors:** Use the exact pastel palette from the cards to fill the chart segments.
* **Interaction:** Highlight the active/hovered bar (e.g., with a thin dark outline and a dark label pill, as seen on the "Dec" column).