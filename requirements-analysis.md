# HIT-Website Project - Requirements Analysis & Feasibility Study

## Executive Summary

This document analyzes the feasibility of developing a comprehensive web-based event management system for the Higher Education Information Day (HIT) at ZSB Osnabrück within **1 month with a half-time position** using AI-assisted coding tools (vibe coding), compared with traditional development approaches.

**Current Status:** Existing website at https://www.zsb-os.de/hit-2025 needs to be replaced with a more sophisticated system.

**Target Users:** Hundreds to thousands of concurrent users (5-digit total visitor numbers during November events)

---

## Project Requirements Summary

### 1. Program Query System (Programmabfrage)

**Core Functionality:**
- Event management system handling dozens of parallel administrators
- Multi-field event data capture including:
  - Title and description (with character limits)
  - Event type classification (Vortrag, Laborführung, Rundgang, Workshop, Links to videos/OSAs, Photos, Infostand)
  - Location details with specific sub-options:
    - Infomarkt Schloss (table type, pinboard, power)
    - Infomarkt CN
    - Other locations
  - Free-text field for additional information
  - Lecturer details (name, title, email, building/room number)
  - Event organizer contact information (internal use only)
  - Time scheduling (except for links)
  - Room/location requests with meeting points for tours/lab visits
  - Association with study programs:
    - Single study program
    - Multiple study programs
    - Study program clusters
  - Association with information markets
  - Institution designation (HS-specific, Uni-specific, or cross-institutional)

### 2. Program Display (Programmdarstellung)

**Technical Requirements:**
- **Primary Option:** Web-based interface (preferred over Excel/Access)
- **Data Management:** 
  - Editable file format that can be shared with room/facility management
  - Automatic website generation from the data file
  - Support for incremental updates without full system rebuild
- **Performance Requirements:**
  - Early November: Several hundred parallel users
  - Mid-November: Several thousand parallel users
  - HIT event: 5-digit visitor numbers (not all concurrent)
- **Display Features:**
  - Multiple sortable list views:
    - Alphabetical by study program
    - By building/location
    - By time schedule
    - Other relevant sorting criteria

### 3. Participant Planning Support (Planungsunterstützung)

#### a. Shopping Cart / Schedule Builder (Warenkorb/Stundenplan)
- Create personalized event schedules
- Support multiple events per time slot with prioritization
- Schedule persistence across program updates
- User-friendly schedule visualization

#### b. Route Planner (Wegeplan)
- Directions from current location to next selected event
- Estimated walking time between venues
- Alerts when travel time between consecutive events is insufficient
- Integration with actual campus layout

#### c. Study Program Suggestions (Studiengangsvorschläge)
- AI-powered study program navigator for both Uni and Hochschule
- Display top ~10 relevant results
- Show associated study program clusters
- Reference to respective study program cluster information
- **Note:** Existing navigator already available with positive user feedback

#### d. Program Recommendations (Programmvorschläge)
- Generate event suggestions based on selected study programs
- Filter by available time windows
- Direct integration with shopping cart/schedule builder
- Smart recommendation algorithm

### 4. Additional Requirements from Email Correspondence

**Feedback on Existing Studiengangsnavigator:**
- Multi-subject programs (especially teaching degrees) need special handling
- Should link to specific pages/videos for subject combination rules
- 2-Fächer-Bachelor polyvalence presents challenges
- System tends to favor mono-bachelor programs over 2-subject combinations
- Some questions repeat during the process
- Initial question selection may be too restrictive
- Intermediate text should match displayed images
- Crisis detection in open questions with referral to appropriate support
- End results should reference: counseling services, trial programs, events, aptitude tests, additional information

**Operational Constraints:**
- Budget concerns from ZSB requiring cost estimates
- Need approval from vice presidents at both institutions
- Potential launch discussion scheduled for February 18, 2026
- Tight timeline expectations

---

## Technical Architecture Recommendation

### Frontend
- **Framework:** React or Next.js for modern, responsive UI
- **State Management:** Context API or Zustand for user schedules/cart
- **UI Library:** Tailwind CSS with shadcn/ui components
- **Routing:** Client-side navigation for optimal UX
- **Maps Integration:** Leaflet or Mapbox for route planning

### Backend
- **API Framework:** Node.js with Express or Next.js API routes
- **Database:** PostgreSQL for relational data (events, programs, locations)
- **Caching:** Redis for high-traffic event periods
- **Authentication:** Role-based access (admin, organizer, public)
- **File Generation:** Export capabilities for facility management

### Infrastructure
- **Hosting:** Cloud platform (Vercel, AWS, or Azure)
- **CDN:** Content delivery for static assets
- **Monitoring:** Error tracking and performance monitoring
- **Backup:** Automated database backups

### AI Components
- **Study Program Navigator:** LLM integration (Gemini 2.5 Fast currently used)
- **Recommendation Engine:** Custom algorithm with optional AI enhancement
- **Search:** Elasticsearch or Algolia for fast event searching

---

## Feasibility Analysis

### Scenario 1: AI-Assisted Development (Half-Time Position, 1 Month)

**Available Resources:**
- ~80 hours total (4 hours/day × 20 working days)
- AI coding tools (Cursor, GitHub Copilot, Claude, etc.)
- Existing studiengangsnavigator code/prompts as reference

**Realistic Scope for 1 Month Half-Time with AI Tools:**

**FEASIBLE (Core MVP):**
✅ Program query system with essential fields
✅ Basic admin interface for event management
✅ Public-facing event display with sorting
✅ Shopping cart / schedule builder basics
✅ Integration of existing study program navigator
✅ Basic program recommendations
✅ Data export for facility management

**CHALLENGING BUT POSSIBLE:**
⚠️ Route planner (simplified version with static map)
⚠️ Advanced sorting and filtering
⚠️ Performance optimization for thousands of concurrent users
⚠️ Responsive design across all devices

**NOT REALISTIC IN TIMEFRAME:**
❌ Sophisticated route planner with real-time directions
❌ Advanced AI recommendations beyond basic filtering
❌ Comprehensive crisis detection in open questions
❌ Full production-ready scalability testing
❌ Complete accessibility compliance
❌ Extensive multi-language support

**Risk Assessment:**
- **HIGH RISK:** The timeline is extremely aggressive even with AI assistance
- **QUALITY CONCERNS:** Testing and bug fixing may be insufficient
- **SCALABILITY CONCERNS:** Performance under thousands of concurrent users may not be adequately validated
- **TECHNICAL DEBT:** Quick development will likely create maintenance challenges

**Recommendation for AI-Assisted Approach:**
- **Phase 1 (Month 1):** Core MVP with essential features only
- **Phase 2 (Month 2):** Enhancement, testing, and route planner
- **Phase 3 (Ongoing):** Refinement based on user feedback

### Scenario 2: Traditional Human Development (Full-Time Position)

**Realistic Timeline:**
- **Minimum:** 2-3 months full-time (320-480 hours)
- **Recommended:** 3-4 months full-time (480-640 hours)

**Cost Estimates (Germany, 2026):**

**Junior Developer (€45-60/hour):**
- Minimum timeline: €14,400 - €28,800
- Recommended timeline: €21,600 - €38,400

**Mid-Level Developer (€70-90/hour):**
- Minimum timeline: €22,400 - €43,200
- Recommended timeline: €33,600 - €57,600

**Senior Developer (€100-130/hour):**
- Minimum timeline: €32,000 - €62,400
- Recommended timeline: €48,000 - €83,200

**Development Agency:**
- Fixed-price project: €35,000 - €75,000
- Time & Materials: Higher hourly rates (€120-180/hour) = €38,400 - €115,200

**What Traditional Development Provides:**
- Comprehensive testing and QA
- Proper documentation
- Scalability validation
- Security best practices
- Accessibility compliance
- Maintenance planning
- Knowledge transfer

---

## Hybrid Recommendation: AI-Assisted with Extended Timeline

**Optimal Approach:**
- **Timeline:** 6-8 weeks with half-time position (120-160 hours)
- **Cost:** €5,400 - €20,800 (depending on hourly rate)
- **Method:** AI-assisted rapid development + proper testing phase

**Week-by-Week Breakdown:**

**Weeks 1-2:** Foundation & Core Features
- Database design and setup
- Admin interface for event management
- Basic authentication and authorization

**Weeks 3-4:** Public Features
- Event display with sorting/filtering
- Shopping cart / schedule builder
- Integration of study program navigator

**Weeks 5-6:** Advanced Features
- Program recommendations
- Simplified route planner
- Data export functionality

**Weeks 7-8:** Testing & Deployment
- Performance testing
- Bug fixing
- Production deployment
- Documentation

**Benefits of This Approach:**
- Realistic timeline for quality delivery
- AI tools accelerate development without sacrificing quality
- Adequate time for testing under load
- Buffer for unexpected challenges
- Better code quality and maintainability

---

## Conclusion

**1-Month Half-Time Assessment:** **HIGH RISK, PARTIAL DELIVERY ONLY**
- Only a basic MVP is realistic
- Critical features like route planner will be incomplete
- Performance at scale is questionable
- Significant technical debt likely

**Recommended Approach:** **6-8 Week Half-Time with AI Assistance**
- Delivers complete, tested system
- Balances speed with quality
- More predictable outcome
- Manageable cost for ZSB budget

**Alternative:** **Traditional 3-Month Full-Time Development**
- Highest quality and reliability
- Best long-term maintenance
- Higher upfront cost
- Most conservative timeline
