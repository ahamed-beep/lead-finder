export type LeadType = "Website" | "Reputation";
export type WebsiteStatus = "No website" | "Has website";
export type CheckboxState = "on" | "off" | "some";

export interface LeadRow {
  name: string;
  rating: string;
  reviews: number;
  phone: string;
  area: string;
  email: string;
  leadType: LeadType;
  website: WebsiteStatus;
}