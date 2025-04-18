// src/components/legal/TermsOfServiceContent.tsx
import React from "react";

export function TermsOfServiceContent() {
  return (
    <div className="terms-of-service">
      <h2 className="text-xl font-bold mb-4">1. Introduction</h2>
      <p className="mb-4">
        Welcome to PsyAssist. These Terms of Service ("Terms") govern your use
        of our website, products, and services ("Services"). By accessing or
        using our Services, you agree to be bound by these Terms.
      </p>

      <h2 className="text-xl font-bold mb-4">2. Account Registration</h2>
      <p className="mb-4">
        To access certain features of our Services, you may be required to
        register for an account. You agree to provide accurate, current, and
        complete information during the registration process and to update such
        information to keep it accurate, current, and complete.
      </p>

      <h2 className="text-xl font-bold mb-4">3. Privacy</h2>
      <p className="mb-4">
        Your privacy is important to us. Our Privacy Policy explains how we
        collect, use, and protect your information. By using our Services, you
        agree to our Privacy Policy, which is incorporated into these Terms.
      </p>

      <h2 className="text-xl font-bold mb-4">4. User Conduct</h2>
      <p className="mb-4">
        You agree not to use our Services for any unlawful purpose or in any way
        that may impair the performance, functionality, or integrity of our
        Services. You agree not to attempt to gain unauthorized access to any
        system or network connected to our Services.
      </p>

      <h2 className="text-xl font-bold mb-4">5. Intellectual Property</h2>
      <p className="mb-4">
        All content, features, and functionality of our Services, including but
        not limited to text, graphics, logos, icons, images, audio clips,
        digital downloads, data compilations, and software, are the exclusive
        property of PsyAssist or its licensors.
      </p>

      <h2 className="text-xl font-bold mb-4">6. Disclaimer of Warranties</h2>
      <p className="mb-4">
        Our Services are provided on an "as is" and "as available" basis without
        any warranties, expressed or implied. PsyAssist does not warrant that
        our Services will be uninterrupted or error-free.
      </p>

      <h2 className="text-xl font-bold mb-4">7. Limitation of Liability</h2>
      <p className="mb-4">
        In no event shall PsyAssist be liable for any indirect, incidental,
        special, consequential, or punitive damages, including but not limited
        to loss of profits, data, use, goodwill, or other intangible losses,
        resulting from your access to or use of our Services.
      </p>

      <h2 className="text-xl font-bold mb-4">8. Changes to Terms</h2>
      <p className="mb-4">
        We reserve the right to modify these Terms at any time. Your continued
        use of our Services after any such changes constitutes your acceptance
        of the new Terms.
      </p>

      <h2 className="text-xl font-bold mb-4">9. Governing Law</h2>
      <p className="mb-4">
        These Terms shall be governed by and construed in accordance with the
        laws of [Your Jurisdiction], without regard to its conflict of law
        provisions.
      </p>

      <h2 className="text-xl font-bold mb-4">10. Contact Information</h2>
      <p className="mb-4">
        If you have any questions about these Terms, please contact us at
        support@psyassist.com.
      </p>

      <p className="font-bold mt-8">
        Last Updated: {new Date().toLocaleDateString()}
      </p>
    </div>
  );
}
