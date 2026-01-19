import React from 'react';

const TermsPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Terms of Service</h2>
        <button onClick={onBack} className="px-3 py-2 bg-gray-100 border rounded text-sm">
          Back
        </button>
      </div>

      <div className="text-sm text-gray-600 mb-4">
        Terms of Service, Disclaimer, and Guidelines
      </div>

      <div className="whitespace-pre-wrap text-sm text-gray-800 border rounded p-4 bg-gray-50">
        {/* Replace this block with your full terms */}
        {`TERMS OF SERVICE AND DISCLAIMER
CollegeAsk.org
Operated by TappedIn Incorporated
Effective Date: Immediately

1. Acceptance of Terms
By accessing, browsing, registering for, or otherwise using CollegeAsk.org (the “Platform”), you acknowledge that you have read, understood, and agree to be legally bound by these Terms of Service and Disclaimer (“Terms”). If you do not agree to these Terms, you must immediately discontinue use of the Platform.

2. Nature of the Platform
The Platform provides a forum for general informational content and user-generated discussion related to higher education topics. The Platform does not provide authoritative, official, or binding guidance and does not replace official institutional communications or professional advice.

3. General Information Disclaimer
All content made available on or through the Platform is provided strictly for general informational purposes. TappedIn Incorporated makes no representations or warranties regarding the accuracy, completeness, reliability, timeliness, or applicability of any content.

4. No Professional Advice
Nothing on the Platform constitutes or should be construed as legal, financial, medical, academic, admissions, housing, safety, or professional advice. Users are solely responsible for consulting appropriate professionals or official institutional sources before acting on any information obtained from the Platform.

5. User-Generated Content Disclaimer
The Platform contains content submitted by users. Such content reflects the opinions and experiences of individual users only and does not represent the views, positions, or endorsements of TappedIn Incorporated. TappedIn Incorporated does not control, verify, approve, or guarantee user-generated content.

6. Accuracy and Verification Disclaimer
TappedIn Incorporated does not verify, audit, or validate information posted on the Platform. Content may be inaccurate, incomplete, misleading, or outdated. Reliance on any content is undertaken solely at the user’s own risk.

7. Assumption of Risk
You expressly assume all risks associated with accessing and using the Platform, including reliance on any information obtained therein.

8. Limitation of Liability
To the maximum extent permitted by applicable law, TappedIn Incorporated shall not be liable for any direct, indirect, incidental, consequential, special, exemplary, or punitive damages arising from or relating to your access to or use of the Platform, regardless of the theory of liability and even if advised of the possibility of such damages.

9. Indemnification
You agree to indemnify, defend, and hold harmless TappedIn Incorporated, its affiliates, officers, directors, employees, agents, and partners from and against any and all claims, liabilities, damages, losses, costs, and expenses, including reasonable attorneys’ fees, arising from your use of the Platform or violation of these Terms.

10. Third-Party Links Disclaimer
The Platform may contain links to third-party websites or resources. TappedIn Incorporated has no control over and assumes no responsibility for third-party content, policies, or practices. Accessing third-party resources is done at your own risk.

11. Platform Availability Disclaimer
The Platform is provided on an “AS IS” and “AS AVAILABLE” basis. TappedIn Incorporated disclaims all warranties, express or implied, including warranties of merchantability, fitness for a particular purpose, and non-infringement. The Platform may be unavailable, interrupted, or contain errors.

12. University Affiliation Disclaimer
CollegeAsk maintains affiliations with the University. Notwithstanding such affiliation, unless expressly stated, content on the Platform does not constitute official university policy, guidance, or communications and should not be relied upon as such.

13. Admissions and Institutional Policy Disclaimer
Institutional policies, admissions standards, deadlines, housing rules, and procedures are subject to change without notice. TappedIn Incorporated assumes no responsibility for inaccuracies arising from institutional changes or reliance on outdated information.

14. Financial Aid and Scholarship Disclaimer
Any information related to financial aid, scholarships, tuition, or costs is provided without guarantee. Eligibility determinations and awards are made exclusively by the relevant institution or authority.

15. Housing, Safety, and Campus Life Disclaimer
Discussions related to housing, safety, transportation, or campus life are based on personal opinion or anecdotal experience. TappedIn Incorporated disclaims all liability for personal injury, loss, or damages arising from reliance on such content.

16. User Responsibility
Users are solely responsible for the content they submit and for compliance with all applicable laws and regulations.

17. Right to Remove Content
TappedIn Incorporated reserves the unrestricted right, but assumes no obligation, to remove, restrict, or modify any content for any reason or no reason at its sole discretion.

18. No Duty to Monitor
TappedIn Incorporated has no duty to monitor user activity or content and assumes no liability for failure to do so.

19. Community Guidelines
Use of the Platform is subject to separate Community Guidelines, which are incorporated by reference. Violation of such guidelines may result in removal of content or termination of access.

20. Intellectual Property Rights
All Platform software, code, design, trademarks, and proprietary materials are the exclusive property of TappedIn Incorporated and are protected by applicable intellectual property laws.

21. User License Grant
By submitting content to the Platform, you grant TappedIn Incorporated a perpetual, irrevocable, non-exclusive, royalty-free, worldwide license to use, reproduce, distribute, modify, display, and sublicense such content in connection with the Platform.

22. Prohibited Use
Users may not engage in misuse of the Platform, including but not limited to harassment, impersonation, scraping, automated data extraction, or dissemination of false or misleading information.

23. Privacy Policy
Use of the Platform is subject to the Privacy Policy, which governs data collection and usage practices.

24. Data Accuracy and Security Disclaimer
TappedIn Incorporated does not guarantee the accuracy of user identities or data. No security system is impenetrable, and TappedIn Incorporated disclaims liability for unauthorized access to the extent permitted by law.

25. Governing Law
These Terms shall be governed by and construed in accordance with the laws of the State of Delaware.

26. Venue and Jurisdiction
Any legal action arising under these Terms shall be brought exclusively in the courts located in or serving Tuscaloosa County, Alabama.

27. Class Action Waiver
You waive any right to participate in a class action, collective action, or representative proceeding against TappedIn Incorporated.

28. Modifications to Terms
TappedIn Incorporated reserves the right to modify these Terms at any time. Continued use of the Platform constitutes acceptance of the revised Terms.

29. Severability
If any provision of these Terms is held unenforceable, the remaining provisions shall remain in full force and effect.

30. Contact Information
TappedIn Incorporated
2627 10th Avenue
Unit 64
Tuscaloosa, AL 35401
Attn: Lars Griffin

31. Effective Date
These Terms are effective immediately upon publication.

Community Guidelines
CollegeAsk.org
Operated by TappedIn Incorporated
Effective Date: Immediately

1. Purpose and Scope
These Community Guidelines (“Guidelines”) govern all user activity, content submissions, interactions, and conduct on CollegeAsk.org (the “Platform”). Compliance with these Guidelines is a condition of access to and use of the Platform.
TappedIn Incorporated (“TappedIn”) reserves the right to enforce these Guidelines at its sole discretion.

2. User Responsibility
Users are solely and fully responsible for all content they submit, post, upload, or otherwise make available on the Platform. Users are responsible for ensuring that their content is lawful, accurate, non-deceptive, and compliant with these Guidelines and all applicable laws.
TappedIn assumes no responsibility or liability for user-generated content.

3. Prohibited Content
The following content is strictly prohibited and may result in immediate removal, suspension, or termination without notice:
3.1 False or Misleading Information
Knowingly false statements
Misrepresentation of facts, credentials, affiliations, or authority
Deliberate dissemination of outdated or misleading information presented as fact
3.2 Impersonation and Misrepresentation
Impersonating university officials, staff, faculty, administrators, or representatives
Misrepresenting affiliation, endorsement, or authority
Creating accounts or content intended to deceive users regarding identity or role
3.3 Harassment and Abuse
Harassment, intimidation, threats, or abusive conduct
Hate speech or discriminatory language based on protected characteristics
Personal attacks or targeted hostility toward individuals or groups
3.4 Professional or Authoritative Claims
Presenting legal, medical, financial, academic, or admissions advice as authoritative
Claiming content represents official university policy or decisions unless expressly authorized
3.5 Unsafe or Harmful Content
Encouragement of dangerous, illegal, or reckless behavior
Advice that could reasonably result in physical harm, financial loss, or legal exposure
3.6 Privacy and Confidentiality Violations
Sharing private, confidential, or personally identifiable information of others
Posting student records, internal communications, or non-public institutional materials
3.7 Spam and Platform Abuse
Spam, solicitation, advertising, or promotional content without authorization
Automated posting, scraping, or data harvesting
Attempts to manipulate platform functionality or engagement metrics

4. Content Standards
All user content must:
Be submitted in good faith
Be relevant to the Platform’s purpose
Avoid inflammatory, deceptive, or reckless claims
Clearly distinguish personal opinion from factual assertion where applicable
TappedIn makes no guarantee of content accuracy and does not endorse user submissions.

5. Moderation and Enforcement
TappedIn reserves the unrestricted right, but not the obligation, to:
Review, remove, edit, restrict, or disable content
Suspend or terminate user accounts
Limit platform access or functionality
Take any action deemed necessary to protect users, the Platform, or TappedIn
Enforcement actions may be taken with or without notice and with or without explanation.

6. No Duty to Monitor
TappedIn has no obligation to monitor content, investigate complaints, or respond to user reports. Failure to enforce these Guidelines in any instance does not constitute a waiver of the right to enforce them in the future.

7. Reporting Violations
Users may report content believed to violate these Guidelines. Submission of a report does not guarantee action, response, or removal.

8. University Affiliation Clarification
Although CollegeAsk maintains affiliations with the University, user-generated content does not constitute official university communications, policy, or guidance unless explicitly designated as such by authorized parties.

9. Disclaimer of Liability
TappedIn disclaims all liability arising from user content, moderation decisions, enforcement actions, or failure to enforce these Guidelines to the fullest extent permitted by law.

10. Amendments
TappedIn reserves the right to modify these Guidelines at any time. Continued use of the Platform constitutes acceptance of the updated Guidelines.

11. Governing Law
These Guidelines shall be governed by and construed in accordance with the laws of the State of Delaware.

12. Contact Information
TappedIn Incorporated
2627 10th Avenue
Unit 64
Tuscaloosa, AL 35401
Attn: Lars Griffin

Privacy Policy
CollegeAsk.org
Operated by TappedIn Incorporated
Effective Date: Immediately

1. Introduction
TappedIn Incorporated (“TappedIn,” “we,” “us,” or “our”) operates CollegeAsk.org (the “Platform”). This Privacy Policy describes how we collect, use, disclose, and safeguard information obtained from users (“you” or “users”) of the Platform.
By accessing or using the Platform, you acknowledge and agree to the practices described in this Privacy Policy.

2. Scope of This Policy
This Privacy Policy applies solely to information collected through the Platform and does not apply to information collected offline or through third-party websites, services, or integrations not operated by TappedIn.

3. Information We Collect
3.1 Information You Provide Voluntarily
We may collect information you voluntarily provide, including but not limited to:
Name
Email address
Account credentials
Profile information
Content you submit, post, or upload
Communications sent to us
3.2 Automatically Collected Information
When you access the Platform, we may automatically collect:
IP address
Browser type and version
Device identifiers
Operating system
Access times and referring URLs
Usage data and interaction logs
3.3 Authentication and Identity Data
We may collect authentication-related data through third-party authentication providers used by the Platform. We do not store plaintext passwords.

4. Use of Information
We may use collected information for purposes including but not limited to:
Operating and maintaining the Platform
User authentication and account management
Platform security and fraud prevention
Content moderation and enforcement of policies
Analytics and performance optimization
Legal compliance and risk management
Communications related to Platform operations

5. User-Generated Content
Any information or content you voluntarily disclose on public areas of the Platform may be viewed, collected, and used by others. We are not responsible for the privacy practices of third parties who access such information.

6. Cookies and Tracking Technologies
We may use cookies, web beacons, and similar technologies to collect usage data, maintain sessions, and improve functionality. You may control cookie preferences through your browser settings; however, disabling cookies may affect Platform functionality.

7. Disclosure of Information
We may disclose information:
To service providers and vendors who perform services on our behalf
To comply with legal obligations, court orders, or lawful requests
To enforce our Terms of Service, Community Guidelines, or policies
To protect the rights, property, or safety of TappedIn, users, or others
In connection with a merger, acquisition, restructuring, or sale of assets
We do not sell personal information for monetary consideration.

8. Third-Party Services
The Platform may integrate or interact with third-party services, including authentication, hosting, analytics, or infrastructure providers. We are not responsible for the privacy practices or content of third-party services.
Use of third-party services is subject to their respective privacy policies.

9. Data Retention
We retain personal information for as long as reasonably necessary to fulfill operational, legal, regulatory, or business purposes, unless a longer retention period is required or permitted by law.

10. Data Security
We implement reasonable administrative, technical, and physical safeguards designed to protect information. However, no method of transmission or storage is completely secure. We do not guarantee absolute security and disclaim liability for unauthorized access to the extent permitted by law.

11. Children’s Privacy
The Platform is not directed to children under the age of 13. We do not knowingly collect personal information from children under 13. If such information is discovered, it will be deleted.

12. User Rights and Choices
Depending on jurisdiction, users may have rights to access, correct, or delete personal information. Requests may be submitted using the contact information below. We reserve the right to deny requests where permitted by law.

13. Changes to This Privacy Policy
We reserve the right to modify this Privacy Policy at any time. Changes are effective immediately upon publication. Continued use of the Platform constitutes acceptance of the revised policy.

14. Governing Law
This Privacy Policy is governed by and construed in accordance with the laws of the State of Delaware, without regard to conflict-of-law principles.

15. Contact Information
TappedIn Incorporated
2627 10th Avenue
Unit 64
Tuscaloosa, AL 35401
Attn: Lars Griffin


`}
      </div>
    </div>
  );
};

export default TermsPage;
