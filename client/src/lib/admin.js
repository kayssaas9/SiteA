export const ADMIN_EMAILS = new Set([
  "kays.amr9@gmail.com",
  "kays.saas9@gmail.com",
]);

export function getUserEmail(user) {
  const primary = user?.emailAddresses?.find(
    (address) => address.id === user.primaryEmailAddressId,
  );
  return (primary?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || "")
    .trim()
    .toLowerCase();
}

export function isAdminUser(user) {
  return ADMIN_EMAILS.has(getUserEmail(user));
}