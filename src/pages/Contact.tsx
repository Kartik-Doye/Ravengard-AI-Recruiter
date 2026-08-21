import React from 'react';
import { ContactIntroSection } from '../components/contact/ContactIntroSection';
import { ContactFormSection } from '../components/contact/ContactFormSection';
import { ContactClosingNote } from '../components/contact/ContactClosingNote';

export default function Contact() {
  return (
    <div className="flex flex-col min-h-screen">
      <ContactIntroSection />
      <ContactFormSection />
      <ContactClosingNote />
    </div>
  );
}
