/**
 * Tests for `maintenanceService` — verifies that each service function calls
 * the correct API endpoint and returns properly typed data.
 */

import { describe, it, expect, beforeAll, afterEach, afterAll } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../../test/mocks/server";
import {
  getMaintenanceBatches,
  getMaintenanceBatch,
  createMaintenanceBatch,
  updateMaintenanceBatch,
  startMaintenanceBatch,
  cancelMaintenanceBatch,
  addMaintenanceBatchItems,
  removeMaintenanceBatchItem,
  resolveMaintenanceBatchItem,
} from "../maintenanceService";

const BASE = "http://localhost:3000/api/v1";

const MOCK_BATCH = {
  _id: "batch-1",
  name: "Test Batch",
  status: "draft",
  items: [],
  organizationId: "org-1",
  createdBy: "user-1",
  totalEstimatedCost: 0,
  totalActualCost: 0,
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z",
};

const MOCK_LIST_RESPONSE = {
  status: "success",
  data: {
    batches: [MOCK_BATCH],
    pagination: { total: 1, page: 1, totalPages: 1 },
  },
};

const MOCK_DETAIL_RESPONSE = {
  status: "success",
  data: MOCK_BATCH,
};

beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("getMaintenanceBatches()", () => {
  it("fetches the list of batches", async () => {
    server.use(http.get(`${BASE}/maintenance`, () => HttpResponse.json(MOCK_LIST_RESPONSE)));

    const res = await getMaintenanceBatches();
    expect(res.status).toBe("success");
    expect(res.data.batches).toHaveLength(1);
    expect(res.data.batches[0].name).toBe("Test Batch");
    expect(res.data.pagination.total).toBe(1);
  });

  it("passes query parameters", async () => {
    server.use(
      http.get(`${BASE}/maintenance`, ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get("status")).toBe("draft");
        expect(url.searchParams.get("page")).toBe("2");
        return HttpResponse.json(MOCK_LIST_RESPONSE);
      }),
    );

    await getMaintenanceBatches({ status: "draft", page: 2 });
  });
});

describe("getMaintenanceBatch()", () => {
  it("fetches a single batch by ID", async () => {
    server.use(
      http.get(`${BASE}/maintenance/batch-1`, () => HttpResponse.json(MOCK_DETAIL_RESPONSE)),
    );

    const res = await getMaintenanceBatch("batch-1");
    expect(res.status).toBe("success");
    expect(res.data._id).toBe("batch-1");
    expect(res.data.name).toBe("Test Batch");
  });
});

describe("createMaintenanceBatch()", () => {
  it("creates a new batch", async () => {
    server.use(
      http.post(`${BASE}/maintenance`, async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({
          status: "success",
          data: { ...MOCK_BATCH, name: body.name },
        });
      }),
    );

    const res = await createMaintenanceBatch({ name: "New Batch" });
    expect(res.status).toBe("success");
    expect(res.data.name).toBe("New Batch");
  });
});

describe("updateMaintenanceBatch()", () => {
  it("updates batch metadata", async () => {
    server.use(
      http.patch(`${BASE}/maintenance/batch-1`, async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({
          status: "success",
          data: { ...MOCK_BATCH, name: body.name },
        });
      }),
    );

    const res = await updateMaintenanceBatch("batch-1", { name: "Updated" });
    expect(res.status).toBe("success");
    expect(res.data.name).toBe("Updated");
  });
});

describe("startMaintenanceBatch()", () => {
  it("transitions batch to in_progress", async () => {
    server.use(
      http.post(`${BASE}/maintenance/batch-1/start`, () =>
        HttpResponse.json({
          status: "success",
          data: { ...MOCK_BATCH, status: "in_progress" },
        }),
      ),
    );

    const res = await startMaintenanceBatch("batch-1");
    expect(res.data.status).toBe("in_progress");
  });
});

describe("cancelMaintenanceBatch()", () => {
  it("cancels the batch", async () => {
    server.use(
      http.post(`${BASE}/maintenance/batch-1/cancel`, () =>
        HttpResponse.json({
          status: "success",
          data: { ...MOCK_BATCH, status: "cancelled" },
        }),
      ),
    );

    const res = await cancelMaintenanceBatch("batch-1");
    expect(res.data.status).toBe("cancelled");
  });
});

describe("addMaintenanceBatchItems()", () => {
  it("adds items to a batch", async () => {
    const itemPayload = {
      items: [
        {
          materialInstanceId: "inst-1",
          entryReason: "damaged" as const,
          sourceType: "manual" as const,
        },
      ],
    };

    server.use(
      http.post(`${BASE}/maintenance/batch-1/items`, () =>
        HttpResponse.json({
          status: "success",
          data: {
            ...MOCK_BATCH,
            items: [
              {
                _id: "item-1",
                materialInstanceId: "inst-1",
                entryReason: "damaged",
                itemStatus: "pending",
                sourceType: "manual",
              },
            ],
          },
        }),
      ),
    );

    const res = await addMaintenanceBatchItems("batch-1", itemPayload);
    expect(res.data.items).toHaveLength(1);
    expect(res.data.items[0].entryReason).toBe("damaged");
  });
});

describe("removeMaintenanceBatchItem()", () => {
  it("removes an item from a batch", async () => {
    server.use(
      http.delete(`${BASE}/maintenance/batch-1/items/inst-1`, () =>
        HttpResponse.json({
          status: "success",
          data: { ...MOCK_BATCH, items: [] },
        }),
      ),
    );

    const res = await removeMaintenanceBatchItem("batch-1", "inst-1");
    expect(res.data.items).toHaveLength(0);
  });
});

describe("resolveMaintenanceBatchItem()", () => {
  it("resolves an item", async () => {
    server.use(
      http.patch(`${BASE}/maintenance/batch-1/items/inst-1`, async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({
          status: "success",
          data: {
            ...MOCK_BATCH,
            items: [
              {
                _id: "item-1",
                materialInstanceId: "inst-1",
                entryReason: "damaged",
                itemStatus: body.resolution === "repaired" ? "repaired" : "unrecoverable",
                sourceType: "manual",
                actualCost: body.actualCost,
                resolvedAt: "2025-01-02T00:00:00Z",
              },
            ],
          },
        });
      }),
    );

    const res = await resolveMaintenanceBatchItem("batch-1", "inst-1", {
      resolution: "repaired",
      actualCost: 5000,
    });
    expect(res.data.items[0].itemStatus).toBe("repaired");
    expect(res.data.items[0].actualCost).toBe(5000);
  });
});
