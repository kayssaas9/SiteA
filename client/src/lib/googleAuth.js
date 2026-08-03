const GOOGLE_POPUP_FEATURES = [
  "popup=yes",
  "width=500",
  "height=650",
  "left=100",
  "top=100",
  "resizable=yes",
  "scrollbars=yes",
].join(",");

function getAbsolutePath(path) {
  if (typeof path !== "string" || !path.startsWith("/")) return "/generate";
  return path;
}

function getClerkErrorMessage(error, fallback) {
  return error?.errors?.[0]?.longMessage
    || error?.errors?.[0]?.message
    || error?.longMessage
    || error?.message
    || fallback;
}

export async function continueWithGoogle(authenticateWithPopup, redirectPath, fallback) {
  const popup = window.open(
    "about:blank",
    "astra-google-auth",
    GOOGLE_POPUP_FEATURES,
  );

  if (!popup) {
    throw new Error("Autorise les fenêtres pop-up pour continuer avec Google.");
  }

  try {
    const callbackUrl = `${window.location.origin}/sso-callback`;
    const completeUrl = `${window.location.origin}${getAbsolutePath(redirectPath)}`;

    await authenticateWithPopup({
      popup,
      strategy: "oauth_google",
      redirectUrl: callbackUrl,
      redirectUrlComplete: completeUrl,
    });
  } catch (error) {
    try {
      if (!popup.closed) popup.close();
    } catch {
      // The browser may already have closed the OAuth window.
    }
    throw new Error(getClerkErrorMessage(error, fallback));
  }
}