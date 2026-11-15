import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicShell } from "@/components/site-chrome";
import { PageTitle, Panel } from "@/components/app-ui";
import { Button } from "@/components/ui/button";
export const Route = createFileRoute("/help")({
  component: () => (
    <PublicShell>
      <div className="container-page space-y-6 py-12">
        <PageTitle
          title="Find answers fast."
          intro="Help with your account, trading, recycling and delivery."
        />
        <Panel title="Frequently asked questions">
          <p>Learn how Marketplace verification, offers and AkuBin recycling work.</p>
          <Button asChild className="mt-4">
            <Link to="/faq">Read FAQs</Link>
          </Button>
        </Panel>
        <Panel title="Contact support">
          <p>Send a support request and our team will review it.</p>
          <Button asChild className="mt-4">
            <Link to="/contact" search={{ interest: "support" }}>
              Contact support
            </Link>
          </Button>
        </Panel>
      </div>
    </PublicShell>
  ),
});
