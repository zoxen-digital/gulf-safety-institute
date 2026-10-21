export const INQUIRY_TYPES = ["Course Inquiry", "Corporate On-Site Training", "Certificate Verification Help", "Other"] as const;
export type InquiryType = (typeof INQUIRY_TYPES)[number];
