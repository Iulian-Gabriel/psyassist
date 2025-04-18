// src/components/legal/GDPRConsentContent.tsx
import React from "react";

export function GDPRConsentContent() {
  return (
    <div className="gdpr-consent">
      <h2 className="text-xl font-bold mb-4">
        GDPR Consent and Data Processing Agreement
      </h2>

      <p className="mb-4">
        This Data Protection and Privacy Agreement outlines how PsyAssist ("we",
        "our", or "us") collect, use, store, and share your personal data in
        accordance with the General Data Protection Regulation (GDPR).
      </p>

      <h2 className="text-xl font-bold mb-4">1. Data Controller</h2>
      <p className="mb-4">
        PsyAssist acts as the Data Controller for the personal information you
        provide to us.
      </p>

      <h2 className="text-xl font-bold mb-4">
        2. Types of Personal Data We Collect
      </h2>
      <p className="mb-4">
        We may collect the following types of personal data:
      </p>
      <ul className="list-disc pl-8 mb-4">
        <li>Identity data (name, date of birth, gender)</li>
        <li>Contact data (email address, phone number, address)</li>
        <li>Medical history and treatment-related information</li>
        <li>Psychological assessment data</li>
        <li>Technical data (IP address, login information, browser type)</li>
        <li>Usage data (information about how you use our services)</li>
      </ul>

      <h2 className="text-xl font-bold mb-4">
        3. How We Use Your Personal Data
      </h2>
      <p className="mb-4">
        We use your personal data for the following purposes:
      </p>
      <ul className="list-disc pl-8 mb-4">
        <li>To provide mental health services</li>
        <li>To manage appointments and service scheduling</li>
        <li>To process payments</li>
        <li>To communicate with you regarding your treatment</li>
        <li>To improve and develop our services</li>
        <li>To comply with legal and regulatory obligations</li>
      </ul>

      <h2 className="text-xl font-bold mb-4">4. Legal Basis for Processing</h2>
      <p className="mb-4">
        We process your personal data on the following legal grounds:
      </p>
      <ul className="list-disc pl-8 mb-4">
        <li>Your explicit consent</li>
        <li>Performance of a contract</li>
        <li>Compliance with legal obligations</li>
        <li>Legitimate interests</li>
        <li>Protection of vital interests in emergency situations</li>
      </ul>

      <h2 className="text-xl font-bold mb-4">5. Data Retention</h2>
      <p className="mb-4">
        We will retain your personal data only for as long as necessary for the
        purposes set out in this agreement and to comply with our legal
        obligations.
      </p>

      <h2 className="text-xl font-bold mb-4">6. Your Data Protection Rights</h2>
      <p className="mb-4">Under the GDPR, you have the following rights:</p>
      <ul className="list-disc pl-8 mb-4">
        <li>Right to access your personal data</li>
        <li>Right to rectification of inaccurate data</li>
        <li>Right to erasure (the "right to be forgotten")</li>
        <li>Right to restriction of processing</li>
        <li>Right to data portability</li>
        <li>Right to object to processing</li>
        <li>Rights related to automated decision-making and profiling</li>
      </ul>

      <h2 className="text-xl font-bold mb-4">7. Data Security</h2>
      <p className="mb-4">
        We implement appropriate technical and organizational measures to
        protect your personal data against unauthorized access, alteration,
        disclosure, or destruction.
      </p>

      <h2 className="text-xl font-bold mb-4">8. Data Sharing</h2>
      <p className="mb-4">We may share your personal data with:</p>
      <ul className="list-disc pl-8 mb-4">
        <li>Healthcare professionals involved in your treatment</li>
        <li>Third-party service providers acting as processors</li>
        <li>Regulatory authorities when legally required</li>
      </ul>

      <h2 className="text-xl font-bold mb-4">9. International Transfers</h2>
      <p className="mb-4">
        If we transfer your data outside the European Economic Area (EEA), we
        ensure appropriate safeguards are in place to protect your personal
        data.
      </p>

      <h2 className="text-xl font-bold mb-4">10. Contact Information</h2>
      <p className="mb-4">
        If you have any questions or wish to exercise your data protection
        rights, please contact our Data Protection Officer at dpo@psyassist.com.
      </p>

      <p className="font-bold mt-8">
        Last Updated: {new Date().toLocaleDateString()}
      </p>
    </div>
  );
}
