import { Link } from "react-router-dom";

const Terms = () => {
  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "#0B0E14", color: "#A4ADB3" }}
    >
      <div className="mx-auto max-w-3xl px-6 py-12">
        {/* Header */}
        <header className="mb-12 flex items-center justify-between">
          <span className="text-xl font-semibold" style={{ color: "#FFFFFF" }}>
            ServX
          </span>
          <Link
            to="/dashboard"
            className="text-sm"
            style={{ color: "#00C2CB" }}
          >
            Back to Dashboard
          </Link>
        </header>

        {/* Content */}
        <main className="space-y-8">
          <h1
            className="text-3xl font-bold"
            style={{ color: "#FFFFFF" }}
          >
            Terms of Service
          </h1>
          <p className="text-sm" style={{ color: "#A4ADB3" }}>
            Last updated:{" "}
            {new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>

          <section className="space-y-4">
            <h2
              className="text-xl font-semibold"
              style={{ color: "#FFFFFF" }}
            >
              Agreement to Terms
            </h2>
            <p className="leading-relaxed" style={{ color: "#A4ADB3" }}>
              By accessing or using ServX, you agree to be bound by these Terms of
              Service. If you do not agree to these terms, you may not use the
              service.
            </p>
          </section>

          <section className="space-y-4">
            <h2
              className="text-xl font-semibold"
              style={{ color: "#FFFFFF" }}
            >
              Description of Service
            </h2>
            <p className="leading-relaxed" style={{ color: "#A4ADB3" }}>
              ServX is an open-source infrastructure command center designed to
              help you manage and monitor your DevOps workflows. The service is
              provided &quot;as is&quot; without warranties of any kind, express or
              implied. ServX is maintained as an open-source project, and its
              availability, features, and functionality may change over time.
            </p>
          </section>

          <section className="space-y-4">
            <h2
              className="text-xl font-semibold"
              style={{ color: "#FFFFFF" }}
            >
              User Responsibility
            </h2>
            <p className="leading-relaxed" style={{ color: "#A4ADB3" }}>
              You are fully responsible for all actions you execute through the
              ServX dashboard. This includes, but is not limited to: flushing Redis
              caches, locking or unlocking GitHub contributors, dropping databases,
              deploying applications, restarting services, or any other operations
              performed via the platform. You must ensure you have appropriate
              authorization and backups before executing potentially destructive
              actions. ServX does not validate the appropriateness of your commands
              for your specific environment.
            </p>
          </section>

          <section className="space-y-4">
            <h2
              className="text-xl font-semibold"
              style={{ color: "#FFFFFF" }}
            >
              Limitation of Liability
            </h2>
            <p className="leading-relaxed" style={{ color: "#A4ADB3" }}>
              To the maximum extent permitted by law, the creators, contributors,
              and maintainers of ServX shall not be liable for any direct,
              indirect, incidental, special, consequential, or punitive damages,
              including but not limited to: accidental data loss, server downtime,
              service interruptions, loss of revenue, or any other damages arising
              from your use of the dashboard or the execution of actions through
              it. You use ServX at your own risk. The creators of ServX are not
              liable for any harm caused by user-initiated operations, including
              misconfiguration, unintended deletions, or system failures.
            </p>
          </section>

          <section className="space-y-4">
            <h2
              className="text-xl font-semibold"
              style={{ color: "#FFFFFF" }}
            >
              Open Source
            </h2>
            <p className="leading-relaxed" style={{ color: "#A4ADB3" }}>
              ServX is distributed as open-source software. You may use, modify,
              and distribute it in accordance with its license. Contributions to
              the project are welcome and subject to the project&apos;s contribution
              guidelines.
            </p>
          </section>

          <section className="space-y-4">
            <h2
              className="text-xl font-semibold"
              style={{ color: "#FFFFFF" }}
            >
              Modifications
            </h2>
            <p className="leading-relaxed" style={{ color: "#A4ADB3" }}>
              We reserve the right to modify these Terms of Service at any time.
              Continued use of ServX after changes constitutes acceptance of the
              updated terms. We encourage you to review this page periodically.
            </p>
          </section>

          <section className="space-y-4">
            <h2
              className="text-xl font-semibold"
              style={{ color: "#FFFFFF" }}
            >
              Contact
            </h2>
            <p className="leading-relaxed" style={{ color: "#A4ADB3" }}>
              For questions about these Terms of Service, please contact us at{" "}
              <a
                href="mailto:servx.lab@gmail.com"
                style={{ color: "#00C2CB" }}
              >
                servx.lab@gmail.com
              </a>
              .
            </p>
          </section>
        </main>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t" style={{ borderColor: "#2a2f3a" }}>
          <Link
            to="/dashboard"
            className="text-sm"
            style={{ color: "#00C2CB" }}
          >
            Back to Dashboard
          </Link>
        </footer>
      </div>
    </div>
  );
};

export default Terms;
