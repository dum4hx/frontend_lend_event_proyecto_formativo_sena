import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ShipmentDetailModal } from "../TransferModals";
import type { Transfer } from "../../../../../types/api";

vi.mock("../../../../../contexts/useLanguage", () => ({
  useLanguage: () => ({
    language: "es",
  }),
}));

vi.mock("../../../../../contexts/useEntityDetail", () => ({
  useEntityDetail: () => ({
    openEntityDetail: vi.fn(),
    closeEntityDetail: vi.fn(),
    isDetailOpen: false,
    active: null,
  }),
}));

function buildTransfer(): Transfer {
  return {
    _id: "transfer-1",
    requestId: "request-1",
    fromLocationId: "loc-a",
    toLocationId: "loc-b",
    status: "in_transit",
    createdAt: "2026-04-10T10:00:00.000Z",
    items: [
      {
        instanceId: "instance-1",
        sentCondition: "OK",
      },
    ],
    traceabilityEvents: [
      {
        eventType: "received",
        occurredAt: "2026-04-12T09:00:00.000Z",
        performedByName: "Bodega Destino",
        notes: "Ingreso conforme",
      },
      {
        eventType: "sent",
        occurredAt: "2026-04-11T08:15:00.000Z",
        performedByEmail: "origen@example.com",
      },
    ],
  };
}

describe("ShipmentDetailModal integration", () => {
  it("renders transfer traceability events in ascending order", () => {
    render(
      <ShipmentDetailModal
        shipment={buildTransfer()}
        locationName={(id) => id}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText("Material enviado")).toBeInTheDocument();
  expect(screen.getAllByText("Material recibido").length).toBeGreaterThan(0);
    expect(screen.getByText("origen@example.com")).toBeInTheDocument();
    expect(screen.getByText("Ingreso conforme")).toBeInTheDocument();
    expect(screen.getByTestId("traceability-kpi-total-events")).toHaveTextContent("2");

    const labels = screen
      .getAllByTestId("material-traceability-label")
      .map((element) => element.textContent);

    expect(labels).toEqual(["Material enviado", "Material recibido"]);
  });

  it("shows empty state when transfer does not include traceability events", () => {
    const transfer = buildTransfer();
    delete transfer.traceabilityEvents;

    render(
      <ShipmentDetailModal
        shipment={transfer}
        locationName={(id) => id}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText("Sin eventos de trazabilidad aún")).toBeInTheDocument();
  });
});
