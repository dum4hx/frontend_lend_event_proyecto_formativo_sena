import { describe, expect, it } from "vitest";
import type { MaterialType } from "../../../../types/api";
import {
  applySelectedMaterialToDraftRows,
  calculateRentalDays,
  mergeSelectionsIntoDraftRows,
  type FormDraftItem,
} from "../ordersDraft.helpers";

function buildMaterial(id: string, name: string, categoryId: string): MaterialType {
  return {
    _id: id,
    name,
    description: `${name} description`,
    categoryId,
    pricePerDay: 100,
  };
}

describe("calculateRentalDays", () => {
  it("returns 1 when dates are missing or invalid", () => {
    expect(calculateRentalDays("", "")).toBe(1);
    expect(calculateRentalDays("2026-03-12", "2026-03-11")).toBe(1);
    expect(calculateRentalDays("invalid", "2026-03-11")).toBe(1);
  });

  it("returns inclusive day count for valid date range", () => {
    expect(calculateRentalDays("2026-03-11", "2026-03-11")).toBe(1);
    expect(calculateRentalDays("2026-03-11", "2026-03-13")).toBe(3);
  });
});

describe("mergeSelectionsIntoDraftRows", () => {
  it("merges quantities for duplicated materials and uses empty rows first", () => {
    const rows: FormDraftItem[] = [
      {
        localId: "row-1",
        categoryId: "cat-a",
        materialTypeId: "mat-1",
        materialSearchTerm: "Speaker",
        quantity: "2",
      },
      {
        localId: "row-2",
        categoryId: "",
        materialTypeId: "",
        materialSearchTerm: "",
        quantity: "1",
      },
    ];

    const result = mergeSelectionsIntoDraftRows(rows, [
      { material: buildMaterial("mat-1", "Speaker", "cat-a"), quantity: 3 },
      { material: buildMaterial("mat-2", "Microphone", "cat-b"), quantity: 1 },
    ]);

    const speakerRow = result.find((row) => row.materialTypeId === "mat-1");
    const microphoneRow = result.find((row) => row.materialTypeId === "mat-2");

    expect(result).toHaveLength(2);
    expect(speakerRow?.quantity).toBe("5");
    expect(microphoneRow?.categoryId).toBe("cat-b");
    expect(microphoneRow?.quantity).toBe("1");
  });

  it("appends a row when no empty row is available", () => {
    const rows: FormDraftItem[] = [
      {
        localId: "row-1",
        categoryId: "cat-a",
        materialTypeId: "mat-1",
        materialSearchTerm: "Speaker",
        quantity: "2",
      },
    ];

    const result = mergeSelectionsIntoDraftRows(rows, [
      { material: buildMaterial("mat-3", "Light", "cat-c"), quantity: 2 },
    ]);

    const lightRows = result.filter((row) => row.materialTypeId === "mat-3");

    expect(result).toHaveLength(2);
    expect(lightRows).toHaveLength(1);
    expect(lightRows[0].quantity).toBe("2");
  });
});

describe("applySelectedMaterialToDraftRows", () => {
  it("merges into existing row when selected material already exists", () => {
    const rows: FormDraftItem[] = [
      {
        localId: "row-existing",
        categoryId: "cat-a",
        materialTypeId: "mat-1",
        materialSearchTerm: "Speaker",
        quantity: "2",
      },
      {
        localId: "row-source",
        categoryId: "cat-b",
        materialTypeId: "",
        materialSearchTerm: "Spea",
        quantity: "4",
      },
    ];

    const result = applySelectedMaterialToDraftRows(
      rows,
      "row-source",
      buildMaterial("mat-1", "Speaker", "cat-a"),
    );

    const existingRow = result.find((row) => row.localId === "row-existing");
    const sourceRow = result.find((row) => row.localId === "row-source");

    expect(existingRow?.quantity).toBe("6");
    expect(sourceRow?.materialTypeId).toBe("");
    expect(sourceRow?.materialSearchTerm).toBe("");
    expect(sourceRow?.quantity).toBe("1");
  });

  it("sets selected material on source row when there is no duplicate", () => {
    const rows: FormDraftItem[] = [
      {
        localId: "row-source",
        categoryId: "cat-b",
        materialTypeId: "",
        materialSearchTerm: "",
        quantity: "2",
      },
    ];

    const result = applySelectedMaterialToDraftRows(
      rows,
      "row-source",
      buildMaterial("mat-9", "Fog Machine", "cat-z"),
    );

    expect(result[0].categoryId).toBe("cat-z");
    expect(result[0].materialTypeId).toBe("mat-9");
    expect(result[0].materialSearchTerm).toBe("Fog Machine");
    expect(result[0].quantity).toBe("2");
  });
});
