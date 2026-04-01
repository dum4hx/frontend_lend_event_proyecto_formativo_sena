/**
 * Custom hook wrapping Colombia API calls (departments + cities)
 * using TanStack Query instead of SWR
 */

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ColombiaDepartment, ColombiaCity } from "./types";
import { normalize } from "./helpers";

const COLOMBIA_API_BASE = "https://api-colombia.com/api/v1";

async function fetchDepartments(): Promise<ColombiaDepartment[]> {
  const res = await fetch(`${COLOMBIA_API_BASE}/Department`);
  if (!res.ok) throw new Error(`Colombia API error: ${res.status}`);
  return res.json() as Promise<ColombiaDepartment[]>;
}

async function fetchCities(departmentId: string): Promise<ColombiaCity[]> {
  const res = await fetch(`${COLOMBIA_API_BASE}/Department/${departmentId}/cities`);
  if (!res.ok) throw new Error(`Colombia API error: ${res.status}`);
  return res.json() as Promise<ColombiaCity[]>;
}

interface UseColombiaAddressReturn {
  /** All departments (raw) */
  departments: ColombiaDepartment[];
  /** Departments filtered by current query */
  filteredDepartments: ColombiaDepartment[];
  /** Whether departments are loading */
  loadingDepartments: boolean;
  /** Cities for the selected department */
  cities: ColombiaCity[];
  /** Cities filtered by current query */
  filteredCities: ColombiaCity[];
  /** Whether cities are loading */
  loadingCities: boolean;
  /** Currently selected department ID (as string) */
  selectedDepartment: string;
  /** Set the selected department by ID */
  setSelectedDepartment: (id: string) => void;
  /** Current department search query */
  departmentQuery: string;
  /** Set the department search query */
  setDepartmentQuery: (q: string) => void;
  /** Current city search query */
  cityQuery: string;
  /** Set the city search query */
  setCityQuery: (q: string) => void;
  /** Find a department by name and select it */
  selectDepartmentByName: (name: string) => void;
  /** Reset all state */
  reset: () => void;
}

export function useColombiaAddress(): UseColombiaAddressReturn {
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [departmentQuery, setDepartmentQuery] = useState("");
  const [cityQuery, setCityQuery] = useState("");

  const { data: departments = [], isLoading: loadingDepartments } = useQuery({
    queryKey: ["colombia", "departments"],
    queryFn: fetchDepartments,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const { data: cities = [], isLoading: loadingCities } = useQuery({
    queryKey: ["colombia", "cities", selectedDepartment],
    queryFn: () => fetchCities(selectedDepartment),
    enabled: !!selectedDepartment,
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
  });

  const filteredDepartments = useMemo(() => {
    if (!departmentQuery.trim()) return departments;
    const nq = normalize(departmentQuery);
    const prefixMatches = departments.filter((d) => d?.name && normalize(d.name).startsWith(nq));
    if (prefixMatches.length > 0) return prefixMatches;
    return departments.filter((d) => d?.name && normalize(d.name).includes(nq));
  }, [departments, departmentQuery]);

  const filteredCities = useMemo(() => {
    if (!cityQuery.trim()) return cities;
    const nq = normalize(cityQuery);
    const prefixMatches = cities.filter((c) => c?.name && normalize(c.name).startsWith(nq));
    if (prefixMatches.length > 0) return prefixMatches;
    return cities.filter((c) => c?.name && normalize(c.name).includes(nq));
  }, [cities, cityQuery]);

  const selectDepartmentByName = (name: string) => {
    if (!name || departments.length === 0) return;
    const dept = departments.find((d) => d.name === name);
    if (dept) {
      setSelectedDepartment(dept.id.toString());
      setDepartmentQuery(dept.name);
    }
  };

  const reset = () => {
    setSelectedDepartment("");
    setDepartmentQuery("");
    setCityQuery("");
  };

  return {
    departments,
    filteredDepartments,
    loadingDepartments,
    cities,
    filteredCities,
    loadingCities,
    selectedDepartment,
    setSelectedDepartment,
    departmentQuery,
    setDepartmentQuery,
    cityQuery,
    setCityQuery,
    selectDepartmentByName,
    reset,
  };
}
