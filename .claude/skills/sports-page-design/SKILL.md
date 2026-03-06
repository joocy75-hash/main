# Sports Page Design Specification (FROZEN)

> **Status**: LOCKED - DO NOT MODIFY
> **File**: `user-page/frontend/src/app/(main)/sports/page.tsx`
> **Last Updated**: 2026-03-06
> **Purpose**: This skill defines the EXACT design of the user-page sports betting page. Any modification request MUST preserve every detail documented here.

---

## ABSOLUTE RULE

**This design is FROZEN. When modifying the sports page:**
1. DO NOT change any color values
2. DO NOT change any spacing/padding/margin values
3. DO NOT change any font sizes or weights
4. DO NOT change the layout structure
5. DO NOT change shadow values
6. DO NOT change gradient directions or stops
7. DO NOT remove or reorder any UI sections
8. DO NOT change the component hierarchy

**If a change is required**, it must be explicitly requested by the user and documented as a delta from this specification.

---

## 1. Page Layout

```
┌─────────────────────────────────────────────────────────┐
│  min-h-screen bg-[#f4f6f9] text-[#333] font-sans       │
│  pb-10 flex border-t border-[#ddd]                      │
│                                                         │
│  ┌─ Container ────────────────────────────────────────┐ │
│  │  flex-1 max-w-[1300px] mx-auto flex gap-4          │ │
│  │  mt-0 px-2                                         │ │
│  │                                                    │ │
│  │  ┌─ LEFT (flex-1) ──┐  ┌─ RIGHT (w-[300px]) ──┐  │ │
│  │  │  Events Table     │  │  Bet Slip Sidebar     │  │ │
│  │  │                   │  │  (sticky top-[80px])   │  │ │
│  │  │                   │  │  hidden lg:block       │  │ │
│  │  └───────────────────┘  └───────────────────────┘  │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## 2. Sport Icons Grid

- Container: `flex gap-2 overflow-x-auto pb-4 pt-2 px-2 scrollbar-hide`
- Each button: `shrink-0 w-[78px] h-[96px] rounded-xl flex flex-col items-center justify-between py-2`
- Hover: `hover:-translate-y-1`

### Active State (selected sport)
```
bg-gradient-to-b from-[#4da1ff] to-[#1e6adb]
text-white
shadow: inset 0 -4px 0 rgba(0,0,0,0.2),
        inset 0 3px 5px rgba(255,255,255,0.6),
        0 5px 10px rgba(30,106,219,0.5)
```

### Inactive State
```
bg-gradient-to-b from-[#ffffff] to-[#e4e9f0]
text-[#444]
shadow: inset 0 -4px 0 rgba(180,186,195,0.4),
        inset 0 3px 5px rgba(255,255,255,0.9),
        0 4px 6px rgba(0,0,0,0.06)
hover shadow: inset 0 -4px 0 rgba(180,186,195,0.4),
              inset 0 3px 5px rgba(255,255,255,0.9),
              0 6px 10px rgba(0,0,0,0.1)
```

### Icon Circle (Active)
```
w-[46px] h-[46px] rounded-full
bg-gradient-to-br from-white/30 to-white/5
shadow: inset 0 2px 4px rgba(0,0,0,0.15)
ring-1 ring-white/30
```

### Icon Circle (Inactive)
```
w-[46px] h-[46px] rounded-full
bg-gradient-to-br from-[#ffffff] to-[#f0f3f6]
shadow: inset 0 3px 6px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.08)
ring-1 ring-[#e2e7ec]
```

### Label
- Active: `text-[12px] font-extrabold text-white drop-shadow-sm`
- Inactive: `text-[12px] font-extrabold text-[#5b6571] drop-shadow-sm`

### Count Pill
- Active: `text-[10px] w-12 text-center rounded-full py-[3px] font-black bg-[#0b4792] text-white shadow: inset 0 1px 3px rgba(0,0,0,0.4), 0 1px 1px rgba(255,255,255,0.2)`
- Inactive: `text-[10px] w-12 text-center rounded-full py-[3px] font-black bg-[#8995a5] text-white shadow: inset 0 1px 3px rgba(0,0,0,0.3), 0 1px 1px rgba(255,255,255,0.8)`

## 3. Main Table Container

```
bg-white rounded-xl
shadow: 0 4px 12px rgba(0,0,0,0.05)
border border-[#e5e9f0]
text-[#444] overflow-hidden
```

### Header Columns
```
flex bg-gradient-to-b from-[#fafbfc] to-[#f0f3f6]
border-b border-[#e2e6eb] py-[10px] text-[12px]
shadow: inset 0 1px 0 white
```

Column widths:
- 경기일시: `w-[100px]`
- 구분: `w-[80px]`
- 승(홈)오버: `flex-[3]` with red arrow `text-[#ff5c5c] text-[9px]`
- 무/핸/합: `flex-[1] min-w-[60px] max-w-[70px]`
- 패(원정)언더: `flex-[3]` with blue arrow `text-[#4da1ff] text-[9px]`
- 정보: `w-[70px]`

All column text: `font-extrabold text-[#6b7583]`

## 4. Bonus Event Banner

```
m-3 bg-white rounded-xl border border-[#eab16f]
shadow: 0 4px 10px rgba(234,177,111,0.2)
flex items-stretch h-[86px] overflow-hidden relative
```

### Red Gift Section (left)
```
w-[76px] bg-gradient-to-b from-[#ff6b52] to-[#da2a13]
border-r border-[#ba200e]
shadow: inset 0 -4px 0 rgba(0,0,0,0.15), inset 0 2px 4px rgba(255,255,255,0.3)
Icon: 🎁 text-4xl drop-shadow-[0_3px_5px_rgba(0,0,0,0.4)]
```

### Orange Content Section
- Top (55%): `bg-gradient-to-r from-[#ffbd59] to-[#f29432]`
  - Border bottom: `border-[#e28322]`
  - Shadow: `inset 0 -2px 0 rgba(0,0,0,0.08), inset 0 2px 4px rgba(255,255,255,0.4)`
  - Title: `text-[#fffbf0] font-black tracking-wider text-[22px] drop-shadow-[0_2px_3px_rgba(180,80,0,0.6)]`
  - Slant cutout bg: `#fff6e0`, clipPath: `polygon(40px 0%, 100% 0, 100% 100%, 0% 100%)`

- Bottom tools:
  - Date: `font-extrabold text-[#444] tracking-tighter text-[12px]`
  - "보너스" label: `font-black text-[#d67a1b] drop-shadow-sm`
  - Orange pill buttons: `bg-gradient-to-b from-[#ffb15c] to-[#e87a1a] border-[#c4600e] text-white rounded-full shadow: inset 0 -2px 0 rgba(0,0,0,0.15), 0 2px 4px rgba(232,122,26,0.3)`

## 5. Filter Bar

```
flex items-center justify-between px-4
border-b border-[#e5e9f0] pb-3 mb-[12px]
bg-gradient-to-b from-white to-[#fcfcfd]
```

- Left folder icon: `bg-[#f4f6f9] px-3 py-1.5 rounded-lg shadow-inner border border-[#e8eaef]`
  - Icon: 📁 text-[18px]
  - Text: `text-[14px] font-extrabold text-[#4a5568]`

- Filter buttons: `h-[32px] bg-gradient-to-b from-white to-[#f0f3f6] px-3 text-[12px] font-bold rounded-lg text-[#5b6571]`
  - Shadow: `inset 0 -2px 0 rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.05)`
  - Ring: `ring-1 ring-[#d1d7e0]`
  - Dropdown arrow: `text-[9px] text-[#8995a5]`

## 6. League Sections

### getFlagAndName() Logic (FROZEN)
```
1. Extract country from parentheses: "League Name (Country)" → cleanedName + countryStr
2. Flag lookup priority (3 levels):
   - Priority 0: event.countryName from backend (Korean country name)
   - Priority 1: countryStr match in flag map (case-insensitive)
   - Priority 2: cleanedName match in flag map (case-insensitive)
   - Fallback: 🌐
3. League name translations: 50+ entries via leagueTranslations map
4. toggleBet uses displayName (translated name), NOT raw league
```

### League Header (Glossy 3D Blue)

```
bg-gradient-to-r from-[#2c7de0] via-[#4da1ff] to-[#eaf2fc]
h-[38px] border-b border-[#1e6adb]
```

- Gloss overlay: `h-[50%] bg-gradient-to-b from-white/30 to-transparent`
- Left tag container: `bg-gradient-to-r from-[#1e6adb] to-[#3a8ef2] min-w-[320px]`
  - clipPath: `polygon(0 0, 100% 0, calc(100% - 25px) 100%, 0 100%)`
  - Shadow: `4px 0 10px rgba(0,0,0,0.2)`
  - 3D League Badge: `size-[22px] rounded-full bg-gradient-to-b from-white to-[#e2e8f0] border border-white/50 text-[12px] text-[#475569] shadow: inset 0 -2px 0 rgba(0,0,0,0.2), 0 2px 4px rgba(0,0,0,0.3) shrink-0 overflow-hidden`
    - Priority 1: If `leagueLogo` exists: `<img> w-full h-full object-contain p-[1px] bg-white`
    - Priority 2: If `countryFlag` URL exists: `<img> w-full h-full object-cover`
    - Fallback: `<span> drop-shadow-sm` with flag emoji from fmap
  - League Name Block: `bg-white/10 px-2.5 py-0.5 rounded border border-white/20 shadow: inset 0 1px 3px rgba(255,255,255,0.1)`
    - Icon: `text-[12px] opacity-90`
    - Name: `tracking-wide text-[13.5px] truncate max-w-[200px]` (uses displayName)

### Match Rows
- Container: `px-2 py-2 bg-[#fbfcfd]`
- Row: `flex items-center py-[10px]`, separator: `border-b border-[#edf1f5]`

#### Left (Date/Type): `w-[184px]`
- Date: `text-[11.5px] text-[#6b7583] font-bold tracking-tight`
- Time: `text-[#3b82f6] text-[13px]`
- Type badge: `bg-white border border-[#e2e8f0] px-2 py-1 rounded-md shadow-sm`
  - "1x2": `font-extrabold text-[#2d3748]`
  - "(연장미포함)": `text-[9.5px] text-[#a0aec0] tracking-tighter`

#### Middle (Odds Block)
```
flex-1 max-w-[700px]
border border-[#d1d7e0] rounded-xl
bg-gradient-to-b from-[#f8fafc] to-[#eef2f6]
h-[48px]
shadow: inset 0 2px 4px rgba(0,0,0,0.02), 0 2px 5px rgba(0,0,0,0.04)
p-[2px]
```

- Team name: `text-[13.5px] text-[#2d3748] font-extrabold tracking-tight`
- Team logo circle: `size-7 rounded-full bg-gradient-to-b from-white to-[#e2e8f0] border border-[#cbd5e1]`
  - Shadow: `inset 0 -2px 0 rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.05)`
- Divider: `w-[2px] h-[70%] bg-gradient-to-b from-transparent via-[#cbd5e1] to-transparent mx-1`
- VS text (no draw): `text-[14px] font-black text-[#94a3b8]`

#### OddsButton Component
- Container: `flex-[1] min-w-[60px] max-w-[70px] text-[14px] font-black rounded-lg mx-0.5`
- Selected: `bg-gradient-to-b from-[#4da1ff] to-[#1e6adb] text-white shadow: inset 0 -3px 0 rgba(0,0,0,0.2), inset 0 2px 3px rgba(255,255,255,0.4), 0 3px 5px rgba(30,106,219,0.4) -translate-y-[1px]`
- Default: `bg-transparent text-[#475569] hover:bg-white hover:shadow: 0 2px 5px rgba(0,0,0,0.06), inset 0 -2px 0 rgba(0,0,0,0.02) hover:ring-[#e2e8f0]`
- Locked: `🔒 text-[#94a3b8] text-[15px]`

#### Right (+더보기)
```
w-[80px]
button: bg-gradient-to-b from-[#6b7583] to-[#4a5568]
text-white text-[11px] font-bold px-[12px] py-[8px] rounded-lg
shadow: inset 0 -3px 0 rgba(0,0,0,0.3),
        inset 0 2px 2px rgba(255,255,255,0.2),
        0 2px 4px rgba(0,0,0,0.15)
```

## 7. Bet Slip Sidebar

### Container
```
w-[300px] shrink-0 hidden lg:block
bg-white rounded-xl
shadow: 0 8px 20px rgba(0,0,0,0.08)
sticky top-[80px] overflow-hidden
ring-1 ring-[#e5e9f0]
```

### Header (Clock Section)
```
px-4 py-[10px]
bg-gradient-to-b from-[#f8fafc] to-[#f1f5f9]
border-b border-[#e2e8f0]
shadow: inset 0 1px 0 white
```
- Date: `text-[12px] text-[#64748b] font-bold`
- Time: `text-[#3b82f6] font-black text-[15px] tracking-tight`
- Icon buttons (🗑️, 🔄): `w-[34px] h-[34px] bg-gradient-to-b from-white to-[#f1f5f9] rounded-lg ring-1 ring-[#e2e8f0]`

### Tabs (Cart/History)
```
bg-[#f8fafc] p-1 gap-1
```
- Active tab: `bg-gradient-to-b from-[#4da1ff] to-[#1e6adb] text-white shadow: inset 0 -3px 0 rgba(0,0,0,0.2), 0 3px 6px rgba(30,106,219,0.3)`
- Inactive tab: `bg-transparent text-[#64748b] hover:bg-[#e2e8f0] hover:shadow-inner`
- Badge (active): `bg-[#ff5c5c] shadow: inset 0 1px 2px rgba(255,255,255,0.4)` w-[20px] h-[20px]
- Badge (inactive): `bg-[#94a3b8]`
- Tab text: `text-[14px] font-black`

### Empty State
```
bg-[#f1f5f9] text-[13px] font-bold text-[#94a3b8]
border-b border-[#e2e8f0] shadow-inner py-8
```

### Bet Cards (in slip)
```
bg-white rounded-lg p-[10px]
border border-[#e2e8f0]
shadow: 0 2px 4px rgba(0,0,0,0.03)
```
- League: `text-[11.5px] text-[#64748b] font-extrabold tracking-tight`
- Teams: `text-[12.5px] font-black text-[#1e293b]`
- "vs": `text-[#94a3b8] font-bold`
- Bet type badge: `text-[#3b82f6] font-extrabold text-[12.5px] bg-[#eff6ff] px-2 py-0.5 rounded border border-[#bfdbfe]`
- Odds: `text-[#ef4444] font-black text-[15px]`
- Remove button: `text-[#cbd5e1] hover:text-[#ef4444] text-[18px] hover:bg-[#fee2e2]`

### Stats Area
- Container: `p-4 bg-white text-[#475569] font-bold space-y-[12px] text-[13px]`
- 보유금액: `text-[18px] font-black text-[#3b82f6]` + 원: `text-[13px] text-[#94a3b8]`
- 베팅 최소금액: value `text-[#ef4444] font-extrabold`
- 베팅/적중 최대금액: value `font-extrabold text-[#334155]`
- Labels: `text-[#94a3b8] font-medium text-[12.5px]`

### Odds Total Box
```
py-[12px] my-[10px]
border-t border-b border-[#e2e8f0]
bg-gradient-to-r from-[#fef2f2] to-white px-2 rounded-md
```
- Label: `font-extrabold text-[#7f1d1d]`
- Value: `text-[18px] font-black text-[#ef4444]`

### Bet Amount Input
```
bg-[#f8fafc] p-2 rounded-lg border border-[#e2e8f0] shadow-inner
Input: w-[130px] h-[34px] bg-white border border-[#cbd5e1] rounded-md
       text-right px-3 text-[#ef4444] font-black text-[15px]
       focus:ring-2 focus:ring-[#3b82f6]
       shadow: inset 0 1px 2px rgba(0,0,0,0.05)
```

### Quick Amount Buttons (6)
```
grid grid-cols-3 gap-[6px]
h-[36px] bg-gradient-to-b from-white to-[#f1f5f9]
ring-1 ring-[#cbd5e1] text-[#475569] text-[13px] font-black rounded-lg
shadow: inset 0 -2px 0 rgba(0,0,0,0.05), 0 2px 3px rgba(0,0,0,0.05)
```
Values: `5,000 | 10,000 | 50,000 | 100,000 | 500,000 | 1,000,000`
Behavior: ADDITIVE (adds to current amount)

### Action Buttons (하프/최대/정정)
```
grid grid-cols-3 gap-[6px]
h-[38px]
```
- 하프/최대: `bg-gradient-to-b from-[#64748b] to-[#334155] text-white font-black text-[13px] rounded-lg shadow: inset 0 -3px 0 rgba(0,0,0,0.3), inset 0 2px 2px rgba(255,255,255,0.2), 0 3px 5px rgba(0,0,0,0.2)`
- 정정: `bg-gradient-to-b from-[#94a3b8] to-[#475569] text-white font-black text-[13px] rounded-lg` (same shadow)
- 하프 = amt / 2, 최대 = 7,000,000, 정정 = clear

### Submit Button (베팅하기)
```
w-full mt-4 h-[52px]
bg-gradient-to-b from-[#4da1ff] to-[#1e6adb]
hover: from-[#5cadef] to-[#1a5ca8]
text-white text-[17px] font-black rounded-xl
shadow: inset 0 -4px 0 rgba(0,0,0,0.2),
        inset 0 3px 5px rgba(255,255,255,0.4),
        0 8px 12px rgba(30,106,219,0.3)
active: translate-y-[2px]
```
- Cart icon circle: `w-[24px] h-[24px] bg-white/20 rounded-full shadow: inset 0 1px 2px rgba(0,0,0,0.2)`

## 8. Color Palette (Complete)

### Primary Blues
| Token | Hex | Usage |
|-------|-----|-------|
| primary-light | #4da1ff | Gradient start, active states |
| primary | #3b82f6 | Time display, links, badges |
| primary-dark | #1e6adb | Gradient end, borders |
| primary-deep | #0b4792 | Active count pill |
| primary-border | #2c7de0 | League header start |

### Reds / Warnings
| Token | Hex | Usage |
|-------|-----|-------|
| red-accent | #ef4444 | Odds, amounts, remove |
| red-badge | #ff5c5c | Cart count badge, up arrow |
| red-gift-start | #ff6b52 | Gift section gradient start |
| red-gift-end | #da2a13 | Gift section gradient end |
| red-bg | #fef2f2 | Odds total background |
| red-deep | #7f1d1d | 배당률합계 label |

### Oranges (Bonus Banner)
| Token | Hex | Usage |
|-------|-----|-------|
| orange-light | #ffbd59 | Banner gradient start |
| orange | #f29432 | Banner gradient end |
| orange-btn-start | #ffb15c | Pill button gradient start |
| orange-btn-end | #e87a1a | Pill button gradient end |
| orange-border | #c4600e | Pill button border |
| orange-text | #d67a1b | "보너스" label |
| orange-cream | #fff6e0 | Banner background |
| orange-warm | #eab16f | Banner border |

### Grays (UI Structure)
| Token | Hex | Usage |
|-------|-----|-------|
| bg-page | #f4f6f9 | Page background |
| bg-card | #fbfcfd | Match row background |
| bg-header | #fafbfc → #f0f3f6 | Table header gradient |
| bg-input | #f8fafc | Input container background |
| bg-slip-empty | #f1f5f9 | Empty bet slip |
| text-primary | #333 | Page text |
| text-dark | #2d3748 | Match type, team names |
| text-secondary | #444 | Card text |
| text-muted | #475569 | Odds text, stat values |
| text-label | #5b6571 | Filter labels |
| text-column | #6b7583 | Column headers, date |
| text-placeholder | #94a3b8 | Placeholders, VS |
| text-light | #a0aec0 | Sub-labels |
| text-faint | #64748b | Sidebar labels |
| border-light | #e5e9f0 | Card borders |
| border-medium | #e2e8f0 | Inner borders |
| border-input | #cbd5e1 | Input borders, dividers |
| border-outer | #d1d7e0 | Odds block border |
| btn-dark-start | #6b7583 | +더보기 gradient start |
| btn-dark-end | #4a5568 | +더보기 gradient end |
| btn-action-start | #64748b | 하프/최대 gradient start |
| btn-action-end | #334155 | 하프/최대 gradient end |
| btn-reset-start | #94a3b8 | 정정 gradient start |

## 9. Typography

| Element | Size | Weight | Tracking |
|---------|------|--------|----------|
| Sport button label | 12px | 800 (extrabold) | default |
| Sport count pill | 10px | 900 (black) | wide |
| Column header | 12px | 800 | default |
| Bonus title | 22px | 900 | wider |
| Filter text | 14px | 800 | default |
| Filter button | 12px | 700 | default |
| League badge icon | 12px | - | default |
| League name | 13.5px | - | wide |
| Match date | 11.5px | 700 | tight |
| Match time | 13px | - | default |
| Team name | 13.5px | 800 | tight |
| Odds value | 14px | 900 | default |
| Clock time | 15px | 900 | tight |
| Tab label | 14px | 900 | default |
| Stat value (big) | 18px | 900 | default |
| Stat label | 12.5px | 500 | default |
| Bet button text | 17px | 900 | default |
| +더보기 button | 11px | 700 | default |

## 10. Interaction Behaviors

### Bet Selection
- Click odds button → toggle in/out of betSlip array
- Selected state applies blue gradient + slight lift (-translate-y-[1px])
- Multiple bets = accumulator (multiply all odds)

### Quick Amount Buttons
- **ADDITIVE**: clicking adds value to current amount (not replaces)
- 하프: divides current by 2
- 최대: sets to 7,000,000
- 정정: clears to empty

### Auto-refresh
- Clock updates every 1 second
- Sport events refetch when category changes

### Flag Mapping (50+ Countries, KO+EN Keys)

```
Americas:
  콜롬비아/Colombia→🇨🇴, 과테말라/Guatemala→🇬🇹,
  브라질/Brazil→🇧🇷, 아르헨티나/Argentina→🇦🇷,
  미국/USA/NBA/NHL/MLB/NFL/MLS→🇺🇸, 캐나다/Canada→🇨🇦,
  멕시코/Mexico→🇲🇽, 칠레/Chile→🇨🇱, 파라과이/Paraguay→🇵🇾,
  우루과이/Uruguay→🇺🇾, 페루/Peru→🇵🇪, 에콰도르/Ecuador→🇪🇨

Europe:
  잉글랜드/England/프리미어리그→🇬🇧, 스페인/Spain/라리가→🇪🇸,
  이탈리아/Italy→🇮🇹, 독일/Germany→🇩🇪, 프랑스/France→🇫🇷,
  챔피언스/Europe→🇪🇺, 포르투갈/Portugal→🇵🇹, 네덜란드/Netherlands→🇳🇱,
  터키/Turkey/Türkiye→🇹🇷, 벨기에/Belgium→🇧🇪, 스위스/Switzerland→🇨🇭,
  오스트리아/Austria→🇦🇹, 스코틀랜드/Scotland→🏴󠁧󠁢󠁳󠁣󠁴󠁿,
  러시아/Russia→🇷🇺, 우크라이나/Ukraine→🇺🇦, 그리스/Greece→🇬🇷,
  덴마크/Denmark→🇩🇰, 스웨덴/Sweden→🇸🇪, 노르웨이/Norway→🇳🇴,
  폴란드/Poland→🇵🇱, 체코/Czech→🇨🇿, 크로아티아/Croatia→🇭🇷,
  세르비아/Serbia→🇷🇸, 루마니아/Romania→🇷🇴

Asia/Oceania:
  한국/Korea/LCK/KBO/K리그→🇰🇷, 일본/Japan/NPB→🇯🇵, 중국/China→🇨🇳,
  사우디/Saudi→🇸🇦, 이란/Iran→🇮🇷, 인도/India→🇮🇳,
  태국/Thailand→🇹🇭, 베트남/Vietnam→🇻🇳, 인도네시아/Indonesia→🇮🇩,
  호주/Australia→🇦🇺

Africa:
  이집트/Egypt→🇪🇬, 남아공/South Africa→🇿🇦,
  모로코/Morocco→🇲🇦, 나이지리아/Nigeria→🇳🇬

International:
  국제/World/International→🌍, default→🌐
```

### League Name Translations (50+ Entries via leagueTranslations Map)

```
European Top:
  'Premier League'→'프리미어리그', 'La Liga'→'라리가', 'Bundesliga'→'분데스리가',
  'Serie A'→'세리에 A', 'Ligue 1'→'리그 1'

European Cups:
  'Champions League'→'챔피언스리그', 'Europa League'→'유로파리그',
  'Europa Conference League'→'컨퍼런스리그', 'FA Cup'→'FA컵',
  'Copa del Rey'→'코파 델 레이', 'DFB Pokal'→'DFB 포칼',
  'Coppa Italia'→'코파 이탈리아', 'Coupe de France'→'쿠프 드 프랑스',
  'EFL Cup'→'EFL컵'

European Lower/Other:
  'EFL Championship'→'EFL 챔피언십', 'Eredivisie'→'에레디비시',
  'Primeira Liga'→'프리메이라리가', 'Super Lig'→'쉬페르리그',
  'Scottish Premiership'→'스코티시 프리미어십', 'Pro League'→'프로리그',
  'Super League'→'슈퍼리그', 'Bundesliga 2'→'분데스리가 2',
  'Serie B'→'세리에 B', 'Ligue 2'→'리그 2', 'Segunda Division'→'세군다'

Asian:
  'J1 League'→'J1리그', 'J2 League'→'J2리그',
  'K League 1'→'K리그1', 'K League 2'→'K리그2', 'A-League'→'A리그'

Americas:
  'MLS'→'MLS', 'Liga MX'→'리가 MX',
  'Copa Libertadores'→'코파 리베르타도레스', 'Copa Sudamericana'→'코파 수다메리카나',
  'Copa do Brasil'→'코파 두 브라질', 'Brasileirão Série A'→'브라질레이랑',
  'Argentine Primera'→'아르헨티나 프리메라'

International:
  'World Cup Qualifiers'→'월드컵 예선', 'UEFA Nations League'→'UEFA 네이션스리그',
  'International Friendly'→'국제 친선경기', 'AFC Champions League'→'AFC 챔피언스리그'

Other Sports:
  'NBA'→'NBA', 'NHL'→'NHL', 'MLB'→'MLB', 'NFL'→'NFL',
  'KBO'→'KBO', 'NPB'→'NPB', 'KBL'→'KBL',
  'ATP'→'ATP 투어', 'WTA'→'WTA 투어'

All others → original cleanedName (parenthesis-extracted)
```

### Sport Icon Mapping
```
football→⚽, basketball→🏀, hockey→🏒, baseball→⚾, default→🎾
```

### No-Draw Sports
- When odds.d === 'VS' → show "VS" text instead of draw button
- Applies to basketball, hockey, etc.

## 11. Component Tree

```
SportsPage
├── Sport Icons Grid (horizontal scroll)
│   └── Sport Button × N (icon circle + label + count pill)
├── Main Table Container
│   ├── Header Columns (6 columns)
│   ├── Bonus Event Banner (gift + orange content)
│   ├── Filter Bar (folder icon + league/country dropdowns)
│   └── League Sections × N
│       ├── League Header (glossy blue with angled tag)
│       └── Match Rows × N
│           ├── Date/Type (left w-[184px])
│           ├── Odds Block (center, 3D container)
│           │   ├── Home Team (name + logo)
│           │   ├── OddsButton (home)
│           │   ├── Divider
│           │   ├── OddsButton/VS (draw)
│           │   ├── Divider
│           │   ├── OddsButton (away)
│           │   └── Away Team (name + logo)
│           └── +더보기 Button (right w-[80px])
└── Bet Slip Sidebar (right, sticky)
    ├── Clock Header (date + time + actions)
    ├── Tabs (cart / history)
    ├── Bet Cards List (scrollable max-h-[220px])
    ├── Stats Section
    │   ├── 보유금액
    │   ├── 베팅 최소/최대/적중 최대
    │   ├── 배당률합계
    │   ├── 베팅금액 Input
    │   ├── 적중예상금액
    │   ├── Quick Amount Grid (3×2)
    │   └── Action Buttons (하프/최대/정정)
    └── 베팅하기 Submit Button
```

---

## REFERENCE: Complete Source Code Snapshot

The authoritative source is:
`user-page/frontend/src/app/(main)/sports/page.tsx`

This skill documents the design as of 2026-03-06. Any future modification must be compared against this specification to ensure no unintended design regression occurs.
