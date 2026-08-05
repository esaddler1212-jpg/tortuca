import type { ShoppingItem, UserSettings } from "../types";
import { matchRecipes, type RecipeMatch } from "./mealPrepRecipes";

export function isMealPrepDay(settings: UserSettings, now = new Date()): boolean {
  const wd = new Intl.DateTimeFormat("en-US", {
    timeZone: settings.timezone,
    weekday: "short",
  }).format(now);
  return wd === "Sun";
}

export function pantryFromItems(items: ShoppingItem[]): string[] {
  return items.filter((i) => i.inPantry).map((i) => i.name);
}

export function shoppingListItems(items: ShoppingItem[]): ShoppingItem[] {
  return items.filter((i) => !i.inPantry);
}

export function buildMealPrepPlan(items: ShoppingItem[]): {
  pantry: string[];
  toBuy: ShoppingItem[];
  recipes: RecipeMatch[];
  readyCount: number;
  almostCount: number;
} {
  const pantry = pantryFromItems(items);
  const toBuy = shoppingListItems(items);
  const recipes = matchRecipes(pantry);
  const readyCount = recipes.filter((r) => r.ready).length;
  const almostCount = recipes.filter((r) => !r.ready && r.score >= 0.5).length;

  return { pantry, toBuy, recipes, readyCount, almostCount };
}

export function mealPrepHeadline(settings: UserSettings, plan: ReturnType<typeof buildMealPrepPlan>, now = new Date()): string {
  if (isMealPrepDay(settings, now)) {
    if (plan.readyCount > 0) {
      return `Sunday meal prep — ${plan.readyCount} recipe${plan.readyCount === 1 ? "" : "s"} ready with what you have`;
    }
    if (plan.toBuy.length > 0) {
      return `Sunday meal prep — shop ${plan.toBuy.length} item${plan.toBuy.length === 1 ? "" : "s"}, then cook`;
    }
    return "Sunday meal prep — add ingredients to your list";
  }
  if (plan.readyCount > 0) {
    return `${plan.readyCount} meal prep option${plan.readyCount === 1 ? "" : "s"} match your pantry`;
  }
  return "Shopping & meal prep";
}
