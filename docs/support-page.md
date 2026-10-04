# Voluntary project support

The owner explicitly confirmed the recipient details and their publication in this public repository and the GitHub Pages website. Only the named recipient and account are published; the original photograph is not included. The page does not submit payments, receive slips or collect donor identity, age, transaction history or analytics.

## Acknowledgement and age policy

Both unchecked controls must be selected before revealing account details: self-declared age 20 or above, and acknowledgement of voluntary project support. The 20-year threshold is a project eligibility policy aligned with Thailand's general age of majority; it is not a claim that all donations require a statutory 18+ or 20+ rule. Self-declaration is not identity or age verification. This page excludes under-20 users rather than implementing guardian consent or exceptions for emancipated minors.

The text explains purpose, optional participation, donor-controlled amount, manual transfer, recipient verification, no automatic debit, no representation of a temple/foundation and no tax-deduction receipt issued by the page. There is no blanket liability waiver or mandatory nonrefund clause. Controls reset on reload, navigation, return from history and withdrawal. No remembered consent is stored. This is a UI acknowledgement, not a durable legal consent record or PDPA consent to collect donor data.

Account information is public source code and can be inspected without the UI acknowledgement; the gate is a user flow, not a confidentiality or authentication mechanism.

## Bank identity

The recipient card includes the unmodified official Kasikorn logo, retrieved on 2026-10-04 from https://www.kasikornbank.com/SiteCollectionDocuments/assets/theme-navigation/img/logo2.svg and served locally as `icons/kbank-logo.svg`. It identifies the destination bank; it does not imply bank endorsement or verify account ownership. The visible bank name and recipient verification instructions remain.

## Bank navigation

K PLUS store links were retrieved from the official Kasikorn page on 2026-10-04:
https://www.kasikornbank.com/th/personal/digital-banking/pages/kplus.aspx

SCB and Krungthai links lead to their official websites. No undocumented banking URI, automatic recipient prefill or transfer initiation is implemented. Opening an installed native application varies by device and store. No transfer QR is fabricated from the bank account number.

## Legal scope and remaining review

A checkbox does not make a fundraising activity lawful, replace any required permit, establish tax treatment or prove the donor's capacity. The Civil and Commercial Code's general majority rule is section 19 (20 years); exceptions and minor transactions must not be reduced to a universal 18+ rule. Current authoritative legal material could not be fully retrieved in this session (PDPC access was blocked and DOPA search/API did not supply the requested text). No legal-compliance certification is claimed.

The owner must obtain case-specific advice on the activity's treatment under fundraising rules, any permission required and recipient tax obligations. Calling a transfer “project support” does not establish an exemption. This implementation supplies a clear voluntary-support user flow and publishes owner-authorized account information; it cannot determine those legal facts.

## QA

Browser regression covers both required controls, exact numeric clipboard output with a nonreal fixture, denied clipboard fallback, withdrawal, keyboard focus, small-screen overflow, reload/back reset, unconfigured account and protected external navigation. The production recipient needs a final public-site display/copy smoke check after deployment. Native banking navigation and actual transfers remain manual checks.
