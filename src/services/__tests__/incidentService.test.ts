/**
 * Tests for `incidentService` — verifies that each service function calls
 * the correct API endpoint and returns properly typed data.
 */

import { describe, it, expect, beforeAll, afterEach, afterAll } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../../test/mocks/server";
import {
  getIncidents,
  getIncident,
  createIncident,
  acknowledgeIncident,
  resolveIncident,
  dismissIncident,
} from "../incidentService";

const BASE = "http://localhost:3000/api/v1";

const MOCK_INCIDENT = {
  _id: "inc-1",
  context: "loan",
  loanId: "loan-1",
  type: "damage",
  severity: "high",
  status: "open",
  sourceType: "manual",
  description: "Broken screen",
  relatedMaterialInstances: ["inst-1"],
  financialImpact: { estimated: 50000, currency: "COP" },
  organizationId: "org-1",
  reportedBy: "user-1",
  createdAt: "2025-06-01T00:00:00Z",
  updatedAt: "2025-06-01T00:00:00Z",
};

const MOCK_LIST_RESPONSE = {
  status: "success",
  data: {
    incidents: [MOCK_INCIDENT],
    total: 1,
    page: 1,
    totalPages: 1,
  },
};

const MOCK_DETAIL_RESPONSE = {
  status: "success",
  data: { incident: MOCK_INCIDENT },
};

beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("getIncidents()", () => {
  it("fetches the list of incidents", async () => {
    server.use(http.get(`${BASE}/incidents`, () => HttpResponse.json(MOCK_LIST_RESPONSE)));

    const res = await getIncidents();
    expect(res.status).toBe("success");
    expect(res.data.incidents).toHaveLength(1);
    expect(res.data.incidents[0].type).toBe("damage");
    expect(res.data.total).toBe(1);
  });

  it("passes query parameters", async () => {
    server.use(
      http.get(`${BASE}/incidents`, ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get("status")).toBe("open");
        expect(url.searchParams.get("context")).toBe("loan");
        expect(url.searchParams.get("page")).toBe("2");
        return HttpResponse.json(MOCK_LIST_RESPONSE);
      }),
    );

    await getIncidents({ status: "open", context: "loan", page: 2 });
  });
});

describe("getIncident()", () => {
  it("fetches a single incident by ID", async () => {
    server.use(http.get(`${BASE}/incidents/inc-1`, () => HttpResponse.json(MOCK_DETAIL_RESPONSE)));

    const res = await getIncident("inc-1");
    expect(res.status).toBe("success");
    expect(res.data.incident._id).toBe("inc-1");
    expect(res.data.incident.context).toBe("loan");
  });
});

describe("createIncident()", () => {
  it("creates a new incident", async () => {
    server.use(
      http.post(`${BASE}/incidents`, async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        expect(body.context).toBe("storage");
        expect(body.type).toBe("issue");
        return HttpResponse.json(MOCK_DETAIL_RESPONSE, { status: 201 });
      }),
    );

    const res = await createIncident({
      context: "storage",
      type: "issue",
      severity: "medium",
      description: "Humidity damage",
    });
    expect(res.data.incident._id).toBe("inc-1");
  });
});

describe("acknowledgeIncident()", () => {
  it("acknowledges an open incident", async () => {
    const acknowledged = { ...MOCK_INCIDENT, status: "acknowledged" };
    server.use(
      http.post(`${BASE}/incidents/inc-1/acknowledge`, () =>
        HttpResponse.json({ status: "success", data: { incident: acknowledged } }),
      ),
    );

    const res = await acknowledgeIncident("inc-1");
    expect(res.data.incident.status).toBe("acknowledged");
  });
});

describe("resolveIncident()", () => {
  it("resolves an incident with resolution text", async () => {
    const resolved = { ...MOCK_INCIDENT, status: "resolved", resolution: "Fixed" };
    server.use(
      http.post(`${BASE}/incidents/inc-1/resolve`, async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        expect(body.resolution).toBe("Fixed");
        return HttpResponse.json({ status: "success", data: { incident: resolved } });
      }),
    );

    const res = await resolveIncident("inc-1", { resolution: "Fixed" });
    expect(res.data.incident.status).toBe("resolved");
    expect(res.data.incident.resolution).toBe("Fixed");
  });
});

describe("dismissIncident()", () => {
  it("dismisses an incident with reason", async () => {
    const dismissed = { ...MOCK_INCIDENT, status: "dismissed", resolution: "Not relevant" };
    server.use(
      http.post(`${BASE}/incidents/inc-1/dismiss`, async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        expect(body.resolution).toBe("Not relevant");
        return HttpResponse.json({ status: "success", data: { incident: dismissed } });
      }),
    );

    const res = await dismissIncident("inc-1", { resolution: "Not relevant" });
    expect(res.data.incident.status).toBe("dismissed");
  });
});
