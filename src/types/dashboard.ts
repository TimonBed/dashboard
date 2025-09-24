export interface Badge {
  id: string;
  title: string;
  icon: string;
  entityId: string;
}

export interface DashboardColumn {
  id: string;
  title: string;
  width?: number; // 1-12 grid system (optional, defaults to 50% when using grid-cols-2)
  gridColumns?: {
    sm?: number; // small screens
    md?: number; // medium screens
    lg?: number; // large screens
    xl?: number; // extra large screens
  };
  cards: DashboardCard[];
  badges?: Badge[];
}

export interface DashboardCard {
  id: string;
  type:
    | "light-switch"
    | "sensor-state"
    | "button"
    | "shutter"
    | "trash"
    | "time-remaining"
    | "binary-switch"
    | "person"
    | "uptime"
    | "helios-ventilation"
    | "bus-departure";
  title: string;
  entityId?: string;
  position: {
    x: number;
    y: number;
  };
  size: {
    width: number;
    height: number;
  };
  uptimeSettings?: {
    segmentDuration: "minutes" | "hours" | "days";
    segmentCount: number;
  };
  heliosSettings?: {
    indoorAirEntity?: string;
    supplyAirEntity?: string;
    outdoorAirEntity?: string;
    exhaustAirEntity?: string;
    fanSpeedEntity?: string;
    buttonStateEntity?: string;
  };
  maxDepartures?: number;
}

export interface Dashboard {
  id: string;
  title: string;
  path: string;
  description?: string;
  icon?: string;
  backgroundColor?: string;
  columns: DashboardColumn[];
  layout: "grid" | "list" | "custom";
  createdAt: string;
  updatedAt: string;
}
