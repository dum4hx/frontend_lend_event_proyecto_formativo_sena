import { describe, expect, it } from "vitest";
import type { TraceabilityEvent } from "../../types/api";
import {
  computeTraceabilityKpis,
  mapTraceabilityLabel,
  sortTraceabilityEvents,
} from "../traceability";

describe("traceability utils", () => {
  it("maps event labels to Spanish", () => {
    expect(mapTraceabilityLabel("checkout")).toBe("Retiro / entrega al cliente");
    expect(mapTraceabilityLabel("return_received")).toBe("Devolución recibida");
    expect(mapTraceabilityLabel("sent")).toBe("Material enviado");
    expect(mapTraceabilityLabel("received")).toBe("Material recibido");
    expect(mapTraceabilityLabel("custom_event")).toBe("custom_event");
  });

  it("sorts events in ascending order by occurredAt", () => {
    const events: TraceabilityEvent[] = [
      { eventType: "received", occurredAt: "2026-04-12T10:00:00.000Z" },
      { eventType: "sent", occurredAt: "2026-04-10T10:00:00.000Z" },
      { eventType: "checkout", occurredAt: "2026-04-11T10:00:00.000Z" },
    ];

    const sorted = sortTraceabilityEvents(events);
    expect(sorted.map((event) => event.eventType)).toEqual(["sent", "checkout", "received"]);
  });

  it("computes transfer KPIs including sent -> received duration", () => {
    const events: TraceabilityEvent[] = [
      { eventType: "received", occurredAt: "2026-04-12T12:00:00.000Z" },
      { eventType: "sent", occurredAt: "2026-04-12T09:00:00.000Z" },
    ];

    const kpis = computeTraceabilityKpis(events, "transfer");

    expect(kpis.totalEvents).toBe(2);
    expect(kpis.latestEventLabel).toBe("Material recibido");
    expect(kpis.durationLabel).toBe("Tiempo envío -> recepción");
    expect(kpis.durationValue).toContain("3 h");
  });

  it("computes loan KPIs including checkout -> return duration", () => {
    const events: TraceabilityEvent[] = [
      { eventType: "return_received", occurredAt: "2026-04-15T10:30:00.000Z" },
      { eventType: "checkout", occurredAt: "2026-04-13T10:30:00.000Z" },
    ];

    const kpis = computeTraceabilityKpis(events, "loan");

    expect(kpis.totalEvents).toBe(2);
    expect(kpis.latestEventLabel).toBe("Devolución recibida");
    expect(kpis.durationLabel).toBe("Tiempo retiro -> devolución");
    expect(kpis.durationValue).toContain("2 d");
  });

  it("returns non-available durations when pair events are missing", () => {
    const kpis = computeTraceabilityKpis(
      [{ eventType: "checkout", occurredAt: "2026-04-10T10:00:00.000Z" }],
      "loan",
    );

    expect(kpis.durationValue).toBe("No disponible");
  });
});
