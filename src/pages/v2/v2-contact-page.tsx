import { FormEvent, useState } from "react";
import { HeadingBlock } from "@/components/v2/heading-block";
import { SectionWrapper } from "@/components/v2/section-wrapper";

export function V2ContactPage() {
  const [status, setStatus] = useState<string>("");

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("Message captured. Response workflow placeholder.");
  };

  return (
    <SectionWrapper ariaLabel="Contact">
      <div className="v2-stack-24 v2-text-column">
        <HeadingBlock
          level={1}
          title="Contact"
          subtext="Direct path to conversation."
        />

        <section className="v2-flow-item v2-stack-8" aria-label="Contact methods">
          <h2 className="v2-h3">Contact methods</h2>
          <p className="v2-body">Email: <a href="mailto:hello@migueldelalama.com">hello@migueldelalama.com</a></p>
          <p className="v2-body">LinkedIn: <a href="https://www.linkedin.com" target="_blank" rel="noreferrer">Profile</a></p>
        </section>

        <form className="v2-form v2-stack-16" onSubmit={onSubmit}>
          <label className="v2-stack-8">
            <span className="v2-caption">Email</span>
            <input className="v2-input" type="email" required />
          </label>
          <label className="v2-stack-8">
            <span className="v2-caption">Message</span>
            <textarea className="v2-textarea" required />
          </label>
          <button className="v2-btn" type="submit">Submit</button>
        </form>

        <div className="v2-flow-item" aria-live="polite" aria-atomic="true">
          <p className="v2-body">{status || "Status: idle"}</p>
        </div>
      </div>
    </SectionWrapper>
  );
}
