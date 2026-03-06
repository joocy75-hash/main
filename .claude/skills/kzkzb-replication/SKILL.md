---
name: kzkzb-design-system
description: KZING(kzkzb.com) 디자인 시스템 완전 레퍼런스. user-page UI 구현 시 반드시 이 스킬을 참조하여 100% 동일한 디자인을 재현한다.
---

# KZING Design System - Complete Reference

> **Source**: https://kzkzb.com/eng/home/lobby (KZING Global Demo)
> **Extracted**: 2026-02-26 (Playwright MCP 기반 100% 추출 완료)
> **Design Assets Location**: `/Users/mr.joo/Desktop/kz디자인/design-system/`

## IMPORTANT: 이 스킬의 사용법

1. user-page의 UI를 구현할 때 **반드시** 이 스킬을 참조
2. 색상, 폰트, 레이아웃, 컴포넌트 구조를 이 문서 기준으로 맞출 것
3. 정확한 값이 필요하면 아래 경로의 원본 파일을 Read tool로 직접 읽을 것
4. HTML 원본과 비교 검증이 필요하면 해당 HTML 파일을 참조

---

## Asset File Paths (Read tool로 접근 가능)

```
/Users/mr.joo/Desktop/kz디자인/design-system/
├── DESIGN-SYSTEM.md              # 전체 디자인 시스템 문서
├── VERIFICATION-REPORT.md        # 추출 검증 리포트 (100% 완료)
├── theme-variables.json          # 93개 CSS 변수 JSON
├── css/                          # 원본 CSS 8개 파일 (총 653KB)
│   ├── app.css                   # 메인 앱 스타일 (148KB, 4824 rules)
│   ├── chunk-main.css            # 페이지별 스타일 (198KB, 5297 rules)
│   ├── chunk-lobby.css           # 로비 전용 (23KB, 573 rules)
│   ├── chunk-vendors.css         # 벤더 (6KB)
│   ├── antd-mobile.min.css       # Ant Design Mobile (27KB)
│   └── animate.min.css           # 애니메이션 (53KB)
├── fonts/                        # 폰트 3개
│   ├── InterVariable.woff2       # Inter 가변폰트 (318KB)
│   ├── ProximaNova-Regular.ttf   # (128KB)
│   └── ProximaNova-Bold.ttf      # (127KB)
├── html/                         # 렌더링된 HTML 31페이지
│   ├── 로비/lobby-rendered.html              # 데스크톱 로비 (211KB)
│   ├── 스포츠/sports-rendered.html           # 스포츠 (238KB)
│   ├── 카지노/live-casino-rendered.html      # 라이브 카지노 (152KB)
│   ├── 슬롯/slots-rendered.html              # 슬롯 (155KB)
│   ├── 기타/                                 # 7페이지 (fishing, card, lottery, esports, arcade, vip, promotions)
│   └── 모바일/                               # 20페이지 (모든 모바일 라우트)
│       ├── mobile-lobby-rendered.html        # 모바일 로비 (217KB)
│       ├── mobile-sports-rendered.html       # 모바일 스포츠 (726KB)
│       ├── mobile-slots-rendered.html        # 슬롯
│       ├── mobile-live-casino-rendered.html  # 라이브 카지노
│       ├── mobile-casino2-rendered.html      # 카지노 메인
│       ├── mobile-local-rendered.html        # 로컬 게임
│       ├── mobile-3d-rendered.html           # 3D 게임
│       ├── mobile-fishing-rendered.html      # 낚시
│       ├── mobile-lottery-rendered.html      # 복권
│       ├── mobile-esports-rendered.html      # e스포츠
│       ├── mobile-arcade-rendered.html       # 아케이드
│       ├── mobile-p2p-rendered.html          # P2P
│       ├── mobile-allProvider-rendered.html  # 전체 프로바이더
│       ├── mobile-sponsor-rendered.html      # 스폰서
│       ├── mobile-help-rendered.html         # 도움말
│       ├── mobile-promotion-rendered.html    # 프로모션
│       ├── mobile-member-landing-rendered.html # 마이페이지
│       ├── mobile-member-vip-rendered.html   # VIP
│       └── mobile-agent-rendered.html        # 어필리에이트
└── images/                       # 182개 이미지
    ├── logo/        (4) kzb_logo.png, kzb_logo_dark.png, favicon.ico, icon-128.png
    ├── banners/     (3) banner_1~3.webp
    ├── category-icons/ (13) 게임 카테고리 아이콘 (slots, sports, fishing, etc.)
    ├── ui-icons/    (43) UI/네비게이션 아이콘
    ├── theme/       (35) 테마/기능 이미지 (vip, checkin, mission, etc.)
    ├── providers/   (15) 게임 프로바이더 로고
    ├── provider-filters/ (18) 프로바이더 필터 아이콘 (yellow themed)
    ├── social/      (18) 소셜 미디어 아이콘
    ├── currency/    (16) 통화 아이콘 (KRW, USD, BTC, etc.)
    ├── payment-icons/ (8) 결제 아이콘 (visa, mastercard, gpay, etc.)
    └── static/      (9) 사이트 고유 정적 아이콘
```

### Screenshots (참고용 스크린샷)

```
/Users/mr.joo/Desktop/관리자페이지/design-reference/
├── desktop/  (14장) 00-lobby-logged-out ~ 13-lobby-dark
└── mobile/   (11장) 01-lobby-top ~ 11-lobby-dark
```

---

## 1. Color System (93 CSS Variables)

### Brand Colors (Primary)
| Variable | Value | Usage |
|----------|-------|-------|
| `--yellow-theme` | `#feb614` | Primary brand yellow |
| `--main-bg-theme` | `#f4b53e` | Main background theme |
| `--secondary-yellow` | `#f4b53e` | Secondary yellow |
| `--txt-yellow` | `#feb614` | Yellow text |
| `--main-yellow` | `linear-gradient(180deg, #ffd651, #fe960e)` | Gold gradient (CTA, buttons) |
| `--cta-button-color` | `linear-gradient(#f4b53e, #f48d3e)` | CTA button gradient |
| `--color-red` | `#ff4848` | Error/negative red |

**핵심 원칙**: Gold/Yellow(`#feb614`)가 **유일한 액센트 컬러**. 모든 CTA, 활성 상태, 하이라이트에 사용.

### Dark Mode Colors
| Variable | Value | Usage |
|----------|-------|-------|
| `--background-theme` | `#252531` | Main dark background |
| `--background-theme2` | `#2c2d33` | Secondary dark bg |
| `--body-color` | `#252531` | Body background |
| `--sidebar-bg` | `#303134` | Sidebar background |
| `--sidebar-list-bg` | `#252531` | Sidebar list bg |
| `--dm-bg-dark` | `#202125` | Deep dark bg |
| `--dm-bg-score` | `#303134` | Score section bg |
| `--dm-button-selected` | `#2c2d33` | Selected button bg |
| `--dm-header-btn` | `#303134` | Header button bg |
| `--hot-new-tab` | `#2d2a38` | Tab background |

### Light Mode Colors
| Variable | Value | Usage |
|----------|-------|-------|
| `--theme-light-bg` | `#f1f2f7` | Light mode background |
| `--theme-light-secondary` | `#fff` | Light mode secondary |
| `--lm-bg-light` | `#f2f3f7` | Light background |
| `--lm-bg-score` | `#f6f7fb` | Score section light |
| `--lm-button-selected` | `#edeef3` | Selected button light |

### Text Colors
| Variable | Value | Usage |
|----------|-------|-------|
| `--text-white` | `#fff` | White text |
| `--main-black` | `#333` | Main black text |
| `--txt-grey` | `#666` | Grey text |
| `--txt-grey2` | `#bdbdbd` | Light grey text |
| `--sidebar-list-text-color` | `#98a7b5` | Sidebar text |
| `--dm-txt-white` | `#98a7b5` | Dark mode muted text |
| `--dm-txt-grey` | `#c4c4c2` | Dark mode grey text |
| `--lm-txt-black` | `#31373d` | Light mode main text |
| `--search-text` | `#adb4b4` | Placeholder text |
| `--dropdown-text` | `#707070` | Dropdown text |

### Neutrals
| Variable | Value |
|----------|-------|
| `--black-2` | `#828282` |
| `--black-3` | `#4f4f4f` |
| `--black-4` | `#999` |
| `--black-5` | `#bdbdbd` |
| `--black-6` | `#e0e0e0` |
| `--white-2` | `#f2f2f2` |
| `--white-3` | `#d9d9d9` |
| `--bg-grey` | `#d6d6d6` |
| `--bg-grey2` | `#f7f7f7` |

### Borders
| Variable | Value |
|----------|-------|
| `--border-grey` | `#e8e8e8` |
| `--sidebar-border` | `3px solid #404054` |
| `--lm-border` | `#e8e8e8` |
| `--dm-border` | `#999` |
| `--dm-border2` | `#808087` |
| `--dm-border-selected` | `#484a51` |

### Tailwind CSS 매핑 가이드

```css
/* globals.css 또는 tailwind config에서 사용 */
:root {
  --kz-primary: #feb614;
  --kz-primary-gradient: linear-gradient(180deg, #ffd651, #fe960e);
  --kz-cta-gradient: linear-gradient(#f4b53e, #f48d3e);
  --kz-error: #ff4848;
  --kz-success: #4CAF50;
}

/* Dark mode (default) */
.dark {
  --kz-bg: #252531;
  --kz-bg-secondary: #2c2d33;
  --kz-bg-sidebar: #303134;
  --kz-bg-deep: #202125;
  --kz-text-primary: #98a7b5;
  --kz-text-secondary: #c4c4c2;
  --kz-text-white: #fff;
  --kz-border: #484a51;
}

/* Light mode */
.light {
  --kz-bg: #f1f2f7;
  --kz-bg-secondary: #fff;
  --kz-bg-sidebar: #fff;
  --kz-bg-deep: #f2f3f7;
  --kz-text-primary: #31373d;
  --kz-text-secondary: #666;
  --kz-text-white: #333;
  --kz-border: #e8e8e8;
}
```

---

## 2. Typography

### Font Stack
```css
/* Primary */
font-family: -apple-system, Inter, sans-serif;
/* Secondary */
font-family: -apple-system, ProximaNova, "Microsoft Yahei UI", PingFangSc, "Segoe UI", sans-serif;
```

### Font Files (복사 필요)
- `InterVariable.woff2` (318KB) - 가변폰트, 400~900 weight
- `ProximaNova-Regular.ttf` (128KB)
- `ProximaNova-Bold.ttf` (127KB)

### Size Scale
| Size | Usage |
|------|-------|
| 9px | Micro labels |
| 10px | Small badges, timestamps |
| 12px | Body small, table cells |
| 13px | Body medium |
| 14px | **Body default**, buttons |
| 15px | Sub-headings |
| 16px | Section titles |
| 18px | Card titles, section headers |
| 20px | Large headings |
| 22px | Page titles |
| 24px | Hero sub-heading |
| 28px | Hero heading |
| 38px | Jackpot/prize display |

### Weight Scale
| Weight | Usage |
|--------|-------|
| 400 | Body text, labels |
| 500 | Buttons, navigation |
| 600 | Sub-headings, emphasis |
| 700 | Headings, prices, section titles |
| 800 | Hero text |
| 900 | Jackpot numbers |

---

## 3. Layout System

### Desktop (1920px viewport)
```
┌──────────────────────────────────────────────────┐
│  Header (70px, full width, fixed)                 │
│  Logo │ Casino │ Sports │ DuckRace │ Balance │ DP │
├──────────┬───────────────────────────────────────┤
│ Sidebar  │  Main Content (.game-page)             │
│ (270px)  │                                        │
│          │  ┌── Marquee Ticker ────────────────┐  │
│ ─ Home   │  ├── Hero Banner Slider ────────────┤  │
│ ─ Local  │  ├── Promo Shortcut Cards (3) ──────┤  │
│ ─ Slots  │  ├── Recent Big Wins (scroll) ──────┤  │
│ ─ Casino │  ├── Start Playing (3 large) ───────┤  │
│ ─ Sports │  ├── Casino Games Grid (10 tabs) ───┤  │
│ ─ Fish   │  ├── Live Sports (carousel) ────────┤  │
│ ─ Card   │  ├── Latest Bet Table ──────────────┤  │
│ ─ Lotto  │  ├── News Section (tabs) ───────────┤  │
│ ─ ESport │  ├── Providers Carousel ────────────┤  │
│ ─ 3D     │  └── Footer (4 columns) ───────────┘  │
│ ─ Arcade │                                        │
│ ─ Marble │                                        │
│          │                                        │
│ Profile  │                                        │
│ Promo    │                                        │
│ Lang     │                                        │
│ Theme ☀  │                                        │
└──────────┴───────────────────────────────────────┘

Header height: 70px
Sidebar expanded: 270px
Sidebar collapsed: 90px
```

### Mobile (375px viewport)
```
┌──────────────────────────┐
│ ☰  Logo        🔔 👤    │  Header
├──────────────────────────┤
│ Marquee Ticker           │
├──────────────────────────┤
│ Banner Carousel          │
├──────────────────────────┤
│ Category Tabs (scroll)   │
│ [Local][New][Hot]...     │
├──────────────────────────┤
│ Game Grid (2~3 cols)     │
│ ┌─────┐ ┌─────┐         │
│ │Game │ │Game │          │
│ └─────┘ └─────┘          │
├──────────────────────────┤
│ Sports / Big Wins        │
├──────────────────────────┤
│ Footer Content           │
├──────────────────────────┤
│ 🏠  🎰  📋  👤          │ Bottom Tab Bar (56px)
└──────────────────────────┘
```

### Responsive Breakpoints
```
Mobile:  0 ~ 768px     (sidebar hidden, bottom tab visible)
Tablet:  768px ~ 1024px (sidebar collapsible)
Desktop: 1024px+        (sidebar visible, full layout)
```

### Spacing System
| Token | Value | Usage |
|-------|-------|-------|
| Section gap | 24-32px | Between major sections |
| Card padding | 16-20px | Card internal padding |
| Card border-radius | 8-12px | Card corners |
| Button border-radius | 20-24px | Pill shape buttons |
| Mobile bottom tab height | 56px | Fixed bottom nav |

---

## 4. Component Inventory

### 4.1 Header (.headerWrap.noColorIcon.v2Menu)
- Fixed top, 70px height
- Logo (left) → Top nav (Casino / Sports / DuckRace) → Balance display → Deposit button (gold gradient) → Notifications (bell + badge) → Profile avatar
- Mobile: Logo + hamburger menu + bell + avatar

### 4.2 Sidebar (#sidebar)
- Desktop: 270px expanded / 90px collapsed
- Mobile: Hidden, overlay on hamburger tap
- 13 game categories with icons:
  Local Games, New Releases, Hot Games, Slots, Live Casino, Sports, Fishing, Card Game, Lottery, ESports, 3D, Arcade, Marble
- Promotional shortcuts: Check-In, Gifts, VIP, Roulette, Quest Hub
- Bottom: Language selector + Theme toggle (Light/Dark)

### 4.3 Hero Banner (.flagshipSignup + .home-slider)
- Full-width carousel, 3 slides, auto-play with dots
- "SIGN UP & GET REWARD UP TO $20,000.00" CTA
- Social login icons (Google, Facebook, Telegram, Line)

### 4.4 Game Cards Grid (.game-list)
- Category tabs: Local / New / Hot / Slots / LiveCasino / Fishing / CardGame / Lottery / Arcade / Marble
- Desktop: 4~6 columns
- Mobile: 3 columns
- Each card: thumbnail + RTP badge (top-left) + name + "Play Now" hover + provider name (bottom-right)

### 4.5 Sports Section (.live-sports / .upComingMatchSection)
- Horizontal carousel with prev/next buttons
- Card: League → Teams (logos) → Handicap odds → Live indicator badge
- Background: Dark blue/violet gradient variants

### 4.6 Bet History Table
- Tabs: Latest Bet / High Roller
- Columns: Game, Player, Bet amount, Multiplier, Profit
- Profit: Green (+) / Red (-)

### 4.7 News Section
- Tabs: Default / About KZING / Special Bonus
- Article content with "Read More" button

### 4.8 VIP Level Cards
- Horizontal scroll of level cards (VIP 0-3+)
- Current level: orange/gold gradient highlight
- Progress bars for upgrade/maintain requirements
- VIP Exclusive: 2-column benefits grid (Withdrawal limits, Daily/Weekly/Monthly Bonus, Birthday Bonus)

### 4.9 Promotion Cards
- Desktop: 2-column grid / Mobile: single column
- Vivid illustration images with overlaid text
- Filter tabs: All / 7 Days Check-in / General Activity / Gift Bonus

### 4.10 Check-In Bonus
- 7-day calendar (3+3+1 layout)
- Day 1-6: circle checkmarks / Day 7: gift box icon (gold bg)
- "Check-In Now" gold CTA button

### 4.11 Profile/Landing Page
- User card: Avatar + username + VIP badge + last login
- Quick actions: Deposit, Withdraw, Transfer, VIP
- General: Personal Profile, My Wallet, Banking, Transaction Records, Quests Hub, Bet History, KYC
- Service: Sponsor, Affiliate, Referrer, Referral, Support, Help
- Sports: Preferred Odds, Tutorial

### 4.12 Footer (.footerWrap.v2Footer)
- Desktop 4-column: Responsible Gambling | Games | Info | Social
- Payment Methods: UPI, NetBanking, GPay, Bitcoin, Crypto, LocalBank, VISA, Mastercard
- Currencies: BRL, CNY, PHP, IDR, INR, JPY, KRW, MXN, THB, TRY, VND, BDT
- Crypto: BTC, ETH, USDT
- Copyright text

### 4.13 Bottom Navigation (Mobile only)
- Fixed, 56px height, 5 tabs
- Menu (hamburger) | Home | Affiliate | Bet History | My

---

## 5. Image Assets Reference

이미지를 user-page에서 사용하려면 kz디자인에서 복사하거나, public/ 폴더에 배치 후 참조.

### Category Icons (13개)
`/Users/mr.joo/Desktop/kz디자인/design-system/images/category-icons/`
```
3d.webp, arcade.webp, card_game.webp, esports.webp, fishing.webp,
hot_games.webp, live_casino.webp, local_games.webp, lottery.webp,
marble.webp, new_releases.webp, slots.webp, sports.webp
```

### Logo (4개)
`/Users/mr.joo/Desktop/kz디자인/design-system/images/logo/`
```
kzb_logo.png, kzb_logo_dark.png, favicon.ico, icon-128.png
```

### Banners (3개)
`/Users/mr.joo/Desktop/kz디자인/design-system/images/banners/`
```
banner_1.webp, banner_2.webp, banner_3.webp
```

### UI Icons (43개)
`/Users/mr.joo/Desktop/kz디자인/design-system/images/ui-icons/`
- Navigation: home_icon, menu_icon, arrow_back, left_arrow, right_arrow, sidebar_arrow
- Actions: play_icon, play_icon_2, search_icon, icon_copy, icon_close
- Game: icon_casino, icon_sport, icon_duckrace, icon_dice, icon_favourite
- User: icon_username, icon_password, icon_eye_hide, icon_captcha, my_icon
- Status: icon_bell, notification_icon, recommend, betrecord_icon, live_support

### Provider Logos (15개)
`/Users/mr.joo/Desktop/kz디자인/design-system/images/providers/`
```
bti, evolution, ezugi, fc_slot, im, jili, kingmaker,
marblemagic, mwg, og, pg, playtech, pragmatic_play, saba, spribe
```

### Social Icons (18개)
`/Users/mr.joo/Desktop/kz디자인/design-system/images/social/`
```
facebook, google, telegram, line, twitter_x, whatsapp, zalo,
tiktok, linkedin, wechat (+ v2 variants)
```

### Currency Icons (16개)
`/Users/mr.joo/Desktop/kz디자인/design-system/images/currency/`
```
BDT, BRL, CNY, COP, ETH, IDR, INR, JPY,
KRW, MBTC, MXN, PHP, THB, TRY, USDT, VND
```

### Payment Icons (8개)
`/Users/mr.joo/Desktop/kz디자인/design-system/images/payment-icons/`
```
bitcoin, crypto, gpay, local_bank, mastercard, net_banking, upi, visa
```

### Theme/Feature Images (35개)
`/Users/mr.joo/Desktop/kz디자인/design-system/images/theme/`
- VIP: vip_banner, vip_icon.gif
- Check-in: checkin_banner, checkin_icon.gif
- Mission: mission_banner, mission_icon.gif
- Feature: feature_casino, feature_sports, feature_marble, feature_gp1/2/14
- UI: profile_icon, promotion_icon, provider_icon, sponsor_icon, affiliate_icon, cs_icon, news_icon
- Games: baccarat, blackjack, roulette, roulette_banner
- Theme: theme_dark, theme_light
- Other: responsible_gambling, age_limit_21, fifa_floating.gif, gift_banner, gift_reward_icon.gif

---

## 6. HTML Reference 사용법

특정 컴포넌트의 정확한 HTML 구조를 알고 싶을 때:

```bash
# 데스크톱 로비 전체 HTML
Read /Users/mr.joo/Desktop/kz디자인/design-system/html/로비/lobby-rendered.html

# 모바일 로비
Read /Users/mr.joo/Desktop/kz디자인/design-system/html/모바일/mobile-lobby-rendered.html

# 특정 섹션의 클래스명 검색
Grep "sectionSpace" /Users/mr.joo/Desktop/kz디자인/design-system/html/로비/lobby-rendered.html
Grep "game-list" /Users/mr.joo/Desktop/kz디자인/design-system/html/로비/lobby-rendered.html
```

### Key CSS Class Names
| Class | Component |
|-------|-----------|
| `.headerWrap.noColorIcon.v2Menu` | Header |
| `#sidebar` | Sidebar navigation |
| `.game-page.home-yellow` | Main content area |
| `.footerWrap.v2Footer` | Footer |
| `.flagshipSignup` | Hero/signup banner |
| `.home-slider` | Image carousel |
| `.game-list` | Game category grid |
| `.casinoProvider` | Provider logos |
| `.standalone-category-list` | Category tabs |
| `.live-sports` / `.upComingMatchSection` | Sports section |
| `.sectionSpace` | Section wrapper |
| `.titleSection` | Section title (icon + text + View All) |
| `.gameRollover` | Game card hover effect |
| `.tabBar` | Mobile bottom nav |
| `.mobileMenu` | Mobile hamburger menu |
| `.yellow-dark` | Dark theme class |
| `.yellow-light` | Light theme class |

---

## 7. CSS Reference 사용법

정확한 CSS 값이 필요할 때:

```bash
# 특정 클래스의 스타일 검색
Grep ".headerWrap" /Users/mr.joo/Desktop/kz디자인/design-system/css/app.css
Grep ".game-list" /Users/mr.joo/Desktop/kz디자인/design-system/css/chunk-main.css

# 전체 CSS 변수 확인
Read /Users/mr.joo/Desktop/kz디자인/design-system/theme-variables.json
```

---

## 8. Tech Stack (Original → Target Mapping)

| Layer | Original (kzkzb.com) | Target (user-page) |
|-------|---------------------|---------------------|
| Framework | Vue.js 2.x (SPA) | Next.js (React) |
| UI Library | Ant Design Mobile | shadcn/ui + Tailwind |
| CSS | CSS Custom Properties + BEM | Tailwind CSS v4 |
| Fonts | Inter (variable), ProximaNova | Same (copy fonts) |
| Routing | Vue Router | Next.js App Router |
| Theme | `.yellow-dark` / `.yellow-light` class toggle | `next-themes` dark/light |

### Migration Notes
1. **Theme System**: CSS Custom Properties → Tailwind CSS custom properties in `globals.css`
2. **Dark/Light Mode**: `.yellow-dark`/`.yellow-light` → `next-themes`의 `dark` class
3. **Layout**: Vue SPA layout → Next.js layout.tsx (header/sidebar/footer 공유)
4. **Components**: Vue components → React TSX + shadcn/ui base
5. **Fonts**: `design-system/fonts/` → `user-page/frontend/public/fonts/` 에 복사
6. **Images**: `design-system/images/` → `user-page/frontend/public/images/` 에 복사

---

## 9. Implementation Checklist

user-page 구현 시 아래 순서로 진행:

### Phase 1: Foundation
- [ ] fonts/ 복사 → public/fonts/
- [ ] images/ 복사 → public/images/
- [ ] globals.css에 CSS custom properties 설정 (위 Tailwind 매핑 참조)
- [ ] next-themes 설정 (dark mode default)

### Phase 2: Layout Shell
- [ ] Header (70px, fixed, logo + nav + balance + deposit + bell + avatar)
- [ ] Sidebar (270px/90px, game categories, theme toggle)
- [ ] Footer (4-column, payments, currencies, copyright)
- [ ] Mobile bottom tab bar (56px, 5 tabs)

### Phase 3: Main Pages
- [ ] Lobby page (hero + games grid + sports + bet table + news)
- [ ] Casino/Slots/Sports category pages
- [ ] VIP page
- [ ] Promotions page
- [ ] Profile/Member landing page
- [ ] Check-in page
- [ ] Affiliate page

### Phase 4: Polish
- [ ] Responsive breakpoints (mobile/tablet/desktop)
- [ ] Animations (marquee, carousel, hover effects)
- [ ] Dark/Light theme toggle
- [ ] Pixel-perfect 비교 검증 (screenshots vs implementation)

---

## 10. Quick Reference Card

```
Primary Yellow:    #feb614
CTA Gradient:      linear-gradient(180deg, #ffd651, #fe960e)
Dark BG:           #252531
Dark BG Secondary: #2c2d33
Light BG:          #f1f2f7
Text Primary Dark: #98a7b5
Text Primary Light:#31373d
Error Red:         #ff4848
Border Dark:       #484a51
Border Light:      #e8e8e8

Header:  70px fixed
Sidebar: 270px / 90px
Mobile Bottom: 56px
Card Radius: 8-12px
Button Radius: 20-24px (pill)
Body Font: 14px / 400
Section Title: 18px / 700
```
