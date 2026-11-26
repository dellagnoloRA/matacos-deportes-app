import React from "react";
import { CookieConsentBanner } from "@/components/ecommerce/legal/CookieConsentBanner";

export default function EcommerceGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <CookieConsentBanner />
    </>
  );
}
