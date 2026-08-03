import { AuthenticateWithRedirectCallback } from "@clerk/clerk-react";

export default function SsoCallback() {
  return (
    <AuthenticateWithRedirectCallback
      signInForceRedirectUrl="/generate"
      signUpForceRedirectUrl="/generate"
      signInFallbackRedirectUrl="/generate"
      signUpFallbackRedirectUrl="/generate"
    />
  );
}
