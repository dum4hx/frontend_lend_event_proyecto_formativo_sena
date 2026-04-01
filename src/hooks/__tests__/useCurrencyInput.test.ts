import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCurrencyInput } from "../useCurrencyInput";

describe("useCurrencyInput", () => {
  describe("Initialization", () => {
    it("should initialize with empty display value when initialValue is 0", () => {
      const { result } = renderHook(() => useCurrencyInput(0));
      expect(result.current.displayValue).toBe("");
      expect(result.current.rawValue).toBe(0);
    });

    it("should format initialValue correctly", () => {
      const { result } = renderHook(() => useCurrencyInput(1234567.89));
      expect(result.current.rawValue).toBe(1234567.89);
      expect(result.current.displayValue).toContain("1.234.567");
    });

    it("should handle string initialValue", () => {
      const { result } = renderHook(() => useCurrencyInput("500000"));
      expect(result.current.rawValue).toBe(500000);
    });

    it("should handle NaN gracefully", () => {
      const { result } = renderHook(() => useCurrencyInput(NaN));
      expect(result.current.rawValue).toBe(0);
      expect(result.current.displayValue).toBe("");
    });
  });

  describe("Input parsing - es-CO format", () => {
    it("should parse es-CO formatted input (dot as thousand separator, comma as decimal)", () => {
      const callback = vi.fn();
      const { result } = renderHook(() => useCurrencyInput(0, callback));

      act(() => {
        result.current.handleChange({
          target: { value: "1.234.567,89" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.rawValue).toBe(1234567.89);
      expect(callback).toHaveBeenCalledWith(1234567.89);
    });

    it("should parse input with only thousand separators", () => {
      const callback = vi.fn();
      const { result } = renderHook(() => useCurrencyInput(0, callback));

      act(() => {
        result.current.handleChange({
          target: { value: "1.000.000" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.rawValue).toBe(1000000);
      expect(callback).toHaveBeenCalledWith(1000000);
    });

    it("should parse input with decimal part only", () => {
      const callback = vi.fn();
      const { result } = renderHook(() => useCurrencyInput(0, callback));

      act(() => {
        result.current.handleChange({
          target: { value: "123,45" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.rawValue).toBe(123.45);
    });
  });

  describe("Input parsing - US format fallback", () => {
    it("should parse US formatted input when dot appears after comma", () => {
      const { result } = renderHook(() => useCurrencyInput(0));

      act(() => {
        result.current.handleChange({
          target: { value: "1,234,567.89" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.rawValue).toBe(1234567.89);
    });
  });

  describe("Real-time formatting output", () => {
    it("should format display value as user types", () => {
      const { result } = renderHook(() => useCurrencyInput(0));

      act(() => {
        result.current.handleChange({
          target: { value: "1000000" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.displayValue).toContain("1.000.000");
    });

    it("should handle partial input correctly", () => {
      const { result } = renderHook(() => useCurrencyInput(0));

      act(() => {
        result.current.handleChange({
          target: { value: "123" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.rawValue).toBe(123);
    });

    it("should clear display value when input is empty", () => {
      const { result } = renderHook(() => useCurrencyInput(100000));

      act(() => {
        result.current.handleChange({
          target: { value: "" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.displayValue).toBe("");
      expect(result.current.rawValue).toBe(0);
    });
  });

  describe("Decimal handling", () => {
    it("should preserve decimals in raw value", () => {
      const callback = vi.fn();
      const { result } = renderHook(() => useCurrencyInput(0, callback));

      act(() => {
        result.current.handleChange({
          target: { value: "1234567,99" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.rawValue).toBe(1234567.99);
      expect(callback).toHaveBeenCalledWith(1234567.99);
    });

    it("should handle two decimal places", () => {
      const { result } = renderHook(() => useCurrencyInput(0));

      act(() => {
        result.current.handleChange({
          target: { value: "99,99" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.rawValue).toBe(99.99);
    });

    it("should handle one decimal place", () => {
      const { result } = renderHook(() => useCurrencyInput(0));

      act(() => {
        result.current.handleChange({
          target: { value: "100,5" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.rawValue).toBe(100.5);
    });
  });

  describe("Callback behavior", () => {
    it("should call onChangeRaw callback with numeric value", () => {
      const callback = vi.fn();
      const { result } = renderHook(() => useCurrencyInput(0, callback));

      act(() => {
        result.current.handleChange({
          target: { value: "5000000" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(5000000);
    });

    it("should call callback with 0 for empty input", () => {
      const callback = vi.fn();
      const { result } = renderHook(() => useCurrencyInput(100000, callback));

      act(() => {
        result.current.handleChange({
          target: { value: "" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(callback).toHaveBeenCalledWith(0);
    });
  });

  describe("Edge cases", () => {
    it("should handle zero correctly", () => {
      const { result } = renderHook(() => useCurrencyInput(0));

      act(() => {
        result.current.handleChange({
          target: { value: "0" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.rawValue).toBe(0);
      expect(result.current.displayValue).toBe("");
    });

    it("should handle very large numbers", () => {
      const { result } = renderHook(() => useCurrencyInput(0));

      act(() => {
        result.current.handleChange({
          target: { value: "999999999999,99" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.rawValue).toBe(999999999999.99);
    });

    it("should handle special characters in input (strip them)", () => {
      const { result } = renderHook(() => useCurrencyInput(0));

      act(() => {
        result.current.handleChange({
          target: { value: "$1.234.567,89" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.rawValue).toBe(1234567.89);
    });

    it("should handle multiple spaces", () => {
      const { result } = renderHook(() => useCurrencyInput(0));

      act(() => {
        result.current.handleChange({
          target: { value: "  1000  " },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.rawValue).toBe(1000);
    });
  });

  describe("Update initialValue (edit scenario)", () => {
    it("should update display when initialValue prop changes", () => {
      const { result, rerender } = renderHook(
        ({ value }) => useCurrencyInput(value),
        { initialProps: { value: 100000 } },
      );

      expect(result.current.rawValue).toBe(100000);

      act(() => {
        rerender({ value: 500000 });
      });

      expect(result.current.rawValue).toBe(500000);
    });
  });
});
