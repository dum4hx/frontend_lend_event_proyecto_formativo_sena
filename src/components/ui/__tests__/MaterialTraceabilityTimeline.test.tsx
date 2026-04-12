import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { MaterialTraceabilityTimeline } from "../MaterialTraceabilityTimeline";
import type { MaterialTraceabilityEvent } from "../../../types/api";

describe("MaterialTraceabilityTimeline", () => {
  it("renders loading skeleton", () => {
    render(<MaterialTraceabilityTimeline isLoading entityType="transfer" />);

    expect(screen.getByTestId("material-traceability-skeleton")).toBeInTheDocument();
    expect(screen.getByTestId("material-traceability-kpi-skeleton")).toBeInTheDocument();
  });

  it("renders empty state when no events are provided", () => {
    render(<MaterialTraceabilityTimeline events={[]} entityType="loan" />);

    expect(screen.getByTestId("material-traceability-empty")).toHaveTextContent(
      "Sin eventos de trazabilidad aún",
    );
  });

  it("sorts events ascending and maps labels to Spanish", () => {
    const events: MaterialTraceabilityEvent[] = [
      {
        eventType: "received",
        occurredAt: "2026-04-12T14:00:00.000Z",
        performedByName: "Andrea Ruiz",
        performedByEmail: "andrea@example.com",
      },
      {
        eventType: "sent",
        occurredAt: "2026-04-11T09:30:00.000Z",
        performedByName: "Carlos M",
      },
    ];

    render(<MaterialTraceabilityTimeline events={events} entityType="transfer" />);

    const labels = screen
      .getAllByTestId("material-traceability-label")
      .map((element) => element.textContent);

    expect(labels).toEqual(["Material enviado", "Material recibido"]);
    expect(screen.getByTestId("traceability-kpi-total-events")).toHaveTextContent("2");
  });

  it("uses robust fallback when performedByName is missing", () => {
    const events: MaterialTraceabilityEvent[] = [
      {
        eventType: "checkout",
        occurredAt: "2026-04-10T10:00:00.000Z",
        performedByEmail: "operator@example.com",
      },
      {
        eventType: "return_received",
        occurredAt: "2026-04-11T10:00:00.000Z",
      },
    ];

    render(<MaterialTraceabilityTimeline events={events} entityType="loan" />);

    expect(screen.getByText("operator@example.com")).toBeInTheDocument();
    expect(screen.getByText("Usuario no disponible")).toBeInTheDocument();
  });

  it("filters events by delivery and reception groups", async () => {
    const user = userEvent.setup();
    const events: MaterialTraceabilityEvent[] = [
      { eventType: "checkout", occurredAt: "2026-04-10T10:00:00.000Z" },
      { eventType: "return_received", occurredAt: "2026-04-11T10:00:00.000Z" },
      { eventType: "sent", occurredAt: "2026-04-12T10:00:00.000Z" },
      { eventType: "received", occurredAt: "2026-04-13T10:00:00.000Z" },
    ];

    render(<MaterialTraceabilityTimeline events={events} entityType="transfer" />);

    await user.click(screen.getByRole("button", { name: "Filtrar por Entregas / envíos" }));

    let labels = screen
      .getAllByTestId("material-traceability-label")
      .map((element) => element.textContent);
    expect(labels).toEqual(["Retiro / entrega al cliente", "Material enviado"]);

    await user.click(
      screen.getByRole("button", { name: "Filtrar por Recepciones / devoluciones" }),
    );

    labels = screen
      .getAllByTestId("material-traceability-label")
      .map((element) => element.textContent);
    expect(labels).toEqual(["Devolución recibida", "Material recibido"]);
  });

  it("renders long notes in a collapsible details block", async () => {
    const user = userEvent.setup();
    const longNotes = "Observacion larga ".repeat(10).trim();

    render(
      <MaterialTraceabilityTimeline
        entityType="loan"
        events={[
          {
            eventType: "checkout",
            occurredAt: "2026-04-10T10:00:00.000Z",
            notes: longNotes,
          },
        ]}
      />, 
    );

    const summary = screen.getByText("Ver observaciones");
    expect(summary).toBeInTheDocument();
    await user.click(summary);
    expect(screen.getByText(longNotes)).toBeInTheDocument();
  });
});
