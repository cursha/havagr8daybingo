# Good Deeds Bingo Game - Development Plan

---

## 🔭 Feature Backlog (agreed with Curt — not yet built)

These are confirmed features Curt asked for, to build later (not now). Added Jun 3, 2026.

- [ ] **Card locks during an active game** — once a player's weekly card is generated, deed edits (e.g. changing quantity) do NOT change their current card. Changes apply to the **next** game. (Currently changes apply on next page load.)
- [ ] **Flip Three Squares power-up** — a player can use it once per game. They must select exactly three squares, which are then randomly replaced with new deeds.
- [ ] **Challenge Level** — players choose the difficulty level (the complexity 1 / 3 / 5) they want their card generated at. Needs consistent names for the levels (e.g. Easy / Medium / Hard).
- [ ] **Invite-a-friend email** — actually send the referral invitation email. Blocked on the email system (Resend/SendGrid) being configured.

### Also pending a decision
- [ ] **Prize image hosting** — Curt wants to host prize images on the site (havagr8day.com/images/...) but there is no upload mechanism. Decide between: (a) build a Supabase Storage upload button in the admin [recommended], or (b) host externally (Imgur etc.) and paste the URL [works today].

---

## Design Guidelines

### Design References
- **Modern Gaming UI**: Clean card-based layout with playful animations
- **Style**: Vibrant + Friendly + Gamified

### Color Palette
- Primary: #6366F1 (Indigo - main brand)
- Secondary: #10B981 (Emerald - success/completed)
- Accent: #F59E0B (Amber - gold/coins/wallet)
- Danger: #EF4444 (Red - purchasable squares)
- Background: #F8FAFC (Light gray)
- Card: #FFFFFF (White)
- Text: #1E293B (Dark slate), #64748B (Muted)

### Typography
- Headings: Inter font-weight 700
- Body: Inter font-weight 400
- Accent: Inter font-weight 600

### Key Component Styles
- **Bingo Card**: Grid with rounded cells, shadow, hover effects
- **Marked Cells**: Green checkmark stamp animation
- **Purchasable Cells**: Gold/amber border with price badge
- **Free Cells**: Emerald border with gift icon
- **Buttons**: Rounded, bold, with hover transitions

### Images to Generate
1. **hero-bingo-banner.jpg** - Colorful bingo card with good deeds theme, cheerful community vibe (1024x576)
2. **bingo-stamp.png** - Green checkmark stamp effect for marking squares (256x256, transparent bg)
3. **celebration-confetti.png** - Confetti celebration effect (512x512, transparent bg)
4. **good-deeds-pattern.jpg** - Subtle pattern of helping hands and hearts for backgrounds (1024x1024)

---

## Database Tables

### 1. good_deeds (public, create_only=false)
- id (integer, PK)
- deed_text (string) - The good deed prompt
- category (string) - Optional category
- is_active (boolean) - Whether deed is available
- created_at (datetime)

### 2. game_configs (public, create_only=false)
- id (integer, PK)
- config_key (string) - e.g. "purchasable_count", "referral_free_count", "dollar1_pct", "dollar2_pct", "dollar5_pct"
- config_value (string) - The value
- description (string)
- updated_at (datetime)

### 3. player_wallets (user-specific, create_only=true)
- id (integer, PK)
- user_id (string)
- balance (float) - Current wallet balance
- created_at (datetime)
- updated_at (datetime)

### 4. wallet_transactions (user-specific, create_only=true)
- id (integer, PK)
- user_id (string)
- amount (float)
- transaction_type (string) - "deposit", "purchase"
- description (string)
- created_at (datetime)

### 5. player_cards (user-specific, create_only=true)
- id (integer, PK)
- user_id (string)
- week_year (string) - e.g. "2026-W16"
- card_seed (string) - email+week hash for reproducibility
- card_data (string) - JSON of the 25 cells
- win_condition (string) - "one_line", "two_lines", "four_corners"
- completed_cells (string) - JSON array of completed cell indices
- purchased_cells (string) - JSON array of purchased cell indices
- referral_cells (string) - JSON array of referral free cell indices
- is_bingo (boolean)
- created_at (datetime)
- updated_at (datetime)

### 6. referrals (user-specific, create_only=true)
- id (integer, PK)
- user_id (string) - The referrer
- referred_email (string) - Email of referred person
- is_validated (boolean)
- created_at (datetime)

---

## Development Tasks

### Files to Create (Frontend - max 8 files)
1. **src/pages/Index.tsx** - Homepage with hero, login, game overview
2. **src/pages/GameBoard.tsx** - Main bingo game board with 5x5 grid, marking, purchasing, win detection
3. **src/pages/Wallet.tsx** - Wallet page with balance, add funds, transaction history
4. **src/pages/AdminPanel.tsx** - Admin panel for managing deeds, game config
5. **src/lib/api.ts** - API client helpers, game logic utilities
6. **src/components/BingoCell.tsx** - Individual bingo cell component with animations
7. **src/components/CelebrationOverlay.tsx** - Bingo win celebration animation
8. **src/App.tsx** - Router setup with all routes

### Backend Custom APIs
- POST /api/v1/game/generate-card - Generate/retrieve card for player
- POST /api/v1/game/mark-cell - Mark a cell as completed
- POST /api/v1/game/purchase-cell - Purchase a cell (deduct from wallet)
- POST /api/v1/game/submit-referral - Submit a referral email
- POST /api/v1/wallet/add-funds - Add funds to wallet (Stripe)
- GET /api/v1/admin/config - Get game config
- POST /api/v1/admin/config - Update game config
- POST /api/v1/admin/verify - Verify admin password