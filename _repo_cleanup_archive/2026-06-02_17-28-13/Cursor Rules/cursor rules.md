# Flicklet TV Tracker - Master Cursor Rules

## 📋 **ACTIVE RULES - ALWAYS REFERENCE THESE**

### **Primary Rules Documents**
1. **[Global Rules](./Cursor-rules-global.md)** - Repository-wide standards, scope control, branching, testing
2. **[Mobile Compact V1 Rules](./Cursor-rules-mobile-compact-v1.md)** - React V2 specific project guidelines

### **🚨 MANDATORY REFERENCE CHECKLIST**

Before starting ANY task, I must:

- [ ] **Read the appropriate rules file** (Global + Phase-specific if applicable)
- [ ] **Declare scope banner** with ACTIVE APP, ALLOWED PATHS, HARD BLOCKS
- [ ] **Verify no www/ modifications** unless explicitly scoped
- [ ] **Use feature flags** (default OFF, localStorage format)
- [ ] **Follow testing patterns** (Playwright E2E, console error detection)
- [ ] **Create proper reports** in `reports/` with clear naming
- [ ] **Document rollback strategy** (one flag flip or revert)

### **🎯 Current Project Context**

**ACTIVE APP:** `apps/web` (React V2)
**HARD BLOCKS:** `www/**` (Legacy V1 - read-only)
**FEATURE FLAG:** `mobile_compact_v1` (localStorage: `flag:mobile_compact_v1`)
**DEV SERVER:** `http://localhost:8888`

### **📝 Task Template (Copy This)**

```
ROLE: <role> in STRICT PM MODE
BRANCH: <type/area-name>
GOAL: <one-sentence goal>

ACTIVE APP: <apps/web | www>
ALLOWED PATHS: <exact globs>
HARD BLOCKS: <exact globs>
NO UI/BEHAVIOR CHANGE: <yes/no>

TASKS:
1) <step one>
2) <step two>

CONSTRAINTS:
- <hard constraints>
- <do-nots>

OUTPUT:
- <files to expect>

ACCEPTANCE (BINARY):
- <checklist>

ROLLBACK:
- <flag flip or revert steps>
```

### **🔄 Rule Reference Triggers**

I will reference these rules when:
- Starting any new task
- Making scope decisions
- Creating tests or reports
- Working with feature flags
- Handling rollback scenarios
- Any conflict between global and phase-specific rules

### **📚 Quick Reference Links**

- **Global Standards:** [Cursor-rules-global.md](./Cursor-rules-global.md)
- **Mobile Compact V1:** [Cursor-rules-mobile-compact-v1.md](./Cursor-rules-mobile-compact-v1.md)
- **Repository Structure:** See Global Rules Section 2
- **Testing Patterns:** See Global Rules Section 8
- **Feature Flags:** See Global Rules Section 5

---

**⚠️ REMINDER: Phase-specific rules override global rules within their scope. Always check both documents for complete guidance.**
