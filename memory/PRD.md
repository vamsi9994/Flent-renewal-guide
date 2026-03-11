# Renewal Guide - Product Requirements Document

## Original Problem Statement
Build a renewal guide webpage to send to clients showing:
- Current rent with editable input
- Slider with 4 lock-in options (No lock-in, 6, 9, 11 months)
- Standard escalation (custom editable field)
- Offers/pricing based on lock-in discounts
- Submit button to send tenant's choice to agreements@flent.in
- Confirmation email to tenant

## User Personas
- **Property Manager/Landlord**: Sends renewal guide links to tenants
- **Tenant/Client**: Views renewal options, selects choice, submits

## What's Been Implemented (Jan 2026)
- ✅ Current rent input field with INR formatting
- ✅ Standard escalation input (percentage)
- ✅ 4-option lock-in slider with clickable markers
- ✅ Dynamic discount calculations (0%/30%/40%/50%)
- ✅ New monthly rent display with animation
- ✅ Total savings display (green glow effect)
- ✅ Program introduction section
- ✅ FAQ accordion section (4 questions)
- ✅ Submit section with email/name inputs
- ✅ URL parameters for pre-filling: `?email=x&name=y&rent=z&escalation=w`
- ✅ Backend API: POST /api/renewal/submit
- ✅ Submissions stored in MongoDB
- ⚠️ Email sending (requires valid Resend API key)

## URL Parameters
Example: `yoursite.com?email=tenant@example.com&name=John&rent=55000&escalation=10`
- `email` - Pre-fills tenant email
- `name` - Pre-fills tenant name  
- `rent` - Pre-fills current rent
- `escalation` - Pre-fills escalation percentage

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
- [x] Submit button with form
- [x] Backend API endpoint

### P1 (High) - PENDING
- [ ] Email delivery (need valid Resend API key)
- [ ] HubSpot integration for rent data

### P2 (Medium)
- [ ] PDF export of renewal terms
- [ ] Custom branding/logo support

## Next Tasks
1. Provide valid Resend API key for email functionality
2. HubSpot API integration when ready
