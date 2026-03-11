# Renewal Guide - Product Requirements Document

## Original Problem Statement
Build a renewal guide webpage to send to clients showing:
- Current rent with editable input
- Slider with 4 lock-in options (No lock-in, 6, 9, 11 months)
- Standard escalation (custom editable field)
- Offers/pricing based on lock-in:
  - No lock-in: 0% discount
  - 6 months: 30% discount
  - 9 months: 40% discount
  - 11 months: 50% discount
- Monthly rent price and total savings over 11 months

## User Personas
- **Property Manager/Landlord**: Sends renewal guide links to tenants
- **Tenant/Client**: Views renewal options and savings

## Core Requirements
- Modern & minimal design (black/white/grey theme)
- Gamified savings display (green highlighting)
- Clean, professional UI
- Responsive design for mobile

## What's Been Implemented (Jan 2026)
- ✅ Current rent input field with INR formatting
- ✅ Standard escalation input (percentage)
- ✅ 4-option lock-in slider with clickable markers
- ✅ Dynamic discount calculations
- ✅ New monthly rent display with animation
- ✅ Total savings display (green glow effect)
- ✅ Responsive mobile layout
- ✅ Dark theme with zinc/green accent colors

## Calculation Logic
- Escalation Amount = Current Rent × Escalation %
- Discount = Escalation Amount × Lock-in Discount %
- New Rent = Current Rent + Escalation - Discount
- Total Savings = Discount × 11 months

## Prioritized Backlog
### P0 (Critical) - DONE
- [x] Core calculator functionality
- [x] Lock-in slider
- [x] Savings display

### P1 (High)
- [ ] HubSpot integration (pull rent from "Contracts" > "Total retail rent")
- [ ] Shareable URL with pre-filled values

### P2 (Medium)
- [ ] PDF export of renewal terms
- [ ] Email sending functionality
- [ ] Custom branding/logo support

## Next Tasks
1. HubSpot API integration when user provides API key
2. URL parameters for pre-filling values
