import { createServerFn } from "@tanstack/react-start";
import { customerTicketSchema, enquirySchema, ticketLookupSchema, volunteerApplicationSchema } from "./submission-schemas";

export const submitEnquiry = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => enquirySchema.parse(data))
  .handler(async ({ data }) => {
    const { limitSubmission } = await import("./submissions.server");
    await limitSubmission(data.email);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: saved, error } = await supabaseAdmin.from("contact_submissions").insert({ name: data.name, email: data.email, phone: data.phone, service: data.service, industry: data.industry, message: data.message, coordinator_code: data.coordinatorCode || null }).select("ack_number").single();
    if (error || !saved) { const { submissionFailure } = await import("./db-errors.server"); throw submissionFailure("Your message could not be saved. Please try again.", "insert", "contact_submissions", error ?? new Error("No row returned")); }
    return { ok: true, ackNumber: saved.ack_number };
  });
/** "Become a Volunteer" applications land in the same enquiry inbox and CRM lead flow as the contact form. */
export const submitVolunteerApplication = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => volunteerApplicationSchema.parse(data))
  .handler(async ({ data }) => {
    const { limitSubmission } = await import("./submissions.server");
    await limitSubmission(data.email);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const message = [`Volunteer application`, `City / district: ${data.city}`, `Occupation: ${data.occupation}`, `Hours available per week: ${data.hours}`, data.message ? `About me: ${data.message}` : ""].filter(Boolean).join("\n");
    const { data: saved, error } = await supabaseAdmin.from("contact_submissions").insert({ name: data.name, email: data.email, phone: data.phone, service: "Volunteer programme application", industry: data.occupation, message, coordinator_code: data.coordinatorCode || null }).select("ack_number").single();
    if (error || !saved) { const { submissionFailure } = await import("./db-errors.server"); throw submissionFailure("Your application could not be saved. Please try again.", "insert", "contact_submissions", error ?? new Error("No row returned")); }
    return { ok: true, ackNumber: saved.ack_number };
  });

/** Contact page support tickets for clients and customers; only Support staff and admins can read them. */
export const submitCustomerTicket = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => customerTicketSchema.parse(data))
  .handler(async ({ data }) => {
    const { limitSubmission } = await import("./submissions.server");
    await limitSubmission(data.email);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: saved, error } = await supabaseAdmin.from("customer_tickets").insert({ full_name: data.name, email: data.email, phone: data.phone, customer_reference: data.reference || null, category: data.category, priority: data.priority, subject: data.subject, description: data.description }).select("ticket_code").single();
    if (error || !saved) { const { submissionFailure } = await import("./db-errors.server"); throw submissionFailure("Your ticket could not be created. Please try again.", "insert", "customer_tickets", error ?? new Error("No row returned")); }
    return { ok: true, ticketCode: saved.ticket_code };
  });

/** Ticket status check: needs both the ticket number and the email used, and returns only the status. */
export const checkCustomerTicket = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => ticketLookupSchema.parse(data))
  .handler(async ({ data }) => {
    const { limitSubmission } = await import("./submissions.server");
    await limitSubmission("ticket-lookup", { ipOnly: true });
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin.from("customer_tickets").select("ticket_code,status,subject,created_at,updated_at,email,csat_rating").eq("ticket_code", data.ticketCode.toUpperCase()).maybeSingle();
    if (!row || row.email.toLowerCase() !== data.email.toLowerCase()) throw new Error("No ticket matches that number and email.");
    return { ticketCode: row.ticket_code, status: row.status, subject: row.subject, createdAt: row.created_at, updatedAt: row.updated_at, rated: row.csat_rating !== null };
  });

/** Customer rates a resolved ticket once (1-5 stars) using the ticket number + email; staff cannot set ratings. */
export const rateCustomerTicket = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => {
    const d = data as Record<string, unknown>;
    const base = ticketLookupSchema.parse({ ticketCode: d?.['ticketCode'], email: d?.['email'] });
    const rating = Number(d?.['rating']); if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new Error("Choose 1 to 5 stars.");
    const comment = typeof d?.['comment'] === "string" ? (d['comment'] as string).trim().slice(0, 500) : "";
    return { ...base, rating, comment };
  })
  .handler(async ({ data }) => {
    const { limitSubmission } = await import("./submissions.server");
    await limitSubmission("ticket-rating", { ipOnly: true });
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin.from("customer_tickets").select("id,email,status,csat_rating").eq("ticket_code", data.ticketCode.toUpperCase()).maybeSingle();
    if (!row || row.email.toLowerCase() !== data.email.toLowerCase()) throw new Error("No ticket matches that number and email.");
    if (!["resolved", "closed"].includes(row.status)) throw new Error("You can rate this ticket once it is resolved.");
    if (row.csat_rating !== null) throw new Error("Thank you — this ticket has already been rated.");
    const { error } = await supabaseAdmin.from("customer_tickets").update({ csat_rating: data.rating, csat_comment: data.comment || null, csat_at: new Date().toISOString() }).eq("id", row.id);
    if (error) throw new Error("Your rating could not be saved. Please try again.");
    return { ok: true };
  });
