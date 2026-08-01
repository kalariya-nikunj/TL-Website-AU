import type { Metadata } from "next";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ContactForm } from "@/components/forms/ContactForm";
import { PageHeader } from "@/components/sections/PageHeader";
import { Section } from "@/components/sections/Section";
import { SectionHeader } from "@/components/sections/SectionHeader";
import { contact } from "@/content/site";
import { faq } from "@/content/faq";

export const metadata: Metadata = {
  title: "Help",
  description:
    "How to access the Tinkerer Lab, frequently asked questions, and how to get in touch.",
};

export default function HelpPage() {
  return (
    <>
      <PageHeader
        title="Help"
        description="How to get into the lab, what you can do once you are in, and who to ask when something is unclear."
      />

      <Section ariaLabelledBy="access">
        <SectionHeader
          id="access"
          title="Getting access"
          description="Three steps, and none of them cost anything."
        />
        <ol className="mt-6 flex max-w-2xl list-decimal flex-col gap-3 pl-5 text-muted">
          <li>
            Come to the lab during open hours and register at the front desk.
          </li>
          <li>
            Book the induction for whichever machine your project needs. Open
            access equipment needs no induction.
          </li>
          <li>Book machine time, or just walk in for the open-access bays.</li>
        </ol>
      </Section>

      <Section ariaLabelledBy="faq">
        <SectionHeader id="faq" title="Frequently asked" />
        <Accordion type="single" collapsible className="mt-6 max-w-2xl">
          {faq.map((item) => (
            <AccordionItem key={item.id} value={item.id}>
              <AccordionTrigger>{item.question}</AccordionTrigger>
              <AccordionContent>{item.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Section>

      <Section ariaLabelledBy="visit">
        <SectionHeader id="visit" title="Find us" />
        <div className="mt-6 grid gap-8 sm:grid-cols-2">
          <address className="flex flex-col gap-1 text-muted not-italic">
            {contact.address.map((line) => (
              <span key={line}>{line}</span>
            ))}
            <a className="mt-3" href={`mailto:${contact.email}`}>
              {contact.email}
            </a>
            <a href={`tel:${contact.phone.replace(/\s/g, "")}`}>
              {contact.phone}
            </a>
          </address>

          <dl className="flex flex-col gap-2 text-muted">
            {contact.hours.map((slot) => (
              <div key={slot.label} className="flex justify-between gap-4">
                <dt>{slot.label}</dt>
                <dd>{slot.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Section>

      <Section ariaLabelledBy="contact">
        <SectionHeader
          id="contact"
          title="Send a message"
          description="For anything not covered above. We usually reply within two working days."
        />
        <div className="mt-8">
          <ContactForm />
        </div>
      </Section>
    </>
  );
}
