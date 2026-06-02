export const ADMIN_EMAIL = process.env.ADMIN_NOTIFY_EMAIL ?? "info@lexxbrush.eu";
const CC_EMAIL = process.env.ADMIN_CC_EMAIL ?? "lexxbrush44@gmail.com";
export const ADMIN_EMAILS: string[] = [ADMIN_EMAIL, CC_EMAIL];
