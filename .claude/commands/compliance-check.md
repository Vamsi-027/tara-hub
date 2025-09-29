---
description: Legal and regulatory compliance validation
argument-hint: [regulation]
allowed-tools: Read, Grep, Glob
---

# Compliance Check

Validate compliance for: ${1:-all regulations}

## Compliance Frameworks:

### 1. GDPR (EU Data Protection)
- [ ] **Consent Management**: Cookie consent, marketing opt-in
- [ ] **Right to Access**: Data export functionality
- [ ] **Right to Erasure**: Account deletion with data removal
- [ ] **Right to Portability**: Machine-readable data export
- [ ] **Breach Notification**: 72-hour notification process
- [ ] **Privacy by Design**: Data minimization, purpose limitation

**Test Data Subject Rights**:
```bash
# Request data export
curl -X POST /api/gdpr/export -H "Authorization: Bearer $TOKEN"

# Request deletion
curl -X DELETE /api/gdpr/delete-account -H "Authorization: Bearer $TOKEN"
```

### 2. CCPA (California Privacy)
- [ ] **Right to Know**: Data collection disclosure
- [ ] **Right to Delete**: Account and data deletion
- [ ] **Right to Opt-Out**: Do Not Sell My Info
- [ ] **Privacy Policy**: Updated with CCPA requirements
- [ ] **User Verification**: Identity verification for requests

### 3. PCI DSS (Payment Security)
- [ ] **Requirement 1**: Firewall configuration
- [ ] **Requirement 2**: No default passwords
- [ ] **Requirement 3**: Protect stored cardholder data
- [ ] **Requirement 4**: Encrypt transmission
- [ ] **Requirement 6**: Secure systems and applications
- [ ] **Requirement 10**: Track and monitor access
- [ ] **Requirement 11**: Regular security testing

**Payment Flow Review**:
```bash
grep -r "card.*number\|cvv\|credit.*card" --include="*.ts" --include="*.tsx"
```

### 4. Textile Industry Compliance
- [ ] **Fiber Content Labeling**: Accurate fiber percentages
- [ ] **Country of Origin**: Manufacturing location disclosure
- [ ] **Care Instructions**: Proper care symbols and text
- [ ] **Flammability Standards**: CPSC compliance for apparel
- [ ] **Chemical Restrictions**: REACH, Oeko-Tex compliance

**Validate Product Labels**:
```sql
SELECT id, name, fiber_content, country_of_origin, care_instructions
FROM products
WHERE fiber_content IS NULL
   OR country_of_origin IS NULL
   OR care_instructions IS NULL;
```

### 5. Accessibility (WCAG 2.1 AA)
- [ ] **Color Contrast**: 4.5:1 for normal text, 3:1 for large
- [ ] **Keyboard Navigation**: All functions accessible
- [ ] **Screen Reader**: ARIA labels and semantic HTML
- [ ] **Form Labels**: All inputs properly labeled
- [ ] **Error Identification**: Clear error messages

**Accessibility Audit**:
```bash
npm install -g @axe-core/cli
axe https://tara-hub.vercel.app --tags wcag2a,wcag2aa
```

## Compliance Documentation:

Review and update:
1. Privacy Policy
2. Terms of Service
3. Cookie Policy
4. Data Retention Policy
5. Incident Response Plan

## Risk Assessment:

Identify high-risk areas:
- Personal data processing
- Payment handling
- Cross-border data transfers
- Third-party data sharing
- Automated decision-making

Use legal-compliance-specialist agent for regulatory guidance.