"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface Activity {
  time: string;
  name: string;
  lat: number;
  lon: number;
  description: string;
  namePlace: string;
  city: string;
  province?: string;
  address: string;
  rating: number;
}

interface TripDay {
  day: number;
  date: string;
  activities: Activity[];
}

interface TripParameters {
  location: string;
  days: TripDay[];
}

interface TripPlan {
  name: string;
  parameters: TripParameters;
}

interface DataContextType {
  data: TripPlan | null;
  setData: (data: TripPlan | null) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider = ({ children }: DataProviderProps) => {
  const [data, setData] = useState<TripPlan | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("tripPlan");
      if (stored) {
        setData(JSON.parse(stored));
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (data) {
        localStorage.setItem("tripPlan", JSON.stringify(data));
      } else {
        localStorage.removeItem("tripPlan");
      }
    }
  }, [data]);

  return (
    <DataContext.Provider value={{ data, setData }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};
