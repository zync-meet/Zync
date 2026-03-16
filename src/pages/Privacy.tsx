import { Link } from "react-router-dom";

const Privacy = () => {
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
            Privacy Policy
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
              Introduction
            </h2>
            <p className="leading-relaxed" style={{ color: "#A4ADB3" }}>
              ServX (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to
              protecting your privacy. This Privacy Policy explains how we collect,
              use, disclose, and safeguard your information when you use our
              open-source infrastructure command center. By using ServX, you consent
              to the practices described in this policy.
            </p>
          </section>

          <section className="space-y-4">
            <h2
              className="text-xl font-semibold"
              style={{ color: "#FFFFFF" }}
            >
              Information We Collect
            </h2>
            <p className="leading-relaxed" style={{ color: "#A4ADB3" }}>
              We collect information you provide directly, including account
              credentials, email addresses, and configuration data necessary to
              operate the dashboard. We also collect usage data to improve our
              services and ensure security.
            </p>
          </section>

          <section className="space-y-4">
            <h2
              className="text-xl font-semibold"
              style={{ color: "#FFFFFF" }}
            >
              Google Workspace API Usage
            </h2>
            <p className="leading-relaxed" style={{ color: "#A4ADB3" }}>
              ServX uses Google OAuth to authenticate users. We request the
              https://www.googleapis.com/auth/gmail.send scope solely to allow the
              ServX platform to dispatch automated system alerts (such as server
              crash notifications) from your email address. ServX does not request,
              and does not have the ability to read, store, delete, or share your
              personal inbox data or existing emails.
            </p>
          </section>

          <section className="space-y-4">
            <h2
              className="text-xl font-semibold"
              style={{ color: "#FFFFFF" }}
            >
              Third-Party API Key Storage
            </h2>
            <p className="leading-relaxed" style={{ color: "#A4ADB3" }}>
              Third-party API keys (including but not limited to Vercel, Render, and
              other service providers) that you provide to ServX are encrypted and
              stored solely for your own dashboard functionality. These keys are used
              exclusively to enable features you have configured. We never share,
              sell, or disclose your API keys to third parties. Your keys remain
              under your control and are used only to perform actions you authorize
              through the dashboard.
            </p>
          </section>

          <section className="space-y-4">
            <h2
              className="text-xl font-semibold"
              style={{ color: "#FFFFFF" }}
            >
              Data Security
            </h2>
            <p className="leading-relaxed" style={{ color: "#A4ADB3" }}>
              We implement industry-standard security measures to protect your data,
              including encryption of sensitive credentials and secure transmission
              protocols. However, no method of transmission over the Internet is
              completely secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section className="space-y-4">
            <h2
              className="text-xl font-semibold"
              style={{ color: "#FFFFFF" }}
            >
              Data Sharing
            </h2>
            <p className="leading-relaxed" style={{ color: "#A4ADB3" }}>
              We do not sell, trade, or rent your personal information to third
              parties. We may share information only when required by law, to
              protect our rights, or with your explicit consent.
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
              If you have questions about this Privacy Policy, please contact us at{" "}
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

export default Privacy;
