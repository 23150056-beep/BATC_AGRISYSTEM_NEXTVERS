---
title: Design System & UI Tokens
domain: project
type: overview
tags: [design, tokens, colors, layout, components, ui-spec]
updated: 2026-05-12
---

# Design System & UI Tokens

## Color Palette

### Primary Brand
| Token | Hex | Usage |
|---|---|---|
| `--batc-green-primary` | `#3B6D11` | Buttons, active nav, call-to-action, primary actions |
| `--batc-green-interactive` | `#639922` | Hover states, links, focus rings, secondary actions |
| `--batc-green-surface` | `#EAF3DE` | Active table rows, selected states, subtle background |

### Navy (Admin/Staff Sidebars)
| Token | Hex | Usage |
|---|---|---|
| `--batc-navy-sidebar` | `#162036` | Admin sidebar background, Staff icon bar, topbar |
| `--batc-navy-hover` | `#1e2f4a` | Sidebar item hover/active background |
| `--batc-navy-text` | `#8aa0bb` | Sidebar inactive item text |
| `--batc-navy-text-active` | `#E8F0E0` | Sidebar active item text |

## Status Pills

Used in tables and detail views to show lifecycle state. Background + text color (accessible contrast).

| Status | Background | Text | Contexts |
|---|---|---|---|
| **Delivered** | `#EAF3DE` | `#27500A` | Distribution state, completed allocations |
| **Scheduled** | `#E6F1FB` | `#0C447C` | Distribution state, pending date |
| **Delayed** | `#FAEEDA` | `#633806` | Distribution state, past scheduled date |
| **Out of stock** | `#FCEBEB` | `#791F1F` | Inventory alert state |
| **Rescheduled** | `#F1EFE8` | `#444441` | Distribution state, updated schedule |
| **Unavailable** | `#FCEBEB` | `#791F1F` | Program state, not accepting applications |
| **Active** | `#EAF3DE` | `#27500A` | Program state, accepting applications |
| **Draft** | `#F1EFE8` | `#5F5E5A` | Application/Program state, not finalized |
| **Suspended** | `#FAEEDA` | `#633806` | Program state, temporarily not available |
| **Completed** | `#E6F1FB` | `#0C447C` | Program state, closed to new applications |

## Layout Specs

### Admin Layout
- **Sidebar:** 160px wide, dark navy background (`#162036`), dark text
- **Topbar:** Full width, contains user menu + logout
- **Content:** Outlet (React Router) takes remaining space
- **Navigation:** Vertical stack of menu items (Users, Programs, Inventory, Reports, Announcements)

### Staff Layout
- **Icon Sidebar:** 44px wide, icon-only navigation (collapsed)
- **Breadcrumb Topbar:** Full width, breadcrumb trail + user menu
- **Content:** Outlet takes remaining space
- **Responsive:** On mobile, sidebar collapses further or uses drawer

### Client Layout (Farmer)
- **Topbar:** Full width, dark navy, centered BATC logo + logout
- **Content:** Outlet in middle
- **Bottom Nav:** Fixed 4-tab navigation:
  1. **Home** — dashboard + quick actions
  2. **Programs** — browse + apply to programs
  3. **Claims** — view claim status + distributions
  4. **Profile** — own farmer profile + edit

## Component Tokens

### Buttons
- **Primary:** `bg-[--batc-green-primary] text-white hover:bg-[--batc-green-interactive]`
- **Secondary:** `bg-gray-100 text-gray-900 hover:bg-gray-200`
- **Danger:** `bg-red-500 text-white hover:bg-red-600`
- **Disabled:** `opacity-50 cursor-not-allowed`

### Forms
- **Input:** `border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-[--batc-green-interactive]`
- **Label:** `text-sm font-medium text-gray-700 mb-1`
- **Error:** `text-red-600 text-sm mt-1`
- **Required indicator:** Red asterisk `*`

### Tables
- **Row hover:** `hover:bg-[--batc-green-surface] cursor-pointer`
- **Active row:** `bg-[--batc-green-surface]`
- **Header:** `bg-gray-100 text-gray-900 font-semibold`
- **Pagination:** Centered below table, numbered buttons

### Cards
- **Background:** White
- **Border:** `border border-gray-200 rounded-lg`
- **Padding:** `p-4` (standard card padding)
- **Shadow:** `shadow-sm` (subtle shadow)

---

**Defined in:** `src/index.css` (Tailwind CSS variables + globals)  
**Updated:** 2026-05-12
