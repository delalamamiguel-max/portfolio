import { CONTACT_EMAIL, contactMailto } from "@/lib/site";
import { cn } from "@/lib/utils";

type EmailLinkProps = {
  /** Optional prefilled subject line for the visitor's email draft. */
  subject?: string;
  /** Link text; defaults to the address itself. */
  children?: React.ReactNode;
  className?: string;
};

/** The one way an email address is rendered on the site: a real anchor
 * (keyboard and screen-reader accessible by nature) that opens the visitor's
 * default mail app addressed to the canonical contact address. */
export function EmailLink({ subject, children, className }: EmailLinkProps) {
  return (
    <a href={contactMailto(subject)} className={cn("link-accent underline underline-offset-4", className)}>
      {children ?? CONTACT_EMAIL}
    </a>
  );
}
