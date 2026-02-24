# KZING Casino User Page Design Analysis

> **Source**: kzkzb.com (KZING Global Demo)
> **Captured**: 2026-02-23
> **Purpose**: User-site (user-site/) UI replication reference
> **Total Screenshots**: 25 (Desktop 14 + Mobile 11)

---

## 1. Color System

### Light Mode
| Role | Color | Usage |
|------|-------|-------|
| Primary | `#FFC107` (Gold/Amber) | CTA buttons, active tabs, highlights, badges |
| Background | `#FFFFFF` | Main content background |
| Surface | `#F5F5F5` / `#F8F9FA` | Cards, sections, sidebar |
| Text Primary | `#333333` | Headings, body text |
| Text Secondary | `#666666` / `#999999` | Descriptions, meta text |
| Border | `#E0E0E0` / `#EEEEEE` | Cards, dividers |
| Success (Profit) | `#4CAF50` (Green) | Positive amounts, online status |
| Danger (Loss) | `#F44336` (Red) | Negative amounts, alerts |
| Accent | `#FF6B35` (Orange) | Notification badges, VIP current level |

### Dark Mode
| Role | Color | Usage |
|------|-------|-------|
| Background | `#1A1A2E` / `#16213E` | Main dark background |
| Surface | `#2A2A3E` / `#1F2937` | Cards, sidebar |
| Text Primary | `#FFFFFF` / `#F0F0F0` | Headings, body |
| Primary | `#FFC107` (Gold) | Same as light - CTA, highlights |
| Footer BG | `#0F3460` / `#1A1A2E` | Footer section |

### Key Observation
- Gold/Yellow is the ONLY accent color, used consistently across ALL interactive elements
- Light/Dark toggle preserves all accent colors, only inverts backgrounds
- No blue, purple, or other accent colors used anywhere

---

## 2. Layout Architecture

### Desktop (1440px+)
```
+--------------------------------------------------+
| TOP BAR: Logo | Balance | Deposit | Bell | Avatar |
+--------+-----------------------------------------+
| LEFT   | MAIN CONTENT                            |
| SIDE   | - Marquee ticker                        |
| BAR    | - Hero Banner Carousel (3 slides)       |
| (220px)| - Promo Shortcut Cards (3)              |
|        | - Recent Big Wins (scrolling ticker)    |
| Game   | - Start Playing (3 large cards)         |
| Cats   | - Casino Games Grid (10 categories)     |
| Promos | - Live Sports Cards (horizontal scroll) |
| VIP    | - Latest Round & Race Table             |
| etc    | - News Section (tabbed)                 |
|        | - Providers Carousel                    |
|        | - Footer (4 columns)                    |
+--------+-----------------------------------------+
```

### Mobile (375px)
```
+----------------------------------+
| Header: Logo | Balance | Deposit |
+----------------------------------+
| Horizontal Nav: Home Casino Sports|
+----------------------------------+
| Marquee ticker                   |
+----------------------------------+
| Banner Carousel (full width)     |
+----------------------------------+
| Recent Big Wins (vertical list)  |
+----------------------------------+
| Start Playing (3 cards)          |
+----------------------------------+
| Casino Games                     |
+----------------------------------+
| Live Sports                      |
+----------------------------------+
| ... more sections ...            |
+----------------------------------+
| Bottom Tab: Menu Home Aff Bet My |
+----------------------------------+
```

---

## 3. Navigation Patterns

### Desktop Sidebar (Left, ~220px, Fixed)
- **Game Categories** (icon + label):
  - Local Games, New Releases, Hot Games, Slots, Live Casino
  - Sports, Fishing, Card Game, Lottery, ESports, 3D, Arcade, Marble
- **Promotional Shortcuts** (colored pill buttons):
  - Check-In Bonus, Gifts Reward, VIP, Roulette, Quest Hub
- **Bottom**: Light/Dark theme toggle

### Mobile Bottom Tab Bar (Fixed, 5 items)
| Icon | Label | Route |
|------|-------|-------|
| Hamburger | Menu | Opens sidebar overlay |
| Home | Home | /eng/home/lobby |
| Handshake | Affiliate | /eng/agent/index |
| List | Bet History | Bet history page |
| Person | My | /eng/member/landing |

### Mobile Hamburger Menu (Slide overlay)
- Promotional shortcuts (same as desktop sidebar)
- Navigation links: Profile, Promotions, Sponsor, Affiliate, Live Support
- Language selector (English >)
- Theme toggle: Light / Dark

### Desktop Top Bar
- Logo (left)
- Balance display with refresh icon
- **Deposit** button (gold, prominent)
- Notification bell (with badge count)
- Avatar

---

## 4. Component Patterns

### Hero Banner Carousel
- **Desktop**: ~70% width, rounded corners (12px), 3 slides with dots
- **Mobile**: Full width, same content adapted
- Content: Vivid promotional images, CTA overlays

### Game Cards Grid
- **Desktop**: 4 columns, showing game thumbnail + name + RTP/provider
- **Mobile**: 3 columns, smaller thumbnails
- Horizontal category tabs above grid (scrollable on mobile)
- "View All >" link in section header

### Sports Betting Cards
- Horizontal scroll (desktop: ~4 visible, mobile: 1)
- Card structure: League > Teams (with logos) > Handicap odds
- Previous/Next navigation buttons

### Latest Round & Race Table
- Toggle: Latest Bet / High Roller
- Columns: Game, Player, Multiplier, Profit
- Profit colored: green (+) / red (-)
- Colored icons per row (game type indicators)

### VIP Level Cards
- Horizontal scroll of level cards (VIP 0-3+)
- Current level highlighted with orange/gold gradient
- Medal/badge icon per level
- Progress bars for upgrade/maintain requirements
- **VIP Exclusive** section: 2-column grid of benefit cards
  - Number of Withdrawals, Daily Withdrawal Amount
  - Upgrade Bonus, Daily Bonus, Weekly/Monthly Bonus, Birthday Bonus

### Promotion Cards
- **Desktop**: 2-column grid
- **Mobile**: Single column, full width
- Vivid illustration images with overlaid text (amount, title)
- Top filter tabs: All promotions, 7 Days Check-in, General Activity, Gift Bonus

### Check-In Bonus
- 7-day calendar grid (3+3+1 layout)
- Day 1-6: Circle checkmarks
- Day 7: Gift box icon (gold background, special)
- "Check-In Now" button (gold)
- Rules table below

### Profile/Landing Page
- User card: Avatar, username, VIP badge, last login
- Upgrade requirements (deposit + turnover)
- Quick action buttons: Deposit, Withdraw, Transfer, VIP
- 5 promotional shortcut cards (same as sidebar)
- **General** section: List items with icons
  - Personal Profile, My Wallet (shows balance), Banking
  - Transaction Records, Quests Hub, Bet History, KYC Verification
- **Service** section: Sponsor, Affiliate, Referrer Report, Referral, Support, Help
- **Sports** section: Preferred Odds, Tutorial

### Footer
- **Desktop**: 4-column layout
  1. Responsible Gambling (badges)
  2. Games (category links)
  3. Info (About, Promotions, VIP, Sponsor, Affiliate, Help Desk)
  4. Social Network (icons)
- Payment Methods: UPI, NetBanking, GPay, Bitcoin, Crypto, Local Bank, VISA, Mastercard
- Currency Accepted: 12 currency icons (BRL, CNY, PHP, IDR, INR, JPY, KRW, etc.)
- Crypto Accepted: BTC, ETH, USDT
- Copyright + Site description

---

## 5. Typography

| Element | Size (est.) | Weight | Font |
|---------|-------------|--------|------|
| Logo | - | Bold | Custom (KZ) |
| Page Title | 24px | Bold | System sans-serif |
| Section Header | 18-20px | Semi-bold | System sans-serif |
| Card Title | 14-16px | Medium | System sans-serif |
| Body Text | 14px | Regular | System sans-serif |
| Small/Meta | 12px | Regular | System sans-serif |
| Balance | 16px | Bold | Monospace-like |
| Button | 14-16px | Semi-bold | System sans-serif |

---

## 6. Key UI Patterns for Replication

### Must-Have Elements
1. **Balance bar** with refresh + Deposit CTA (always visible)
2. **Game category horizontal tabs** (scrollable, with icons)
3. **Recent Big Wins** scrolling ticker
4. **Light/Dark theme toggle**
5. **Bottom tab navigation** (mobile)
6. **VIP level progression** with progress bars
7. **7-day check-in calendar** UI

### Design Principles
- **Gold (#FFC107) as sole accent** - all CTAs, active states, highlights
- **Card-based layout** everywhere - rounded corners (8-12px)
- **Generous whitespace** between sections
- **Icons + text** for all navigation items
- **Real-time data** feel (scrolling tickers, live sports odds)
- **Hamburger menu** on mobile (not full sidebar)
- **Progressive disclosure** - landing page shows shortcuts to deeper pages

### Spacing System (estimates)
- Section gap: 24-32px
- Card padding: 16-20px
- Card border-radius: 8-12px
- Button border-radius: 20-24px (pill shape)
- Mobile bottom tab height: ~56px

---

## 7. Screenshot Index

### Desktop (1440px)
| File | Content |
|------|---------|
| `00-lobby-logged-out.png` | Landing page before login |
| `01-lobby-top.png` | Lobby after login, top section |
| `02-lobby-hero.png` | Hero banner + promotional cards |
| `03-lobby-bigwins-games.png` | Casino games grid + categories |
| `04-lobby-sports-race.png` | Sports + Latest Bet table |
| `05-lobby-providers-footer.png` | Providers + Footer |
| `06-profile.png` | Profile/My page |
| `07-vip.png` | VIP levels + requirements |
| `08-vip-rebate.png` | VIP rebate section |
| `09-promotion.png` | Promotions page grid |
| `10-checkin.png` | 7-day check-in bonus |
| `11-affiliate.png` | Affiliate page |
| `12-deposit.png` | Deposit verification page |
| `13-lobby-dark.png` | Dark mode lobby |

### Mobile (375x812)
| File | Content |
|------|---------|
| `01-lobby-top.png` | Mobile lobby: header, nav, banner, big wins |
| `02-lobby-games.png` | Latest Bet table + News section |
| `03-lobby-footer.png` | Footer: currencies, crypto, copyright |
| `04-profile.png` | Profile: user info, quick actions, general |
| `05-profile-bottom.png` | Profile: service + sports sections |
| `06-vip.png` | VIP levels + progress requirements |
| `07-vip-benefits.png` | VIP Exclusive benefits grid |
| `08-promotion.png` | Promotions: filter tabs + cards |
| `09-sidebar-menu.png` | Hamburger menu overlay |
| `10-checkin.png` | 7-day check-in (mobile) |
| `11-lobby-dark.png` | Dark mode lobby (mobile) |
