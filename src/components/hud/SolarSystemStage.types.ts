import type { SolarPlanetId } from "../../../shared/solarPlanets";
import type { SolarPlanetDef } from "../../../shared/solarPlanets";

export interface SolarPlanetView {
  id: SolarPlanetId;
  badge?: number;
  alert?: boolean;
}

export type MergedPlanet = {
  def: SolarPlanetDef;
  badge?: number;
  alert?: boolean;
};
