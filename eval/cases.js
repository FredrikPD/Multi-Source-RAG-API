export const evalCases = [
  //
  // ─────────────────────────────────────────
  // Document 1 — RefundPolicy.docx
  // ─────────────────────────────────────────
  //

  {
    id: "refund_physical_timeline",
    query: "What is the maximum number of days a customer has to request a refund for physical products?",
    relevantChunks: [
      "d9680a11-eaba-4f32-a212-3943038ba037"
    ],
  },

  {
    id: "refund_digital_conditions",
    query: "Under what conditions can a customer receive a refund for digital products?",
    relevantChunks: [
      "7d3da053-1532-45e7-9f21-4c11ecb83914"
    ],
  },

  {
    id: "refund_rma_timeline",
    query: "When must customers ship a product back after receiving an RMA number?",
    relevantChunks: [
      "7e5d62df-e6d2-400b-819e-13aafda99518"
    ],
  },

  {
    id: "refund_nonrefundable_items",
    query: "What items are not eligible for a refund according to the policy?",
    relevantChunks: [
      "6de8f520-416c-4f75-9e7f-3fbc451b3f5e"
    ],
  },

  {
    id: "refund_shipping_responsibility",
    query: "Who is responsible for shipping costs when the product is returned due to customer change of mind?",
    relevantChunks: [
      "affe52df-abac-4dcd-9d29-745c71bdcc48"
    ],
  },

  {
    id: "refund_inspection_process",
    query: "What happens after ACME receives a returned product during the inspection stage?",
    relevantChunks: [
      "66748dff-e7e3-4afa-9356-d6377faec469"
    ],
  },

  //
  // ─────────────────────────────────────────
  // Document 2 — SLA_IncidentResponse.docx
  // ─────────────────────────────────────────
  //

  {
    id: "sla_sev1_standard_response",
    query: "What is the response time for a Severity 1 incident under Standard Support?",
    relevantChunks: [
      "98a0aa35-a384-4b29-a63c-b40cf018dcd9"
    ],
  },

  {
    id: "sla_sev3_update_frequency",
    query: "How often does ACME provide status updates for Severity 3 incidents?",
    relevantChunks: [
      "db2bf20c-7c28-4011-9fcc-646e5e3606c1"
    ],
  },

  {
    id: "sla_escalation_timeline",
    query: "What are the escalation timelines for Severity 1 incidents?",
    relevantChunks: [
      "d0086ecd-22aa-4985-aaa6-3d5f59149a7d"
    ],
  },

  {
    id: "sla_containment_actions",
    query: "What actions are taken during the containment stage of the incident workflow?",
    relevantChunks: [
      "2ec8bdb8-9a74-4230-9a58-37ce8919fce6",
      "d0086ecd-22aa-4985-aaa6-3d5f59149a7d"
    ],
  },

  {
    id: "sla_languages_supported",
    query: "What languages does ACME provide support in?",
    relevantChunks: [
      "50163e5d-be4f-43a1-a55d-6ab7c606e3bd"
    ],
  },

  {
    id: "sla_outage_obligations",
    query: "What are ACME's obligations during a multi-customer outage?",
    relevantChunks: [
      "2ec8bdb8-9a74-4230-9a58-37ce8919fce6"
    ],
  },

  //
  // ─────────────────────────────────────────
  // Document 3 — Warranty_ServiceAgreement.docx
  // ─────────────────────────────────────────
  //

  // Warranty – Product Warranty & Service Agreement

  {
    id: "warranty_coverage_duration",
    query: "What is the standard warranty coverage period for ACME products?",
    relevantChunks: [
      "8c743428-449c-4888-8a40-441128a367e0"
    ],
  },

  {
    id: "warranty_included_services",
    query: "What services are included under ACME’s standard warranty?",
    relevantChunks: [
      "8c743428-449c-4888-8a40-441128a367e0"
    ],
  },

  {
    id: "warranty_exclusions",
    query: "What types of issues or damages are excluded from ACME’s warranty coverage?",
    relevantChunks: [
      "f12aa9ad-b119-41d5-af2b-229fdf45d152",
      "1d03db33-4008-42f2-a5cc-bb8801713fb8"
    ],
  },

  {
    id: "warranty_claim_process",
    query: "What steps must a customer follow to submit a warranty claim?",
    relevantChunks: [
      "98788ff7-ee76-403b-ba01-33d179af24c1",
      "82028eb8-87fb-47cc-ab85-cc13f5905f25"
    ],
  },

  {
    id: "warranty_repair_timeline",
    query: "How long does ACME have to complete warranty repairs after receiving a valid claim?",
    relevantChunks: [
      // intentionally empty – the document never specifies an exact repair timeline
    ],
  },

  {
    id: "warranty_shipping_responsibility",
    query: "Who is responsible for shipping costs when sending a product in for warranty service?",
    relevantChunks: [
      "f12aa9ad-b119-41d5-af2b-229fdf45d152",
      "1d03db33-4008-42f2-a5cc-bb8801713fb8"
    ],
  },
];