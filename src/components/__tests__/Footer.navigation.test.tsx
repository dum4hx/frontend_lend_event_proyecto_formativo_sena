import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import Footer from "../Footer";
import { LanguageProvider } from "../../contexts/LanguageContext";

interface FooterLinkCase {
  linkText: string;
  expectedHeading: string;
}

const footerLinks: FooterLinkCase[] = [
  { linkText: "Contact", expectedHeading: "Contact Page" },
  { linkText: "Billing", expectedHeading: "Billing Page" },
  { linkText: "About", expectedHeading: "About Page" },
  { linkText: "Business", expectedHeading: "Business Page" },
  { linkText: "Pricing", expectedHeading: "Pricing Page" },
  { linkText: "Blog", expectedHeading: "Blog Page" },
  { linkText: "What's New", expectedHeading: "Whats New Page" },
  { linkText: "Help Center", expectedHeading: "Help Center Page" },
  { linkText: "Terms of Service", expectedHeading: "Terms Of Service Page" },
  { linkText: "Cookie Policy", expectedHeading: "Cookie Policy Page" },
];

function renderFooterRouter(): void {
  render(
    <LanguageProvider>
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<Footer />} />
          <Route path="/contact" element={<h1>Contact Page</h1>} />
          <Route path="/billing" element={<h1>Billing Page</h1>} />
          <Route path="/about" element={<h1>About Page</h1>} />
          <Route path="/business" element={<h1>Business Page</h1>} />
          <Route path="/pricing" element={<h1>Pricing Page</h1>} />
          <Route path="/blog" element={<h1>Blog Page</h1>} />
          <Route path="/whats-new" element={<h1>Whats New Page</h1>} />
          <Route path="/help-center" element={<h1>Help Center Page</h1>} />
          <Route path="/terms-of-service" element={<h1>Terms Of Service Page</h1>} />
          <Route path="/cookie-policy" element={<h1>Cookie Policy Page</h1>} />
        </Routes>
      </MemoryRouter>
    </LanguageProvider>,
  );
}

describe("Footer navigation", () => {
  it.each(footerLinks)("navigates to $linkText route", async ({ linkText, expectedHeading }) => {
    const user = userEvent.setup();
    renderFooterRouter();

    await user.click(screen.getByRole("link", { name: linkText }));

    expect(await screen.findByRole("heading", { name: expectedHeading })).toBeInTheDocument();
  });
});
